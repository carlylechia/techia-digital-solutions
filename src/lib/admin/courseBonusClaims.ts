import type { PrismaClient } from "@prisma/client";
import {
  serializeBonusClaimForAdmin,
  type SerializedCourseBonusClaim,
} from "@/lib/courses/bonusClaims";

const adminUserSelect = {
  name: true,
  email: true,
} as const;

const courseBonusClaimInclude = {
  verifiedBy: { select: adminUserSelect },
  fulfilledBy: { select: adminUserSelect },
  deliveries: {
    orderBy: { sentAt: "desc" as const },
    include: {
      sentBy: { select: adminUserSelect },
    },
  },
} as const;

export async function loadAdminCourseBonusClaims(prisma: PrismaClient) {
  const claims = await prisma.courseBonusClaim.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 120,
    include: courseBonusClaimInclude,
  });

  return claims.map((claim) => serializeBonusClaimForAdmin(claim));
}

export async function loadAdminCourseBonusClaimSummary(prisma: PrismaClient) {
  const [total, submitted, underReview, verified, fulfilled, rejected] =
    await Promise.all([
      prisma.courseBonusClaim.count(),
      prisma.courseBonusClaim.count({ where: { status: "SUBMITTED" } }),
      prisma.courseBonusClaim.count({ where: { status: "UNDER_REVIEW" } }),
      prisma.courseBonusClaim.count({ where: { status: "VERIFIED" } }),
      prisma.courseBonusClaim.count({ where: { status: "FULFILLED" } }),
      prisma.courseBonusClaim.count({ where: { status: "REJECTED" } }),
    ]);

  return {
    total,
    submitted,
    underReview,
    verified,
    fulfilled,
    rejected,
    actionable: submitted + underReview + verified,
  };
}

export type AdminCourseBonusClaim = SerializedCourseBonusClaim;
