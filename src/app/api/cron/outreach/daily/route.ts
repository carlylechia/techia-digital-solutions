import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/prisma-errors";
import { NO_STORE_HEADERS, verifyCronAuthorization } from "@/lib/outreach/cron-auth";
import { runDailyOrchestrator } from "@/lib/outreach/orchestrator";

/**
 * The single daily outreach orchestrator.
 *
 * This is the only scheduled entry point for the outreach engine. Vercel's Hobby
 * plan allows a cron at most once a day, so everything the engine needs to do is
 * driven from here by asking what is due, rather than by separate high-frequency
 * schedules.
 *
 * Authentication reuses the existing CRON_SECRET bearer check. Vercel attaches
 * `Authorization: Bearer $CRON_SECRET` to scheduled invocations, and no other
 * caller can reach this.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Kept above the orchestrator's own wall-clock budget so the function is never
// killed mid-run before the orchestrator can stop cleanly and leave the
// remaining work queued.
export const maxDuration = 300;

export async function GET(request: Request) {
  const auth = verifyCronAuthorization(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE_HEADERS });
  }

  try {
    const result = await runDailyOrchestrator();
    return NextResponse.json({ ok: true, ...result }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    // One unexpected failure is reported, not swallowed.
    console.error("outreach_daily_orchestrator_cron_failed", getErrorMessage(error));
    return NextResponse.json({ error: "Outreach daily orchestration failed." }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
