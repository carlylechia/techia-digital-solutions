import "server-only";

import { sendLeadEmail } from "@/lib/email";
import { getErrorMessage } from "@/lib/prisma-errors";
import { OUTREACH_SAFETY } from "./config";
import type { ReplyCategory } from "./constants";

/**
 * Admin notifications.
 *
 * Reuses the existing transactional notification channel (`sendLeadEmail`) so
 * admin alerts stay in one inbox. Alerts are deliberately sparse: only events a
 * human must act on, never routine discovery.
 */

function escape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const CATEGORY_COPY: Record<string, string> = {
  INTERESTED: "A prospect expressed interest",
  QUESTION: "A prospect asked a question",
  MEETING_REQUEST: "A prospect asked to book a meeting",
  PRICE_REQUEST: "A prospect asked about pricing",
};

export async function notifyAdminOfOutreachReply(input: {
  prospectId: string;
  businessName: string;
  category: ReplyCategory;
  excerpt: string;
  suggestedAction: string;
}) {
  const headline = CATEGORY_COPY[input.category] ?? "An outreach reply needs review";
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://techiadigital.com").replace(/\/+$/, "");
  const link = `${site}/admin/outreach/conversations?category=${encodeURIComponent(input.category)}`;

  const html = `<div style="color:#94a3b8;font-size:14px;line-height:1.7;">${escape(headline)}</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;border:1px solid #1e1e2e;border-radius:12px;padding:16px 20px;margin:16px 0;">
      <tr><td style="padding:4px 0;color:#f8fafc;font-weight:600;">${escape(input.businessName)}</td></tr>
      <tr><td style="padding:4px 0;color:#06b6d4;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">${escape(input.category)}</td></tr>
    </table>
    <div style="background:#0a0a0f;border:1px solid #1e1e2e;border-radius:12px;padding:16px 20px;margin:0 0 16px;">
      <p style="margin:0;font-size:14px;color:#e2e8f0;line-height:1.7;white-space:pre-wrap;">${escape(input.excerpt.slice(0, 500))}</p>
    </div>
    <p style="margin:0 0 12px;color:#94a3b8;font-size:13px;">${escape(input.suggestedAction)}</p>
    <p style="margin:0;"><a href="${escape(link)}" style="background:#06b6d4;color:#0a0a0f;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;">Open conversations</a></p>`;

  try {
    await sendLeadEmail(`[outreach] ${input.category} · ${input.businessName} · teChia`, html);
  } catch (error) {
    console.error("[outreach-notify] reply_failed", getErrorMessage(error));
  }
}

export async function notifyAdminOfOutreachAlert(input: {
  severity: "warning" | "critical";
  title: string;
  detail: string;
  campaignName?: string | null;
}) {
  const color = input.severity === "critical" ? "#ef4444" : "#f59e0b";
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://techiadigital.com").replace(/\/+$/, "");

  const html = `<div style="display:inline-block;background:${color}22;border:1px solid ${color}44;border-radius:8px;padding:4px 12px;margin:0 0 16px;">
      <span style="font-size:13px;font-weight:700;color:${color};">${escape(input.severity.toUpperCase())}</span>
    </div>
    <div style="color:#f8fafc;font-size:15px;line-height:1.6;">${escape(input.title)}</div>
    ${input.campaignName ? `<div style="color:#94a3b8;font-size:13px;margin:8px 0 0;">Campaign: ${escape(input.campaignName)}</div>` : ""}
    <div style="background:#0a0a0f;border:1px solid #1e1e2e;border-radius:12px;padding:16px 20px;margin:16px 0;">
      <p style="margin:0;font-size:14px;color:#e2e8f0;line-height:1.7;white-space:pre-wrap;">${escape(input.detail.slice(0, 600))}</p>
    </div>
    <p style="margin:0;"><a href="${escape(site)}/admin/outreach" style="background:#06b6d4;color:#0a0a0f;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;">Open outreach console</a></p>`;

  try {
    await sendLeadEmail(`[outreach] ${input.title} · teChia`, html);
  } catch (error) {
    console.error("[outreach-notify] alert_failed", getErrorMessage(error));
  }
}

export function isBounceRateAbnormal(sent: number, bounced: number) {
  if (sent < OUTREACH_SAFETY.bounceRateAlertMinSends) return false;
  return bounced / sent >= OUTREACH_SAFETY.bounceRateAlertThreshold;
}
