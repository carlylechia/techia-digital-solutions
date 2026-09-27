import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { NO_STORE_HEADERS, verifyCronAuthorization } from "@/lib/outreach/cron-auth";
import { recomputeAllDailyStats, startOfUtcDay } from "@/lib/outreach/stats";
import { isBounceRateAbnormal, notifyAdminOfOutreachAlert } from "@/lib/outreach/notifications";

/**
 * Daily statistics cron.
 *
 * Rebuilds the materialized daily aggregate for every campaign, then checks the
 * bounce rate and alerts only when a campaign has sent enough for the number to
 * mean something.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

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
    const yesterday = new Date(startOfUtcDay().getTime() - 24 * 60 * 60 * 1000);
    const processed = await recomputeAllDailyStats(yesterday);

    const windowStart = startOfUtcDay(yesterday);
    const windowEnd = new Date(windowStart.getTime() + 24 * 60 * 60 * 1000);
    const campaigns = await prisma.outreachCampaign.findMany({ select: { id: true, name: true } });
    const alerts: Array<{ campaignId: string; campaignName: string; sent: number; bounced: number }> = [];

    for (const campaign of campaigns) {
      const [sent, bounced] = await Promise.all([
        prisma.outreachMessage.count({ where: { campaignId: campaign.id, sentAt: { gte: windowStart, lt: windowEnd } } }),
        prisma.outreachMessage.count({ where: { campaignId: campaign.id, status: "BOUNCED", sentAt: { gte: windowStart, lt: windowEnd } } }),
      ]);
      if (isBounceRateAbnormal(sent, bounced)) {
        alerts.push({ campaignId: campaign.id, campaignName: campaign.name, sent, bounced });
        await notifyAdminOfOutreachAlert({
          severity: "warning",
          title: "Abnormal bounce rate detected",
          campaignName: campaign.name,
          detail: `${bounced} of ${sent} messages bounced on the previous day. Review the audience and consider pausing this campaign.`,
        });
      }
    }

    return NextResponse.json({ ok: true, processed, date: windowStart.toISOString(), alerts }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("outreach_daily_stats_cron_failed", getErrorMessage(error));
    return NextResponse.json({ error: "Outreach daily statistics failed." }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
