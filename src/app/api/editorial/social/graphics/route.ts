import { NextResponse } from "next/server";
import { assertSameOrigin, requireSuperAdmin, BlogAuthorizationError } from "@/lib/blog/auth";
import { isEditorialImageEnabled, isEditorialAiEnabled } from "@/lib/ai/editorial-config";
import { generateSocialGraphic, EditorialAiError as SocialError } from "@/lib/ai/social-share-service";
import { socialGraphicGenerateInputSchema } from "@/lib/ai/social-share-types";
import { EditorialAiError } from "@/lib/ai/editorial-service";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    if (!isEditorialAiEnabled()) {
      return NextResponse.json({ ok: false, error: "Editorial AI is disabled." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    const json = await request.json().catch(() => null);
    const parsed = socialGraphicGenerateInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid graphic request.", issues: parsed.error.issues }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const result = await generateSocialGraphic(parsed.data.postId, parsed.data.format, actor.id);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BlogAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    if (error instanceof EditorialAiError || error instanceof SocialError) {
      const e = error as EditorialAiError;
      const status = e.category === "limit_reached" || e.category === "quota" ? 429 : e.category === "disabled" || e.category === "not_configured" ? 503 : e.category === "too_large" || e.category === "malformed_output" ? 422 : 400;
      return NextResponse.json({ ok: false, error: e.message, category: e.category }, { status, headers: { "Cache-Control": "no-store" } });
    }
    console.error("social_share_graphic_failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ ok: false, error: "Graphic generation could not be completed." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
