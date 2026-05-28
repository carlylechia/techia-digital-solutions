import { NextResponse, type NextRequest } from "next/server";
import { sendProjectInquiryNotification } from "@/lib/email";
import { apiError, apiOk, payloadLocale, readRequestJson } from "@/lib/api";
import { getPrisma } from "@/lib/prisma";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { sanitizeObject } from "@/lib/sanitize";
import { projectInquirySchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const ip = requestIp(request.headers);
  const limit = checkRateLimit(`project:${ip}`, 4, 60_000);
  if (!limit.ok) return apiError("rate_limited", 429, "en", { headers: { "Retry-After": String(limit.retryAfter) } });

  const raw = await readRequestJson(request, 32_000);
  const locale = payloadLocale(raw);
  if (raw && typeof raw === "object" && "consent" in raw) raw.consent = raw.consent === true || raw.consent === "true" || raw.consent === "on";
  const parsed = projectInquirySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: locale === "fr" ? "Données invalides" : "Invalid payload", code: "invalid_payload", issues: parsed.error.issues }, { status: 400 });
  if (parsed.data.honeypot) return apiOk();
  const data = sanitizeObject(parsed.data);

  try {
    const prisma = getPrisma();
    if (prisma) {
      const lead = await prisma.lead.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          whatsapp: data.whatsapp || null,
          company: data.company || null,
          country: data.country,
          preferredLanguage: data.preferredLanguage,
          source: "project_inquiry"
        }
      });
      const inquiry = await prisma.projectInquiry.create({
        data: { leadId: lead.id, businessType: data.businessType, need: data.need, budgetRange: data.budgetRange, timeline: data.timeline, details: data.details }
      });

      // Auto-create a task on the inquiry pipeline board
      const inquiryBoard = await prisma.processBoard.findFirst({
        where: { boardType: "inquiry_pipeline" },
        include: { columns: { orderBy: { position: "asc" }, take: 1 } }
      });
      if (inquiryBoard?.columns[0]) {
        const col = inquiryBoard.columns[0];
        const lastPos = await prisma.processTask.findFirst({ where: { columnId: col.id }, orderBy: { position: "desc" }, select: { position: true } });
        await prisma.processTask.create({
          data: {
            boardId: inquiryBoard.id,
            columnId: col.id,
            requestType: "inquiry",
            requestId: inquiry.id,
            title: `${data.name} — ${data.businessType}`,
            description: `${data.need}\n\nBudget: ${data.budgetRange} · Timeline: ${data.timeline}`,
            priority: "MEDIUM",
            position: (lastPos?.position ?? 0) + 1000
          }
        });
      }
    }
  } catch (error) {
    console.error("[project-inquiry] db_create_failed", { email: data.email, message: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : undefined });
    return apiError("server_error", 500, locale);
  }

  // Email notification is best-effort — failure must not fail the submission
  fireProjectInquiryEmail(data);
  return apiOk();
}

function fireProjectInquiryEmail(data: ReturnType<typeof sanitizeObject>) {
  sendProjectInquiryNotification({
    name: data.name as string,
    email: data.email as string,
    phone: data.phone as string | undefined,
    whatsapp: (data.whatsapp as string | null) || null,
    company: (data.company as string | null) || null,
    country: data.country as string | undefined,
    businessType: data.businessType as string | undefined,
    need: data.need as string | undefined,
    budgetRange: data.budgetRange as string | undefined,
    timeline: data.timeline as string | undefined,
    details: data.details as string | undefined
  }).catch((err) => {
    console.error("[project-inquiry] notification_email_failed", { email: data.email, message: err instanceof Error ? err.message : err });
  });
}
