import { NextResponse, type NextRequest } from "next/server";
import {
  normalizeRequestedBonusIds,
  verifyBonusDeliveryToken,
} from "@/lib/courses/bonusClaims";
import { readBuyerBonusResource } from "@/lib/courses/bonusResources";
import { getPrisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ claimId: string; bonusId: string }>;
  },
) {
  const { claimId, bonusId } = await params;
  const expiresAt = Number(request.nextUrl.searchParams.get("exp") || "0");
  const signature = request.nextUrl.searchParams.get("sig") || "";

  if (!verifyBonusDeliveryToken(claimId, bonusId, expiresAt, signature)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const claim = await prisma.courseBonusClaim.findUnique({
    where: { id: claimId },
    select: {
      coursePackId: true,
      requestedBonusIds: true,
      status: true,
    },
  });

  if (!claim || !["VERIFIED", "FULFILLED"].includes(claim.status)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const allowedBonusIds = normalizeRequestedBonusIds(
    claim.coursePackId,
    claim.requestedBonusIds,
  );
  if (!allowedBonusIds.includes(bonusId)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const resource = await readBuyerBonusResource(bonusId);
  if (!resource) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(resource.content, {
    status: 200,
    headers: {
      "content-type": resource.contentType,
      "content-disposition": `attachment; filename="${resource.filename}"`,
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
