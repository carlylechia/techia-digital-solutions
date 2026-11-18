import { NextResponse } from "next/server";
import { assertSameOrigin, requireSuperAdmin, BlogAuthorizationError } from "@/lib/blog/auth";
import { updatePublishStatus } from "@/lib/ai/social-share-service";
import { socialPublishStatusInputSchema } from "@/lib/ai/social-share-types";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    const json = await request.json().catch(() => null);
    const parsed = socialPublishStatusInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid publish status request.", issues: parsed.error.issues }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    await updatePublishStatus(parsed.data.postId, parsed.data.platform, parsed.data.status, actor.id);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BlogAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    console.error("social_share_publish_failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ ok: false, error: "Publish status could not be updated." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
