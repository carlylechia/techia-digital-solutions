import { NextResponse } from "next/server";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import {
  deleteFromCloudinary,
  isCloudinaryConfigured,
  uploadToCloudinary,
} from "@/lib/cloudinary";
import { detectImageMime, isAllowedBlogImageMime } from "@/lib/blog/media-validation";
import { requireAcademyCatalogManagerApi } from "@/lib/admin/academy-auth";

const ACADEMY_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // Non-browser clients without an Origin are allowed.
  const host = request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Course/pack cover image upload for the academy admin. Same trust rules as the
 * editorial media endpoint: same-origin, permission re-read from the database,
 * rate limited, magic-byte image sniffing (declared type is never trusted), and
 * a signed Cloudinary upload into a dedicated academy folder.
 */
export async function POST(request: Request) {
  let uploadedPublicId: string | null = null;
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }

    const auth = await requireAcademyCatalogManagerApi();
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status, headers: { "Cache-Control": "no-store" } });
    }

    const rate = checkRateLimit(`academy-media:${auth.user.id}:${requestIp(request.headers)}`, 12, 60_000);
    if (!rate.ok) {
      return NextResponse.json({ ok: false, error: "Upload limit reached. Try again shortly." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
    }

    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ ok: false, error: "Image hosting is not configured. Use a direct image URL instead." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Choose an image file." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    if (file.size <= 0 || file.size > ACADEMY_MAX_IMAGE_BYTES) {
      return NextResponse.json({ ok: false, error: "Images must be smaller than 10 MB." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const detected = detectImageMime(await file.arrayBuffer());
    if (!isAllowedBlogImageMime(detected)) {
      return NextResponse.json({ ok: false, error: "Only JPEG, PNG, WebP, and AVIF images are accepted." }, { status: 415, headers: { "Cache-Control": "no-store" } });
    }
    if (file.type && file.type !== detected) {
      return NextResponse.json({ ok: false, error: "The file content does not match its declared type." }, { status: 415, headers: { "Cache-Control": "no-store" } });
    }
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json({ ok: false, error: "The image extension is not allowed." }, { status: 415, headers: { "Cache-Control": "no-store" } });
    }

    const result = await uploadToCloudinary(file, "techia/academy", { forceSigned: true });
    uploadedPublicId = result.public_id;
    if (result.resource_type !== "image" || !result.width || !result.height || result.width > 10000 || result.height > 10000) {
      await deleteFromCloudinary(result.public_id).catch(() => undefined);
      uploadedPublicId = null;
      return NextResponse.json({ ok: false, error: "The uploaded image could not be verified." }, { status: 415, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json(
      {
        ok: true,
        image: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (uploadedPublicId) await deleteFromCloudinary(uploadedPublicId).catch(() => undefined);
    console.error("academy_media_upload_failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ ok: false, error: "The image could not be uploaded right now." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
