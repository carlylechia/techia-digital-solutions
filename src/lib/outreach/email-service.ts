import "server-only";

import { Resend } from "resend";
import { getErrorMessage } from "@/lib/prisma-errors";
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
function stripControlCharacters(value: string, maxLength: number) {
  return value
    .replace(/[\r\n]+/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Only absolute http/https links are ever emitted. Escaping alone is not enough
 * for an href, because a `javascript:` URL survives HTML escaping and still
 * executes in some mail clients.
 */
function safeHref(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

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
  const href = safeHref(unsubscribeUrl);
  const unsubscribeBlock = href
    ? `<p style="margin:0 0 8px;"><a href="${escapeHtml(href)}" style="color:#64748b;text-decoration:underline;">Unsubscribe from teChia business messages</a></p>`
    : "";
  const noteBlock = note ? `<p style="margin:0 0 8px;">${escapeHtml(note)}</p>` : "";
  return `<div style="margin:0;padding:20px 32px;border-top:1px solid #1e1e2e;background:#0d0d1a;">
    ${noteBlock}
    ${unsubscribeBlock}
    <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;">
      ${escapeHtml(OUTREACH_SENDER.name)} · ${escapeHtml(OUTREACH_SENDER.brand)} · ${escapeHtml(OUTREACH_SENDER.address)} ·
      <a href="${escapeHtml(OUTREACH_SENDER.siteUrl)}" style="color:#06b6d4;text-decoration:none;">techiadigital.com</a>
    </p>
  </div>`;
}

export function buildOutreachHtml(input: { subject: string; bodyText: string; unsubscribeUrl: string | null; complianceNote: string | null }) {
  // The body is model-generated, so it is escaped rather than trusted. A prompt
  // injection that survives validation can therefore never inject markup or a
  // script into an email.
  const subject = stripControlCharacters(input.subject, 180);
  const bodyHtml = escapeHtml(input.bodyText.slice(0, 4_000)).replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br />");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111118;border:1px solid #1e1e2e;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 18px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#06b6d4;">${escapeHtml(OUTREACH_SENDER.brand)}</p>
          <p style="margin:0;font-size:15px;color:#e2e8f0;line-height:1.7;">${bodyHtml}</p>
        </td></tr>
        <tr><td>${complianceFooter(input.unsubscribeUrl, input.complianceNote)}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
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
  const listUnsubscribeUrl = safeHref(input.unsubscribeUrl);
  const headers: Record<string, string> = {};
  if (listUnsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${stripControlCharacters(listUnsubscribeUrl, 500)}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  const subject = stripControlCharacters(input.subject, 180);
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
