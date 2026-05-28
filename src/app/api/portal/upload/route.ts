import { NextRequest, NextResponse } from "next/server";
import { verifyPortalToken } from "@/lib/portal-auth";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { getPrisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/sanitize";
import { revalidatePath } from "next/cache";

const PORTAL_COOKIE_NAME = "techia_portal_session";

async function getPortalSessionFromRequest(request: NextRequest) {
  const tokenFromCookie = request.cookies.get(PORTAL_COOKIE_NAME)?.value;
  if (tokenFromCookie) {
    const session = await verifyPortalToken(tokenFromCookie);
    if (session) return session;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken) {
      const session = await verifyPortalToken(bearerToken);
      if (session) return session;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getPortalSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = sanitizeText(String(formData.get("name") || ""));
    const category = String(formData.get("category") || "DOCUMENT").toUpperCase();
    const requirementId = String(formData.get("requirementId") || "").trim() || null;
    const projectId = String(formData.get("projectId") || "").trim() || null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    const fileName = name || file.name;

    let url = "#";
    let publicId: string | undefined;

    if (isCloudinaryConfigured()) {
      const result = await uploadToCloudinary(file, `portal/${session.clientId}`);
      url = result.secure_url;
      publicId = result.public_id;
    }

    const portalFile = await prisma.portalFile.create({
      data: {
        clientId: session.clientId,
        projectId: projectId || null,
        name: fileName,
        fileType: file.type || "application/octet-stream",
        category,
        url,
        publicId: publicId || null,
        size: file.size,
        uploadedBy: "client",
        status: "PENDING",
      },
    });

    if (requirementId) {
      await prisma.portalRequirement.update({
        where: { id: requirementId, clientId: session.clientId },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
          fileUrl: url,
          filePublicId: publicId || null,
        },
      });
    }

    revalidatePath("/client-portal/files");

    return NextResponse.json({ success: true, file: portalFile });
  } catch (error) {
    console.error("[portal-upload]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
