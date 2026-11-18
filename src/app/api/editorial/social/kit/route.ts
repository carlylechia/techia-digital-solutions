import { NextResponse } from "next/server";
import { assertSameOrigin, requireSuperAdmin, BlogAuthorizationError } from "@/lib/blog/auth";
import { getSocialKit, getSocialArticleSource } from "@/lib/ai/social-share-service";

export async function GET(request: Request) {
  try {
    assertSameOrigin(request);
    await requireSuperAdmin();
    const url = new URL(request.url);
    const postId = url.searchParams.get("postId");
    if (!postId) return NextResponse.json({ ok: false, error: "postId is required." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    const [article, kit] = await Promise.all([getSocialArticleSource(postId), getSocialKit(postId)]);
    return NextResponse.json({ ok: true, article, kit }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BlogAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ ok: false, error: "Could not load social kit." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
