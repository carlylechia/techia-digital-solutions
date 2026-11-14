import "server-only";

import type { PrismaClient } from "@prisma/client";
import type { Locale } from "@/content/site";
import {
  effectiveCoursePriceMinor,
  effectivePackPriceMinor,
} from "@/lib/courses/pricing";
import { formatMoney } from "@/lib/payments/money";
import { getPublicAppPath } from "@/lib/site-routes";
import {
  buildCheckoutPath,
  extractRecommendationCandidates,
  messageMentionsSlug,
  type AcademyRecommendation,
  type AcademyRecommendationType,
  type RecommendationCandidate,
  type RecommendationRef,
} from "@/lib/ai/recommendation";

type CatalogRow = {
  slug: string;
  titleEn: string;
  titleFr: string | null;
  priceMinor: number | null;
  currency: string;
};

function titleFor(locale: Locale, row: CatalogRow) {
  return locale === "fr" ? row.titleFr?.trim() || row.titleEn : row.titleEn;
}

function toRecommendation(
  locale: Locale,
  type: AcademyRecommendationType,
  row: CatalogRow,
): AcademyRecommendation {
  const priceMinor =
    type === "course"
      ? effectiveCoursePriceMinor(row.priceMinor, row.currency)
      : effectivePackPriceMinor(row.priceMinor, row.currency);

  return {
    type,
    slug: row.slug,
    title: titleFor(locale, row),
    productPath: getPublicAppPath(`/courses/${row.slug}`),
    checkoutPath:
      priceMinor === null ? null : buildCheckoutPath(type, row.slug),
    priceLabel:
      priceMinor === null
        ? null
        : formatMoney(priceMinor, row.currency, locale),
  };
}

function resolveCandidate(
  candidate: RecommendationCandidate,
  courses: Map<string, CatalogRow>,
  packs: Map<string, CatalogRow>,
  locale: Locale,
): AcademyRecommendation | null {
  if (candidate.type === "course") {
    const course = courses.get(candidate.slug);
    return course ? toRecommendation(locale, "course", course) : null;
  }

  if (candidate.type === "pack") {
    const pack = packs.get(candidate.slug);
    return pack ? toRecommendation(locale, "pack", pack) : null;
  }

  // A plain /courses/<slug> URL is used by both products. The storefront
  // resolves a pack first, so checkout must follow the same rule.
  const pack = packs.get(candidate.slug);
  if (pack) return toRecommendation(locale, "pack", pack);
  const course = courses.get(candidate.slug);
  return course ? toRecommendation(locale, "course", course) : null;
}

function findCandidate(
  candidates: RecommendationCandidate[],
  courses: Map<string, CatalogRow>,
  packs: Map<string, CatalogRow>,
  locale: Locale,
) {
  for (const candidate of candidates) {
    const resolved = resolveCandidate(candidate, courses, packs, locale);
    if (resolved) return resolved;
  }
  return null;
}

function findTitleMatch(
  message: string,
  courses: CatalogRow[],
  packs: CatalogRow[],
  locale: Locale,
): AcademyRecommendation | null {
  const haystack = message.toLowerCase();
  const matches: Array<{
    type: AcademyRecommendationType;
    row: CatalogRow;
    length: number;
  }> = [];

  const consider = (
    type: AcademyRecommendationType,
    row: CatalogRow,
    titles: Array<string | null>,
  ) => {
    for (const rawTitle of titles) {
      const title = rawTitle?.trim();
      if (!title || title.length < 4) continue;
      if (!haystack.includes(title.toLowerCase())) continue;
      matches.push({ type, row, length: title.length });
    }
  };

  for (const course of courses) {
    consider("course", course, [course.titleEn, course.titleFr]);
  }
  for (const pack of packs) {
    consider("pack", pack, [pack.titleEn, pack.titleFr]);
  }

  const best = matches.sort((a, b) => b.length - a.length)[0];
  if (!best) return null;
  return toRecommendation(locale, best.type, best.row);
}

async function loadCatalog(prisma: PrismaClient, slugs: Set<string>) {
  const [courses, packs] = await Promise.all([
    prisma.academyCourse.findMany({
      where: { slug: { in: [...slugs] }, status: "PUBLISHED" },
      select: {
        slug: true,
        titleEn: true,
        titleFr: true,
        priceMinor: true,
        currency: true,
      },
    }),
    prisma.academyCoursePack.findMany({
      where: { slug: { in: [...slugs] }, status: "PUBLISHED" },
      select: {
        slug: true,
        titleEn: true,
        titleFr: true,
        priceMinor: true,
        currency: true,
      },
    }),
  ]);

  return {
    courseBySlug: new Map(courses.map((course) => [course.slug, course])),
    packBySlug: new Map(packs.map((pack) => [pack.slug, pack])),
  };
}

/**
 * Validates a recommendation the client already holds. Used when saving a
 * course-purchase lead so the redirect target is always the current, published
 * database item rather than a stale client value.
 */
export async function resolveAcademyRecommendationRef(
  prisma: PrismaClient | null,
  locale: Locale,
  ref: RecommendationRef | null,
): Promise<AcademyRecommendation | null> {
  if (!prisma || !ref) return null;

  const { courseBySlug, packBySlug } = await loadCatalog(
    prisma,
    new Set([ref.slug]),
  );
  return resolveCandidate(
    { type: ref.type, slug: ref.slug, source: "marker" },
    courseBySlug,
    packBySlug,
    locale,
  );
}

/**
 * Resolves the item the conversation is actually discussing against the live
 * published catalog. The hidden marker and explicit checkout URLs are
 * authoritative; ordinary course links and the previous recommendation are
 * fallbacks so the agent can never invent a checkout endpoint.
 */
export async function resolveAcademyRecommendation(
  prisma: PrismaClient | null,
  locale: Locale,
  message: string,
  activeRecommendation: RecommendationRef | null,
): Promise<AcademyRecommendation | null> {
  if (!prisma) return null;

  const candidates = extractRecommendationCandidates(message);
  const slugs = new Set<string>(candidates.map((candidate) => candidate.slug));
  if (activeRecommendation) slugs.add(activeRecommendation.slug);

  const { courseBySlug, packBySlug } = await loadCatalog(prisma, slugs);

  const markerCandidates = candidates.filter(
    (candidate) => candidate.source === "marker",
  );
  const checkoutCandidates = candidates.filter(
    (candidate) => candidate.source === "checkout",
  );
  const productCandidates = candidates.filter(
    (candidate) => candidate.source === "product",
  );

  const explicit =
    findCandidate(markerCandidates, courseBySlug, packBySlug, locale) ??
    findCandidate(checkoutCandidates, courseBySlug, packBySlug, locale);
  if (explicit) return explicit;

  // Models do not always follow the marker instruction. If the reply names a
  // published course or pack but includes no URL at all, match the title against
  // the live catalog so the recommendation still reaches the interface.
  if (productCandidates.length === 0) {
    const [allCourses, allPacks] = await Promise.all([
      prisma.academyCourse.findMany({
        where: { status: "PUBLISHED" },
        select: {
          slug: true,
          titleEn: true,
          titleFr: true,
          priceMinor: true,
          currency: true,
        },
      }),
      prisma.academyCoursePack.findMany({
        where: { status: "PUBLISHED" },
        select: {
          slug: true,
          titleEn: true,
          titleFr: true,
          priceMinor: true,
          currency: true,
        },
      }),
    ]);
    const titleMatch = findTitleMatch(message, allCourses, allPacks, locale);
    if (titleMatch) return titleMatch;
  }

  // Keep the conversation anchored to the current item when the reply still
  // refers to it (for example, a comparison that also links other items).
  // A new item link is allowed to take over when the model has not emitted an
  // explicit marker or checkout URL for it.
  const active = activeRecommendation
    ? resolveCandidate(
        {
          type: activeRecommendation.type,
          slug: activeRecommendation.slug,
          source: "product",
        },
        courseBySlug,
        packBySlug,
        locale,
      )
    : null;

  if (
    active &&
    (messageMentionsSlug(message, active.slug) ||
      message.toLowerCase().includes(active.title.toLowerCase()))
  ) {
    return active;
  }

  return (
    findCandidate(productCandidates, courseBySlug, packBySlug, locale) ?? active
  );
}
