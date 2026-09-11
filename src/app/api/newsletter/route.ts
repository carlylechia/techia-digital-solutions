import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiError, apiOk, payloadLocale, readRequestJson } from "@/lib/api";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { subscribeToNewsletter } from "@/lib/newsletter/subscribe";

export async function POST(request: NextRequest) {
  const ip = requestIp(request.headers);
  const limit = checkRateLimit(`newsletter:${ip}`, 5, 60_000);
  if (!limit.ok) return apiError("rate_limited", 429, "en", { headers: { "Retry-After": String(limit.retryAfter) } });
  const raw = await readRequestJson(request, 8_000);
  const locale = payloadLocale(raw);

  const result = await subscribeToNewsletter(raw);
  if (result.status === "invalid") return apiError("invalid_payload", 400, locale);
  if (result.status === "duplicate") {
    return NextResponse.json(result, { status: 409 });
  }
  if (!result.ok) return apiError("server_error", 500, locale);

  return apiOk({
    status: result.status,
    message: result.message,
    subscriberId: result.subscriberId,
    warnings: result.warnings,
  });
}
