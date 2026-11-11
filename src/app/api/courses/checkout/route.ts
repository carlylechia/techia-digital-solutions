import { NextRequest, NextResponse } from "next/server";
import { academyCheckoutSchema } from "@/lib/validation";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { CheckoutError, startAcademyCheckout } from "@/lib/payments/checkout";

function isJsonContentType(request: NextRequest) {
  const ct = request.headers.get("content-type") || "";
  return ct.includes("application/json");
}

function originAllowed(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  if (!host) return false;
  try {
    const o = new URL(origin);
    return o.host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isJsonContentType(request)) {
    return NextResponse.json(
      { ok: false, error: "Expected application/json." },
      { status: 415 },
    );
  }
  if (!originAllowed(request)) {
    return NextResponse.json(
      { ok: false, error: "Invalid request origin." },
      { status: 403 },
    );
  }

  const ip = requestIp(request.headers);
  const limit = checkRateLimit(`academy-checkout:${ip}`, 8, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many checkout attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = academyCheckoutSchema.safeParse({
    ...(typeof body === "object" && body ? body : {}),
    customerIp: ip,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid checkout data.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  if (parsed.data.honeypot) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  try {
    const result = await startAcademyCheckout({
      itemType: parsed.data.itemType,
      itemSlug: parsed.data.itemSlug,
      provider: parsed.data.provider,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      countryCode: parsed.data.countryCode,
      locale: parsed.data.locale,
      idempotencyKey: parsed.data.idempotencyKey,
      customerIp: ip,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json(
        { ok: false, code: error.code, error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Checkout could not be started. Please try again." },
      { status: 500 },
    );
  }
}
