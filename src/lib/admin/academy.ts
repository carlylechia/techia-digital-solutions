import "server-only";

import type { PrismaClient } from "@prisma/client";

export async function loadAdminAcademyCatalog(prisma: PrismaClient) {
  const [courses, packs, categories, orders] = await Promise.all([
    prisma.academyCourse.findMany({
      orderBy: [{ position: "asc" }, { titleEn: "asc" }],
      include: {
        category: true,
        _count: { select: { lessons: true, packItems: true } },
        packItems: { include: { pack: { select: { id: true, slug: true, titleEn: true } } } },
      },
    }),
    prisma.academyCoursePack.findMany({
      orderBy: [{ position: "asc" }, { titleEn: "asc" }],
      include: {
        items: {
          orderBy: [{ position: "asc" }],
          include: {
            course: {
              select: {
                id: true,
                slug: true,
                titleEn: true,
                status: true,
              },
            },
          },
        },
        _count: { select: { items: true } },
      },
    }),
    prisma.academyCourseCategory.findMany({
      orderBy: [{ position: "asc" }, { nameEn: "asc" }],
    }),
    prisma.academyOrder.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 50,
      include: {
        items: true,
        payments: { orderBy: [{ createdAt: "desc" }], take: 3 },
        bonusGrants: true,
      },
    }),
  ]);

  return { courses, packs, categories, orders };
}

export type AdminAcademyCatalog = Awaited<ReturnType<typeof loadAdminAcademyCatalog>>;
