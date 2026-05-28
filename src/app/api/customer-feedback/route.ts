import { NextResponse, type NextRequest } from "next/server";
import { apiError, apiOk, payloadLocale, readRequestJson } from "@/lib/api";
import { getPrisma } from "@/lib/prisma";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { sanitizeObject } from "@/lib/sanitize";
import { customerFeedbackSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const ip = requestIp(request.headers);
  const limit = checkRateLimit(`feedback:${ip}`, 3, 60_000);
  if (!limit.ok) {
    return apiError("rate_limited", 429, "en", {
      headers: { "Retry-After": String(limit.retryAfter) }
    });
  }

  const raw = await readRequestJson(request, 24_000);
  const locale = payloadLocale(raw);
  if (raw && typeof raw === "object" && "consent" in raw) {
    (raw as Record<string, unknown>).consent =
      (raw as Record<string, unknown>).consent === true ||
      (raw as Record<string, unknown>).consent === "true" ||
      (raw as Record<string, unknown>).consent === "on";
  }

  const parsed = customerFeedbackSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: locale === "fr" ? "Données invalides" : "Invalid payload",
        code: "invalid_payload",
        issues: parsed.error.issues
      },
      { status: 400 }
    );
  }

  if (parsed.data.honeypot) return apiOk();
  const sanitized = sanitizeObject(parsed.data);
  const data = parsed.data;

  try {
    const prisma = getPrisma();
    if (!prisma) {
      return apiError("server_error", 500, locale);
    }

    const project = data.projectSlug
      ? await prisma.clientProject.findFirst({
          where: {
            OR: [{ publicSlug: data.projectSlug }, { slug: data.projectSlug }]
          },
          select: { id: true }
        })
      : null;

    await prisma.customerFeedback.create({
      data: {
        projectId: project?.id,
        name: sanitized.name as string,
        email: sanitized.email as string,
        role: data.role ? (sanitized.role as string) : null,
        company: data.company ? (sanitized.company as string) : null,
        rating: data.rating ?? null,
        quote: sanitized.quote as string,
        locale: (data.locale as "en" | "fr" | undefined) ?? null,
        source: "website",
        consent: true,
        status: "PENDING"
      }
    });

    return apiOk();
  } catch (error) {
    console.error("[customer-feedback] db_create_failed", { email: data.email, message: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : undefined });
    return apiError("server_error", 500, locale);
  }
}
