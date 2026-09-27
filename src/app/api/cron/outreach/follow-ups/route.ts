import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/prisma-errors";
import { NO_STORE_HEADERS, verifyCronAuthorization } from "@/lib/outreach/cron-auth";
import { scheduleDueFollowUps } from "@/lib/outreach/follow-ups";

/**
 * Follow-up scheduler cron.
 *
 * Scans for prospects whose next action is due and enqueues the next step of the
 * sequence. The state machine decides what — if anything — is due.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(request: Request) {
  const auth = verifyCronAuthorization(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE_HEADERS });
  }

  try {
    const result = await scheduleDueFollowUps();
    return NextResponse.json({ ok: true, ...result }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("outreach_followup_cron_failed", getErrorMessage(error));
    return NextResponse.json({ error: "Outreach follow-up scheduling failed." }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
