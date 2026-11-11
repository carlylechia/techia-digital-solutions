import "server-only";

import type { AcademyCourseLevel } from "@prisma/client";
import type { Locale } from "@/content/site";
import { getPrisma } from "@/lib/prisma";
import { getPublicAppPath } from "@/lib/site-routes";
import {
  effectiveCoursePriceMinor,
  effectivePackPriceMinor,
} from "@/lib/courses/pricing";
import { COURSE_CATALOG, type CourseCatalogEntry } from "./catalog";
import {
  COURSE_PACK_DEFINITIONS,
  getCoursePacks,
  getCoursePackLevelLabel,
  type CoursePack,
} from "./coursePacks";

export type StorefrontLesson = {
  id: string;
  slug: string;
  title: string;
  description: string;
  durationLabel: string | null;
  isPreview: boolean;
  position: number;
};

export type StorefrontCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export type StorefrontCourse = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  category: StorefrontCategory | null;
  level: AcademyCourseLevel;
  levelLabel: string;
  skills: string[];
  lessons: StorefrontLesson[];
  priceMinor: number | null;
  compareAtPriceMinor: number | null;
  currency: string;
  chariowProductId: string | null;
  imageUrl: string | null;
  // Admin-entered structure metadata; null means "not recorded" and is never
  // displayed or invented.
  moduleCount: number | null;
  lessonCount: number | null;
  pathCount: number | null;
  financialDisclaimerRequired: boolean;
  includedInFullPack: boolean;
  seoTitle: string;
  seoDescription: string;
  path: string;
  source: "database" | "static";
};

export type StorefrontPack = CoursePack & {
  databaseId: string | null;
  priceMinor: number | null;
  priceCurrency: string;
  chariowProductId: string | null;
};

export type CatalogSort =
  | "recommended"
  | "title"
  | "price-asc"
  | "price-desc";

export type CatalogFilters = {
  query?: string;
  category?: string;
  level?: string;
  sort?: CatalogSort;
};

const LEVEL_LABELS: Record<
  AcademyCourseLevel,
  { en: string; fr: string }
> = {
  BEGINNER: { en: "Beginner", fr: "Débutant" },
  BEGINNER_TO_INTERMEDIATE: {
    en: "Beginner to Intermediate",
    fr: "Débutant à intermédiaire",
  },
  INTERMEDIATE: { en: "Intermediate", fr: "Intermédiaire" },
};

export function getCourseLevelLabel(
  locale: Locale,
  level: AcademyCourseLevel | string,
) {
  const entry =
    LEVEL_LABELS[level as AcademyCourseLevel] ??
    LEVEL_LABELS.BEGINNER_TO_INTERMEDIATE;
  return locale === "fr" ? entry.fr : entry.en;
}

function fromLocale(locale: Locale, en: string, fr?: string | null) {
  if (locale === "fr") return fr?.trim() || en;
  return en;
}

function levelFromStatic(value: string): AcademyCourseLevel {
  if (value === "Beginner") return "BEGINNER";
  if (value === "Intermediate") return "INTERMEDIATE";
  return "BEGINNER_TO_INTERMEDIATE";
}

function staticCategory(course: CourseCatalogEntry): StorefrontCategory {
  const definition = COURSE_PACK_DEFINITIONS.find((pack) =>
    pack.courseSlugs.includes(course.slug),
  );
  const fallbackName = course.category;
  const slug =
    {
      "Digital Marketing & Online Business":
        "digital-marketing-online-business",
      "Creative & Content Skills": "creative-content-skills",
      "Tech & Future Skills": "tech-future-skills",
      "Professional Office & Business Skills":
        "professional-office-business-skills",
      "Finance & Market Education": "finance-market-education",
    }[fallbackName] ?? "academy-courses";
  return {
    id: `static-category-${slug}`,
    slug,
    name: definition?.copy.en.category || fallbackName,
    description: null,
  };
}

function staticCourseToStorefront(
  course: CourseCatalogEntry,
  locale: Locale,
): StorefrontCourse {
  return {
    id: `static-${course.slug}`,
    slug: course.slug,
    title: course.title,
    shortDescription: course.shortDescription,
    description: course.description,
    category: staticCategory(course),
    level: levelFromStatic(course.level),
    levelLabel: getCourseLevelLabel(locale, levelFromStatic(course.level)),
    skills: course.skillsLearned,
    lessons: course.lessons.map((lesson, index) => ({
      id: `static-${course.slug}-${lesson.slug}`,
      slug: lesson.slug,
      title: lesson.title,
      description: lesson.description,
      durationLabel: lesson.durationLabel,
      isPreview: lesson.isPreview ?? false,
      position: index,
    })),
    priceMinor: null,
    compareAtPriceMinor: null,
    currency: "XAF",
    chariowProductId: null,
    imageUrl: null,
    moduleCount: null,
    lessonCount: null,
    pathCount: null,
    financialDisclaimerRequired:
      course.financialDisclaimerRequired ?? false,
    includedInFullPack: course.includedInFullPack,
    seoTitle: `${course.title} | teChia Digital Academy`,
    seoDescription: course.shortDescription,
    path: getPublicAppPath(`/courses/${course.slug}`),
    source: "static",
  };
}

type DatabaseCourseRow = NonNullable<
  Awaited<ReturnType<typeof queryPublishedCourses>>
>[number];

async function queryPublishedCourses() {
  const prisma = getPrisma();
  if (!prisma) return null;

  return prisma.academyCourse.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ position: "asc" }, { titleEn: "asc" }],
    include: {
      category: true,
      lessons: { orderBy: [{ position: "asc" }, { titleEn: "asc" }] },
    },
  });
}

function databaseCourseToStorefront(
  course: DatabaseCourseRow,
  locale: Locale,
): StorefrontCourse {
  return {
    id: course.id,
    slug: course.slug,
    title: fromLocale(locale, course.titleEn, course.titleFr),
    shortDescription: fromLocale(
      locale,
      course.shortDescriptionEn,
      course.shortDescriptionFr,
    ),
    description: fromLocale(
      locale,
      course.descriptionEn,
      course.descriptionFr,
    ),
    category: course.category
      ? {
          id: course.category.id,
          slug: course.category.slug,
          name: fromLocale(
            locale,
            course.category.nameEn,
            course.category.nameFr,
          ),
          description: fromLocale(
            locale,
            course.category.descriptionEn || "",
            course.category.descriptionFr,
          ) || null,
        }
      : null,
    level: course.level,
    levelLabel: getCourseLevelLabel(locale, course.level),
    skills:
      locale === "fr"
        ? course.skillsFr.length
          ? course.skillsFr
          : course.skillsEn
        : course.skillsEn,
    lessons: course.lessons.map((lesson) => ({
      id: lesson.id,
      slug: lesson.slug,
      title: fromLocale(locale, lesson.titleEn, lesson.titleFr),
      description: fromLocale(
        locale,
        lesson.descriptionEn,
        lesson.descriptionFr,
      ),
      durationLabel: lesson.durationLabel,
      isPreview: lesson.isPreview,
      position: lesson.position,
    })),
    priceMinor: effectiveCoursePriceMinor(course.priceMinor, course.currency),
    compareAtPriceMinor: course.compareAtPriceMinor,
    currency: course.currency,
    chariowProductId: course.chariowProductId ?? null,
    imageUrl: course.imageUrl,
    moduleCount: course.moduleCount,
    lessonCount: course.lessonCount,
    pathCount: course.pathCount,
    financialDisclaimerRequired: course.financialDisclaimerRequired,
    includedInFullPack: course.includedInFullPack,
    seoTitle: fromLocale(
      locale,
      course.seoTitleEn || `${course.titleEn} | teChia Digital Academy`,
      course.seoTitleFr,
    ),
    seoDescription: fromLocale(
      locale,
      course.seoDescriptionEn || course.shortDescriptionEn,
      course.seoDescriptionFr,
    ),
    path: getPublicAppPath(`/courses/${course.slug}`),
    source: "database",
  };
}

export async function listPublishedCourses(
  locale: Locale,
): Promise<StorefrontCourse[]> {
  try {
    const rows = await queryPublishedCourses();
    if (rows === null) {
      return COURSE_CATALOG.map((course) =>
        staticCourseToStorefront(course, locale),
      );
    }
    if (!rows.length) {
      // A connected database with no seeded catalog is intentional: do not
      // resurrect static courses that an administrator may have removed.
      return [];
    }
    return rows.map((course) => databaseCourseToStorefront(course, locale));
  } catch (error) {
    console.error("[academy-catalog] published_courses_query_failed", {
      message: error instanceof Error ? error.message : error,
    });
    return COURSE_CATALOG.map((course) =>
      staticCourseToStorefront(course, locale),
    );
  }
}

export async function getPublishedCourse(
  locale: Locale,
  slug: string,
): Promise<StorefrontCourse | null> {
  const courses = await listPublishedCourses(locale);
  return courses.find((course) => course.slug === slug) || null;
}

export async function listPublishedCategories(
  locale: Locale,
): Promise<StorefrontCategory[]> {
  const courses = await listPublishedCourses(locale);
  const seen = new Map<string, StorefrontCategory>();
  for (const course of courses) {
    if (course.category && !seen.has(course.category.slug)) {
      seen.set(course.category.slug, course.category);
    }
  }
  return [...seen.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function filterCatalogCourses(
  courses: StorefrontCourse[],
  filters: CatalogFilters = {},
) {
  const query = normalize(filters.query?.trim() || "");
  const category = filters.category?.trim() || "";
  const level = filters.level?.trim() || "";

  const filtered = courses.filter((course) => {
    if (category && course.category?.slug !== category) return false;
    if (level && course.level !== level) return false;
    if (!query) return true;
    const haystack = normalize(
      [
        course.title,
        course.shortDescription,
        course.description,
        course.category?.name || "",
        ...course.skills,
      ].join(" "),
    );
    return haystack.includes(query);
  });

  const sorted = [...filtered];
  switch (filters.sort) {
    case "title":
      sorted.sort((left, right) => left.title.localeCompare(right.title));
      break;
    case "price-asc":
      sorted.sort(
        (left, right) =>
          (left.priceMinor ?? Number.MAX_SAFE_INTEGER) -
          (right.priceMinor ?? Number.MAX_SAFE_INTEGER),
      );
      break;
    case "price-desc":
      sorted.sort(
        (left, right) =>
          (right.priceMinor ?? -1) - (left.priceMinor ?? -1),
      );
      break;
    default:
      break;
  }
  return sorted;
}

export async function getStorefrontPacks(
  locale: Locale,
): Promise<StorefrontPack[]> {
  const staticPacks = getCoursePacks(locale);
  const prisma = getPrisma();
  if (!prisma) {
    return staticPacks.map((pack) => ({
      ...pack,
      databaseId: null,
      priceMinor: null,
      priceCurrency: "XAF",
      chariowProductId: null,
    }));
  }

  try {
    const databasePacks = await prisma.academyCoursePack.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ position: "asc" }, { titleEn: "asc" }],
      include: {
        items: {
          orderBy: [{ position: "asc" }],
          include: { course: { select: { slug: true } } },
        },
      },
    });
    const bySlug = new Map(databasePacks.map((pack) => [pack.slug, pack]));

    return staticPacks.map((pack) => {
      const databasePack = bySlug.get(pack.id);
      if (!databasePack) {
        return {
          ...pack,
          databaseId: null,
          priceMinor: null,
          priceCurrency: "XAF",
          chariowProductId: null,
        };
      }
      return {
        ...pack,
        title: fromLocale(locale, databasePack.titleEn, databasePack.titleFr),
        shortTitle:
          fromLocale(
            locale,
            databasePack.shortTitleEn || databasePack.titleEn,
            databasePack.shortTitleFr,
          ) || undefined,
        category: fromLocale(
          locale,
          databasePack.categoryLabelEn,
          databasePack.categoryLabelFr,
        ),
        tagline: fromLocale(
          locale,
          databasePack.taglineEn,
          databasePack.taglineFr,
        ),
        summary: fromLocale(
          locale,
          databasePack.summaryEn,
          databasePack.summaryFr,
        ),
        longDescription: fromLocale(
          locale,
          databasePack.descriptionEn,
          databasePack.descriptionFr,
        ),
        bestFor:
          locale === "fr" && databasePack.bestForFr.length
            ? databasePack.bestForFr
            : databasePack.bestForEn,
        learningOutcomes:
          locale === "fr" && databasePack.learningOutcomesFr.length
            ? databasePack.learningOutcomesFr
            : databasePack.learningOutcomesEn,
        whyChoose:
          locale === "fr" && databasePack.whyChooseFr.length
            ? databasePack.whyChooseFr
            : databasePack.whyChooseEn,
        includedCourses: databasePack.items.map((item) => ({
          slug: item.course.slug,
          title:
            pack.includedCourses?.find(
              (course) => course.slug === item.course.slug,
            )?.title || item.course.slug,
          description: pack.includedCourses?.find(
            (course) => course.slug === item.course.slug,
          )?.description,
        })),
        courseCount: databasePack.items.length || pack.courseCount,
        level: (databasePack.level === "BEGINNER"
          ? "Beginner"
          : databasePack.level === "INTERMEDIATE"
            ? "Intermediate"
            : "Beginner to Intermediate") as CoursePack["level"],
        recommended: databasePack.recommended,
        badge:
          fromLocale(
            locale,
            databasePack.badgeEn || "",
            databasePack.badgeFr,
          ) || undefined,
        seoTitle: fromLocale(
          locale,
          databasePack.seoTitleEn || pack.seoTitle,
          databasePack.seoTitleFr,
        ),
        seoDescription: fromLocale(
          locale,
          databasePack.seoDescriptionEn || pack.seoDescription,
          databasePack.seoDescriptionFr,
        ),
        databaseId: databasePack.id,
        priceMinor: effectivePackPriceMinor(databasePack.priceMinor, databasePack.currency),
        priceCurrency: databasePack.currency,
        chariowProductId: databasePack.chariowProductId,
        checkoutUrl: pack.checkoutUrl,
      };
    });
  } catch (error) {
    console.error("[academy-catalog] published_packs_query_failed", {
      message: error instanceof Error ? error.message : error,
    });
    return staticPacks.map((pack) => ({
      ...pack,
      databaseId: null,
      priceMinor: null,
      priceCurrency: "XAF",
      chariowProductId: null,
    }));
  }
}

export async function getStorefrontPack(locale: Locale, slug: string) {
  const packs = await getStorefrontPacks(locale);
  return packs.find((pack) => pack.id === slug) || null;
}

export function getStorefrontPackLevelLabel(
  locale: Locale,
  pack: Pick<CoursePack, "level">,
) {
  return getCoursePackLevelLabel(locale, pack.level);
}

export async function getPublishedCourseSlugs() {
  try {
    const rows = await queryPublishedCourses();
    if (rows === null) return COURSE_CATALOG.map((course) => course.slug);
    return rows.map((course) => course.slug);
  } catch {
    return COURSE_CATALOG.map((course) => course.slug);
  }
}
