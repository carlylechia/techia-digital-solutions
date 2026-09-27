import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { OutreachAuthorizationError, requireOutreachActor } from "@/lib/outreach/auth";
import { loadReviewQueue } from "@/lib/outreach/queries";
import { reviewOutreachMessage } from "@/app/[locale]/admin/outreach/actions";

/**
 * Review queue endpoint.
 *
 * Authorization is enforced on the server from the admin session and the
 * `outreach.view` / `outreach.manage` permissions; hiding the UI is never the
 * control. The mutation is delegated to the same server action the admin UI
 * calls, so validation, audit logging and the authorization rule cannot drift
 * between the two entry points.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const querySchema = z.object({
  campaignId: z.string().trim().max(64).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});

const bodySchema = z.object({
  messageId: z.string().trim().min(1).max(64),
  action: z.enum(["APPROVE", "REJECT", "EDIT", "PAUSE_PROSPECT"]),
  subject: z.string().trim().min(3).max(180).optional(),
  bodyText: z.string().trim().min(20).max(4_000).optional(),
});

function fail(error: unknown) {
  if (error instanceof OutreachAuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  console.error("outreach_review_api_failed", getErrorMessage(error));
  return NextResponse.json({ error: "Could not complete that request." }, { status: 500, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  try {
    const actor = await requireOutreachActor("outreach.view");

    const limit = checkRateLimit(`outreach-review:${actor.id}:${requestIp(request.headers)}`, 120, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" } }
      );
    }

    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      campaignId: url.searchParams.get("campaignId") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ error: "Outreach data is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    const queue = await loadReviewQueue(prisma, parsed.data.campaignId, parsed.data.page);
    return NextResponse.json(
      {
        ok: true,
        total: queue.total,
        page: queue.page,
        totalPages: queue.totalPages,
        items: queue.rows.map((row) => ({
          messageId: row.id,
          type: row.type,
          status: row.status,
          subject: row.subject,
          bodyText: row.bodyText,
          createdAt: row.createdAt,
          prospect: {
            id: row.prospect.id,
            businessName: row.prospect.businessName,
            city: row.prospect.city,
            country: row.prospect.country,
            industry: row.prospect.industry,
            opportunityScore: row.prospect.opportunityScore,
            publicEmail: row.prospect.publicEmail,
            recommendedServices: row.prospect.recommendedServices,
            status: row.prospect.status,
          },
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireOutreachActor("outreach.manage");

    const limit = checkRateLimit(`outreach-review-mutate:${actor.id}:${requestIp(request.headers)}`, 60, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" } }
      );
    }

    const raw = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    if (!getPrisma()) {
      return NextResponse.json({ error: "Outreach data is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    const result = await reviewOutreachMessage(parsed.data);
    return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}
