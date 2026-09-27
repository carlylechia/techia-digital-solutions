import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { OutreachAuthorizationError, requireOutreachActor } from "@/lib/outreach/auth";
import { getOutreachSendingState } from "@/lib/outreach/config";
import { isOutreachEmailConfigured } from "@/lib/outreach/email-service";
import { isGooglePlacesConfigured } from "@/lib/outreach/config";
import { countQueuedJobs } from "@/lib/outreach/jobs";
import { loadOutreachAnalytics, loadOutreachDashboard } from "@/lib/outreach/queries";

/**
 * Outreach analytics endpoint.
 *
 * Reads the materialized daily aggregate rather than recounting events, and never
 * returns a secret — only a configured/not-configured flag per integration.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireOutreachActor("outreach.view");

    const limit = checkRateLimit(`outreach-analytics:${actor.id}:${requestIp(request.headers)}`, 60, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" } }
      );
    }

    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ error: "Outreach data is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    const [dashboard, analytics, jobs] = await Promise.all([
      loadOutreachDashboard(prisma),
      loadOutreachAnalytics(prisma),
      countQueuedJobs(),
    ]);

    return NextResponse.json(
      {
        ok: true,
        sending: getOutreachSendingState(),
        integrations: { googlePlaces: isGooglePlacesConfigured(), emailProvider: isOutreachEmailConfigured() },
        counters: dashboard.counters,
        funnel: dashboard.funnel,
        performance: dashboard.performance,
        jobs,
        analytics,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof OutreachAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    console.error("outreach_analytics_api_failed", getErrorMessage(error));
    return NextResponse.json({ error: "Could not load outreach analytics." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
