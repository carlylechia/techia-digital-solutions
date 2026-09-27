import "server-only";

import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { OUTREACH_ORCHESTRATION } from "./config";
import { processJobBatch } from "./dispatcher";
import { scheduleDueFollowUps } from "./follow-ups";
import { enqueueJob } from "./jobs";
import { clampDailyDiscovery, evaluateDiscoveryAllowance, startOfDayInTimezone } from "./limits";
import { isBounceRateAbnormal, notifyAdminOfOutreachAlert } from "./notifications";
import { recordCronRun } from "./campaign-run";
import { recomputeAllDailyStats, startOfUtcDay } from "./stats";

/**
 * Daily outreach orchestrator.
 *
 * One Vercel Cron entry wakes the outreach system once a day and answers a single
 * question: "what work is due right now?" Nothing is scheduled by wall-clock time
 * elsewhere, and nothing runs just because the orchestrator happened to fire.
 *
 * This matters because Vercel's Hobby plan cannot run a cron more than once a
 * day, fires it up to 59 minutes late, and always in UTC. So:
 *
 *   - due-ness is stored on each job as an absolute time (`scheduledFor`) and on
 *     each prospect as `nextActionAt`, never as "09:00 on the dot";
 *   - a daily allowance is measured in the campaign's own timezone, not UTC;
 *   - work that is not yet due stays queued for the next run.
 *
 * Every phase is independently guarded. A Google outage, a failed assessment or a
 * rejected email never stops the remaining work.
 */

export type PhaseResult = {
  phase: string;
  ok: boolean;
  detail: string;
  skipped?: string | null;
};

export type OrchestratorResult = {
  startedAt: string;
  durationMs: number;
  budgetExhausted: boolean;
  dueWork: {
    campaignsEligibleForDiscovery: number;
    discoveryQueued: number;
    jobsDue: number;
    jobsProcessed: number;
    jobsCompleted: number;
    jobsDeferred: number;
    jobsFailed: number;
    followUpsScheduled: number;
    statsCampaignsRefreshed: number;
  };
  phases: PhaseResult[];
};

/**
 * Phase 1 — decide which campaigns should discover today.
 *
 * Reuses the same allowance the discovery job itself enforces, so a campaign that
 * has already spent its daily budget is skipped here and would be skipped again
 * in the job. Belt and braces, because a campaign must never discover twice
 * because two different code paths disagreed.
 */
async function queueDueDiscovery(now: Date, deadlineAt: number): Promise<{ eligible: number; queued: number; detail: string }> {
  const prisma = getPrisma();
  if (!prisma) return { eligible: 0, queued: 0, detail: "database unavailable" };

  // MANUAL mode never discovers automatically; only ACTIVE campaigns participate.
  const campaigns = await prisma.outreachCampaign.findMany({
    where: { status: "ACTIVE", mode: { in: ["SEMI_AUTOMATIC", "AUTOMATIC"] } },
    select: {
      id: true,
      mode: true,
      requireApproval: true,
      dailyDiscoveryLimit: true,
      dailySendLimit: true,
      dailyAiAssessLimit: true,
      minOpportunityScore: true,
      followUpEnabled: true,
      maxFollowUps: true,
      sendingWindowStart: true,
      sendingWindowEnd: true,
      timezone: true,
    },
    take: 25,
    orderBy: { updatedAt: "asc" },
  });

  let eligible = 0;
  let queued = 0;
  const skippedReasons: string[] = [];

  for (const campaign of campaigns) {
    if (Date.now() >= deadlineAt) break;

    // The allowance is measured against the campaign's own calendar day.
    const dayStart = startOfDayInTimezone(now, campaign.timezone);
    const [discoveredToday, runsToday] = await Promise.all([
      prisma.outreachProspect.count({ where: { campaignId: campaign.id, discoveredAt: { gte: dayStart } } }),
      prisma.outreachJob.count({ where: { campaignId: campaign.id, type: "DISCOVER", createdAt: { gte: dayStart } } }),
    ]);

    const allowance = evaluateDiscoveryAllowance(
      { ...campaign, status: "ACTIVE" },
      { discoveredToday, qualifiedToday: 0, sentToday: 0 },
      runsToday
    );

    if (!allowance.allowed) {
      skippedReasons.push(`${campaign.id}:${allowance.code}`);
      continue;
    }

    eligible += 1;
    const jobId = await enqueueJob({
      type: "DISCOVER",
      campaignId: campaign.id,
      // One discovery job per campaign per orchestrator day. A manual trigger
      // uses a distinct key, so the two never collide.
      dedupeKey: `DISCOVER:${campaign.id}:daily:${dayStart.getTime()}`,
      scheduledFor: now,
      payload: { reason: "daily_orchestrator", cap: clampDailyDiscovery(campaign.dailyDiscoveryLimit) },
    });
    if (jobId) queued += 1;
  }

  const detail = skippedReasons.length > 0 ? `skipped: ${skippedReasons.slice(0, 6).join(", ")}` : "all eligible campaigns queued";
  return { eligible, queued, detail };
}

/**
 * Phase 4 — daily statistics and bounce-rate alerting.
 *
 * Rebuilds yesterday's aggregate and warns only when a campaign has sent enough
 * for a bounce rate to mean something. A failure here is logged and the run
 * continues, because reporting is not pipeline state.
 */
async function refreshStats(now: Date): Promise<{ campaigns: number; detail: string }> {
  const prisma = getPrisma();
  if (!prisma) return { campaigns: 0, detail: "database unavailable" };

  // Yesterday is the day being reported on, so both the aggregate and the bounce
  // window cover exactly that day. Measuring today instead would read a partial
  // day and could never raise a meaningful bounce rate.
  const windowEnd = startOfUtcDay(now);
  const windowStart = new Date(windowEnd.getTime() - 24 * 60 * 60 * 1000);

  // The existing batched helper, so this stays a single pass rather than a query
  // per campaign added on top of the one the helper already does.
  const refreshed = await recomputeAllDailyStats(windowStart);

  const campaigns = await prisma.outreachCampaign.findMany({ select: { id: true, name: true } });
  let alerts = 0;

  for (const campaign of campaigns) {
    const [sent, bounced] = await Promise.all([
      prisma.outreachMessage.count({ where: { campaignId: campaign.id, sentAt: { gte: windowStart, lt: windowEnd } } }),
      prisma.outreachMessage.count({ where: { campaignId: campaign.id, status: "BOUNCED", sentAt: { gte: windowStart, lt: windowEnd } } }),
    ]);
    // A bounce rate on a handful of sends means nothing, so the helper refuses to
    // alert below a minimum sample.
    if (isBounceRateAbnormal(sent, bounced)) {
      alerts += 1;
      await notifyAdminOfOutreachAlert({
        severity: "warning",
        title: "Abnormal bounce rate detected",
        campaignName: campaign.name,
        detail: `${bounced} of ${sent} messages bounced on the previous day. Review the audience and consider pausing this campaign.`,
      });
    }
  }

  return { campaigns: refreshed, detail: `yesterday=${windowStart.toISOString().slice(0, 10)} bounceAlerts=${alerts}` };
}

/**
 * Run one daily cycle.
 *
 * `deadlineMs` bounds the whole invocation so it can never run indefinitely on a
 * serverless function. Whatever is not finished stays PENDING with its own due
 * time, so the next daily run simply continues.
 */
export async function runDailyOrchestrator(
  options: { now?: Date; maxJobs?: number; deadlineMs?: number } = {}
): Promise<OrchestratorResult> {
  const now = options.now ?? new Date();
  const startedAt = Date.now();
  const maxJobs = options.maxJobs ?? OUTREACH_ORCHESTRATION.maxJobsPerRun;
  const deadlineMs = options.deadlineMs ?? OUTREACH_ORCHESTRATION.runBudgetMs;
  const deadlineAt = startedAt + deadlineMs;

  const phases: PhaseResult[] = [];
  const dueWork = {
    campaignsEligibleForDiscovery: 0,
    discoveryQueued: 0,
    jobsDue: 0,
    jobsProcessed: 0,
    jobsCompleted: 0,
    jobsDeferred: 0,
    jobsFailed: 0,
    followUpsScheduled: 0,
    statsCampaignsRefreshed: 0,
  };

  const runPhase = async <T extends { detail: string; skipped?: string | null }>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T | null> => {
    if (Date.now() >= deadlineAt) {
      phases.push({ phase: name, ok: true, detail: "skipped: run budget already spent", skipped: "budget" });
      return null;
    }
    try {
      const result = await fn();
      phases.push({ phase: name, ok: true, detail: result.detail, skipped: result.skipped ?? null });
      return result;
    } catch (error) {
      // Failure isolation: one broken phase must not abandon the rest.
      console.error(`[outreach-orchestrator] phase_failed:${name}`, getErrorMessage(error));
      phases.push({ phase: name, ok: false, detail: getErrorMessage(error).slice(0, 200) });
      return null;
    }
  };

  // 1. What campaigns should discover today? Only those inside their daily budget.
  const discovery = await runPhase("discovery-scheduling", () => queueDueDiscovery(now, deadlineAt));
  if (discovery) {
    dueWork.campaignsEligibleForDiscovery = discovery.eligible;
    dueWork.discoveryQueued = discovery.queued;
  }

  // 2. How many jobs are actually due right now?
  const prisma = getPrisma();
  dueWork.jobsDue = prisma
    ? await prisma.outreachJob.count({ where: { status: "PENDING", scheduledFor: { lte: now } } }).catch(() => 0)
    : 0;

  // 3. Process a bounded batch of due work. Jobs handle their own limits,
  //    approvals, suppression and sending windows, so nothing is duplicated here.
  await runPhase("job-processing", async () => {
    const result = await processJobBatch(maxJobs, { deadlineAt });
    dueWork.jobsProcessed = result.claimed;
    dueWork.jobsCompleted = result.completed;
    dueWork.jobsDeferred = result.deferred;
    dueWork.jobsFailed = result.failed;
    return {
      detail: `claimed=${result.claimed} completed=${result.completed} deferred=${result.deferred} failed=${result.failed}${
        result.budgetExhausted ? " budget=exhausted" : ""
      }`,
    };
  });

  // 4. Follow-ups whose time has come. The state machine decides what is due, and
  //    the campaign's own timezone decides when.
  await runPhase("follow-up-scheduling", async () => {
    const result = await scheduleDueFollowUps(now);
    dueWork.followUpsScheduled = result.scheduled;
    return { detail: `scanned=${result.scanned} scheduled=${result.scheduled} stopped=${result.stopped}` };
  });

  // 5. Reporting.
  await runPhase("daily-statistics", async () => {
    const result = await refreshStats(now);
    dueWork.statsCampaignsRefreshed = result.campaigns;
    return { detail: `campaigns=${result.campaigns} ${result.detail}` };
  });

  const durationMs = Date.now() - startedAt;
  const budgetExhausted = Date.now() >= deadlineAt;

  const result: OrchestratorResult = {
    startedAt: new Date(startedAt).toISOString(),
    durationMs,
    budgetExhausted,
    dueWork,
    phases,
  };

  console.info("[outreach-orchestrator] run_complete", {
    durationMs,
    budgetExhausted,
    dueWork,
    failedPhases: phases.filter((phase) => !phase.ok).map((phase) => phase.phase),
  });

  // Record the scheduled run so an operator can see cron activity in the same
  // history as manual and test runs. This is purely additive: it writes a history
  // row after the work is done and cannot affect what the run did. It is wrapped
  // so a failure to record never changes the outcome of the cron itself.
  await recordCronRun({
    campaignIds: await activeCampaignIds(),
    summary: `Scheduled daily cycle. ${dueWork.jobsCompleted} completed, ${dueWork.jobsDeferred} deferred, ${dueWork.jobsFailed} failed, ${dueWork.discoveryQueued} discovery queued.`,
    durationMs,
  }).catch((error) => console.error("[outreach-orchestrator] run_history_failed", getErrorMessage(error)));

  return result;
}

/** Campaigns the scheduled cycle would have considered, for run-history context. */
async function activeCampaignIds(): Promise<string[]> {
  const prisma = getPrisma();
  if (!prisma) return [];
  const rows = await prisma.outreachCampaign.findMany({
    where: { status: "ACTIVE", mode: { in: ["SEMI_AUTOMATIC", "AUTOMATIC"] } },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}
