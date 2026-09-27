import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { unsubscribeContact } from "@/lib/outreach/suppression";

/**
 * One-click unsubscribe.
 *
 * This is the public endpoint the List-Unsubscribe header in every outreach
 * message points at. It is intentionally a GET so mailbox providers can offer
 * native one-click unsubscribe, and it never exposes any prospect data back to
 * the caller — only a generic confirmation.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const querySchema = z.object({
  p: z.string().trim().min(1).max(64),
  m: z.string().trim().max(64).optional(),
});

const CONFIRMATION_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="robots" content="noindex,nofollow" /><title>Unsubscribed · teChia</title></head>
<body style="margin:0;padding:48px 16px;background:#0a0a0f;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#111118;border:1px solid #1e1e2e;border-radius:16px;padding:32px;">
    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#06b6d4;">teChia Digital Solutions</p>
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">You have been unsubscribed</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#94a3b8;">We will not send any further business messages to this address. If you received this by mistake, or you would like to hear from us about a specific project, simply reply to any earlier message and a person will help.</p>
    <p style="margin:0;font-size:13px;color:#64748b;">teChia Digital Solutions · Cameroon</p>
  </div>
</body></html>`;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ p: url.searchParams.get("p"), m: url.searchParams.get("m") ?? undefined });

  if (!parsed.success) {
    return new NextResponse("Invalid unsubscribe link.", { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return new NextResponse("Temporarily unavailable. Please try again shortly.", { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  try {
    // The message id is only used to confirm the link matches a real outbound
    // message; an email address is never taken from the URL.
    const message = await prisma.outreachMessage.findUnique({
      where: { id: parsed.data.m ?? "" },
      select: { prospectId: true, prospect: { select: { publicEmail: true } } },
    });

    const prospect = await prisma.outreachProspect.findUnique({
      where: { id: parsed.data.p },
      select: { id: true, publicEmail: true },
    });

    if (!prospect) {
      return new NextResponse(CONFIRMATION_HTML, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
    }

    if (message && message.prospectId !== prospect.id) {
      // A link whose message and prospect do not match is not honoured.
      return new NextResponse(CONFIRMATION_HTML, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
    }

    await unsubscribeContact(prospect.publicEmail ?? "", prospect.id);

    return new NextResponse(CONFIRMATION_HTML, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
    });
  } catch (error) {
    console.error("outreach_unsubscribe_failed", getErrorMessage(error));
    return new NextResponse("Temporarily unavailable. Please try again shortly.", { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
