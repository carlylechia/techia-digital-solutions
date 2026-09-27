import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { OutreachAuthorizationError, requireOutreachActor } from "@/lib/outreach/auth";
import { OUTREACH_PROSPECT_STATUSES } from "@/lib/outreach/constants";
import { loadOutreachProspects } from "@/lib/outreach/queries";
import { setOutreachProspectStatus, unsubscribeOutreachProspect, updateOutreachProspect } from "@/app/[locale]/admin/outreach/actions";

/** Prospect read and mutation endpoint, protected by the admin permission model. */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const listSchema = z.object({
  campaignId: z.string().trim().max(64).optional(),
  status: z.enum(OUTREACH_PROSPECT_STATUSES).optional(),
  search: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(25),
});

const patchSchema = z.object({
  id: z.string().trim().min(1).max(64),
  businessName: z.string().trim().min(1).max(200).optional(),
  websiteUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  publicEmail: z.string().trim().toLowerCase().max(180).optional().or(z.literal("")),
  publicPhone: z.string().trim().max(40).optional().or(z.literal("")),
  contactName: z.string().trim().max(160).optional().or(z.literal("")),
  contactRole: z.string().trim().max(160).optional().or(z.literal("")),
  industry: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.enum(OUTREACH_PROSPECT_STATUSES).optional(),
  note: z.string().trim().max(2_000).optional().or(z.literal("")),
});

const statusSchema = z.object({
  id: z.string().trim().min(1).max(64),
  status: z.enum(OUTREACH_PROSPECT_STATUSES),
  reason: z.string().trim().max(500).optional(),
});

const actionSchema = z.object({
  action: z.enum(["UNSUBSCRIBE"]),
  id: z.string().trim().min(1).max(64),
});

function fail(error: unknown) {
  if (error instanceof OutreachAuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  console.error("outreach_prospects_api_failed", getErrorMessage(error));
  return NextResponse.json({ error: "Could not complete that request." }, { status: 500, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  try {
    const actor = await requireOutreachActor("outreach.view");
    const limit = checkRateLimit(`outreach-prospects:${actor.id}:${requestIp(request.headers)}`, 120, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" } }
      );
    }

    const url = new URL(request.url);
    const parsed = listSchema.safeParse({
      campaignId: url.searchParams.get("campaignId") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      search: url.searchParams.get("q") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ error: "Outreach data is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    const result = await loadOutreachProspects(prisma, parsed.data);
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireOutreachActor("outreach.manage");
    const limit = checkRateLimit(`outreach-prospects-write:${actor.id}:${requestIp(request.headers)}`, 60, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" } }
      );
    }

    const raw = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const result = await updateOutreachProspect(parsed.data);
    return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireOutreachActor("outreach.manage");
    const limit = checkRateLimit(`outreach-prospects-action:${actor.id}:${requestIp(request.headers)}`, 60, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" } }
      );
    }

    const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const action = actionSchema.safeParse(raw);
    if (!action.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    if (action.data.action === "UNSUBSCRIBE") {
      const result = await unsubscribeOutreachProspect({ prospectId: action.data.id });
      return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: { "Cache-Control": "no-store" } });
    }

    const status = statusSchema.safeParse(raw);
    if (!status.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const result = await setOutreachProspectStatus({
      prospectId: status.data.id,
      status: status.data.status,
      reason: status.data.reason,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}
