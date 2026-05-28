import type { NextRequest } from "next/server";
import { sendDemoLabNotification } from "@/lib/email";
import { apiError, apiOk, readRequestJson } from "@/lib/api";
import { getPrisma } from "@/lib/prisma";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { sanitizeObject } from "@/lib/sanitize";
import { demoLabRequestSchema } from "@/lib/validation";
import { DEMO_SLUGS } from "@/content/demo-lab";

export async function POST(request: NextRequest) {
  const ip = requestIp(request.headers);
  const limit = checkRateLimit(`demo-lab:${ip}`, 5, 60_000);
  if (!limit.ok) {
    return apiError("rate_limited", 429, "en", {
      headers: { "Retry-After": String(limit.retryAfter) }
    });
  }

  const raw = await readRequestJson(request);
  const locale = (raw?.preferredLanguage === "fr" ? "fr" : "en") as "en" | "fr";

  const parsed = demoLabRequestSchema.safeParse(raw);
  if (!parsed.success) return apiError("invalid_payload", 400, locale);
  if (parsed.data.honeypot) return apiOk();

  const data = sanitizeObject(parsed.data);

  // Verify demoSlug is one of the known 5 demos
  if (!DEMO_SLUGS.includes(data.demoSlug as (typeof DEMO_SLUGS)[number])) {
    return apiError("invalid_payload", 400, locale);
  }

  try {
    const prisma = getPrisma();
    if (prisma) {
      await prisma.demoRequest.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          whatsapp: data.whatsapp || null,
          company: data.companyName || null,
          demo: data.demoSlug,
          demoTitle: data.demoTitle,
          locale: locale === "fr" ? "fr" : "en",
          country: data.country || null,
          preferredLanguage: data.preferredLanguage ?? "en",
          businessType: data.businessType || null,
          projectNeed: data.projectNeed,
          budgetRange: data.budgetRange || null,
          timeline: data.timeline || null,
          source: data.source ?? "demo_lab"
        }
      });
    }
  } catch (error) {
    console.error("[demo-requests] db_create_failed", { email: data.email, demoSlug: data.demoSlug, error });
    return apiError("server_error", 500, locale);
  }

  // Email notification is best-effort — a send failure must not fail the submission
  sendDemoLabNotification({
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    whatsapp: data.whatsapp || null,
    companyName: data.companyName || null,
    country: data.country || null,
    preferredLanguage: data.preferredLanguage ?? "en",
    businessType: data.businessType || null,
    demoSlug: data.demoSlug,
    demoTitle: data.demoTitle,
    projectNeed: data.projectNeed,
    budgetRange: data.budgetRange || null,
    timeline: data.timeline || null,
    source: data.source ?? "demo_lab"
  }).catch((err) => {
    console.error("[demo-requests] notification_email_failed", { email: data.email, demoSlug: data.demoSlug, error: err });
  });

  return apiOk();
}
