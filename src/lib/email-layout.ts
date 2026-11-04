/**
 * Shared, dependency-free email layout.
 *
 * Every outbound message in the product — transactional notifications, client
 * portal invitations, CRM replies and outreach — is rendered through this one
 * template. Keeping the layout in a single pure module means the back office and
 * the outreach engine cannot drift into two different visual identities, and it
 * can be unit tested without a provider credential or a database.
 *
 * The renderer is deliberately conservative: all text is escaped unless the
 * caller explicitly supplies already-built HTML. URLs are accepted only when
 * they are absolute http(s), so a `javascript:` link can never reach a mail
 * client even if it survives validation elsewhere.
 */

export function escapeEmailHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function safeEmailHref(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Collapse header-style values so a newline can never start a new header. */
export function sanitizeEmailHeader(value: string, maxLength = 180) {
  return value
    .replace(/[\r\n]+/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, maxLength);
}

/**
 * Convert plain text into safe paragraph HTML. Blank lines become paragraphs and
 * single newlines become line breaks, matching how the composer previews text.
 */
export function renderEmailText(value: string) {
  const escaped = escapeEmailHtml(value.slice(0, 20_000));
  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 16px;font-size:15px;color:#e2e8f0;line-height:1.75;">${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export type EmailLayoutInput = {
  /** Subject line. Also used as the document title and visible heading. */
  subject: string;
  /** Preheader shown by mail clients before the body opens. */
  preheader?: string | null;
  /** Safe plain text. Ignored when `bodyHtml` is provided. */
  bodyText?: string;
  /** Already-built HTML. Callers are responsible for escaping interpolated data. */
  bodyHtml?: string;
  /** Small uppercase label above the heading. */
  eyebrow?: string;
  /** Optional heading override. Defaults to the subject. */
  title?: string | null;
  /** Footer HTML supplied by the caller (compliance text, unsubscribe link). */
  footerHtml?: string;
  /** Brand identity shown in the header. */
  brand?: string;
  siteUrl?: string;
  /** Inline accent colour used by the header rule and links. */
  accent?: string;
  /** Hide the large subject heading when the body already contains it. */
  hideTitle?: boolean;
};

export function renderEmailLayout(input: EmailLayoutInput) {
  const brand = input.brand || "teChia Digital Solutions";
  const siteUrl = safeEmailHref(input.siteUrl || "https://techiadigital.com") || "https://techiadigital.com";
  const accent = input.accent || "#06b6d4";
  const subject = sanitizeEmailHeader(input.subject, 180);
  const title = sanitizeEmailHeader(input.title || input.subject, 220);
  const preheader = input.preheader ? sanitizeEmailHeader(input.preheader, 180) : "";
  const body = input.bodyHtml ?? renderEmailText(input.bodyText ?? "");
  const footer =
    input.footerHtml ??
    `<p style="margin:0;font-size:12px;color:#64748b;line-height:1.7;">${escapeEmailHtml(brand)} · <a href="${escapeEmailHtml(siteUrl)}" style="color:${accent};text-decoration:none;">techiadigital.com</a></p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark light" />
  <title>${escapeEmailHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeEmailHtml(preheader)}</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0a0a0f;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#111118;border:1px solid #1e1e2e;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="padding:30px 32px 22px;border-bottom:1px solid #1e1e2e;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${accent};">${escapeEmailHtml(input.eyebrow || brand)}</p>
              ${input.hideTitle ? "" : `<h1 style="margin:14px 0 0;font-size:23px;line-height:1.35;font-weight:700;color:#f8fafc;">${escapeEmailHtml(title)}</h1>`}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 10px;">${body}</td>
          </tr>
          <tr>
            <td style="padding:20px 32px 24px;border-top:1px solid #1e1e2e;background:#0d0d1a;">${footer}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
