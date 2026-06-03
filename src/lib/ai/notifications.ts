import { sendLeadEmail } from "@/lib/email";

interface AILeadNotificationData {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  serviceInterest: string;
  leadScore: string;
  budgetRange?: string | null;
  timeline?: string | null;
  projectSummary: string;
  demoType?: string | null;
}

function fieldRow(label: string, value: string | null | undefined) {
  if (!value) return "";
  return `<tr>
    <td style="padding:8px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;width:140px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0 8px 16px;font-size:14px;color:#e2e8f0;vertical-align:top;">${value}</td>
  </tr>`;
}

function baseHtml(content: string, title: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111118;border:1px solid #1e1e2e;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 32px 0;border-bottom:1px solid #1e1e2e;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#06b6d4;">teChia AI Growth Agent</p>
          <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#f8fafc;line-height:1.3;">${title}</h1>
        </td></tr>
        <tr><td style="padding:28px 32px;">${content}</td></tr>
        <tr><td style="padding:24px 32px;border-top:1px solid #1e1e2e;background:#0d0d1a;">
          <p style="margin:0;font-size:12px;color:#64748b;">teChia Digital Solutions · <a href="https://techiadigital.com" style="color:#06b6d4;text-decoration:none;">techiadigital.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function notifyAdminOfAILead(data: AILeadNotificationData): Promise<void> {
  try {
    const scoreColor =
      data.leadScore === "HOT"
        ? "#ef4444"
        : data.leadScore === "WARM"
          ? "#f59e0b"
          : "#64748b";
    const content = `
      <p style="color:#94a3b8;font-size:14px;margin:0 0 16px;">A new lead was captured by the teChia AI Growth Agent.</p>
      <div style="display:inline-block;background:${scoreColor}22;border:1px solid ${scoreColor}44;border-radius:8px;padding:4px 12px;margin:0 0 16px;">
        <span style="font-size:13px;font-weight:700;color:${scoreColor};">● ${data.leadScore} LEAD</span>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;border:1px solid #1e1e2e;border-radius:12px;padding:16px 20px;margin:0 0 16px;">
        ${fieldRow("Name", data.name)}
        ${fieldRow("Email", data.email)}
        ${fieldRow("Phone", data.phone)}
        ${fieldRow("Company", data.companyName)}
        ${fieldRow("Service", data.serviceInterest)}
        ${fieldRow("Budget", data.budgetRange)}
        ${fieldRow("Timeline", data.timeline)}
        ${data.demoType ? fieldRow("Demo requested", data.demoType) : ""}
      </table>
      <div style="background:#0a0a0f;border:1px solid #1e1e2e;border-radius:12px;padding:20px;margin:0 0 16px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Project Summary</p>
        <p style="margin:0;font-size:14px;color:#e2e8f0;white-space:pre-wrap;line-height:1.7;">${data.projectSummary}</p>
      </div>
      ${data.email ? `<p style="margin:0;"><a href="mailto:${data.email}" style="background:#06b6d4;color:#0a0a0f;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">Reply via Email</a></p>` : ""}
    `;
    await sendLeadEmail(
      `[${data.leadScore}] AI Lead: ${data.name || "Anonymous"} · ${data.serviceInterest} · teChia`,
      baseHtml(content, `AI Lead: ${data.name || "Anonymous"}`)
    );
  } catch (err) {
    console.error(
      "[ai-notifications] notifyAdminOfAILead failed",
      err instanceof Error ? err.message : err
    );
  }
}

export async function notifyAdminOfAIDemoRequest(data: {
  name?: string | null;
  email?: string | null;
  demoType: string;
  notes?: string | null;
  companyName?: string | null;
}): Promise<void> {
  try {
    const content = `
      <p style="color:#94a3b8;font-size:14px;margin:0 0 16px;">A new demo request was submitted via the AI Growth Agent.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;border:1px solid #1e1e2e;border-radius:12px;padding:16px 20px;margin:0 0 16px;">
        ${fieldRow("Name", data.name)}
        ${fieldRow("Email", data.email)}
        ${fieldRow("Company", data.companyName)}
        ${fieldRow("Demo type", data.demoType)}
      </table>
      ${
        data.notes
          ? `<div style="background:#0a0a0f;border:1px solid #1e1e2e;border-radius:12px;padding:20px;margin:0 0 16px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Notes</p>
        <p style="margin:0;font-size:14px;color:#e2e8f0;line-height:1.7;">${data.notes}</p>
      </div>`
          : ""
      }
      ${data.email ? `<p style="margin:0;"><a href="mailto:${data.email}" style="background:#06b6d4;color:#0a0a0f;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">Reply via Email</a></p>` : ""}
    `;
    await sendLeadEmail(
      `AI Demo Request: ${data.demoType} · ${data.name || "Anonymous"} · teChia`,
      baseHtml(content, `Demo Request: ${data.demoType}`)
    );
  } catch (err) {
    console.error(
      "[ai-notifications] notifyAdminOfAIDemoRequest failed",
      err instanceof Error ? err.message : err
    );
  }
}
