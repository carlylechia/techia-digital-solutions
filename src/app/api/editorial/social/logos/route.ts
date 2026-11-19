import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { deleteFromCloudinary, uploadToCloudinary } from "@/lib/cloudinary";
import { detectImageMime } from "@/lib/blog/media-validation";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { assertSameOrigin, requireSuperAdmin, BlogAuthorizationError } from "@/lib/blog/auth";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const MAX_LOGOS = 40;
const ALLOWED_LOGO_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const ALLOWED_LOGO_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

function noStore<T>(body: T, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function authorizationFailure(error: unknown) {
  if (error instanceof BlogAuthorizationError) return noStore({ ok: false, error: error.message }, error.status);
  return null;
}

export async function GET(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    const rate = checkRateLimit(`social-logos-list:${actor.id}:${requestIp(request.headers)}`, 60, 60_000);
    if (!rate.ok) return noStore({ ok: false, error: "Too many requests. Try again shortly." }, 429);

    const prisma = getPrisma();
    if (!prisma) return noStore({ ok: false, error: "Logo storage is unavailable." }, 503);

    const logos = await prisma.socialShareLogo.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        url: true,
        publicId: true,
        format: true,
        mimeType: true,
        width: true,
        height: true,
        bytes: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: MAX_LOGOS,
    });

    return noStore({
      ok: true,
      logos: logos.map((logo) => ({ ...logo, createdAt: logo.createdAt.toISOString() })),
    });
  } catch (error) {
    const failure = authorizationFailure(error);
    if (failure) return failure;
    console.error("social_logo_list_failed", error instanceof Error ? error.message : "Unknown error");
    return noStore({ ok: false, error: "The uploaded logos could not be loaded." }, 500);
  }
}

export async function POST(request: Request) {
  let uploadedPublicId: string | null = null;
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    const rate = checkRateLimit(`social-logos-upload:${actor.id}:${requestIp(request.headers)}`, 10, 60_000);
    if (!rate.ok) return noStore({ ok: false, error: "Upload limit reached. Try again shortly." }, 429);

    const prisma = getPrisma();
    if (!prisma) return noStore({ ok: false, error: "Logo storage is unavailable." }, 503);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return noStore({ ok: false, error: "Choose a logo image file." }, 400);
    if (file.size <= 0 || file.size > MAX_LOGO_BYTES) {
      return noStore({ ok: false, error: "Logo images must be smaller than 5 MB." }, 400);
    }

    const buffer = await file.arrayBuffer();
    const detected = detectImageMime(buffer);
    if (!detected || !ALLOWED_LOGO_MIME.has(detected)) {
      return noStore({ ok: false, error: "Upload a PNG, JPEG, or WebP logo. PNG or WebP preserve transparency best." }, 415);
    }
    if (file.type && file.type !== detected) {
      return noStore({ ok: false, error: "The file content does not match its declared type." }, 415);
    }
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_LOGO_EXTENSIONS.has(extension)) {
      return noStore({ ok: false, error: "The logo file extension is not allowed." }, 415);
    }

    const count = await prisma.socialShareLogo.count({ where: { isActive: true } });
    if (count >= MAX_LOGOS) {
      return noStore({ ok: false, error: `You can keep up to ${MAX_LOGOS} logos. Delete an unused logo before uploading another.` }, 422);
    }

    const rawName = formData.get("name");
    const fallbackName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
    const name = (typeof rawName === "string" ? rawName.trim() : "").slice(0, 80) || fallbackName.slice(0, 80) || "Brand logo";
    if (name.length < 2) return noStore({ ok: false, error: "Give the logo a name of at least 2 characters." }, 400);

    const result = await uploadToCloudinary(file, "techia/social-share/logos", { forceSigned: true });
    uploadedPublicId = result.public_id;
    if (result.resource_type !== "image" || !result.width || !result.height || result.width > 4000 || result.height > 4000) {
      await deleteFromCloudinary(result.public_id).catch(() => undefined);
      uploadedPublicId = null;
      return noStore({ ok: false, error: "The uploaded logo could not be verified." }, 415);
    }

    const logo = await prisma.$transaction(async (tx) => {
      const created = await tx.socialShareLogo.create({
        data: {
          name,
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          mimeType: detected,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          createdById: actor.id,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "social_share.logo_uploaded",
          entityType: "SocialShareLogo",
          entityId: created.id,
          metadata: { format: created.format, bytes: created.bytes },
        },
      });
      return created;
    });

    return noStore({
      ok: true,
      logo: {
        id: logo.id,
        name: logo.name,
        url: logo.url,
        publicId: logo.publicId,
        format: logo.format,
        mimeType: logo.mimeType,
        width: logo.width,
        height: logo.height,
        bytes: logo.bytes,
        createdAt: logo.createdAt.toISOString(),
      },
    }, 201);
  } catch (error) {
    if (uploadedPublicId) await deleteFromCloudinary(uploadedPublicId).catch(() => undefined);
    const failure = authorizationFailure(error);
    if (failure) return failure;
    console.error("social_logo_upload_failed", error instanceof Error ? error.message : "Unknown error");
    return noStore({ ok: false, error: "The logo could not be uploaded right now." }, 500);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    const rate = checkRateLimit(`social-logos-delete:${actor.id}:${requestIp(request.headers)}`, 30, 60_000);
    if (!rate.ok) return noStore({ ok: false, error: "Too many requests. Try again shortly." }, 429);

    const prisma = getPrisma();
    if (!prisma) return noStore({ ok: false, error: "Logo storage is unavailable." }, 503);

    const id = new URL(request.url).searchParams.get("id")?.trim() || "";
    if (!id || id.length > 64) return noStore({ ok: false, error: "Choose a logo to delete." }, 400);

    const logo = await prisma.socialShareLogo.findUnique({
      where: { id },
      select: { id: true, publicId: true },
    });
    if (!logo) return noStore({ ok: false, error: "Logo not found." }, 404);

    await prisma.$transaction(async (tx) => {
      await tx.socialShareLogo.delete({ where: { id: logo.id } });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "social_share.logo_deleted",
          entityType: "SocialShareLogo",
          entityId: logo.id,
        },
      });
    });

    await deleteFromCloudinary(logo.publicId).catch(() => undefined);
    return noStore({ ok: true });
  } catch (error) {
    const failure = authorizationFailure(error);
    if (failure) return failure;
    console.error("social_logo_delete_failed", error instanceof Error ? error.message : "Unknown error");
    return noStore({ ok: false, error: "The logo could not be deleted right now." }, 500);
  }
}
