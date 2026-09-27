import { NextResponse } from "next/server";
import { processJobBatch } from "@/lib/outreach/dispatcher";
import { NO_STORE_HEADERS, verifyCronAuthorization } from "@/lib/outreach/cron-auth";
import { getErrorMessage } from "@/lib/prisma-errors";

/**
 * Job processor cron.
 *
 * Claims a bounded batch of due jobs and runs them inside the request. Only the
 * processor decides which job types run — a caller cannot pass a job type in, so
 * this endpoint cannot be used to trigger arbitrary work.
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
    const result = await processJobBatch(5);
    return NextResponse.json(
      { ok: true, ...result },
      { headers: { ...NO_STORE_HEADERS, "Retry-After": "0" } }
    );
  } catch (error) {
    console.error("outreach_job_processor_cron_failed", getErrorMessage(error));
    return NextResponse.json({ error: "Outreach job processing failed." }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
