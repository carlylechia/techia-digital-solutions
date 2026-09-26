import { NextResponse } from "next/server";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { getPrisma } from "@/lib/prisma";
import { deleteFromCloudinary, uploadToCloudinary } from "@/lib/cloudinary";
import { BLOG_MAX_IMAGE_BYTES } from "@/lib/blog/constants";
import { detectImageMime, isAllowedBlogImageMime } from "@/lib/blog/media-validation";
import { assertSameOrigin, requireBlogUser, BlogAuthorizationError } from "@/lib/blog/auth";

const MEDIA_PICKER_LIMIT = 120;

/**
 * Lists validated editorial images so an author can reuse an asset that is
 * already in the library instead of uploading the same file again. Read-only,
 * and available to anyone who may upload media.
 */
export async function GET(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireBlogUser("blog.media.upload");
    const rate = checkRateLimit(`blog-media-list:${actor.id}:${requestIp(request.headers)}`, 60, 60_000);
    if (!rate.ok) return NextResponse.json({ ok: false, error: "Too many requests. Try again shortly." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter), "Cache-Control": "no-store" } });
    const prisma = getPrisma();
    if (!prisma) return NextResponse.json({ ok: false, error: "Media storage is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    const media = await prisma.blogMedia.findMany({
      select: { id: true, url: true, publicId: true, format: true, mimeType: true, width: true, height: true, bytes: true, altText: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: MEDIA_PICKER_LIMIT,
    });
    return NextResponse.json(
      { ok: true, media: media.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BlogAuthorizationError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    console.error("blog_media_list_failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ ok: false, error: "The media library could not be loaded." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  let uploadedPublicId: string | null = null;
  try {
    assertSameOrigin(request);
    const actor = await requireBlogUser("blog.media.upload");
    const rate = checkRateLimit(`blog-media:${actor.id}:${requestIp(request.headers)}`, 12, 60_000);
    if (!rate.ok) return NextResponse.json({ ok: false, error: "Upload limit reached. Try again shortly." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Choose an image file." }, { status: 400 });
    if (file.size <= 0 || file.size > BLOG_MAX_IMAGE_BYTES) return NextResponse.json({ ok: false, error: "Images must be smaller than 10 MB." }, { status: 400 });
    const detected = detectImageMime(await file.arrayBuffer());
    if (!isAllowedBlogImageMime(detected)) return NextResponse.json({ ok: false, error: "Only JPEG, PNG, WebP, and AVIF images are accepted." }, { status: 415 });
    if (file.type && file.type !== detected) return NextResponse.json({ ok: false, error: "The file content does not match its declared type." }, { status: 415 });
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "avif"];
    if (!allowedExtensions.includes(extension)) return NextResponse.json({ ok: false, error: "The image extension is not allowed." }, { status: 415 });
    const result = await uploadToCloudinary(file, "techia/blog", { forceSigned: true });
    uploadedPublicId = result.public_id;
    if (result.resource_type !== "image" || !result.width || !result.height || result.width > 10000 || result.height > 10000) {
      await deleteFromCloudinary(result.public_id).catch(() => undefined);
      return NextResponse.json({ ok: false, error: "The uploaded image could not be verified." }, { status: 415 });
    }
    const prisma = getPrisma();
    if (!prisma) {
      await deleteFromCloudinary(result.public_id).catch(() => undefined);
      return NextResponse.json({ ok: false, error: "Media storage is unavailable." }, { status: 503 });
    }
    const media = await prisma.$transaction(async (tx) => {
      const created = await tx.blogMedia.create({ data: { publicId: result.public_id, url: result.secure_url, resourceType: result.resource_type, format: result.format, mimeType: detected, width: result.width, height: result.height, bytes: result.bytes, uploadedById: actor.id } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "blog.media_uploaded", entityType: "BlogMedia", entityId: created.id, metadata: { format: created.format, bytes: created.bytes } } });
      return created;
    });
    return NextResponse.json({ ok: true, media: { id: media.id, url: media.url, publicId: media.publicId, format: media.format, width: media.width, height: media.height, bytes: media.bytes } }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (uploadedPublicId) await deleteFromCloudinary(uploadedPublicId).catch(() => undefined);
    if (error instanceof BlogAuthorizationError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    console.error("blog_media_upload_failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ ok: false, error: "The image could not be uploaded right now." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
