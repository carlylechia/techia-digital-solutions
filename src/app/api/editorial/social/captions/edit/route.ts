import { NextResponse } from "next/server";
import { assertSameOrigin, requireSuperAdmin, BlogAuthorizationError } from "@/lib/blog/auth";
import { saveEditedCaption } from "@/lib/ai/social-share-service";
import { socialCaptionEditInputSchema } from "@/lib/ai/social-share-types";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireSuperAdmin();
    const json = await request.json().catch(() => null);
    const parsed = socialCaptionEditInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid caption edit.", issues: parsed.error.issues }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const result = await saveEditedCaption(parsed.data);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BlogAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ ok: false, error: "Caption could not be saved." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
