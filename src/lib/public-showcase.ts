import { getFounderContent, type FounderProject } from "@/content/founder";
import { getDictionary, type CardItem, type Locale } from "@/content/site";
import { getPrisma } from "@/lib/prisma";

type PublicFeedbackItem = {
  id: string;
  quote: string;
  name: string;
  role: string | null;
  company: string | null;
  rating: number | null;
  source: string;
};

type LocalizedFeedbackRow = {
  id: string;
  quote: string;
  quoteFr: string | null;
  name: string;
  nameFr: string | null;
  role: string | null;
  roleFr: string | null;
  company: string | null;
  rating: number | null;
  source: string;
};

function fromLocale(locale: Locale, en?: string | null, fr?: string | null) {
  if (locale === "fr") return fr || en || null;
  return en || fr || null;
}

function mapLocalizedFeedbackRow(locale: Locale, row: LocalizedFeedbackRow): PublicFeedbackItem {
  return {
    id: row.id,
    quote: fromLocale(locale, row.quote, row.quoteFr) || row.quote,
    name: fromLocale(locale, row.name, row.nameFr) || row.name,
    role: fromLocale(locale, row.role, row.roleFr),
    company: row.company,
    rating: row.rating,
    source: row.source
  };
}

function homepageFallback(locale: Locale): PublicFeedbackItem[] {
  return getDictionary(locale).testimonials.map((item, index) => ({
    id: `homepage-fallback-${index}`,
    quote: item.quote,
    name: item.name,
    role: item.role,
    company: null,
    rating: 5,
    source: "seed_homepage_fallback"
  }));
}

async function loadLocalizedFeedback(
  locale: Locale,
  visibility: "showOnHomepage" | "showOnFounder" | "showOnPortfolio",
  take: number
): Promise<PublicFeedbackItem[] | null> {
  const prisma = getPrisma();
  if (!prisma) return null;

  try {
    const rows =
      visibility === "showOnHomepage"
        ? await prisma.$queryRaw<LocalizedFeedbackRow[]>`
            SELECT
              cf."id",
              cf."quote",
              cf."quoteFr",
              cf."name",
              cf."nameFr",
              cf."role",
              cf."roleFr",
              cf."company",
              cf."rating",
              cf."source"
            FROM "CustomerFeedback" cf
            WHERE cf."status" = 'APPROVED' AND cf."showOnHomepage" = true
            ORDER BY cf."displayOrder" ASC, cf."createdAt" DESC
            LIMIT ${take}
          `
        : visibility === "showOnFounder"
          ? await prisma.$queryRaw<LocalizedFeedbackRow[]>`
              SELECT
                cf."id",
                cf."quote",
                cf."quoteFr",
                cf."name",
                cf."nameFr",
                cf."role",
                cf."roleFr",
                cf."company",
                cf."rating",
                cf."source"
              FROM "CustomerFeedback" cf
              WHERE cf."status" = 'APPROVED' AND cf."showOnFounder" = true
              ORDER BY cf."displayOrder" ASC, cf."createdAt" DESC
              LIMIT ${take}
            `
          : await prisma.$queryRaw<LocalizedFeedbackRow[]>`
              SELECT
                cf."id",
                cf."quote",
                cf."quoteFr",
                cf."name",
                cf."nameFr",
                cf."role",
                cf."roleFr",
                cf."company",
                cf."rating",
                cf."source"
              FROM "CustomerFeedback" cf
              WHERE cf."status" = 'APPROVED' AND cf."showOnPortfolio" = true
              ORDER BY cf."displayOrder" ASC, cf."createdAt" DESC
              LIMIT ${take}
            `;

    return rows.map((row) => mapLocalizedFeedbackRow(locale, row));
  } catch (error) {
    console.error("[public-showcase] localized feedback query failed", {
      visibility,
      message: error instanceof Error ? error.message : error
    });
    return null;
  }
}

export async function loadPortfolioCards(locale: Locale): Promise<CardItem[]> {
  return loadProjectCards(locale, "showInPortfolio");
}

export async function loadHomepageProjectCards(locale: Locale): Promise<CardItem[]> {
  return loadProjectCards(locale, "showOnHomepage");
}

async function loadProjectCards(
  locale: Locale,
  visibility: "showInPortfolio" | "showOnHomepage"
): Promise<CardItem[]> {
  const fallback = getDictionary(locale).caseStudies;
  const prisma = getPrisma();
  if (!prisma) return fallback;

  const projects = await prisma.clientProject.findMany({
    where: visibility === "showOnHomepage" ? { showOnHomepage: true } : { showInPortfolio: true },
    orderBy: [{ publicOrder: "asc" }, { updatedAt: "desc" }],
    take: 60,
    select: {
      id: true,
      slug: true,
      publicSlug: true,
      title: true,
      description: true,
      publicTitleEn: true,
      publicTitleFr: true,
      publicEyebrowEn: true,
      publicEyebrowFr: true,
      publicDescriptionEn: true,
      publicDescriptionFr: true
    }
  });

  if (!projects.length) return fallback;

  return projects.map((project) => {
    const slug = project.publicSlug || project.slug;
    const fallbackItem = fallback.find((item) => item.slug === slug) || fallback.find((item) => item.slug === project.slug);
    return {
      slug,
      title: fromLocale(locale, project.publicTitleEn, project.publicTitleFr) || fallbackItem?.title || project.title,
      description:
        fromLocale(locale, project.publicDescriptionEn, project.publicDescriptionFr) ||
        fallbackItem?.description ||
        project.description ||
        "",
      eyebrow: fromLocale(locale, project.publicEyebrowEn, project.publicEyebrowFr) || fallbackItem?.eyebrow
    } satisfies CardItem;
  });
}

export async function loadFounderProjects(locale: Locale): Promise<FounderProject[]> {
  const fallback = getFounderContent(locale).projects.items;
  const prisma = getPrisma();
  if (!prisma) return fallback;

  const projects = await prisma.clientProject.findMany({
    where: { showInFounder: true },
    orderBy: [{ publicOrder: "asc" }, { updatedAt: "desc" }],
    take: 60,
    select: {
      id: true,
      slug: true,
      publicSlug: true,
      title: true,
      description: true,
      publicTitleEn: true,
      publicTitleFr: true,
      publicDescriptionEn: true,
      publicDescriptionFr: true,
      publicProblemEn: true,
      publicProblemFr: true,
      publicSolutionEn: true,
      publicSolutionFr: true,
      publicRoleEn: true,
      publicRoleFr: true,
      publicBusinessValueEn: true,
      publicBusinessValueFr: true,
      publicEyebrowEn: true,
      publicEyebrowFr: true,
      publicTechStack: true
    }
  });

  if (!projects.length) return fallback;

  return projects.map((project) => {
    const slug = project.publicSlug || project.slug;
    const fallbackItem = fallback.find((item) => item.slug === slug) || fallback.find((item) => item.slug === project.slug);
    const title = fromLocale(locale, project.publicTitleEn, project.publicTitleFr) || fallbackItem?.name || project.title;

    return {
      slug,
      name: title,
      category: fromLocale(locale, project.publicEyebrowEn, project.publicEyebrowFr) || fallbackItem?.category || (locale === "fr" ? "Projet" : "Project"),
      description:
        fromLocale(locale, project.publicDescriptionEn, project.publicDescriptionFr) ||
        fallbackItem?.description ||
        project.description ||
        "",
      problem: fromLocale(locale, project.publicProblemEn, project.publicProblemFr) || fallbackItem?.problem || "",
      solution: fromLocale(locale, project.publicSolutionEn, project.publicSolutionFr) || fallbackItem?.solution || "",
      role: fromLocale(locale, project.publicRoleEn, project.publicRoleFr) || fallbackItem?.role || "",
      businessValue: fromLocale(locale, project.publicBusinessValueEn, project.publicBusinessValueFr) || fallbackItem?.businessValue || "",
      techStack: project.publicTechStack.length ? project.publicTechStack : fallbackItem?.techStack || [],
      caseStudyPath: `/portfolio/${slug}`
    } satisfies FounderProject;
  });
}

export async function loadHomepageFeedback(locale: Locale): Promise<PublicFeedbackItem[]> {
  const feedback = await loadLocalizedFeedback(locale, "showOnHomepage", 8);
  return feedback ?? homepageFallback(locale);
}

export async function loadFounderFeedback(locale: Locale): Promise<PublicFeedbackItem[]> {
  const feedback = await loadLocalizedFeedback(locale, "showOnFounder", 12);
  if (feedback) return feedback;

  const prisma = getPrisma();
  if (!prisma) return [];

  const legacy = await prisma.customerFeedback.findMany({
    where: {
      status: "APPROVED",
      showOnFounder: true
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    take: 12,
    select: {
      id: true,
      quote: true,
      name: true,
      role: true,
      company: true,
      rating: true,
      source: true
    }
  });

  return legacy;
}

export async function loadPortfolioFeedback(locale: Locale): Promise<PublicFeedbackItem[]> {
  const feedback = await loadLocalizedFeedback(locale, "showOnPortfolio", 8);
  if (feedback) return feedback;

  const prisma = getPrisma();
  if (!prisma) return [];

  const legacy = await prisma.customerFeedback.findMany({
    where: {
      status: "APPROVED",
      showOnPortfolio: true
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    take: 8,
    select: {
      id: true,
      quote: true,
      name: true,
      role: true,
      company: true,
      rating: true,
      source: true
    }
  });

  return legacy;
}
