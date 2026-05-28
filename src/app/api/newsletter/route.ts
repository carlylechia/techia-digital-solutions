import type { NextRequest } from "next/server";
import { apiError, apiOk, payloadLocale, readRequestJson } from "@/lib/api";
import { getPrisma } from "@/lib/prisma";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { newsletterSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const ip = requestIp(request.headers);
  const limit = checkRateLimit(`newsletter:${ip}`, 5, 60_000);
  if (!limit.ok) return apiError("rate_limited", 429, "en", { headers: { "Retry-After": String(limit.retryAfter) } });
  const raw = await readRequestJson(request, 8_000);
  const locale = payloadLocale(raw);
  const parsed = newsletterSchema.safeParse(raw);
  if (!parsed.success) return apiError("invalid_payload", 400, locale);
  if (parsed.data.honeypot) return apiOk();

  try {
    const prisma = getPrisma();
    if (prisma) {
      await prisma.newsletterSubscriber.upsert({
        where: { email: parsed.data.email },
        update: parsed.data.locale ? { locale: parsed.data.locale } : {},
        create: { email: parsed.data.email, locale: parsed.data.locale || null }
      });
    }
    return apiOk();
  } catch (error) {
    console.error("[newsletter] db_upsert_failed", { email: parsed.data.email, message: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : undefined });
    return apiError("server_error", 500, locale);
  }
}
