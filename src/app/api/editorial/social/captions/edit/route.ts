import { NextResponse } from "next/server";
import { assertSameOrigin, requireSuperAdmin, BlogAuthorizationError } from "@/lib/blog/auth";
import { saveEditedCaption } from "@/lib/ai/social-share-service";
import { z } from "zod";
import { socialPlatformOptions } from "@/lib/ai/social-share-types";

const bodySchema = z.object({
  postId: z.string().min(1),
  platform: z.enum(socialPlatformOptions),
  editedCaption: z.string().trim().min(1).max(6000),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireSuperAdmin();
    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid caption edit.", issues: parsed.error.issues }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const result = await saveEditedCaption(parsed.data.postId, parsed.data.platform, parsed.data.editedCaption);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BlogAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ ok: false, error: "Caption could not be saved." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
