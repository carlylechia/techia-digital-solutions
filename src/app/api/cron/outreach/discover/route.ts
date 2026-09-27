import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { NO_STORE_HEADERS, verifyCronAuthorization } from "@/lib/outreach/cron-auth";
import { enqueueJob } from "@/lib/outreach/jobs";
import { evaluateDiscoveryAllowance, clampDailyDiscovery } from "@/lib/outreach/limits";
import { startOfUtcDay } from "@/lib/outreach/stats";

/**
 * Discovery cron.
 *
 * Creates DISCOVER jobs for campaigns that are active, not in MANUAL mode and
 * still under their daily discovery budget. It never calls Google directly —
 * enqueuing keeps the API key usage inside the job processor's rate control.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(request: Request) {
  const auth = verifyCronAuthorization(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE_HEADERS });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Outreach data is unavailable." }, { status: 503, headers: NO_STORE_HEADERS });
  }

  try {
    const now = new Date();
    const dayStart = startOfUtcDay(now);
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

    const queued: string[] = [];
    const skipped: Array<{ campaignId: string; reason: string }> = [];

    for (const campaign of campaigns) {
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
        skipped.push({ campaignId: campaign.id, reason: allowance.code });
        continue;
      }

      await enqueueJob({
        type: "DISCOVER",
        campaignId: campaign.id,
        dedupeKey: `DISCOVER:${campaign.id}:${dayStart.getTime()}:${Math.floor(now.getTime() / 3_600_000)}`,
        scheduledFor: now,
        payload: { cap: clampDailyDiscovery(campaign.dailyDiscoveryLimit) },
      });
      queued.push(campaign.id);
    }

    return NextResponse.json(
      { ok: true, campaigns: campaigns.length, queued: queued.length, queuedCampaignIds: queued, skipped },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("outreach_discovery_cron_failed", getErrorMessage(error));
    return NextResponse.json({ error: "Outreach discovery scheduling failed." }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
