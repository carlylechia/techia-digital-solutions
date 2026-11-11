import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { dictionaries } from "../src/content/site";
import { ensureDefaultAdminRoles } from "../src/lib/admin/bootstrap";
import { COURSE_CATALOG } from "../src/lib/courses/catalog";
import { COURSE_PACK_DEFINITIONS } from "../src/lib/courses/coursePacks";
import { hashPassword } from "../src/lib/password";

// ---------------------------------------------------------------------------
// Showcase projects — all projects currently shown on the founder page and
// portfolio are defined here so their visibility can be toggled from the admin
// panel without touching code.
// ---------------------------------------------------------------------------

const SYSTEM_CLIENT_SLUG = "techia-portfolio-internal";
const HOMEPAGE_TESTIMONIAL_SOURCE = "seed_homepage";

type SeededHomepageTestimonial = {
  id: string;
  displayOrder: number;
  name: string;
  nameFr: string;
  role: string;
  roleFr: string;
  quote: string;
  quoteFr: string;
};

type SeededHomepageFaq = {
  id: string;
  displayOrder: number;
  questionEn: string;
  questionFr: string;
  answerEn: string;
  answerFr: string;
};

type SeededHomepageMetric = {
  id: string;
  displayOrder: number;
  labelEn: string;
  labelFr: string;
  value: number;
  prefix: string;
  suffix: string;
};

type ShowcaseProject = {
  slug: string;
  titleEn: string;
  eyebrowEn: string;
  descriptionEn: string;
  problemEn: string;
  solutionEn: string;
  roleEn: string;
  businessValueEn: string;
  titleFr: string;
  eyebrowFr: string;
  descriptionFr: string;
  problemFr: string;
  solutionFr: string;
  roleFr: string;
  businessValueFr: string;
  techStack: string[];
  order: number;
};

const showcaseProjects: ShowcaseProject[] = [
  {
    slug: "teloh-global-business",
    order: 0,
    titleEn: "Teloh Global Business",
    eyebrowEn: "Client project",
    descriptionEn:
      "A multilingual company website and operations presence for logistics, household products, careers, lead capture, and scalable digital workflows.",
    problemEn:
      "A multi-service business needs clarity, trust, and room to grow without looking fragmented online.",
    solutionEn:
      "A premium company presence with structured messaging, scalable content architecture, and future-ready operational pathways.",
    roleEn:
      "Website architecture, UI implementation, localization structure, and business presentation strategy.",
    businessValueEn:
      "Improves digital credibility while laying the groundwork for more advanced internal systems later.",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "SEO metadata"],
    titleFr: "Teloh Global Business",
    eyebrowFr: "Projet client",
    descriptionFr:
      "Un site d'entreprise multilingue et une présence opérationnelle pour la logistique, les produits domestiques, les carrières, la capture de prospects et des processus digitaux évolutifs.",
    problemFr:
      "Une entreprise multi-service a besoin de clarté, de crédibilité et d'espace pour grandir sans paraître fragmentée en ligne.",
    solutionFr:
      "Une présence premium avec message structuré, architecture de contenu évolutive et voies opérationnelles prêtes pour l'avenir.",
    roleFr:
      "Architecture web, implémentation UI, structure de localisation et stratégie de présentation business.",
    businessValueFr:
      "Améliore la crédibilité digitale tout en préparant le terrain pour des systèmes plus avancés."
  },
  {
    slug: "teloh-global-travels",
    order: 1,
    titleEn: "Teloh Global Travels",
    eyebrowEn: "Client project",
    descriptionEn:
      "A travel consultancy website and inquiry system for study, visit, work-abroad services, education guidance, and conversion-focused follow-up.",
    problemEn:
      "Travel consultancies need trust-first information architecture and cleaner inquiry capture to convert interest into qualified conversations.",
    solutionEn:
      "A polished platform concept that makes services easier to understand while preparing for deeper operational workflows.",
    roleEn: "Digital strategy, UX structure, frontend delivery, and growth-focused content layout.",
    businessValueEn:
      "Shows how travel and consultancy brands can look more serious and capture better leads online.",
    techStack: ["Next.js", "Localized routing", "Structured content", "Lead capture"],
    titleFr: "Teloh Global Travels",
    eyebrowFr: "Projet client",
    descriptionFr:
      "Un site et un système de demandes pour le conseil voyage, les études, les séjours, le travail à l'étranger et le suivi commercial.",
    problemFr:
      "Les cabinets de voyage ont besoin d'une architecture d'information rassurante et d'une meilleure capture des demandes.",
    solutionFr:
      "Une plateforme premium qui clarifie les services tout en préparant des workflows plus profonds.",
    roleFr: "Stratégie digitale, structure UX, delivery frontend et mise en page orientée croissance.",
    businessValueFr:
      "Montre comment les marques voyage et conseil peuvent mieux convertir leur crédibilité en leads qualifiés."
  },
  {
    slug: "job-seeker-os",
    order: 2,
    titleEn: "Job Seeker OS",
    eyebrowEn: "Product platform",
    descriptionEn:
      "A career operating system with modern Next.js architecture, authentication, dashboards, and organized job-search workflows.",
    problemEn:
      "Job seekers often manage applications, CV updates, and follow-ups across scattered notes, files, and email threads.",
    solutionEn:
      "A structured platform with organized workflows, better visibility, and a more intentional user journey.",
    roleEn: "Product strategy, UX direction, full-stack implementation, and system architecture.",
    businessValueEn:
      "Demonstrates how teChia can turn messy personal or business workflows into a guided digital operating system.",
    techStack: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Auth"],
    titleFr: "Job Seeker OS",
    eyebrowFr: "Plateforme produit",
    descriptionFr:
      "Un système de gestion de carrière avec architecture Next.js moderne, authentification, tableaux de bord et processus organisés de recherche d'emploi.",
    problemFr:
      "Les chercheurs d'emploi gèrent souvent candidatures, CV et suivis dans des notes, fichiers et emails dispersés.",
    solutionFr:
      "Une plateforme structurée avec des workflows organisés, plus de visibilité et un parcours utilisateur plus intentionnel.",
    roleFr: "Stratégie produit, direction UX, implémentation full-stack et architecture système.",
    businessValueFr:
      "Montre comment teChia peut transformer un workflow désordonné en système numérique guidé."
  },
  {
    slug: "mentora",
    order: 3,
    titleEn: "Mentor@",
    eyebrowEn: "AI platform",
    descriptionEn:
      "An AI-powered career orientation and coaching platform for students, graduates, and professionals changing direction.",
    problemEn:
      "Students and early-career professionals often lack structured, practical guidance they can access consistently.",
    solutionEn:
      "A prototype concept that blends mentoring logic, coaching journeys, and AI-assisted guidance into one experience.",
    roleEn:
      "Concept design, product architecture, AI workflow direction, and interface strategy.",
    businessValueEn:
      "Illustrates teChia's ability to frame AI around practical user outcomes instead of novelty alone.",
    techStack: ["Next.js", "AI workflow patterns", "Prompt-assisted UX", "Dashboard concepts"],
    titleFr: "Mentor@",
    eyebrowFr: "Plateforme IA",
    descriptionFr:
      "Une plateforme IA d'orientation de carrière et de coaching pour étudiants, diplômés et professionnels en reconversion.",
    problemFr:
      "Beaucoup d'étudiants et de jeunes professionnels manquent d'un accompagnement structuré et accessible en continu.",
    solutionFr:
      "Un prototype qui combine logique de mentorat, parcours de coaching et guidance assistée par l'IA.",
    roleFr:
      "Conception de concept, architecture produit, direction des workflows IA et stratégie d'interface.",
    businessValueFr:
      "Illustre la capacité de teChia à cadrer l'IA autour d'un résultat pratique et non autour de la nouveauté seule."
  },
  {
    slug: "mickey-car-sales",
    order: 4,
    titleEn: "Mickey Car Sales",
    eyebrowEn: "Automotive commerce",
    descriptionEn:
      "A premium automotive commerce presence with inventory, inquiry, and immersive vehicle showcase experience.",
    problemEn:
      "Automotive businesses often rely on informal listings and inconsistent presentation that weaken buyer trust.",
    solutionEn:
      "A higher-end concept with stronger product presentation, inquiry flow, and service positioning.",
    roleEn:
      "Visual direction, information architecture, and conversion-focused interface planning.",
    businessValueEn:
      "Demonstrates how teChia can elevate inventory-driven businesses into more premium digital brands.",
    techStack: ["Responsive UI", "Inventory-style layouts", "Lead capture", "Brand presentation"],
    titleFr: "Mickey Car Sales",
    eyebrowFr: "Commerce automobile",
    descriptionFr:
      "Une présence automobile premium avec catalogue, demandes clients et expérience visuelle immersive.",
    problemFr:
      "Les entreprises automobiles s'appuient souvent sur des listings informels et une présentation incohérente qui affaiblissent la confiance.",
    solutionFr:
      "Un concept plus haut de gamme avec une meilleure présentation produit, un meilleur flux de demande et un positionnement plus clair.",
    roleFr: "Direction visuelle, architecture de l'information et planification d'interface orientée conversion.",
    businessValueFr:
      "Démontre comment teChia peut élever des entreprises pilotées par catalogue vers une image plus premium."
  },
  {
    slug: "techia-digital-solutions",
    order: 5,
    titleEn: "teChia Digital Solutions",
    eyebrowEn: "Internal product",
    descriptionEn:
      "The official digital home for teChia, designed to demonstrate premium websites, digital systems, automation, AI tools, and trust-first business positioning.",
    problemEn:
      "A technology studio must prove its standards through its own product, not only through sales language.",
    solutionEn:
      "A bilingual, SEO-ready platform that acts as brand presence, lead engine, portfolio layer, and systems showcase.",
    roleEn:
      "Brand translation into product, full-stack implementation, content architecture, and conversion strategy.",
    businessValueEn:
      "Functions as both marketing site and live demonstration of teChia's quality bar.",
    techStack: ["Next.js App Router", "TypeScript", "Tailwind CSS", "Structured data", "Analytics"],
    titleFr: "teChia Digital Solutions",
    eyebrowFr: "Produit interne",
    descriptionFr:
      "La vitrine officielle de teChia, conçue pour démontrer des sites premium, des systèmes numériques, des automatisations, des outils IA et une présence business crédible.",
    problemFr:
      "Un studio technologique doit prouver son niveau à travers son propre produit, pas seulement à travers son discours commercial.",
    solutionFr:
      "Une plateforme bilingue et SEO-ready qui sert à la fois de présence de marque, moteur de leads, portfolio et vitrine système.",
    roleFr:
      "Traduction de la marque en produit, implémentation full-stack, architecture de contenu et stratégie de conversion.",
    businessValueFr:
      "Fonctionne à la fois comme site marketing et comme démonstration vivante du niveau de qualité de teChia."
  },
  {
    slug: "custom-business-os",
    order: 6,
    titleEn: "Custom Business OS",
    eyebrowEn: "Business system",
    descriptionEn:
      "A reusable delivery model for dashboards, CRMs, quotes, client portals, admin workflows, and business automation modules.",
    problemEn:
      "Many growing businesses operate with disconnected tools that create blind spots, duplication, and slow response times.",
    solutionEn:
      "A modular system model that connects front-facing visibility with back-office operations in one delivery pattern.",
    roleEn: "System modeling, workflow design, technical architecture, and delivery strategy.",
    businessValueEn:
      "Makes it easier to scope repeatable digital transformation offers for service businesses and SMEs.",
    techStack: ["Admin workflows", "Dashboards", "Automation logic", "Analytics", "Portal thinking"],
    titleFr: "Custom Business OS",
    eyebrowFr: "Système métier",
    descriptionFr:
      "Un modèle de livraison réutilisable pour tableaux de bord, CRM, devis, portails clients, workflows administratifs et automatisation métier.",
    problemFr:
      "Beaucoup d'entreprises en croissance fonctionnent avec des outils déconnectés qui créent lenteur, duplication et angles morts.",
    solutionFr:
      "Un modèle modulaire qui relie visibilité externe et opérations internes dans une même logique de livraison.",
    roleFr: "Modélisation système, design de workflow, architecture technique et stratégie de livraison.",
    businessValueFr:
      "Facilite la création d'offres de transformation digitale répétables pour PME et entreprises de services."
  }
];

const homepageTestimonials: SeededHomepageTestimonial[] = dictionaries.en.testimonials.map((item, index) => {
  const french = dictionaries.fr.testimonials[index];

  return {
    id: `seed-homepage-testimonial-0${index + 1}`,
    displayOrder: index,
    name: item.name,
    nameFr: french?.name || item.name,
    role: item.role,
    roleFr: french?.role || item.role,
    quote: item.quote,
    quoteFr: french?.quote || item.quote
  };
});

const homepageFaqs: SeededHomepageFaq[] = dictionaries.en.faqs.map((item, index) => {
  const french = dictionaries.fr.faqs[index];

  return {
    id: `seed-homepage-faq-0${index + 1}`,
    displayOrder: index,
    questionEn: item.question,
    questionFr: french?.question || item.question,
    answerEn: item.answer,
    answerFr: french?.answer || item.answer,
  };
});

const homepageMetrics: SeededHomepageMetric[] = [
  {
    id: "seed-homepage-metric-01",
    displayOrder: 0,
    labelEn: "Projects and systems delivered",
    labelFr: "Projets et systèmes livrés",
    value: 40,
    prefix: "",
    suffix: "+",
  },
  {
    id: "seed-homepage-metric-02",
    displayOrder: 1,
    labelEn: "Industries served",
    labelFr: "Secteurs accompagnés",
    value: 12,
    prefix: "",
    suffix: "+",
  },
  {
    id: "seed-homepage-metric-03",
    displayOrder: 2,
    labelEn: "Core growth services",
    labelFr: "Services de croissance",
    value: 10,
    prefix: "",
    suffix: "",
  },
  {
    id: "seed-homepage-metric-04",
    displayOrder: 3,
    labelEn: "Average first response",
    labelFr: "Délai de première réponse",
    value: 24,
    prefix: "",
    suffix: "h",
  },
];

async function seedShowcaseProjects(prisma: PrismaClient) {
  // Upsert the internal system client that owns all showcase/portfolio projects.
  const systemClient = await prisma.client.upsert({
    where: { slug: SYSTEM_CLIENT_SLUG },
    update: {
      name: "teChia Portfolio (Internal)",
      status: "ACTIVE",
      industry: "Technology",
      notes: "System client — holds all public portfolio and founder showcase projects."
    },
    create: {
      name: "teChia Portfolio (Internal)",
      slug: SYSTEM_CLIENT_SLUG,
      status: "ACTIVE",
      priority: "HIGH",
      industry: "Technology",
      notes: "System client — holds all public portfolio and founder showcase projects."
    }
  });

  for (const project of showcaseProjects) {
    await prisma.clientProject.upsert({
      where: { clientId_slug: { clientId: systemClient.id, slug: project.slug } },
      update: {
        title: project.titleEn,
        status: "DELIVERED",
        priority: "MEDIUM",
        description: project.descriptionEn,
        showInPortfolio: true,
        showOnHomepage: true,
        showInFounder: true,
        publicOrder: project.order,
        publicSlug: project.slug,
        publicTitleEn: project.titleEn,
        publicTitleFr: project.titleFr,
        publicEyebrowEn: project.eyebrowEn,
        publicEyebrowFr: project.eyebrowFr,
        publicDescriptionEn: project.descriptionEn,
        publicDescriptionFr: project.descriptionFr,
        publicProblemEn: project.problemEn,
        publicProblemFr: project.problemFr,
        publicSolutionEn: project.solutionEn,
        publicSolutionFr: project.solutionFr,
        publicRoleEn: project.roleEn,
        publicRoleFr: project.roleFr,
        publicBusinessValueEn: project.businessValueEn,
        publicBusinessValueFr: project.businessValueFr,
        publicTechStack: project.techStack
      },
      create: {
        clientId: systemClient.id,
        title: project.titleEn,
        slug: project.slug,
        status: "DELIVERED",
        priority: "MEDIUM",
        description: project.descriptionEn,
        showInPortfolio: true,
        showOnHomepage: true,
        showInFounder: true,
        publicOrder: project.order,
        publicSlug: project.slug,
        publicTitleEn: project.titleEn,
        publicTitleFr: project.titleFr,
        publicEyebrowEn: project.eyebrowEn,
        publicEyebrowFr: project.eyebrowFr,
        publicDescriptionEn: project.descriptionEn,
        publicDescriptionFr: project.descriptionFr,
        publicProblemEn: project.problemEn,
        publicProblemFr: project.problemFr,
        publicSolutionEn: project.solutionEn,
        publicSolutionFr: project.solutionFr,
        publicRoleEn: project.roleEn,
        publicRoleFr: project.roleFr,
        publicBusinessValueEn: project.businessValueEn,
        publicBusinessValueFr: project.businessValueFr,
        publicTechStack: project.techStack
      }
    });
  }

  console.log(`Seeded ${showcaseProjects.length} showcase projects under client "${systemClient.name}"`);
}

async function seedHomepageTestimonials(prisma: PrismaClient) {
  for (const testimonial of homepageTestimonials) {
    await prisma.$executeRaw`
      INSERT INTO "CustomerFeedback" (
        "id",
        "name",
        "nameFr",
        "role",
        "roleFr",
        "rating",
        "quote",
        "quoteFr",
        "source",
        "status",
        "showOnHomepage",
        "showOnFounder",
        "showOnPortfolio",
        "displayOrder",
        "consent",
        "internalNotes",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${testimonial.id},
        ${testimonial.name},
        ${testimonial.nameFr},
        ${testimonial.role},
        ${testimonial.roleFr},
        5,
        ${testimonial.quote},
        ${testimonial.quoteFr},
        ${HOMEPAGE_TESTIMONIAL_SOURCE},
        'APPROVED',
        true,
        false,
        false,
        ${testimonial.displayOrder},
        true,
        'System-seeded homepage testimonial.',
        NOW(),
        NOW()
      )
      ON CONFLICT ("id") DO UPDATE
      SET
        "name" = EXCLUDED."name",
        "nameFr" = EXCLUDED."nameFr",
        "role" = EXCLUDED."role",
        "roleFr" = EXCLUDED."roleFr",
        "rating" = EXCLUDED."rating",
        "quote" = EXCLUDED."quote",
        "quoteFr" = EXCLUDED."quoteFr",
        "source" = EXCLUDED."source",
        "status" = EXCLUDED."status",
        "showOnHomepage" = EXCLUDED."showOnHomepage",
        "showOnFounder" = EXCLUDED."showOnFounder",
        "showOnPortfolio" = EXCLUDED."showOnPortfolio",
        "displayOrder" = EXCLUDED."displayOrder",
        "consent" = EXCLUDED."consent",
        "internalNotes" = EXCLUDED."internalNotes",
        "updatedAt" = NOW()
    `;
  }

  console.log(`Seeded ${homepageTestimonials.length} homepage testimonials`);
}

async function seedHomepageFaqs(prisma: PrismaClient) {
  for (const faq of homepageFaqs) {
    await prisma.homepageFaq.upsert({
      where: { id: faq.id },
      update: {
        questionEn: faq.questionEn,
        questionFr: faq.questionFr,
        answerEn: faq.answerEn,
        answerFr: faq.answerFr,
        showOnHomepage: true,
        displayOrder: faq.displayOrder,
      },
      create: {
        id: faq.id,
        questionEn: faq.questionEn,
        questionFr: faq.questionFr,
        answerEn: faq.answerEn,
        answerFr: faq.answerFr,
        showOnHomepage: true,
        displayOrder: faq.displayOrder,
      },
    });
  }

  console.log(`Seeded ${homepageFaqs.length} homepage FAQs`);
}

async function seedHomepageMetrics(prisma: PrismaClient) {
  for (const metric of homepageMetrics) {
    await prisma.homepageMetric.upsert({
      where: { id: metric.id },
      update: {
        labelEn: metric.labelEn,
        labelFr: metric.labelFr,
        value: metric.value,
        prefix: metric.prefix,
        suffix: metric.suffix,
        displayOrder: metric.displayOrder,
        visible: true,
      },
      create: {
        id: metric.id,
        labelEn: metric.labelEn,
        labelFr: metric.labelFr,
        value: metric.value,
        prefix: metric.prefix,
        suffix: metric.suffix,
        displayOrder: metric.displayOrder,
        visible: true,
      },
    });
  }

  console.log(`Seeded ${homepageMetrics.length} homepage metrics`);
}

// ---------------------------------------------------------------------------
// Academy catalog
// ---------------------------------------------------------------------------

const ACADEMY_CATEGORIES = [
  {
    slug: "digital-marketing-online-business",
    nameEn: "Digital Marketing & Online Business",
    nameFr: "Marketing digital et business en ligne",
    descriptionEn:
      "Practical marketing, online selling, audience growth, and digital business skills.",
    descriptionFr:
      "Compétences pratiques en marketing, vente en ligne, croissance d’audience et business digital.",
    position: 0,
  },
  {
    slug: "creative-content-skills",
    nameEn: "Creative & Content Skills",
    nameFr: "Compétences créatives et création de contenu",
    descriptionEn:
      "Design, video, content production, and visual communication skills.",
    descriptionFr:
      "Design, vidéo, production de contenu et communication visuelle.",
    position: 1,
  },
  {
    slug: "tech-future-skills",
    nameEn: "Tech & Future Skills",
    nameFr: "Technologies et compétences d’avenir",
    descriptionEn:
      "AI, programming, and website-building foundations for the modern digital economy.",
    descriptionFr:
      "Bases de l’IA, de la programmation et de la création de sites pour l’économie digitale moderne.",
    position: 2,
  },
  {
    slug: "professional-office-business-skills",
    nameEn: "Professional Office & Business Skills",
    nameFr: "Bureautique professionnelle et compétences business",
    descriptionEn:
      "Office productivity, management, people, project, and professional development skills.",
    descriptionFr:
      "Productivité bureautique, management, ressources humaines, gestion de projet et développement professionnel.",
    position: 3,
  },
  {
    slug: "finance-market-education",
    nameEn: "Finance & Market Education",
    nameFr: "Finance et éducation de marché",
    descriptionEn:
      "Educational trading and cryptocurrency foundations with a strong risk-awareness focus.",
    descriptionFr:
      "Bases éducatives du trading et de la cryptomonnaie, avec un accent fort sur la conscience du risque.",
    position: 4,
  },
] as const;

const COURSE_CATEGORY_SLUGS: Record<string, string> = {
  "Digital Marketing & Online Business": "digital-marketing-online-business",
  "Creative & Content Skills": "creative-content-skills",
  "Tech & Future Skills": "tech-future-skills",
  "Professional Office & Business Skills":
    "professional-office-business-skills",
  "Finance & Market Education": "finance-market-education",
};

function academyLevel(value: string) {
  if (value === "Beginner") return "BEGINNER" as const;
  if (value === "Intermediate") return "INTERMEDIATE" as const;
  return "BEGINNER_TO_INTERMEDIATE" as const;
}

function chariowProductIdFromEnv(envKey: string) {
  const value = process.env[envKey]?.trim();
  if (!value) return null;
  try {
    const segments = new URL(value).pathname.split("/").filter(Boolean);
    const candidate = segments[segments.length - 1] || "";
    return /^prd_[a-zA-Z0-9]+$/.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

async function seedAcademyCatalog(prisma: PrismaClient) {
  for (const category of ACADEMY_CATEGORIES) {
    await prisma.academyCourseCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  for (const [position, course] of COURSE_CATALOG.entries()) {
    const categorySlug = COURSE_CATEGORY_SLUGS[course.category];
    await prisma.academyCourse.upsert({
      where: { slug: course.slug },
      update: {},
      create: {
        slug: course.slug,
        category: categorySlug
          ? { connect: { slug: categorySlug } }
          : undefined,
        titleEn: course.title,
        shortDescriptionEn: course.shortDescription,
        descriptionEn: course.description,
        level: academyLevel(course.level),
        status: "PUBLISHED",
        includedInFullPack: course.includedInFullPack,
        financialDisclaimerRequired:
          course.financialDisclaimerRequired ?? false,
        skillsEn: course.skillsLearned,
        position,
        publishedAt: new Date(),
        lessons: {
          create: course.lessons.map((lesson, lessonPosition) => ({
            slug: lesson.slug,
            titleEn: lesson.title,
            descriptionEn: lesson.description,
            durationLabel: lesson.durationLabel,
            isPreview: lesson.isPreview ?? false,
            position: lessonPosition,
          })),
        },
      },
    });
  }

  for (const [position, definition] of COURSE_PACK_DEFINITIONS.entries()) {
    const en = definition.copy.en;
    const fr = definition.copy.fr;
    const pack = await prisma.academyCoursePack.upsert({
      where: { slug: definition.id },
      update: {},
      create: {
        slug: definition.id,
        titleEn: en.title,
        titleFr: fr.title,
        shortTitleEn: en.shortTitle,
        shortTitleFr: fr.shortTitle,
        categoryLabelEn: en.category,
        categoryLabelFr: fr.category,
        taglineEn: en.tagline,
        taglineFr: fr.tagline,
        summaryEn: en.summary,
        summaryFr: fr.summary,
        descriptionEn: en.longDescription,
        descriptionFr: fr.longDescription,
        bestForEn: en.bestFor,
        bestForFr: fr.bestFor,
        learningOutcomesEn: en.learningOutcomes,
        learningOutcomesFr: fr.learningOutcomes,
        whyChooseEn: en.whyChoose,
        whyChooseFr: fr.whyChoose,
        level: academyLevel(definition.level),
        recommended: definition.recommended ?? false,
        badgeEn: definition.badge,
        badgeFr:
          definition.id === "complete-digital-skills-pack"
            ? "Meilleure valeur"
            : definition.badge,
        status: "PUBLISHED",
        chariowProductId: chariowProductIdFromEnv(
          definition.checkoutEnvKey,
        ),
        position,
        publishedAt: new Date(),
      },
    });

    const courseRows = await prisma.academyCourse.findMany({
      where: { slug: { in: definition.courseSlugs } },
      select: { id: true, slug: true },
    });
    const courseBySlug = new Map(
      courseRows.map((course) => [course.slug, course.id]),
    );
    for (const [itemPosition, slug] of definition.courseSlugs.entries()) {
      const courseId = courseBySlug.get(slug);
      if (!courseId) continue;
      await prisma.academyCoursePackItem.upsert({
        where: { packId_courseId: { packId: pack.id, courseId } },
        update: { position: itemPosition },
        create: { packId: pack.id, courseId, position: itemPosition },
      });
    }
  }

  console.log(
    `Seeded ${COURSE_CATALOG.length} academy courses and ${COURSE_PACK_DEFINITIONS.length} packs`,
  );
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await ensureDefaultAdminRoles(prisma);

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD_SEED;
  if (adminEmail && adminPassword) {
    const superRole = await prisma.adminRole.findUniqueOrThrow({ where: { name: "super_admin" } });
    await prisma.adminUser.upsert({
      where: { email: adminEmail },
      update: {
        role: "super_admin",
        roleId: superRole.id,
        status: "ACTIVE",
        passwordHash: await hashPassword(adminPassword)
      },
      create: {
        email: adminEmail,
        name: "teChia Super Admin",
        passwordHash: await hashPassword(adminPassword),
        role: "super_admin",
        roleId: superRole.id,
        status: "ACTIVE"
      }
    });
  }

  const boardCount = await prisma.processBoard.count();
  if (boardCount === 0) {
    // Delivery board (boardType: "delivery")
    await prisma.processBoard.create({
      data: {
        name: "teChia Delivery OS",
        description: "Tracks active projects from intake to completion.",
        boardType: "delivery",
        columns: {
          create: [
            { key: "intake", title: "Intake", color: "#06b6d4", position: 0 },
            { key: "scope", title: "Scoping", color: "#8b5cf6", position: 1 },
            { key: "build", title: "Build", color: "#10b981", position: 2 },
            { key: "review", title: "Review", color: "#f59e0b", position: 3 },
            { key: "done", title: "Done", color: "#22c55e", position: 4 }
          ]
        }
      }
    });

    // Inquiry pipeline board (boardType: "inquiry_pipeline")
    await prisma.processBoard.create({
      data: {
        name: "Project Inquiry Pipeline",
        description: "Sanitizes incoming project inquiries into clear requirements before converting to projects.",
        boardType: "inquiry_pipeline",
        columns: {
          create: [
            { key: "new_inquiry", title: "New", color: "#06b6d4", position: 0 },
            { key: "under_review", title: "Under Review", color: "#8b5cf6", position: 1 },
            { key: "clarifying", title: "Clarifying", color: "#f59e0b", position: 2 },
            { key: "requirements_ready", title: "Requirements Ready", color: "#10b981", position: 3 },
            { key: "approved", title: "Approved — Ready to Build", color: "#22c55e", position: 4 }
          ]
        }
      }
    });
  }

  for (const service of dictionaries.en.services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: { title: service.title, description: service.description, content: service },
      create: { slug: service.slug, title: service.title, description: service.description, content: service }
    });
  }

  for (const post of dictionaries.en.blog) {
    await prisma.blogPost.upsert({
      where: { locale_slug: { locale: "en", slug: post.slug } },
      update: {},
      create: { slug: post.slug, title: post.title, excerpt: post.description, content: post.description, contentText: post.description, locale: "en", status: "DRAFT", published: false, version: 1, readingTime: 1 }
    });
  }

  for (const study of dictionaries.en.caseStudies) {
    await prisma.caseStudy.upsert({
      where: { slug: study.slug },
      update: { title: study.title, description: study.description, type: study.eyebrow || "Case study", content: study },
      create: { slug: study.slug, title: study.title, description: study.description, type: study.eyebrow || "Case study", content: study }
    });
  }

  await seedShowcaseProjects(prisma);
  await seedHomepageTestimonials(prisma);
  await seedHomepageFaqs(prisma);
  await seedHomepageMetrics(prisma);
  await seedAcademyCatalog(prisma);

  console.log("Seed complete");
}

main().finally(async () => prisma.$disconnect());
