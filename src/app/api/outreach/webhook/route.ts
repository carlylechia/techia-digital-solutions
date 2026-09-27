import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { handleBounce } from "@/lib/outreach/sending";
import { enqueueJob } from "@/lib/outreach/jobs";
import { recordEvent } from "@/lib/outreach/events";
import { isValidEmail, normalizeEmail } from "@/lib/outreach/limits";
import { unsubscribeContact } from "@/lib/outreach/suppression";

/**
 * Email provider webhook.
 *
 * Receives delivery, bounce, complaint and inbound-reply events. Two protections
 * are applied before anything is trusted:
 *   1. the raw body is verified against the provider signing secret with a
 *      constant-time comparison, and
 *   2. every payload field is length-bounded and re-validated, because a verified
 *      sender can still deliver a malformed body.
 *
 * Provider identifiers are only ever matched against records this engine wrote,
 * so an attacker who found the endpoint still cannot touch unrelated data.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SignatureResult = { ok: true } | { ok: false; reason: "not_configured" | "missing_signature" | "invalid_signature" };

function verifySignature(rawBody: string, signatureHeader: string | null): SignatureResult {
  const secret = process.env.OUTREACH_WEBHOOK_SECRET || process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return { ok: false, reason: "not_configured" };
  if (!signatureHeader) return { ok: false, reason: "missing_signature" };

  const provided = signatureHeader.replace(/^sha256=/, "");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  const providedBuffer = Buffer.from(provided, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (providedBuffer.length === 0 || providedBuffer.length !== expectedBuffer.length) {
    return { ok: false, reason: "invalid_signature" };
  }
  return timingSafeEqual(providedBuffer, expectedBuffer) ? { ok: true } : { ok: false, reason: "invalid_signature" };
}

type WebhookEvent = {
  type?: unknown;
  data?: {
    email_id?: unknown;
    to?: unknown;
    subject?: unknown;
    text?: unknown;
    html?: unknown;
    reason?: unknown;
  };
};

function asString(value: unknown, max = 4_000) {
  return typeof value === "string" ? value.slice(0, max) : null;
}

function stripHtml(value: string | null) {
  if (!value) return "";
  return value
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEmailAddress(value: string) {
  const match = /<?([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})>?/i.exec(value);
  const normalized = normalizeEmail(match?.[1]);
  return isValidEmail(normalized) ? normalized : null;
}

export async function POST(request: Request) {
  const rawBody = await request.text().catch(() => "");
  const signature = verifySignature(
    rawBody,
    request.headers.get("resend-signature") || request.headers.get("x-resend-signature")
  );
  if (!signature.ok) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: signature.reason === "not_configured" ? 503 : 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const type = asString(event.type, 80);
  const prisma = getPrisma();
  if (!prisma || !type) {
    return NextResponse.json({ ok: true, ignored: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }

  const providerMessageId = asString(event.data?.email_id, 200);

  try {
    if (type === "email.delivered" && providerMessageId) {
      const message = await prisma.outreachMessage.findUnique({
        where: { providerMessageId },
        select: { id: true, campaignId: true, prospectId: true, status: true },
      });
      if (message && message.status === "SENT") {
        await prisma.outreachMessage.update({
          where: { id: message.id },
          data: { status: "DELIVERED", deliveredAt: new Date() },
        });
        await recordEvent({
          type: "EMAIL_DELIVERED",
          campaignId: message.campaignId,
          prospectId: message.prospectId,
          messageId: message.id,
        });
      }
      return NextResponse.json({ ok: true, handled: "delivered" }, { headers: { "Cache-Control": "no-store" } });
    }

    if (type === "email.bounced" && providerMessageId) {
      const detail = asString(event.data?.reason, 300) ?? "Reported by the email provider.";
      const result = await handleBounce({ providerMessageId, category: "hard", detail });
      return NextResponse.json({ ok: true, handled: "bounced", ...result }, { headers: { "Cache-Control": "no-store" } });
    }

    if (type === "email.complained" && providerMessageId) {
      // A spam complaint is the strongest possible signal. Suppress immediately
      // and permanently rather than waiting for a bounce.
      const message = await prisma.outreachMessage.findUnique({
        where: { providerMessageId },
        select: { id: true, campaignId: true, prospectId: true, prospect: { select: { publicEmail: true } } },
      });
      if (message?.prospect.publicEmail) {
        await unsubscribeContact(message.prospect.publicEmail, message.prospectId);
        await recordEvent({
          type: "UNSUBSCRIBED",
          campaignId: message.campaignId,
          prospectId: message.prospectId,
          messageId: message.id,
          summary: "Recipient reported a spam complaint.",
          metadata: { reason: asString(event.data?.reason, 200) },
        });
      }
      return NextResponse.json({ ok: true, handled: "complaint" }, { headers: { "Cache-Control": "no-store" } });
    }

    if (type === "email.inbound") {
      const to = asString(event.data?.to, 300);
      const address = to ? extractEmailAddress(to) : null;
      if (!address) {
        return NextResponse.json({ ok: true, ignored: "unmatched_recipient" }, { headers: { "Cache-Control": "no-store" } });
      }

      // Matched only through an address the business itself published. An
      // unknown sender is never guessed onto a prospect record.
      const prospect = await prisma.outreachProspect.findFirst({
        where: { publicEmail: address },
        select: { id: true },
        orderBy: { discoveredAt: "desc" },
      });
      if (!prospect) {
        return NextResponse.json({ ok: true, ignored: "unknown_prospect" }, { headers: { "Cache-Control": "no-store" } });
      }

      const body = asString(event.data?.text, 8_000) ?? stripHtml(asString(event.data?.html, 20_000));
      if (!body.trim()) {
        return NextResponse.json({ ok: true, ignored: "empty_body" }, { headers: { "Cache-Control": "no-store" } });
      }

      await enqueueJob({
        type: "PROCESS_REPLY",
        prospectId: prospect.id,
        dedupeKey: `PROCESS_REPLY:${prospect.id}:${providerMessageId ?? `${Date.now()}`}`,
        payload: { prospectId: prospect.id, subject: asString(event.data?.subject, 300), body },
      });
      return NextResponse.json({ ok: true, handled: "inbound" }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ ok: true, ignored: "unhandled_type" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("outreach_webhook_failed", { type, error: getErrorMessage(error) });
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
