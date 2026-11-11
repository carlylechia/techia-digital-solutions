import "server-only";

import type { Locale } from "@/content/site";
import { getPrisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/payments/money";
import { getPublicAppPath } from "@/lib/site-routes";
import {
  effectiveCoursePriceMinor,
  effectivePackPriceMinor,
} from "@/lib/courses/pricing";

function fromLocale(locale: Locale, en: string, fr?: string | null) {
  if (locale === "fr") return fr?.trim() || en;
  return en;
}

export async function buildAcademyCatalogContext(locale: Locale = "en") {
  const prisma = getPrisma();
  if (!prisma) {
    return "Academy catalog is temporarily unavailable. Do not invent courses, prices, or availability.";
  }

  try {
    const [courses, packs] = await Promise.all([
      prisma.academyCourse.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ position: "asc" }, { titleEn: "asc" }],
        include: {
          category: true,
          packItems: { include: { pack: { select: { slug: true, titleEn: true, titleFr: true, status: true } } } },
          _count: { select: { lessons: true } },
        },
      }),
      prisma.academyCoursePack.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ position: "asc" }, { titleEn: "asc" }],
        include: {
          items: {
            orderBy: [{ position: "asc" }],
            include: { course: { select: { slug: true, titleEn: true, titleFr: true } } },
          },
        },
      }),
    ]);

    const lines: string[] = [];
    lines.push("LIVE PUBLISHED ACADEMY CATALOG (use this as the source of truth):");
    lines.push("- Only recommend courses/packs listed below. Never recommend unpublished or archived items.");
    lines.push("- Never invent prices, discounts, availability, certifications, instructors, duration, or syllabus details not shown.");
    lines.push("- Prices listed below are the live catalog prices; never quote any other amount.");
    lines.push("- For trading and cryptocurrency topics, provide educational guidance only with clear disclaimers: no financial/investment advice and no guaranteed returns or income.");
    lines.push("- Recommend the option that best fits the user's goal, level, and budget; do not automatically recommend the most expensive product.");
    lines.push("");

    lines.push("INDIVIDUAL COURSES:");
    for (const course of courses) {
      const title = fromLocale(locale, course.titleEn, course.titleFr);
      const coursePriceMinor = effectiveCoursePriceMinor(course.priceMinor, course.currency);
      const price = coursePriceMinor === null
        ? "Price not configured"
        : formatMoney(coursePriceMinor, course.currency, locale);
      const url = getPublicAppPath(`/courses/${course.slug}`);
      const category = course.category
        ? fromLocale(locale, course.category.nameEn, course.category.nameFr)
        : "Uncategorized";
      const inPacks = course.packItems
        .filter((pi) => pi.pack.status === "PUBLISHED")
        .map((pi) => fromLocale(locale, pi.pack.titleEn, pi.pack.titleFr));
      lines.push(`- ${title}`);
      lines.push(`  slug: ${course.slug}`);
      lines.push(`  url: ${url}`);
      lines.push(`  category: ${category}`);
      lines.push(`  level: ${course.level}`);
      lines.push(`  lessons: ${course._count.lessons}`);
      lines.push(`  price: ${price}`);
      lines.push(`  included_in_full_pack: ${course.includedInFullPack ? "yes" : "no"}`);
      if (inPacks.length) lines.push(`  included_in_packs: ${inPacks.join("; ")}`);
      if (course.financialDisclaimerRequired) {
        lines.push("  note: educational only; trading/crypto requires financial-risk disclaimers");
      }
      const summary = fromLocale(locale, course.shortDescriptionEn, course.shortDescriptionFr);
      if (summary) lines.push(`  summary: ${summary}`);
    }

    lines.push("");
    lines.push("COURSE PACKS:");
    for (const pack of packs) {
      const title = fromLocale(locale, pack.titleEn, pack.titleFr);
      const packPriceMinor = effectivePackPriceMinor(pack.priceMinor, pack.currency);
      const price = packPriceMinor === null
        ? "Price not configured"
        : formatMoney(packPriceMinor, pack.currency, locale);
      const url = getPublicAppPath(`/courses/${pack.slug}`);
      const included = pack.items.map((item) =>
        fromLocale(locale, item.course.titleEn, item.course.titleFr),
      );
      lines.push(`- ${title}`);
      lines.push(`  slug: ${pack.slug}`);
      lines.push(`  url: ${url}`);
      lines.push(`  course_count: ${pack.items.length}`);
      lines.push(`  price: ${price}`);
      if (pack.recommended) lines.push("  flagship: yes (complete collection)");
      if (included.length) lines.push(`  includes: ${included.join("; ")}`);
      const summary = fromLocale(locale, pack.summaryEn, pack.summaryFr);
      if (summary) lines.push(`  summary: ${summary}`);
    }

    return lines.join("\n");
  } catch (error) {
    console.error("[academy-catalog-context] failed", error);
    return "Academy catalog could not be loaded right now. Do not invent courses, prices, or availability; ask the user to check the courses page or contact teChia.";
  }
}
