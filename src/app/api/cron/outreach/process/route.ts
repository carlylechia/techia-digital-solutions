import { NextResponse } from "next/server";
import { processJobBatch } from "@/lib/outreach/dispatcher";
import { OUTREACH_ORCHESTRATION } from "@/lib/outreach/config";
import { NO_STORE_HEADERS, verifyCronAuthorization } from "@/lib/outreach/cron-auth";
import { getErrorMessage } from "@/lib/prisma-errors";

/**
 * Job processor.
 *
 * This is NOT scheduled. `/api/cron/outreach/daily` is the single scheduled entry
 * point and calls the same `processJobBatch` internally. This endpoint exists so
 * an operator can drain the queue on demand — for example after a deploy — without
 * waiting for the next daily run.
 *
 * It only runs work that is already due, and each job enforces its own limits,
 * approvals, suppression and sending windows, so calling it early cannot cause
 * anything to happen sooner than the state of the data allows.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const auth = verifyCronAuthorization(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE_HEADERS });
  }

  try {
    const budgetMs = Math.min(OUTREACH_ORCHESTRATION.runBudgetMs, 240_000);
    const result = await processJobBatch(OUTREACH_ORCHESTRATION.maxJobsPerRun, {
      deadlineAt: Date.now() + budgetMs,
    });
    return NextResponse.json({ ok: true, scheduled: false, ...result }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("outreach_job_processor_cron_failed", getErrorMessage(error));
    return NextResponse.json({ error: "Outreach job processing failed." }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
