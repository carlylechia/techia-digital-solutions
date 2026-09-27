import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { OutreachAuthorizationError, requireOutreachActor } from "@/lib/outreach/auth";
import { loadSuppressionList } from "@/lib/outreach/queries";
import { createOutreachSuppression, deleteOutreachSuppression } from "@/app/[locale]/admin/outreach/actions";

/** Suppression list endpoint. Removal requires the send permission. */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const listSchema = z.object({ page: z.coerce.number().int().min(1).max(10_000).default(1) });

const createSchema = z
  .object({
    email: z.string().trim().toLowerCase().max(180).optional().or(z.literal("")),
    domain: z.string().trim().toLowerCase().max(120).optional().or(z.literal("")),
    reason: z.enum(["UNSUBSCRIBED", "BOUNCED", "SPAM_COMPLAINT", "MANUAL", "DO_NOT_CONTACT"]),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine((data) => Boolean(data.email || data.domain), { message: "Provide an email address or a domain." });

const deleteSchema = z.object({ id: z.string().trim().min(1).max(64) });

function fail(error: unknown) {
  if (error instanceof OutreachAuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  console.error("outreach_suppression_api_failed", getErrorMessage(error));
  return NextResponse.json({ error: "Could not complete that request." }, { status: 500, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  try {
    const actor = await requireOutreachActor("outreach.view");
    const limit = checkRateLimit(`outreach-suppression:${actor.id}:${requestIp(request.headers)}`, 120, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" } }
      );
    }

    const url = new URL(request.url);
    const parsed = listSchema.safeParse({ page: url.searchParams.get("page") ?? undefined });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ error: "Outreach data is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    const result = await loadSuppressionList(prisma, parsed.data.page);
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireOutreachActor("outreach.manage");
    const limit = checkRateLimit(`outreach-suppression-write:${actor.id}:${requestIp(request.headers)}`, 30, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" } }
      );
    }

    const raw = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const result = await createOutreachSuppression(parsed.data);
    return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Re-enabling a suppressed address is a privileged action.
    const actor = await requireOutreachActor("outreach.send");
    const limit = checkRateLimit(`outreach-suppression-delete:${actor.id}:${requestIp(request.headers)}`, 20, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" } }
      );
    }

    const url = new URL(request.url);
    const parsed = deleteSchema.safeParse({ id: url.searchParams.get("id") ?? "" });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const result = await deleteOutreachSuppression({ id: parsed.data.id });
    return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}
