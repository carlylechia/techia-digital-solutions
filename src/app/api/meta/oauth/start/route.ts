import { NextResponse } from "next/server";
import { requireSuperAdmin, BlogAuthorizationError } from "@/lib/blog/auth";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import {
  isMetaConfigured,
  isMetaTokenEncryptionConfigured,
} from "@/lib/meta/config";
import {
  buildMetaAuthorizationUrl,
  createMetaOAuthState,
  normalizeReturnLocale,
} from "@/lib/meta/oauth";

export const dynamic = "force-dynamic";

function redirectToKit(locale: "en" | "fr", params: Record<string, string>) {
  const url = new URL(
    `/${locale}/admin/blog/social-share`,
    process.env.NEXTAUTH_URL || "http://localhost:3000",
  );
  for (const [key, value] of Object.entries(params))
    url.searchParams.set(key, value);
  return NextResponse.redirect(url, { status: 302 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = normalizeReturnLocale(url.searchParams.get("locale"));

  try {
    const actor = await requireSuperAdmin();
    const rate = checkRateLimit(
      `meta-oauth-start:${actor.id}:${requestIp(request.headers)}`,
      10,
      60_000,
    );
    if (!rate.ok)
      return redirectToKit(locale, { meta: "error", reason: "rate_limited" });

    if (!isMetaConfigured() || !isMetaTokenEncryptionConfigured()) {
      return redirectToKit(locale, { meta: "error", reason: "configuration" });
    }

    const { state } = await createMetaOAuthState(actor.id, locale);
    const authorizationUrl = buildMetaAuthorizationUrl(state);
    return NextResponse.redirect(authorizationUrl, {
      status: 302,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof BlogAuthorizationError) {
      return NextResponse.redirect(
        new URL(
          `/${locale}/admin`,
          process.env.NEXTAUTH_URL || "http://localhost:3000",
        ),
        { status: 302 },
      );
    }
    return redirectToKit(locale, { meta: "error", reason: "start_failed" });
  }
}
