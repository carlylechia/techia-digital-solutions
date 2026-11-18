import { NextResponse } from "next/server";
import { assertSameOrigin, requireSuperAdmin, BlogAuthorizationError } from "@/lib/blog/auth";
import { getBlogPostsForList } from "@/lib/blog/admin-data";
import type { BlogLocale } from "@/lib/blog/constants";

export async function GET(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    const url = new URL(request.url);
    const localeRaw = url.searchParams.get("locale") || "en";
    const locale: BlogLocale = localeRaw === "fr" ? "fr" : "en";
    const query = url.searchParams.get("q") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const result = await getBlogPostsForList(actor, locale, { query, status });
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BlogAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ ok: false, error: "Could not load articles." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
