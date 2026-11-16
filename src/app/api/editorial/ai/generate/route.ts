import { NextResponse } from "next/server";
import { assertSameOrigin, requireSuperAdmin, BlogAuthorizationError } from "@/lib/blog/auth";
import { checkEditorialBurstLimit } from "@/lib/ai/editorial-usage";
import { isEditorialAiEnabled } from "@/lib/ai/editorial-config";
import { generateEditorialArticle, EditorialAiError } from "@/lib/ai/editorial-service";
import { editorialGenerateInputSchema } from "@/lib/ai/editorial-types";

const bodySchema = editorialGenerateInputSchema;

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
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid article brief.", issues: parsed.error.issues }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const result = await generateEditorialArticle(parsed.data, actor.id);
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BlogAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    if (error instanceof EditorialAiError) {
      const status = error.category === "limit_reached" ? 429 : error.category === "disabled" ? 503 : error.category === "not_configured" ? 503 : 400;
      return NextResponse.json({ ok: false, error: error.message, category: error.category }, { status, headers: { "Cache-Control": "no-store" } });
    }
    console.error("editorial_ai_generate_failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ ok: false, error: "Article generation could not be completed." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}