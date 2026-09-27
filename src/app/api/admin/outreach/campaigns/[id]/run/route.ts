import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { OutreachAuthorizationError, requireOutreachActor } from "@/lib/outreach/auth";
import { CampaignRunError } from "@/lib/outreach/campaign-run";
import { runOutreachCampaignNow, runOutreachCampaignTest } from "@/app/[locale]/admin/outreach/actions";

/**
 * Manual and test campaign runs.
 *
 * This is an admin entry point, not a second way into the scheduler. The browser
 * never calls the cron endpoint and the cron secret is never exposed here:
 * authorization comes from the admin session and the existing outreach
 * permissions, and the work itself is delegated to the same server action the
 * admin UI calls, so validation, audit logging and the lock cannot drift between
 * the two entry points.
 *
 * A run can only be requested for a campaign; the id is validated, and the
 * pipeline re-reads the campaign and re-applies every limit, approval rule and
 * provider decision itself.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({
  mode: z.enum(["NOW", "TEST"]),
  // The campaign id arrives in the path, but it is re-validated here so a value
  // is never passed through on trust.
  campaignId: z.string().trim().min(1).max(64).optional(),
});

function fail(error: unknown) {
  if (error instanceof OutreachAuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  if (error instanceof CampaignRunError) {
    return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  console.error("outreach_campaign_run_api_failed", getErrorMessage(error));
  return NextResponse.json({ error: "Could not complete that run." }, { status: 500, headers: { "Cache-Control": "no-store" } });
}

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // The body is parsed once, up front, purely to learn which permission the
    // requested mode needs. No pipeline work happens before authorization.
    const raw = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    // Run Now is permitted to deliver approved email, so it requires the highest
    // outreach permission. Test Run cannot send, so it only needs manage.
    const actor = await requireOutreachActor(parsed.data.mode === "TEST" ? "outreach.manage" : "outreach.send");

    const limit = checkRateLimit(`outreach-campaign-run:${actor.id}:${requestIp(request.headers)}`, 12, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" } }
      );
    }

    if (!getPrisma()) {
      return NextResponse.json({ error: "Outreach data is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    const { id } = await context.params;
    const campaignId = id?.trim();
    if (!campaignId || campaignId.length > 64) {
      return NextResponse.json({ error: "Invalid campaign." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const result =
      parsed.data.mode === "TEST"
        ? await runOutreachCampaignTest({ campaignId })
        : await runOutreachCampaignNow({ campaignId });

    return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}
