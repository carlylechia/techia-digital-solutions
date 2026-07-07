import { NextRequest, NextResponse } from "next/server";
import { getCloudinaryPrivateDownloadUrl, parseCloudinaryUrl } from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/admin/session";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin("requests.manage");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const claimId = request.nextUrl.searchParams.get("claimId");
  if (!claimId) {
    return NextResponse.json({ error: "Missing claimId parameter" }, { status: 400 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const claim = await prisma.courseBonusClaim.findUnique({
    where: { id: claimId },
    select: {
      proofUrl: true,
    },
  });

  if (!claim?.proofUrl) {
    return NextResponse.json({ error: "Proof file not found" }, { status: 404 });
  }

  const parsed = parseCloudinaryUrl(claim.proofUrl);
  if (!parsed) {
    return NextResponse.redirect(claim.proofUrl, { status: 302 });
  }

  const signedUrl = await getCloudinaryPrivateDownloadUrl(
    parsed.publicId,
    parsed.format,
    parsed.resourceType,
  );

  if (!signedUrl) {
    return NextResponse.redirect(claim.proofUrl, { status: 302 });
  }

  return NextResponse.redirect(signedUrl, { status: 302 });
}
