import { Resend } from "resend";

/** Strip surrounding quotes that may be present if env values were pasted with quotes in Vercel. */
function cleanEnv(value: string | undefined): string | undefined {
  if (!value) return value;
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function getResend() {
  const apiKey = cleanEnv(process.env.RESEND_API_KEY);
  if (!apiKey || apiKey.startsWith("re_placeholder")) return null;
  return new Resend(apiKey);
}

function officialInfo() {
  return {
    email: cleanEnv(process.env.OFFICIAL_EMAIL) || cleanEnv(process.env.CONTACT_TO_EMAIL) || cleanEnv(process.env.ADMIN_EMAIL) || "",
    whatsapp: cleanEnv(process.env.OFFICIAL_WHATSAPP) || "",
    call: cleanEnv(process.env.OFFICIAL_CALL) || "",
    from: cleanEnv(process.env.RESEND_FROM_EMAIL) || "noreply@techiadigital.com",
    replyTo: cleanEnv(process.env.RESEND_REPLY_TO) || cleanEnv(process.env.OFFICIAL_EMAIL) || undefined
  };
}

function baseHtml(content: string, title: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111118;border:1px solid #1e1e2e;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 32px 0;border-bottom:1px solid #1e1e2e;">
          <p style="margin:0 0 24px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#06b6d4;">teChia Digital Solutions</p>
          <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#f8fafc;line-height:1.3;">${title}</h1>
        </td></tr>
        <tr><td style="padding:28px 32px;">${content}</td></tr>
        <tr><td style="padding:24px 32px;border-top:1px solid #1e1e2e;background:#0d0d1a;">
          <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;">
            teChia Digital Solutions · <a href="https://techiadigital.com" style="color:#06b6d4;text-decoration:none;">techiadigital.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function fieldRow(label: string, value: string | null | undefined) {
  if (!value) return "";
  return `<tr>
    <td style="padding:8px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;width:130px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0 8px 16px;font-size:14px;color:#e2e8f0;vertical-align:top;">${value}</td>
  </tr>`;
}

function infoTable(fields: Array<[string, string | null | undefined]>) {
  const rows = fields.map(([l, v]) => fieldRow(l, v)).join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;border:1px solid #1e1e2e;border-radius:12px;padding:16px 20px;margin:16px 0;">${rows}</table>`;
}

export async function sendLeadEmail(subject: string, html: string) {
  const resend = getResend();
  const info = officialInfo();
  if (!resend) {
    console.warn("[email] sendLeadEmail skipped: RESEND_API_KEY not configured or is placeholder");
    return { skipped: true };
  }
  if (!info.email) {
    console.warn("[email] sendLeadEmail skipped: no recipient email configured (OFFICIAL_EMAIL / CONTACT_TO_EMAIL / ADMIN_EMAIL)");
    return { skipped: true };
  }
  const { data, error } = await resend.emails.send({ from: info.from, to: info.email, replyTo: info.replyTo, subject, html });
  if (error) {
    console.error("[email] sendLeadEmail failed — Resend API error", {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      from: info.from,
      to: info.email,
      subject
    });
    throw new Error(`Resend error (${error.name}): ${error.message}`);
  }
  console.info("[email] sendLeadEmail delivered", { id: data?.id, to: info.email, subject });
  return { skipped: false, id: data?.id };
}

export async function sendContactNotification(data: {
  name: string; email: string; phone?: string | null; whatsapp?: string | null; company?: string | null; message: string;
}) {
  const content = `
    <p style="color:#94a3b8;font-size:14px;margin:0 0 16px;">A new contact message was submitted on your website.</p>
    ${infoTable([
      ["Name", data.name], ["Email", data.email], ["Phone", data.phone],
      ["WhatsApp", data.whatsapp], ["Company", data.company]
    ])}
    <div style="background:#0a0a0f;border:1px solid #1e1e2e;border-radius:12px;padding:20px;margin:16px 0;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Message</p>
      <p style="margin:0;font-size:14px;color:#e2e8f0;white-space:pre-wrap;line-height:1.7;">${data.message}</p>
    </div>
    ${data.whatsapp ? `<p style="margin:16px 0 0;"><a href="https://wa.me/${data.whatsapp.replace(/\D/g, "")}" style="background:#25D366;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">Reply on WhatsApp</a></p>` : ""}
    <p style="margin:16px 0 0;"><a href="mailto:${data.email}" style="background:#06b6d4;color:#0a0a0f;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">Reply via Email</a></p>
  `;
  return sendLeadEmail(`New contact from ${data.name} · teChia`, baseHtml(content, `New contact: ${data.name}`));
}

export async function sendProjectInquiryNotification(data: {
  name: string; email: string; phone?: string | null; whatsapp?: string | null; company?: string | null;
  country?: string | null; businessType?: string; need?: string; budgetRange?: string; timeline?: string; details?: string;
}) {
  const content = `
    <p style="color:#94a3b8;font-size:14px;margin:0 0 16px;">A new project inquiry was submitted. A lead has been automatically created.</p>
    ${infoTable([
      ["Name", data.name], ["Email", data.email], ["Phone", data.phone],
      ["WhatsApp", data.whatsapp], ["Company", data.company], ["Country", data.country],
      ["Business type", data.businessType], ["Need", data.need],
      ["Budget", data.budgetRange], ["Timeline", data.timeline]
    ])}
    ${data.details ? `<div style="background:#0a0a0f;border:1px solid #1e1e2e;border-radius:12px;padding:20px;margin:16px 0;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Project Details</p>
      <p style="margin:0;font-size:14px;color:#e2e8f0;white-space:pre-wrap;line-height:1.7;">${data.details}</p>
    </div>` : ""}
    ${data.whatsapp ? `<p style="margin:16px 0 0;"><a href="https://wa.me/${data.whatsapp.replace(/\D/g, "")}" style="background:#25D366;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">Reply on WhatsApp</a></p>` : ""}
    <p style="margin:8px 0 0;"><a href="mailto:${data.email}" style="background:#06b6d4;color:#0a0a0f;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">Reply via Email</a></p>
  `;
  return sendLeadEmail(`New project inquiry from ${data.name} · teChia`, baseHtml(content, `Project inquiry: ${data.name}`));
}

export async function sendDemoRequestNotification(data: {
  name: string; email: string; phone?: string | null; whatsapp?: string | null; company?: string | null; demo?: string; message?: string | null;
}) {
  const content = `
    <p style="color:#94a3b8;font-size:14px;margin:0 0 16px;">A new demo request was submitted.</p>
    ${infoTable([
      ["Name", data.name], ["Email", data.email], ["Phone", data.phone],
      ["WhatsApp", data.whatsapp], ["Company", data.company], ["Demo requested", data.demo]
    ])}
    ${data.message ? `<div style="background:#0a0a0f;border:1px solid #1e1e2e;border-radius:12px;padding:20px;margin:16px 0;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Message</p>
      <p style="margin:0;font-size:14px;color:#e2e8f0;white-space:pre-wrap;line-height:1.7;">${data.message}</p>
    </div>` : ""}
    ${data.whatsapp ? `<p style="margin:16px 0 0;"><a href="https://wa.me/${data.whatsapp.replace(/\D/g, "")}" style="background:#25D366;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">Reply on WhatsApp</a></p>` : ""}
    <p style="margin:8px 0 0;"><a href="mailto:${data.email}" style="background:#06b6d4;color:#0a0a0f;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">Reply via Email</a></p>
  `;
  return sendLeadEmail(`New demo request from ${data.name} · teChia`, baseHtml(content, `Demo request: ${data.name}`));
}

export async function sendOutboundEmail(options: {
  to: string;
  subject: string;
  body: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}) {
  const resend = getResend();
  const info = officialInfo();
  if (!resend) {
    throw new Error(
      "Email not configured — add a valid RESEND_API_KEY to your environment variables (current key is missing or a placeholder)."
    );
  }

  const content = `<div style="font-size:15px;color:#e2e8f0;line-height:1.7;white-space:pre-wrap;">${options.body.replace(/[<>]/g, (c) => (c === "<" ? "&lt;" : "&gt;")).replace(/\n/g, "<br>")}</div>`;
  const html = baseHtml(content, options.subject);

  const from = options.from || info.from;
  const { data, error } = await resend.emails.send({
    from,
    to: options.to,
    replyTo: options.replyTo || info.replyTo,
    subject: options.subject,
    html,
    attachments: options.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType,
    })),
  });

  if (error) {
    console.error("[email] sendOutboundEmail failed — Resend API error", {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      from,
      to: options.to,
      subject: options.subject
    });
    throw new Error(`Failed to send email (${error.name}): ${error.message}`);
  }

  console.info("[email] sendOutboundEmail delivered", { id: data?.id, to: options.to, subject: options.subject });
  return { skipped: false, id: data?.id };
}

export async function sendCourseBonusClaimNotification(data: {
  buyerName: string;
  buyerEmail: string;
  buyerWhatsapp?: string | null;
  coursePackTitle: string;
  orderReference: string;
  requestedBonusTitles: string[];
  preferredDelivery: string;
  proofNotes?: string | null;
  proofUrl?: string | null;
}) {
  const content = `
    <p style="color:#94a3b8;font-size:14px;margin:0 0 16px;">A new course bonus claim was submitted and is ready for admin review.</p>
    ${infoTable([
      ["Buyer", data.buyerName],
      ["Email", data.buyerEmail],
      ["WhatsApp", data.buyerWhatsapp],
      ["Pack", data.coursePackTitle],
      ["Order ref", data.orderReference],
      ["Delivery", data.preferredDelivery],
    ])}
    <div style="background:#0a0a0f;border:1px solid #1e1e2e;border-radius:12px;padding:20px;margin:16px 0;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Requested bonus files</p>
      <p style="margin:0;font-size:14px;color:#e2e8f0;line-height:1.7;">${data.requestedBonusTitles.join("<br />")}</p>
    </div>
    ${data.proofNotes ? `<div style="background:#0a0a0f;border:1px solid #1e1e2e;border-radius:12px;padding:20px;margin:16px 0;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Proof notes</p>
      <p style="margin:0;font-size:14px;color:#e2e8f0;white-space:pre-wrap;line-height:1.7;">${data.proofNotes}</p>
    </div>` : ""}
    ${data.proofUrl ? `<p style="margin:16px 0 0;"><a href="${data.proofUrl}" style="background:#06b6d4;color:#0a0a0f;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">View uploaded proof</a></p>` : ""}
  `;
  return sendLeadEmail(
    `New academy bonus claim from ${data.buyerName} · teChia`,
    baseHtml(content, `Course bonus claim: ${data.buyerName}`),
  );
}

export function whatsappLink(number: string, message?: string) {
  const clean = number.replace(/\D/g, "");
  const encoded = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${clean}${encoded}`;
}

export function officialWhatsappLink(message?: string) {
  const number = process.env.OFFICIAL_WHATSAPP || "653262837";
  return whatsappLink(number, message);
}

export async function sendDemoLabNotification(data: {
  name: string; email: string; phone?: string | null; whatsapp?: string | null;
  companyName?: string | null; country?: string | null; preferredLanguage?: string;
  businessType?: string | null; demoSlug: string; demoTitle: string;
  projectNeed?: string | null; budgetRange?: string | null; timeline?: string | null; source?: string;
}) {
  const content = `
    <p style="color:#94a3b8;font-size:14px;margin:0 0 16px;">A new Demo Lab request was submitted from <strong style="color:#f8fafc;">${data.demoTitle}</strong>.</p>
    ${infoTable([
      ["Name", data.name], ["Email", data.email], ["Phone", data.phone],
      ["WhatsApp", data.whatsapp], ["Company", data.companyName],
      ["Country", data.country], ["Language", data.preferredLanguage],
      ["Business type", data.businessType], ["Demo", data.demoTitle],
      ["Budget", data.budgetRange], ["Timeline", data.timeline],
      ["Source", data.source || "demo_lab"]
    ])}
    ${data.projectNeed ? `<div style="background:#0a0a0f;border:1px solid #1e1e2e;border-radius:12px;padding:20px;margin:16px 0;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">What They Want to Build</p>
      <p style="margin:0;font-size:14px;color:#e2e8f0;white-space:pre-wrap;line-height:1.7;">${data.projectNeed}</p>
    </div>` : ""}
    ${data.whatsapp ? `<p style="margin:16px 0 0;"><a href="https://wa.me/${data.whatsapp.replace(/\D/g, "")}" style="background:#25D366;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">Reply on WhatsApp</a></p>` : ""}
    <p style="margin:8px 0 0;"><a href="mailto:${data.email}" style="background:#06b6d4;color:#0a0a0f;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">Reply via Email</a></p>
  `;
  return sendLeadEmail(
    `New Demo Lab request from ${data.name} · ${data.demoTitle} · teChia`,
    baseHtml(content, `Demo Lab Request: ${data.name}`)
  );
}

// ─── Portal Invite ──────────────────────────────────────────────────────────

export async function sendPortalInviteEmail(data: {
  toEmail: string;
  toName: string;
  accessCode: string;
  loginUrl: string;
}) {
  const resend = getResend();
  const info = officialInfo();
  if (!resend) return { skipped: true, error: "Email service not configured." };
  if (!data.toEmail) return { skipped: true, error: "No client email on file." };

  const content = `
    <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;line-height:1.7;">
      Hello <strong style="color:#f8fafc;">${data.toName}</strong>,
    </p>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;line-height:1.7;">
      Your dedicated client portal is ready. Use the credentials below to log in and access your projects, invoices, files, and messages from our team — all in one place.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;border:1px solid #1e2a3a;border-radius:14px;padding:24px 28px;margin:0 0 28px;">
      <tr>
        <td style="padding:6px 0;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">Email</p>
          <p style="margin:0;font-size:15px;color:#e2e8f0;">${data.toEmail}</p>
        </td>
      </tr>
      <tr><td style="padding:12px 0 0;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">Access Code</p>
        <div style="display:inline-block;background:#0f172a;border:1.5px solid #06b6d4;border-radius:10px;padding:12px 24px;">
          <span style="font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:700;letter-spacing:0.35em;color:#06b6d4;">${data.accessCode}</span>
        </div>
      </td></tr>
    </table>

    <p style="margin:0 0 24px;">
      <a href="${data.loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#06b6d4,#3b82f6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.02em;">Access Your Portal →</a>
    </p>

    <p style="color:#64748b;font-size:13px;margin:0 0 8px;line-height:1.7;">
      Your portal gives you real-time visibility into your project progress, file deliveries, invoices, and direct messaging with our team.
    </p>
    <p style="color:#64748b;font-size:13px;margin:0;line-height:1.7;">
      Keep your access code private. If you have any questions, simply reply to this email.
    </p>
  `;

  const subject = "Your teChia Client Portal is Ready";
  const html = baseHtml(content, subject);

  try {
    const { data: sendResult, error } = await resend.emails.send({
      from: info.from,
      to: data.toEmail,
      replyTo: info.replyTo,
      subject,
      html,
    });
    if (error) {
      console.error("[sendPortalInviteEmail] Resend API error", {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        to: data.toEmail
      });
      return { skipped: true, error: `Resend error (${error.name}): ${error.message}` };
    }
    console.info("[sendPortalInviteEmail] delivered", { id: sendResult?.id, to: data.toEmail });
    return { skipped: false };
  } catch (err) {
    console.error("[sendPortalInviteEmail]", err);
    return { skipped: true, error: "Failed to send email." };
  }
}
