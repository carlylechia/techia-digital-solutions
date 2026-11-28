import { NextResponse } from "next/server";
import { assertSameOrigin, requireSuperAdmin, BlogAuthorizationError } from "@/lib/blog/auth";
import { checkEditorialBurstLimit } from "@/lib/ai/editorial-usage";
import { isEditorialImageEnabled } from "@/lib/ai/editorial-config";
import { editEditorialImageInstruction, EditorialAiError } from "@/lib/ai/editorial-image-service";
import { z } from "zod";

const schema = z.object({
  sourceImageUrl: z.string().trim().min(1).max(2000),
  instruction: z.string().trim().min(5).max(1000),
  altText: z.string().trim().max(200).optional().or(z.literal("")),
  articleTitle: z.string().trim().max(180).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    if (!isEditorialImageEnabled()) return NextResponse.json({ ok: false, error: "Editorial image editing is disabled." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    try { await checkEditorialBurstLimit(actor.id, 10); } catch (rateError) {
      if (rateError instanceof EditorialAiError) {
        return NextResponse.json({ ok: false, error: rateError.message, category: rateError.category }, { status: 429, headers: { "Cache-Control": "no-store" } });
      }
      throw rateError;
    }
    const json = await request.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid image edit request.", issues: parsed.error.issues }, { status: 400, headers: { "Cache-Control": "no-store" } });
    const result = await editEditorialImageInstruction(parsed.data, actor.id);
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BlogAuthorizationError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    if (error instanceof EditorialAiError) {
      const status = error.category === "limit_reached" || error.category === "quota" ? 429 : error.category === "disabled" || error.category === "not_configured" ? 503 : error.category === "too_large" || error.category === "malformed_output" ? 422 : 400;
      return NextResponse.json({ ok: false, error: error.message, category: error.category }, { status, headers: { "Cache-Control": "no-store" } });
    }
    console.error("editorial_ai_image_edit_failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ ok: false, error: "Image editing could not be completed." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}