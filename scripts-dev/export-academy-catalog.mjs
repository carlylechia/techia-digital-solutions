// Export the academy catalog from the LOCAL database (.env DATABASE_URL)
// to scripts-dev/academy-catalog.export.json, keyed by slug for idempotent seeding.
// Usage: node scripts-dev/export-academy-catalog.mjs
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

function readEnvValue(file, key) {
  const line = fs
    .readFileSync(file, "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} not found in ${file}`);
  return line.slice(key.length + 1).trim().replace(/^"|"$/g, "");
}

const connectionString = readEnvValue(".env", "DATABASE_URL");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const iso = (d) => (d ? d.toISOString() : null);

try {
  const [categories, courses, packs] = await Promise.all([
    prisma.academyCourseCategory.findMany({ orderBy: { position: "asc" } }),
    prisma.academyCourse.findMany({
      include: { lessons: { orderBy: { position: "asc" } }, category: true },
      orderBy: { position: "asc" },
    }),
    prisma.academyCoursePack.findMany({
      include: { items: { orderBy: { position: "asc" }, include: { course: true } } },
      orderBy: { position: "asc" },
    }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    categories: categories.map((c) => ({
      slug: c.slug,
      nameEn: c.nameEn,
      nameFr: c.nameFr,
      descriptionEn: c.descriptionEn,
      descriptionFr: c.descriptionFr,
      position: c.position,
      isActive: c.isActive,
    })),
    courses: courses.map((c) => ({
      slug: c.slug,
      categorySlug: c.category?.slug ?? null,
      titleEn: c.titleEn,
      titleFr: c.titleFr,
      shortDescriptionEn: c.shortDescriptionEn,
      shortDescriptionFr: c.shortDescriptionFr,
      descriptionEn: c.descriptionEn,
      descriptionFr: c.descriptionFr,
      level: c.level,
      status: c.status,
      includedInFullPack: c.includedInFullPack,
      financialDisclaimerRequired: c.financialDisclaimerRequired,
      moduleCount: c.moduleCount,
      lessonCount: c.lessonCount,
      pathCount: c.pathCount,
      priceMinor: c.priceMinor,
      compareAtPriceMinor: c.compareAtPriceMinor,
      currency: c.currency,
      chariowProductId: c.chariowProductId,
      imageUrl: c.imageUrl,
      seoTitleEn: c.seoTitleEn,
      seoTitleFr: c.seoTitleFr,
      seoDescriptionEn: c.seoDescriptionEn,
      seoDescriptionFr: c.seoDescriptionFr,
      position: c.position,
      publishedAt: iso(c.publishedAt),
      skillsEn: c.skillsEn,
      skillsFr: c.skillsFr,
      lessons: c.lessons.map((l) => ({
        slug: l.slug,
        titleEn: l.titleEn,
        titleFr: l.titleFr,
        descriptionEn: l.descriptionEn,
        descriptionFr: l.descriptionFr,
        durationLabel: l.durationLabel,
        isPreview: l.isPreview,
        position: l.position,
      })),
    })),
    packs: packs.map((p) => ({
      slug: p.slug,
      titleEn: p.titleEn,
      titleFr: p.titleFr,
      shortTitleEn: p.shortTitleEn,
      shortTitleFr: p.shortTitleFr,
      categoryLabelEn: p.categoryLabelEn,
      categoryLabelFr: p.categoryLabelFr,
      taglineEn: p.taglineEn,
      taglineFr: p.taglineFr,
      summaryEn: p.summaryEn,
      summaryFr: p.summaryFr,
      descriptionEn: p.descriptionEn,
      descriptionFr: p.descriptionFr,
      bestForEn: p.bestForEn,
      bestForFr: p.bestForFr,
      learningOutcomesEn: p.learningOutcomesEn,
      learningOutcomesFr: p.learningOutcomesFr,
      whyChooseEn: p.whyChooseEn,
      whyChooseFr: p.whyChooseFr,
      level: p.level,
      recommended: p.recommended,
      badgeEn: p.badgeEn,
      badgeFr: p.badgeFr,
      status: p.status,
      priceMinor: p.priceMinor,
      compareAtPriceMinor: p.compareAtPriceMinor,
      currency: p.currency,
      chariowProductId: p.chariowProductId,
      imageUrl: p.imageUrl,
      seoTitleEn: p.seoTitleEn,
      seoTitleFr: p.seoTitleFr,
      seoDescriptionEn: p.seoDescriptionEn,
      seoDescriptionFr: p.seoDescriptionFr,
      position: p.position,
      publishedAt: iso(p.publishedAt),
      items: p.items.map((i) => ({ courseSlug: i.course.slug, position: i.position })),
    })),
  };

  const outPath = path.join("scripts-dev", "academy-catalog.export.json");
  fs.writeFileSync(outPath, JSON.stringify(exportData, null, 2));
  const lessonTotal = exportData.courses.reduce((n, c) => n + c.lessons.length, 0);
  console.log(`Exported -> ${outPath}`);
  console.log(
    `categories: ${exportData.categories.length} | courses: ${exportData.courses.length} | lessons: ${lessonTotal} | packs: ${exportData.packs.length}`,
  );
  const priced = exportData.courses.filter((c) => c.priceMinor).length;
  const withProdId = exportData.courses.filter((c) => c.chariowProductId).length;
  const published = exportData.courses.filter((c) => c.status === "PUBLISHED").length;
  console.log(
    `courses published: ${published} | priced: ${priced} | with chariowProductId: ${withProdId}`,
  );
} finally {
  await prisma.$disconnect();
}
