import { NextResponse } from "next/server";
import { assertSameOrigin, requireSuperAdmin, BlogAuthorizationError } from "@/lib/blog/auth";
import { checkEditorialBurstLimit } from "@/lib/ai/editorial-usage";
import { isEditorialAiEnabled } from "@/lib/ai/editorial-config";
import { generateSocialCaption, EditorialAiError as SocialError } from "@/lib/ai/social-share-service";
import { socialCaptionGenerateInputSchema } from "@/lib/ai/social-share-types";
import { EditorialAiError } from "@/lib/ai/editorial-service";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    if (!isEditorialAiEnabled()) {
      return NextResponse.json({ ok: false, error: "Editorial AI is disabled." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    try { await checkEditorialBurstLimit(actor.id, 20); } catch (rateError) {
      if (rateError instanceof EditorialAiError) {
        return NextResponse.json({ ok: false, error: rateError.message, category: rateError.category }, { status: 429, headers: { "Cache-Control": "no-store" } });
      }
      throw rateError;
    }
    const json = await request.json().catch(() => null);
    const parsed = socialCaptionGenerateInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid caption request.", issues: parsed.error.issues }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    await generateSocialCaption(parsed.data, actor.id);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BlogAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    if (error instanceof EditorialAiError || error instanceof SocialError) {
      const e = error as EditorialAiError;
      const status = e.category === "limit_reached" || e.category === "quota" ? 429 : e.category === "disabled" || e.category === "not_configured" ? 503 : 400;
      return NextResponse.json({ ok: false, error: e.message, category: e.category }, { status, headers: { "Cache-Control": "no-store" } });
    }
    console.error("social_share_caption_failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ ok: false, error: "Caption generation could not be completed." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
