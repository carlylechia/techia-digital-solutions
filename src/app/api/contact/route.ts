import { NextResponse, type NextRequest } from "next/server";
import { sendContactNotification } from "@/lib/email";
import { apiError, apiOk, payloadLocale, readRequestJson } from "@/lib/api";
import { getPrisma } from "@/lib/prisma";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { sanitizeObject } from "@/lib/sanitize";
import { contactSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const ip = requestIp(request.headers);
  const limit = checkRateLimit(`contact:${ip}`);
  if (!limit.ok) return apiError("rate_limited", 429, "en", { headers: { "Retry-After": String(limit.retryAfter) } });

  const raw = await readRequestJson(request);
  const locale = payloadLocale(raw);
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: locale === "fr" ? "Données invalides" : "Invalid payload", code: "invalid_payload", issues: parsed.error.issues }, { status: 400 });
  if (parsed.data.honeypot) return apiOk();
  const data = sanitizeObject(parsed.data);

  try {
    const prisma = getPrisma();
    if (prisma) {
      await prisma.contactMessage.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          whatsapp: data.whatsapp || null,
          company: data.company || null,
          message: data.message,
          locale: parsed.data.locale || null
        }
      });
    }
  } catch (error) {
    console.error("[contact] db_create_failed", { email: data.email, message: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : undefined });
    return apiError("server_error", 500, locale);
  }

  // Email notification is best-effort — failure must not fail the submission
  sendContactNotification({
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    whatsapp: data.whatsapp || null,
    company: data.company || null,
    message: data.message
  }).catch((err) => {
    console.error("[contact] notification_email_failed", { email: data.email, message: err instanceof Error ? err.message : err });
  });

  return apiOk();
}
