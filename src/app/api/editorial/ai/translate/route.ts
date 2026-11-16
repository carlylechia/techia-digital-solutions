import { NextResponse } from "next/server";
import { assertSameOrigin, requireSuperAdmin, BlogAuthorizationError } from "@/lib/blog/auth";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { isEditorialAiEnabled } from "@/lib/ai/editorial-config";
import { translateEditorialContent, EditorialAiError } from "@/lib/ai/editorial-service";
import { editorialTranslateInputSchema } from "@/lib/ai/editorial-types";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    if (!isEditorialAiEnabled()) return NextResponse.json({ ok: false, error: "Editorial AI is disabled." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    const rate = checkRateLimit(`editorial-ai-translate:${actor.id}:${requestIp(request.headers)}`, 40, 60_000);
    if (!rate.ok) return NextResponse.json({ ok: false, error: "Too many requests. Try again shortly." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter), "Cache-Control": "no-store" } });
    const json = await request.json().catch(() => null);
    const parsed = editorialTranslateInputSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid translation request.", issues: parsed.error.issues }, { status: 400, headers: { "Cache-Control": "no-store" } });
    const result = await translateEditorialContent(parsed.data, actor.id);
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BlogAuthorizationError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    if (error instanceof EditorialAiError) {
      const status = error.category === "limit_reached" ? 429 : error.category === "disabled" || error.category === "not_configured" ? 503 : 400;
      return NextResponse.json({ ok: false, error: error.message, category: error.category }, { status, headers: { "Cache-Control": "no-store" } });
    }
    console.error("editorial_ai_translate_failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ ok: false, error: "Translation could not be completed." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}