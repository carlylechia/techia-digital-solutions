import "server-only";

import { getPrisma } from "@/lib/prisma";

/**
 * Daily aggregates.
 *
 * The dashboard reads these rows instead of recounting events on every request.
 * Counting stays correct because each increment is an atomic `increment` inside
 * an UPSERT, so repeated aggregation runs are idempotent by construction: they
 * recompute a total and write it, never add to whatever was there.
 */

export type DailyStatField =
  | "discovered"
  | "disqualified"
  | "qualified"
  | "approved"
  | "emailsSent"
  | "delivered"
  | "opened"
  | "clicked"
  | "replies"
  | "interested"
  | "meetings"
  | "proposals"
  | "won"
  | "lost"
  | "discoveredGoogle"
  | "discoveredOsm"
  | "discoveryFallbacks";

export function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

const FIELDS: DailyStatField[] = [
  "discovered",
  "disqualified",
  "qualified",
  "approved",
  "emailsSent",
  "delivered",
  "opened",
  "clicked",
  "replies",
  "interested",
  "meetings",
  "proposals",
  "won",
  "lost",
  "discoveredGoogle",
  "discoveredOsm",
  "discoveryFallbacks",
];

/** Which per-provider counter a discovery run should increment. */
export function providerStatField(provider: string): "discoveredGoogle" | "discoveredOsm" {
  return provider === "OPENSTREETMAP" ? "discoveredOsm" : "discoveredGoogle";
}

/**
 * Single-step increment, used when a pipeline event happens in real time. Safe to
 * call repeatedly for the same logical event only where the caller guarantees
 * once-only semantics; the send path satisfies that with idempotency keys.
 */
export async function incrementDailyStat(campaignId: string, field: DailyStatField, amount = 1, date = new Date()) {
  const prisma = getPrisma();
  if (!prisma) return;
  const day = startOfUtcDay(date);
  await prisma.outreachDailyStats
    .upsert({
      where: { campaignId_date: { campaignId, date: day } },
      update: { [field]: { increment: amount } },
      create: { campaignId, date: day, [field]: amount },
    })
    .catch(() => undefined);
}

type StatCounts = Record<DailyStatField, number>;

function emptyCounts(): StatCounts {
  return FIELDS.reduce((acc, field) => {
    acc[field] = 0;
    return acc;
  }, {} as StatCounts);
}

/**
 * Recompute a campaign's totals for a single day directly from the immutable
 * source tables. Running this repeatedly converges on the same numbers, which
 * makes it safe to schedule nightly and to re-run manually after a fix.
 */
export async function recomputeDailyStats(campaignId: string, date = new Date()) {
  const prisma = getPrisma();
  if (!prisma) return null;

  const day = startOfUtcDay(date);
  const windowStart = new Date(day.getTime() + 24 * 60 * 60 * 1000);
  const counts = emptyCounts();

  const discovered = await prisma.outreachProspect.count({ where: { campaignId, discoveredAt: { gte: day, lt: windowStart } } });
  counts.discovered = discovered;

  // Per-provider split, derived from the same source rows so a nightly rebuild
  // converges on exactly the real total.
  const [googleCount, osmCount] = await Promise.all([
    prisma.outreachProspect.count({ where: { campaignId, discoveryProvider: "GOOGLE_PLACES", discoveredAt: { gte: day, lt: windowStart } } }),
    prisma.outreachProspect.count({ where: { campaignId, discoveryProvider: "OPENSTREETMAP", discoveredAt: { gte: day, lt: windowStart } } }),
  ]);
  counts.discoveredGoogle = googleCount;
  counts.discoveredOsm = osmCount;

  counts.discoveryFallbacks = await prisma.outreachEvent.count({
    where: { campaignId, type: "DISCOVERY_PROVIDER_FALLBACK", createdAt: { gte: day, lt: windowStart } },
  });

  const qualified = await prisma.outreachProspect.count({ where: { campaignId, status: "QUALIFIED", updatedAt: { gte: day, lt: windowStart } } });
  counts.qualified = qualified;

  const disqualified = await prisma.outreachProspect.count({ where: { campaignId, status: "DISQUALIFIED", updatedAt: { gte: day, lt: windowStart } } });
  counts.disqualified = disqualified;

  const approved = await prisma.outreachMessage.count({ where: { campaignId, approvedAt: { gte: day, lt: windowStart } } });
  counts.approved = approved;

  const sent = await prisma.outreachMessage.count({ where: { campaignId, sentAt: { gte: day, lt: windowStart } } });
  counts.emailsSent = sent;

  const delivered = await prisma.outreachMessage.count({
    where: { campaignId, status: { in: ["DELIVERED", "OPENED", "CLICKED", "REPLIED"] }, sentAt: { gte: day, lt: windowStart } },
  });
  counts.delivered = delivered;

  const opened = await prisma.outreachMessage.count({ where: { campaignId, status: { in: ["OPENED", "CLICKED", "REPLIED"] }, sentAt: { gte: day, lt: windowStart } } });
  counts.opened = opened;

  const clicked = await prisma.outreachMessage.count({ where: { campaignId, status: { in: ["CLICKED", "REPLIED"] }, sentAt: { gte: day, lt: windowStart } } });
  counts.clicked = clicked;

  counts.replies = await prisma.outreachMessage.count({ where: { campaignId, status: "REPLIED" } });
  counts.interested = await prisma.outreachProspect.count({ where: { campaignId, status: "INTERESTED", updatedAt: { gte: day, lt: windowStart } } });
  counts.meetings = await prisma.outreachMeeting.count({ where: { prospect: { campaignId }, scheduledAt: { gte: day, lt: windowStart } } });
  counts.proposals = await prisma.outreachProspect.count({ where: { campaignId, status: "PROPOSAL", updatedAt: { gte: day, lt: windowStart } } });
  counts.won = await prisma.outreachProspect.count({ where: { campaignId, status: "WON", updatedAt: { gte: day, lt: windowStart } } });
  counts.lost = await prisma.outreachProspect.count({ where: { campaignId, status: "LOST", updatedAt: { gte: day, lt: windowStart } } });

  const row = await prisma.outreachDailyStats.upsert({
    where: { campaignId_date: { campaignId, date: day } },
    update: counts,
    create: { campaignId, date: day, ...counts },
  });
  return row;
}

export async function recomputeAllDailyStats(date = new Date()) {
  const prisma = getPrisma();
  if (!prisma) return 0;
  const campaigns = await prisma.outreachCampaign.findMany({ select: { id: true } });
  for (const campaign of campaigns) {
    await recomputeDailyStats(campaign.id, date);
  }
  return campaigns.length;
}
