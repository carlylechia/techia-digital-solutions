import type { NextRequest } from "next/server";
import { sendDemoRequestNotification } from "@/lib/email";
import { apiError, apiOk, payloadLocale, readRequestJson } from "@/lib/api";
import { getPrisma } from "@/lib/prisma";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { sanitizeObject } from "@/lib/sanitize";
import { demoRequestSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const ip = requestIp(request.headers);
  const limit = checkRateLimit(`demo:${ip}`, 5, 60_000);
  if (!limit.ok) return apiError("rate_limited", 429, "en", { headers: { "Retry-After": String(limit.retryAfter) } });
  const raw = await readRequestJson(request);
  const locale = payloadLocale(raw);
  const parsed = demoRequestSchema.safeParse(raw);
  if (!parsed.success) return apiError("invalid_payload", 400, locale);
  if (parsed.data.honeypot) return apiOk();
  const data = sanitizeObject(parsed.data);

  try {
    const prisma = getPrisma();
    if (prisma) {
      await prisma.demoRequest.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          whatsapp: data.whatsapp || null,
          company: data.company || null,
          demo: data.demo,
          message: data.message || null,
          locale: parsed.data.locale || null
        }
      });
    }
  } catch (error) {
    console.error("[demo-request] db_create_failed", { email: data.email, demo: data.demo, message: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : undefined });
    return apiError("server_error", 500, locale);
  }

  // Email notification is best-effort — failure must not fail the submission
  sendDemoRequestNotification({
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    whatsapp: data.whatsapp || null,
    company: data.company || null,
    demo: data.demo,
    message: data.message || null
  }).catch((err) => {
    console.error("[demo-request] notification_email_failed", { email: data.email, demo: data.demo, message: err instanceof Error ? err.message : err });
  });

  return apiOk();
}
