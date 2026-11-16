import { NextResponse } from "next/server";
import { assertSameOrigin, requireSuperAdmin, BlogAuthorizationError } from "@/lib/blog/auth";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { isEditorialImageEnabled } from "@/lib/ai/editorial-config";
import { generateEditorialImage, EditorialAiError } from "@/lib/ai/editorial-image-service";
import { editorialImageInputSchema } from "@/lib/ai/editorial-types";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    if (!isEditorialImageEnabled()) return NextResponse.json({ ok: false, error: "Editorial image generation is disabled." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    const rate = checkRateLimit(`editorial-ai-image:${actor.id}:${requestIp(request.headers)}`, 10, 60_000);
    if (!rate.ok) return NextResponse.json({ ok: false, error: "Too many requests. Try again shortly." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter), "Cache-Control": "no-store" } });
    const json = await request.json().catch(() => null);
    const parsed = editorialImageInputSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid image request.", issues: parsed.error.issues }, { status: 400, headers: { "Cache-Control": "no-store" } });
    const result = await generateEditorialImage(parsed.data, actor.id);
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BlogAuthorizationError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    if (error instanceof EditorialAiError) {
      const status = error.category === "limit_reached" ? 429 : error.category === "disabled" || error.category === "not_configured" ? 503 : error.category === "too_large" || error.category === "malformed_output" ? 422 : 400;
      return NextResponse.json({ ok: false, error: error.message, category: error.category }, { status, headers: { "Cache-Control": "no-store" } });
    }
    console.error("editorial_ai_image_failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ ok: false, error: "Image generation could not be completed." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}