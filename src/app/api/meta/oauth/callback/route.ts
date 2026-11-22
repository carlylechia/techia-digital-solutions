import { NextResponse } from "next/server";
import { requireSuperAdmin, BlogAuthorizationError } from "@/lib/blog/auth";
import { writeAuditLog } from "@/lib/admin/session";
import { requestIp } from "@/lib/rate-limit";
import {
  completeMetaOAuth,
  getMetaOAuthStateLocale,
  MetaOAuthError,
} from "@/lib/meta/oauth";

export const dynamic = "force-dynamic";

function redirectToKit(locale: "en" | "fr", params: Record<string, string>) {
  const url = new URL(
    `/${locale}/admin/blog/social-share`,
    process.env.NEXTAUTH_URL || "http://localhost:3000",
  );
  for (const [key, value] of Object.entries(params))
    url.searchParams.set(key, value);
  return NextResponse.redirect(url, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const metaError =
    url.searchParams.get("error") || url.searchParams.get("error_code");
  const locale = await getMetaOAuthStateLocale(state);

  try {
    const actor = await requireSuperAdmin();
    const result = await completeMetaOAuth({
      state,
      code,
      errorCode: metaError,
      adminUserId: actor.id,
    });

    await writeAuditLog({
      actorId: actor.id,
      action: "meta.connection.connected",
      entityType: "MetaConnection",
      entityId: result.connectionId,
      metadata: {
        graphFlow: "facebook_login_page_linked_instagram",
        missingScopes: result.missingScopes,
      },
      ip: requestIp(request.headers),
    }).catch(() => undefined);

    return redirectToKit(result.returnLocale, {
      meta: result.missingScopes.length ? "permissions" : "connected",
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
    const reason =
      error instanceof MetaOAuthError ? error.code : "callback_failed";
    return redirectToKit(locale, { meta: "error", reason });
  }
}
