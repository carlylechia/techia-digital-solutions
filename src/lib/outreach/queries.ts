import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import { OUTREACH_PAGINATION, getOutreachSendingState, isGooglePlacesConfigured } from "./config";
import { isOutreachEmailConfigured } from "./email-service";
import { OUTREACH_DISCOVERY_PROVIDERS, OUTREACH_PROSPECT_STATUSES, OUTREACH_SERVICE_LABELS, type OutreachDiscoveryProviderValue, type OutreachProspectStatusValue } from "./constants";
import { startOfUtcDay, addDays } from "./stats";
import { countQueuedJobs } from "./jobs";

/**
 * Read-side queries for the admin console.
 *
 * These functions only read. Every mutation goes through a server action or a
 * protected API route that re-checks authorization, so no page component is
 * trusted to have already enforced permissions.
 */

type Db = PrismaClient;

export type OutreachDashboardData = Awaited<ReturnType<typeof loadOutreachDashboard>>;

/**
 * Run history for one campaign, newest first.
 *
 * `durationMs` is derived rather than stored, so a run that is still RUNNING
 * reports no duration instead of a misleading zero.
 */
export async function loadOutreachRunHistory(db: Db, campaignId: string, take = 25) {
  const rows = await db.outreachRun.findMany({
    where: { campaignId },
    orderBy: { startedAt: "desc" },
    take: Math.min(100, Math.max(1, take)),
    select: {
      id: true,
      trigger: true,
      status: true,
      startedAt: true,
      completedAt: true,
      discoveredCount: true,
      processedCount: true,
      qualifiedCount: true,
      draftsGeneratedCount: true,
      emailsSentCount: true,
      skippedCount: true,
      failedCount: true,
      summary: true,
      createdById: true,
    },
  });

  return rows.map((row) => ({
    ...row,
    durationMs: row.completedAt ? row.completedAt.getTime() - row.startedAt.getTime() : null,
  }));
}

export async function loadOutreachDashboard(db: Db) {
  const now = new Date();
  const today = startOfUtcDay(now);
  const thirtyDaysAgo = addDays(today, -29);

  const sendingState = getOutreachSendingState();

  const [
    activeCampaigns,
    campaigns,
    discoveredToday,
    qualifiedTotal,
    awaitingApproval,
    sentToday,
    sentTotal,
    repliesTotal,
    interestedTotal,
    meetingsTotal,
    proposalsTotal,
    wonTotal,
    lostTotal,
    disqualifiedTotal,
    approvedTotal,
    jobs,
    statsRows,
    recentProspects,
  ] = await Promise.all([
    db.outreachCampaign.count({ where: { status: "ACTIVE" } }),
    db.outreachCampaign.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        mode: true,
        country: true,
        requireApproval: true,
        dailyDiscoveryLimit: true,
        dailySendLimit: true,
        minOpportunityScore: true,
        timezone: true,
        sendingWindowStart: true,
        sendingWindowEnd: true,
        followUpEnabled: true,
        maxFollowUps: true,
        createdAt: true,
        startedAt: true,
        updatedAt: true,
        _count: { select: { prospects: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 25,
    }),
    db.outreachProspect.count({ where: { discoveredAt: { gte: today } } }),
    db.outreachProspect.count({ where: { status: "QUALIFIED" } }),
    db.outreachMessage.count({ where: { status: "PENDING_APPROVAL" } }),
    db.outreachMessage.count({ where: { sentAt: { gte: today } } }),
    db.outreachMessage.count({ where: { sentAt: { not: null } } }),
    db.outreachProspect.count({ where: { status: "REPLIED" } }),
    db.outreachProspect.count({ where: { status: "INTERESTED" } }),
    db.outreachMeeting.count({ where: { status: "SCHEDULED" } }),
    db.outreachProspect.count({ where: { status: "PROPOSAL" } }),
    db.outreachProspect.count({ where: { status: "WON" } }),
    db.outreachProspect.count({ where: { status: "LOST" } }),
    db.outreachProspect.count({ where: { status: "DISQUALIFIED" } }),
    db.outreachProspect.count({ where: { status: "APPROVED" } }),
    countQueuedJobs(now),
    db.outreachDailyStats.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      orderBy: { date: "asc" },
      take: 500,
    }),
    db.outreachProspect.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, businessName: true, city: true, status: true, opportunityScore: true, createdAt: true },
    }),
  ]);

  const sentByCampaign = await db.outreachMessage.groupBy({
    by: ["campaignId"],
    where: { sentAt: { gte: thirtyDaysAgo } },
    _count: { _all: true },
  });
  const repliedByCampaign = await db.outreachProspect.groupBy({
    by: ["campaignId"],
    where: { status: { in: ["REPLIED", "INTERESTED", "MEETING_BOOKED", "PROPOSAL", "WON"] } },
    _count: { _all: true },
  });
  const replyMap = new Map(repliedByCampaign.map((row) => [row.campaignId, row._count._all]));

  const performance = campaigns.map((campaign) => {
    const sent = sentByCampaign.find((row) => row.campaignId === campaign.id)?._count._all ?? 0;
    const replied = replyMap.get(campaign.id) ?? 0;
    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      mode: campaign.mode,
      requireApproval: campaign.requireApproval,
      country: campaign.country,
      prospects: campaign._count.prospects,
      sent,
      replied,
      replyRate: sent > 0 ? Math.round((replied / sent) * 1000) / 10 : 0,
    };
  });

  const timeline = statsRows.map((row) => ({
    date: row.date.toISOString().slice(0, 10),
    campaignId: row.campaignId,
    discovered: row.discovered,
    qualified: row.qualified,
    emailsSent: row.emailsSent,
    replies: row.replies,
    meetings: row.meetings,
  }));

  return {
    sendingState,
    integrations: {
      googlePlaces: isGooglePlacesConfigured(),
      emailProvider: isOutreachEmailConfigured(),
    },
    counters: {
      activeCampaigns,
      discoveredToday,
      qualifiedTotal,
      awaitingApproval,
      sentToday,
      sentTotal,
      repliesTotal,
      interestedTotal,
      meetingsTotal,
      proposalsTotal,
      wonTotal,
      lostTotal,
      disqualifiedTotal,
      approvedTotal,
    },
    jobs,
    campaigns,
    performance,
    timeline,
    recentProspects,
    funnel: [
      { stage: "Discovered", value: discoveredToday },
      { stage: "Qualified", value: qualifiedTotal },
      { stage: "Approved", value: approvedTotal },
      { stage: "Sent", value: sentTotal },
      { stage: "Replied", value: repliesTotal },
      { stage: "Interested", value: interestedTotal },
      { stage: "Meetings", value: meetingsTotal },
      { stage: "Proposals", value: proposalsTotal },
      { stage: "Won", value: wonTotal },
    ],
  };
}

export async function loadOutreachCampaigns(db: Db) {
  return db.outreachCampaign.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      mode: true,
      country: true,
      regions: true,
      cities: true,
      industries: true,
      businessTypes: true,
      targetServices: true,
      excludedIndustries: true,
      excludedKeywords: true,
      dailyDiscoveryLimit: true,
      dailySendLimit: true,
      minOpportunityScore: true,
      dailyAiAssessLimit: true,
      requireApproval: true,
      followUpEnabled: true,
      maxFollowUps: true,
      sendingWindowStart: true,
      sendingWindowEnd: true,
      timezone: true,
      discoveryProviderMode: true,
      complianceBasis: true,
      complianceNote: true,
      senderNameOverride: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { prospects: true, messages: true } },
    },
  });
}

export async function loadOutreachCampaignDetail(db: Db, campaignId: string) {
  const campaign = await db.outreachCampaign.findUnique({
    where: { id: campaignId },
    include: {
      dailyStats: { orderBy: { date: "desc" }, take: 30 },
      _count: { select: { prospects: true, messages: true, events: true } },
    },
  });
  if (!campaign) return null;

  const [statusGroups, jobGroups, failedJobs, bounces, sentTotal] = await Promise.all([
    db.outreachProspect.groupBy({ by: ["status"], where: { campaignId }, _count: { _all: true } }),
    db.outreachJob.groupBy({ by: ["type", "status"], where: { campaignId }, _count: { _all: true } }),
    db.outreachJob.findMany({
      where: { campaignId, status: "FAILED" },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { id: true, type: true, errorMessage: true, attempts: true, updatedAt: true },
    }),
    db.outreachMessage.count({ where: { campaignId, status: "BOUNCED" } }),
    db.outreachMessage.count({ where: { campaignId, sentAt: { not: null } } }),
  ]);

  return {
    campaign,
    statusGroups: Object.fromEntries(statusGroups.map((row) => [row.status, row._count._all])),
    jobGroups: jobGroups.map((row) => ({ type: row.type, status: row.status, count: row._count._all })),
    failedJobs,
    bounceRate: sentTotal > 0 ? Math.round((bounces / sentTotal) * 1000) / 10 : 0,
    sentTotal,
  };
}

export type ProspectListFilters = {
  campaignId?: string;
  status?: string;
  search?: string;
  provider?: string;
  page?: number;
  pageSize?: number;
};

export async function loadOutreachProspects(db: Db, filters: ProspectListFilters) {
  const pageSize = Math.min(OUTREACH_PAGINATION.maxPageSize, Math.max(5, filters.pageSize ?? OUTREACH_PAGINATION.defaultPageSize));
  const page = Math.max(1, filters.page ?? 1);

  const where: Prisma.OutreachProspectWhereInput = {};
  if (filters.campaignId) where.campaignId = filters.campaignId;
  if (filters.status && OUTREACH_PROSPECT_STATUSES.includes(filters.status as OutreachProspectStatusValue)) {
    where.status = filters.status as OutreachProspectStatusValue;
  }
  if (filters.provider && OUTREACH_DISCOVERY_PROVIDERS.includes(filters.provider as OutreachDiscoveryProviderValue)) {
    where.discoveryProvider = filters.provider as OutreachDiscoveryProviderValue;
  }
  if (filters.search) {
    where.OR = [
      { businessName: { contains: filters.search, mode: "insensitive" } },
      { city: { contains: filters.search, mode: "insensitive" } },
      { publicEmail: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    db.outreachProspect.findMany({
      where,
      orderBy: [{ opportunityScore: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        campaignId: true,
        businessName: true,
        city: true,
        region: true,
        country: true,
        industry: true,
        status: true,
        opportunityScore: true,
        publicEmail: true,
        websiteUrl: true,
        discoveryProvider: true,
        recommendedServices: true,
        emailsSentCount: true,
        lastContactedAt: true,
        nextActionAt: true,
        discoveredAt: true,
        createdAt: true,
      },
    }),
    db.outreachProspect.count({ where }),
  ]);

  return { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function loadOutreachProspectDetail(db: Db, prospectId: string) {
  const prospect = await db.outreachProspect.findUnique({
    where: { id: prospectId },
    include: {
      campaign: { select: { id: true, name: true, timezone: true, sendingWindowStart: true, sendingWindowEnd: true, dailySendLimit: true, maxFollowUps: true, requireApproval: true, mode: true, status: true } },
      assessments: { orderBy: { createdAt: "desc" }, take: 10 },
      messages: { orderBy: { createdAt: "desc" }, take: 30 },
      events: { orderBy: { createdAt: "desc" }, take: 60 },
      meetings: { orderBy: { scheduledAt: "desc" }, take: 10 },
    },
  });
  if (!prospect) return null;

  const suppression = prospect.publicEmail
    ? await db.outreachSuppression.findMany({
        where: { OR: [{ email: prospect.publicEmail }, { domain: prospect.publicEmail.split("@")[1] }] },
        select: { id: true, email: true, domain: true, reason: true, createdAt: true },
      })
    : [];

  return { prospect, suppression };
}

export async function loadReviewQueue(db: Db, campaignId?: string, page = 1) {
  const pageSize = 20;
  // Typed as OutreachMessageWhereInput: this query runs against OutreachMessage,
  // so filtering the related prospect here is correct.
  const where: Prisma.OutreachMessageWhereInput = {
    status: "PENDING_APPROVAL",
    prospect: { status: { in: ["QUALIFIED", "APPROVED"] } },
  };
  if (campaignId) where.campaignId = campaignId;

  const [rows, total] = await Promise.all([
    db.outreachMessage.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (Math.max(1, page) - 1) * pageSize,
      take: pageSize,
      include: {
        prospect: {
          select: {
            id: true,
            businessName: true,
            city: true,
            country: true,
            industry: true,
            opportunityScore: true,
            publicEmail: true,
            websiteUrl: true,
            recommendedServices: true,
            aiSummary: true,
            status: true,
          },
        },
      },
    }),
    db.outreachMessage.count({ where }),
  ]);

  return { rows, total, page: Math.max(1, page), pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/**
 * Conversation view.
 *
 * `where` is typed with Prisma's own input type rather than a loose record, so an
 * invalid filter becomes a compile error instead of a runtime
 * PrismaClientValidationError.
 */
export async function loadConversations(db: Db, filters: { category?: string; page?: number } = {}) {
  const pageSize = 25;
  const page = Math.max(1, filters.page ?? 1);

  const where: Prisma.OutreachProspectWhereInput = {
    // A prospect belongs in this view once any reply has been recorded.
    messages: { some: { type: "REPLY" } },
  };

  // The reply category lives in the EMAIL_REPLIED event metadata, so a category
  // filter is applied in the database rather than after pagination.
  if (filters.category) {
    where.events = {
      some: {
        type: "EMAIL_REPLIED",
        metadata: { path: ["category"], equals: filters.category },
      },
    };
  }

  const [prospects, total] = await Promise.all([
    db.outreachProspect.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        businessName: true,
        city: true,
        status: true,
        publicEmail: true,
        updatedAt: true,
        lastContactedAt: true,
        emailsSentCount: true,
        messages: {
          where: { type: "REPLY" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, subject: true, bodyText: true, createdAt: true },
        },
        events: {
          where: { type: "EMAIL_REPLIED" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { metadata: true, createdAt: true },
        },
      },
    }),
    db.outreachProspect.count({ where }),
  ]);

  const rows = prospects.map((prospect) => {
    const metadata = (prospect.events[0]?.metadata ?? null) as { category?: string; suggestedAction?: string } | null;
    return {
      ...prospect,
      lastMessage: prospect.messages[0] ?? null,
      category: metadata?.category ?? null,
      suggestedAction: metadata?.suggestedAction ?? null,
    };
  });

  return { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function loadMeetings(db: Db, page = 1) {
  const pageSize = 25;
  const currentPage = Math.max(1, page);
  const [rows, total] = await Promise.all([
    db.outreachMeeting.findMany({
      orderBy: [{ scheduledAt: "desc" }],
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      include: {
        prospect: { select: { id: true, businessName: true, city: true, publicEmail: true, status: true } },
      },
    }),
    db.outreachMeeting.count(),
  ]);
  return { rows, total, page: currentPage, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function loadSuppressionList(db: Db, page = 1) {
  const pageSize = 25;
  const currentPage = Math.max(1, page);
  const [rows, total, reasonGroups] = await Promise.all([
    db.outreachSuppression.findMany({
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    db.outreachSuppression.count(),
    db.outreachSuppression.groupBy({ by: ["reason"], _count: { _all: true } }),
  ]);
  return { rows, total, page: currentPage, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)), reasons: Object.fromEntries(reasonGroups.map((row) => [row.reason, row._count._all])) };
}

export async function loadOutreachAnalytics(db: Db) {
  const now = new Date();
  const from = startOfUtcDay(addDays(now, -29));
  const campaignIds = (await db.outreachCampaign.findMany({ select: { id: true } })).map((row) => row.id);

  const [stats, byIndustry, byCountry, byCity, serviceRows, totals] = await Promise.all([
    db.outreachDailyStats.findMany({ where: { date: { gte: from } }, orderBy: { date: "asc" }, take: 1000 }),
    db.outreachProspect.groupBy({
      by: ["industry"],
      where: campaignIds.length > 0 ? { campaignId: { in: campaignIds } } : { id: "__none__" },
      _count: { _all: true },
      orderBy: { _count: { industry: "desc" } },
      take: 12,
    }),
    db.outreachProspect.groupBy({ by: ["country"], _count: { _all: true }, orderBy: { _count: { country: "desc" } }, take: 12 }),
    db.outreachProspect.groupBy({ by: ["city"], _count: { _all: true }, orderBy: { _count: { city: "desc" } }, take: 12 }),
    db.outreachProspect.findMany({
      select: { recommendedServices: true, status: true },
      take: 2000,
    }),
    db.outreachProspect.count(),
  ]);

  const serviceTotals = new Map<string, { count: number; qualified: number; won: number }>();
  for (const prospect of serviceRows) {
    for (const service of prospect.recommendedServices) {
      const entry = serviceTotals.get(service) ?? { count: 0, qualified: 0, won: 0 };
      entry.count += 1;
      if (prospect.status === "QUALIFIED" || prospect.status === "APPROVED" || prospect.status === "OUTREACH_ACTIVE") entry.qualified += 1;
      if (prospect.status === "WON") entry.won += 1;
      serviceTotals.set(service, entry);
    }
  }

  const sums = stats.reduce(
    (acc, row) => ({
      discovered: acc.discovered + row.discovered,
      qualified: acc.qualified + row.qualified,
      emailsSent: acc.emailsSent + row.emailsSent,
      replies: acc.replies + row.replies,
      meetings: acc.meetings + row.meetings,
      won: acc.won + row.won,
    }),
    { discovered: 0, qualified: 0, emailsSent: 0, replies: 0, meetings: 0, won: 0 }
  );

  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
    totals,
    sums,
    daily: stats.map((row) => ({ date: row.date.toISOString().slice(0, 10), ...pick(row) })),
    byIndustry: byIndustry.map((row) => ({ key: row.industry ?? "unknown", count: row._count._all })),
    byCountry: byCountry.map((row) => ({ key: row.country ?? "unknown", count: row._count._all })),
    byCity: byCity.map((row) => ({ key: row.city ?? "unknown", count: row._count._all })),
    byService: [...serviceTotals.entries()]
      .map(([key, value]) => ({ key, label: OUTREACH_SERVICE_LABELS[key] ?? key, ...value }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 12),
    campaignBreakdown: await db.outreachCampaign.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        _count: { select: { prospects: true, messages: true } },
        dailyStats: { where: { date: { gte: from } }, select: { discovered: true, qualified: true, emailsSent: true, replies: true, meetings: true, won: true } },
      },
      take: 25,
      orderBy: { updatedAt: "desc" },
    }),
  };
}

function pick(row: {
  discovered: number;
  disqualified: number;
  qualified: number;
  approved: number;
  emailsSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replies: number;
  interested: number;
  meetings: number;
  proposals: number;
  won: number;
  lost: number;
}) {
  return {
    discovered: row.discovered,
    disqualified: row.disqualified,
    qualified: row.qualified,
    approved: row.approved,
    emailsSent: row.emailsSent,
    delivered: row.delivered,
    opened: row.opened,
    clicked: row.clicked,
    replies: row.replies,
    interested: row.interested,
    meetings: row.meetings,
    proposals: row.proposals,
    won: row.won,
    lost: row.lost,
  };
}
