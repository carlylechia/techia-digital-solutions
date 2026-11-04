import "server-only";

import { Resend } from "resend";
import { getErrorMessage } from "@/lib/prisma-errors";
import { escapeEmailHtml, renderEmailLayout, safeEmailHref, sanitizeEmailHeader } from "@/lib/email-layout";
import { OUTREACH_SENDER } from "./config";
import { normalizeEmail } from "./limits";

/**
 * Outreach email service — deliberately separate from lib/email.ts.
 *
 * lib/email.ts powers transactional notifications, portal invites and the
 * newsletter. Nothing in this file touches newsletter subscribers, and nothing
 * in lib/email.ts imports this file, so the two workflows can never mix.
 *
 * Every send here is individually addressed. There is no BCC path and no bulk
 * send helper in this module by design.
 */

export type OutreachSendInput = {
  to: string;
  subject: string;
  bodyText: string;
  /** Stable per-message key. The provider uses it to refuse a second delivery. */
  idempotencyKey: string;
  replyTo?: string;
  unsubscribeUrl?: string | null;
  fromName?: string | null;
  fromAddress?: string | null;
};

export type OutreachSendResult = {
  sent: boolean;
  skipped: "not_configured" | "disabled" | null;
  providerMessageId: string | null;
  error: string | null;
};

function cleanEnv(value: string | undefined): string | undefined {
  if (!value) return value;
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function getOutreachResend() {
  // Reuses the existing provider credential. Outreach may still opt into a
  // dedicated sending subdomain when the operator has verified one.
  const apiKey = cleanEnv(process.env.OUTREACH_RESEND_API_KEY) || cleanEnv(process.env.RESEND_API_KEY);
  if (!apiKey || apiKey.startsWith("re_placeholder")) return null;
  return new Resend(apiKey);
}

/**
 * Strips control characters from a header value. Applied to the subject and to
 * the List-Unsubscribe URL, never to the body, so body formatting survives.
 */

function fromAddress(input: OutreachSendInput) {
  // Use the same pattern as the main admin email service (lib/email.ts)
  // to ensure compatibility with Resend's validation requirements.
  const explicit = cleanEnv(input.fromAddress ?? undefined) || cleanEnv(process.env.OUTREACH_FROM_EMAIL);
  const fallback = cleanEnv(process.env.RESEND_FROM_EMAIL) || "noreply@techiadigital.com";
  const address = explicit || fallback;
  // If the address already contains a name (e.g., "Name <email>"), use it as-is
  if (address.includes("<") && address.includes(">")) {
    return address;
  }
  // If the address contains "Outreach", it's already a valid from string
  if (address.includes("Outreach")) {
    return address;
  }
  // Otherwise, format as "Name <email>" — but only if the name is simple
  const name = cleanEnv(input.fromName ?? undefined) || OUTREACH_SENDER.name;
  // Ensure the name doesn't contain characters that could break Resend's parsing
  const safeName = name.replace(/[<>"\\]/g, "").trim();
  return `${safeName} <${address}>`;
}

/**
 * The compliance footer. Marketing email law is not identical in Cameroon, the
 * US and the EU, so every message carries the sender identity, the postal
 * address and a working one-click unsubscribe.
 */
function complianceFooter(unsubscribeUrl: string | null, note: string | null) {
  const href = safeEmailHref(unsubscribeUrl);
  const unsubscribeBlock = href
    ? `<p style="margin:0 0 10px;"><a href="${escapeEmailHtml(href)}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe from teChia business messages</a></p>`
    : "";
  const noteBlock = note ? `<p style="margin:0 0 10px;color:#94a3b8;font-size:12px;line-height:1.7;">${escapeEmailHtml(note)}</p>` : "";
  return `<div style="margin:0;">
    ${noteBlock}
    ${unsubscribeBlock}
    <p style="margin:0;font-size:12px;color:#64748b;line-height:1.7;">
      ${escapeEmailHtml(OUTREACH_SENDER.name)} · ${escapeEmailHtml(OUTREACH_SENDER.brand)} · ${escapeEmailHtml(OUTREACH_SENDER.address)} ·
      <a href="${escapeEmailHtml(OUTREACH_SENDER.siteUrl)}" style="color:#06b6d4;text-decoration:none;">techiadigital.com</a>
    </p>
  </div>`;
}

export function buildOutreachHtml(input: { subject: string; bodyText: string; unsubscribeUrl: string | null; complianceNote: string | null }) {
  // The body is model-generated, so it is escaped rather than trusted. A prompt
  // injection that survives validation can therefore never inject markup or a
  // script into an email.
  const subject = sanitizeEmailHeader(input.subject, 180);
  return renderEmailLayout({
    subject,
    // The first sentence doubles as an inbox preheader without duplicating the
    // whole body in clients that render preview text.
    preheader: input.bodyText.replace(/\s+/g, " ").trim().slice(0, 150),
    eyebrow: OUTREACH_SENDER.brand,
    title: subject,
    bodyText: input.bodyText,
    footerHtml: complianceFooter(input.unsubscribeUrl, input.complianceNote),
  });
}

/**
 * Deliver a single outreach message. The caller is responsible for having
 * already passed the full send gate; this function only performs the provider
 * call and reports the outcome.
 */
export async function sendOutreachEmail(input: OutreachSendInput & { complianceNote?: string | null }): Promise<OutreachSendResult> {
  const resend = getOutreachResend();
  if (!resend) {
    return { sent: false, skipped: "not_configured", providerMessageId: null, error: "Email provider is not configured." };
  }

  // Validate recipient email before sending
  const recipient = normalizeEmail(input.to);
  if (!recipient || !recipient.includes("@") || recipient.length < 5) {
    return { sent: false, skipped: null, providerMessageId: null, error: `Invalid recipient email address: ${input.to}` };
  }

  const html = buildOutreachHtml({
    subject: input.subject,
    bodyText: input.bodyText,
    unsubscribeUrl: input.unsubscribeUrl ?? null,
    complianceNote: input.complianceNote ?? null,
  });

  // Header injection and protocol confusion are both closed off by validating the
  // URL and stripping control characters before anything reaches the provider.
  const listUnsubscribeUrl = safeEmailHref(input.unsubscribeUrl);
  const headers: Record<string, string> = {};
  if (listUnsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${sanitizeEmailHeader(listUnsubscribeUrl, 500)}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  const subject = sanitizeEmailHeader(input.subject, 180);
  const from = fromAddress(input);

  try {
    const { data, error } = await resend.emails.send(
      {
        from,
        to: recipient,
        replyTo: cleanEnv(input.replyTo ?? undefined) || cleanEnv(process.env.OUTREACH_REPLY_TO) || cleanEnv(process.env.RESEND_REPLY_TO) || undefined,
        subject,
        html,
        text: input.bodyText,
        ...(Object.keys(headers).length > 0 ? { headers } : {}),
      },
      { idempotencyKey: input.idempotencyKey }
    );

    if (error) {
      console.error("[outreach-email] provider_error", {
        name: error.name,
        message: error.message,
        category: error.name,
        idempotencyKey: input.idempotencyKey,
        to: input.to,
        from: fromAddress(input),
      });
      return {
        sent: false,
        skipped: null,
        providerMessageId: null,
        error: `Email provider error (${error.name}): ${error.message ?? "Unknown error"}`,
      };
    }

    return { sent: true, skipped: null, providerMessageId: data?.id ?? null, error: null };
  } catch (error) {
    console.error("[outreach-email] send_failed", { idempotencyKey: input.idempotencyKey, error: getErrorMessage(error) });
    return { sent: false, skipped: null, providerMessageId: null, error: "Email provider request failed." };
  }
}

export function isOutreachEmailConfigured() {
  return getOutreachResend() !== null;
}
