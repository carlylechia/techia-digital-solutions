import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { OutreachAuthorizationError, requireOutreachActor } from "@/lib/outreach/auth";
import { loadOutreachCampaignDetail, loadOutreachCampaigns } from "@/lib/outreach/queries";
import { OUTREACH_CAMPAIGN_STATUSES } from "@/lib/outreach/constants";
import { saveOutreachCampaign, setOutreachCampaignStatus, triggerOutreachDiscovery } from "@/app/[locale]/admin/outreach/actions";

/**
 * Campaign endpoint.
 *
 * The request body never carries a credential. Discovery is exposed as an
 * operator action that only enqueues a job — the Google call itself still happens
 * inside the authenticated job processor, so this route cannot be used to drive
 * the Places API.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const listSchema = z.object({ id: z.string().trim().max(64).optional() });

const statusSchema = z.object({
  campaignId: z.string().trim().min(1).max(64),
  status: z.enum(OUTREACH_CAMPAIGN_STATUSES),
});

const discoverSchema = z.object({ campaignId: z.string().trim().min(1).max(64) });

function fail(error: unknown) {
  if (error instanceof OutreachAuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  console.error("outreach_campaigns_api_failed", getErrorMessage(error));
  return NextResponse.json({ error: "Could not complete that request." }, { status: 500, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  try {
    const actor = await requireOutreachActor("outreach.view");
    const limit = checkRateLimit(`outreach-campaigns:${actor.id}:${requestIp(request.headers)}`, 120, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" } }
      );
    }

    const url = new URL(request.url);
    const parsed = listSchema.safeParse({ id: url.searchParams.get("id") ?? undefined });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ error: "Outreach data is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    if (parsed.data.id) {
      const detail = await loadOutreachCampaignDetail(prisma, parsed.data.id);
      if (!detail) {
        return NextResponse.json({ error: "Campaign not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
      }
      return NextResponse.json({ ok: true, ...detail }, { headers: { "Cache-Control": "no-store" } });
    }

    const campaigns = await loadOutreachCampaigns(prisma);
    return NextResponse.json({ ok: true, campaigns }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireOutreachActor("outreach.manage");
    const limit = checkRateLimit(`outreach-campaigns-write:${actor.id}:${requestIp(request.headers)}`, 30, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" } }
      );
    }

    const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!raw) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const discover = discoverSchema.safeParse(raw);
    if (discover.success) {
      const result = await triggerOutreachDiscovery({ campaignId: discover.data.campaignId });
      return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: { "Cache-Control": "no-store" } });
    }

    const status = statusSchema.safeParse(raw);
    if (status.success) {
      const result = await setOutreachCampaignStatus({ campaignId: status.data.campaignId, status: status.data.status });
      return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: { "Cache-Control": "no-store" } });
    }

    // Anything else must satisfy the full campaign schema.
    const saved = await saveOutreachCampaign(raw);
    return NextResponse.json(saved, { status: saved.ok ? 200 : 400, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}
