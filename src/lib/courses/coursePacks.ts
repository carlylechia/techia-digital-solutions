import type { Locale } from "@/content/site";
import { getPublicAppPath } from "@/lib/site-routes";
import { COURSE_CATALOG, COURSE_CATALOG_BY_SLUG } from "./catalog";
import {
  CHARIOW_CHECKOUT_ENV_KEYS,
  type CheckoutEnvKey,
  getChariowCheckoutUrl,
} from "./chariowLinks";

export type CoursePackLevel =
  | "Beginner"
  | "Beginner to Intermediate"
  | "Intermediate";

export type CoursePackCourse = {
  title: string;
  description?: string;
};

export type CourseFaqItem = {
  question: string;
  answer: string;
};

export type CoursePack = {
  id: string;
  slug: string;
  title: string;
  shortTitle?: string;
  category: string;
  tagline: string;
  summary: string;
  longDescription: string;
  bestFor: string[];
  learningOutcomes: string[];
  includedCourses?: CoursePackCourse[];
  courseCount?: number;
  level: CoursePackLevel;
  recommended?: boolean;
  badge?: string;
  checkoutEnvKey: string;
  checkoutUrl: string;
  seoTitle: string;
  seoDescription: string;
  locale: Locale;
  path: string;
  whyChoose: string[];
};

type CoursePackLocaleContent = Omit<
  CoursePack,
  | "id"
  | "checkoutEnvKey"
  | "checkoutUrl"
  | "courseCount"
  | "includedCourses"
  | "level"
  | "recommended"
  | "badge"
  | "locale"
  | "path"
  | "whyChoose"
> & {
  whyChoose: string[];
};

type CoursePackDefinition = {
  id: string;
  level: CoursePackLevel;
  recommended?: boolean;
  badge?: string;
  checkoutEnvKey: CheckoutEnvKey;
  courseSlugs: string[];
  copy: Record<Locale, CoursePackLocaleContent>;
};

const COURSE_PACK_DEFINITIONS: CoursePackDefinition[] = [
  {
    id: "complete-digital-skills-pack",
    level: "Beginner to Intermediate",
    recommended: true,
    badge: "Best Value",
    checkoutEnvKey: CHARIOW_CHECKOUT_ENV_KEYS.fullPack,
    courseSlugs: COURSE_CATALOG.map((course) => course.slug),
    copy: {
      en: {
        slug: "complete-digital-skills-pack",
        title: "Full teChia Digital Skills Pack",
        shortTitle: "Full Pack",
        category: "Complete learning library",
        tagline:
          "The complete 16-course learning library for practical digital growth.",
        summary:
          "Get the full collection of teChia’s curated digital skills courses in one complete pack. This is the best option if you want a broad learning path covering online business, marketing, content creation, AI, technology, office productivity, business skills, finance, and market education.",
        longDescription:
          "The Full teChia Digital Skills Pack brings together the complete academy library in one place. It is designed for learners who want broader, more flexible skill-building instead of limiting themselves to one narrow track. If you want the strongest long-term value and the most complete teChia Digital Academy offer, this is the pack to choose.",
        bestFor: [
          "Students who want practical modern skills",
          "Job seekers who want to improve their digital profile",
          "Freelancers who want more service options",
          "Business owners who want to understand digital growth",
          "Creators who want to improve online visibility",
          "Professionals who want stronger workplace productivity",
        ],
        learningOutcomes: [
          "Understand practical digital tools and online business opportunities",
          "Improve your ability to market, create, sell, and work online",
          "Build stronger professional and business productivity skills",
          "Explore AI, tech, creative, finance, and market-related skills",
          "Learn at your own pace with a broad digital skills library",
        ],
        whyChoose: [
          "It gives you access to all 16 available courses instead of limiting you to one narrower category.",
          "It is the best value if you expect to grow across business, creative, technical, and professional skill areas.",
          "It gives you a more flexible learning library, so you can move between topics as your goals evolve.",
        ],
        seoTitle: "Full teChia Digital Skills Pack | teChia Digital Academy",
        seoDescription:
          "Get the full 16-course teChia Digital Academy library covering digital marketing, AI, design, office skills, business, finance, and online growth.",
      },
      fr: {
        slug: "pack-complet-competences-digitales",
        title: "Pack complet teChia Digital Skills",
        shortTitle: "Pack complet",
        category: "Bibliothèque complète",
        tagline:
          "La bibliothèque complète de 16 cours pour développer des compétences digitales utiles.",
        summary:
          "Accédez à toute la collection de cours sélectionnés par teChia dans un seul pack complet. C’est le meilleur choix si vous voulez un parcours large couvrant business en ligne, marketing, création de contenu, IA, technologie, bureautique, compétences business, finance et éducation de marché.",
        longDescription:
          "Le Pack complet teChia Digital Skills réunit toute la bibliothèque de l’académie dans une seule offre. Il est conçu pour les apprenants qui veulent une montée en compétence plus large et plus souple au lieu de se limiter à une seule thématique. Si vous cherchez la meilleure valeur sur le long terme et l’offre la plus complète de teChia Digital Academy, c’est le pack recommandé.",
        bestFor: [
          "Étudiants qui veulent des compétences modernes et pratiques",
          "Chercheurs d’emploi qui veulent renforcer leur profil digital",
          "Freelances qui veulent élargir leurs services",
          "Entrepreneurs qui veulent mieux comprendre la croissance digitale",
          "Créateurs qui veulent améliorer leur visibilité en ligne",
          "Professionnels qui veulent une meilleure productivité au travail",
        ],
        learningOutcomes: [
          "Comprendre les outils digitaux utiles et les opportunités du business en ligne",
          "Mieux vendre, créer, promouvoir et travailler en ligne",
          "Renforcer vos compétences professionnelles et votre productivité business",
          "Explorer l’IA, la tech, la création, la finance et les marchés",
          "Apprendre à votre rythme avec une bibliothèque complète",
        ],
        whyChoose: [
          "Vous accédez aux 16 cours disponibles au lieu de rester limité à une seule catégorie.",
          "C’est la meilleure valeur si vous voulez progresser en business, création, tech et compétences professionnelles.",
          "Vous gardez une bibliothèque plus flexible pour évoluer selon vos objectifs.",
        ],
        seoTitle: "Pack complet teChia Digital Skills | teChia Digital Academy",
        seoDescription:
          "Accédez à la bibliothèque complète de 16 cours teChia Digital Academy sur le marketing digital, l’IA, le design, la bureautique, le business, la finance et la croissance en ligne.",
      },
    },
  },
  {
    id: "digital-marketing-online-business",
    level: "Beginner to Intermediate",
    badge: "Growth Pack",
    checkoutEnvKey: CHARIOW_CHECKOUT_ENV_KEYS.digitalMarketingOnlineBusiness,
    courseSlugs: [
      "digital-marketing-community-management",
      "ecommerce-dropshipping",
      "youtube-creation-monetization",
    ],
    copy: {
      en: {
        slug: "digital-marketing-online-business",
        title: "Digital Marketing & Online Business",
        shortTitle: "Marketing & Business",
        category: "Growth and visibility",
        tagline:
          "Practical skills for online visibility, customer acquisition, and selling online.",
        summary:
          "This pack is built for entrepreneurs, freelancers, creators, and business owners who want a clearer understanding of digital marketing, online selling, audience growth, and practical business visibility.",
        longDescription:
          "The Digital Marketing & Online Business pack gives you a more structured foundation for showing up online, attracting attention, communicating better, and building practical digital growth habits. It is a strong fit if your main goal is visibility, monetization, and online business confidence.",
        bestFor: [
          "Entrepreneurs building or growing an online business",
          "Freelancers who want stronger digital positioning",
          "Creators who want to understand audience growth",
          "Small business owners learning online sales basics",
        ],
        learningOutcomes: [
          "Understand the basics of digital marketing and community management",
          "Learn how online stores and digital selling workflows are structured",
          "Build stronger visibility habits for content and channel growth",
          "See how monetization and customer journeys connect to practical growth",
        ],
        whyChoose: [
          "It focuses on skills directly tied to online visibility, acquisition, and monetization.",
          "It helps you connect marketing activity with real business and selling goals.",
          "It gives you a practical starting point without forcing you into the full library on day one.",
        ],
        seoTitle:
          "Digital Marketing & Online Business | teChia Digital Academy",
        seoDescription:
          "Learn practical digital marketing, e-commerce, community management, and YouTube growth skills with this teChia Digital Academy pack.",
      },
      fr: {
        slug: "marketing-digital-business-en-ligne",
        title: "Marketing digital & business en ligne",
        shortTitle: "Marketing & business",
        category: "Croissance et visibilité",
        tagline:
          "Des compétences utiles pour la visibilité en ligne, l’acquisition de clients et la vente digitale.",
        summary:
          "Ce pack est conçu pour les entrepreneurs, freelances, créateurs et dirigeants qui veulent mieux comprendre le marketing digital, la vente en ligne, la croissance d’audience et la visibilité pratique d’un business.",
        longDescription:
          "Le pack Marketing digital & business en ligne vous donne une base plus claire pour mieux exister en ligne, attirer l’attention, mieux communiquer et développer des habitudes de croissance digitale utiles. C’est un bon choix si votre priorité est la visibilité, la monétisation et la confiance dans le business en ligne.",
        bestFor: [
          "Entrepreneurs qui développent un business en ligne",
          "Freelances qui veulent mieux se positionner",
          "Créateurs qui veulent comprendre la croissance d’audience",
          "Petites entreprises qui apprennent la vente en ligne",
        ],
        learningOutcomes: [
          "Comprendre les bases du marketing digital et du community management",
          "Voir comment les boutiques en ligne et les parcours de vente sont structurés",
          "Mettre en place de meilleures habitudes de visibilité et de croissance de contenu",
          "Comprendre le lien entre monétisation, audience et croissance pratique",
        ],
        whyChoose: [
          "Il se concentre sur les compétences liées à la visibilité, à l’acquisition et à la monétisation.",
          "Il relie l’activité marketing à de vrais objectifs business et commerciaux.",
          "Il vous donne un point de départ concret sans vous obliger à acheter toute la bibliothèque.",
        ],
        seoTitle:
          "Marketing digital & business en ligne | teChia Digital Academy",
        seoDescription:
          "Apprenez le marketing digital, l’e-commerce, le community management et la croissance YouTube avec ce pack teChia Digital Academy.",
      },
    },
  },
  {
    id: "creative-design-content-creation",
    level: "Beginner to Intermediate",
    badge: "Creative Pack",
    checkoutEnvKey: CHARIOW_CHECKOUT_ENV_KEYS.creativeDesignContentCreation,
    courseSlugs: [
      "infographics-graphic-design",
      "video-editing",
      "canva-graphic-design-video-editing",
    ],
    copy: {
      en: {
        slug: "creative-design-content-creation",
        title: "Creative Design & Content Creation",
        shortTitle: "Creative Design",
        category: "Visual communication",
        tagline:
          "Practical visual and content skills for social platforms, promotions, and branded communication.",
        summary:
          "This pack helps learners build stronger design, editing, and content production habits for modern digital platforms. It is ideal for creators, social media managers, and business owners who need cleaner visuals and more confident content execution.",
        longDescription:
          "The Creative Design & Content Creation pack focuses on the practical side of visual communication. It gives you a cleaner foundation for design thinking, content structure, editing workflow, and fast-turnaround asset creation for digital use.",
        bestFor: [
          "Creators producing social or educational content",
          "Business owners improving brand presentation",
          "Social media managers who need stronger visual execution",
          "Learners who want practical design and editing confidence",
        ],
        learningOutcomes: [
          "Understand stronger layout, design, and infographic principles",
          "Improve your video editing structure and content workflow",
          "Create faster branded assets with Canva and practical template systems",
          "Build more consistent content production habits for digital platforms",
        ],
        whyChoose: [
          "It gives you a focused visual skills path instead of mixing too many unrelated topics.",
          "It is useful for both business communication and creator-style content needs.",
          "It strengthens everyday content production skills you can apply immediately.",
        ],
        seoTitle: "Creative Design & Content Creation | teChia Digital Academy",
        seoDescription:
          "Build practical design, Canva, infographics, and video editing skills with this teChia Digital Academy creative pack.",
      },
      fr: {
        slug: "design-creatif-creation-contenu",
        title: "Design créatif & création de contenu",
        shortTitle: "Design créatif",
        category: "Communication visuelle",
        tagline:
          "Des compétences visuelles pratiques pour les réseaux sociaux, les promotions et la communication de marque.",
        summary:
          "Ce pack aide les apprenants à améliorer leur design, leur montage et leurs habitudes de production de contenu pour les plateformes digitales modernes. Il convient bien aux créateurs, community managers et entrepreneurs qui veulent des visuels plus propres et une exécution plus solide.",
        longDescription:
          "Le pack Design créatif & création de contenu se concentre sur le côté pratique de la communication visuelle. Il vous donne une base plus claire pour le design, la structure du contenu, le montage et la création rapide d’assets visuels utiles au quotidien.",
        bestFor: [
          "Créateurs qui produisent du contenu social ou éducatif",
          "Entrepreneurs qui veulent mieux présenter leur marque",
          "Gestionnaires de réseaux sociaux qui veulent mieux exécuter le visuel",
          "Apprenants qui veulent progresser en design et montage",
        ],
        learningOutcomes: [
          "Comprendre les principes de mise en page, design et infographie",
          "Améliorer votre workflow de montage vidéo",
          "Créer plus vite des visuels de marque avec Canva et des modèles réutilisables",
          "Développer des habitudes de production de contenu plus régulières",
        ],
        whyChoose: [
          "Il vous donne un parcours visuel ciblé sans mélanger trop de sujets éloignés.",
          "Il est utile autant pour la communication business que pour le contenu créateur.",
          "Il renforce des compétences de production que vous pouvez appliquer tout de suite.",
        ],
        seoTitle:
          "Design créatif & création de contenu | teChia Digital Academy",
        seoDescription:
          "Développez vos compétences en design, Canva, infographies et montage vidéo avec ce pack créatif teChia Digital Academy.",
      },
    },
  },
  {
    id: "ai-tech-programming",
    level: "Beginner to Intermediate",
    badge: "Tech Pack",
    checkoutEnvKey: CHARIOW_CHECKOUT_ENV_KEYS.aiTechProgramming,
    courseSlugs: [
      "artificial-intelligence",
      "computer-science-programming",
      "wordpress-website-design",
    ],
    copy: {
      en: {
        slug: "ai-tech-programming",
        title: "AI, Tech & Programming",
        shortTitle: "AI & Tech",
        category: "Technology skills",
        tagline:
          "A practical introduction to AI tools, programming logic, and modern digital technology.",
        summary:
          "This pack is for learners who want a more technical direction. It introduces AI usage, programming foundations, and website-building structure in a way that stays practical and beginner-aware.",
        longDescription:
          "The AI, Tech & Programming pack helps learners make sense of today’s technology landscape without unnecessary hype. It gives you a more grounded view of AI tools, coding logic, and website systems so you can build stronger technical confidence over time.",
        bestFor: [
          "Learners curious about AI and modern digital tools",
          "Beginners exploring programming and technical logic",
          "People who want a first step into website-building systems",
          "Professionals who want a more technical productivity layer",
        ],
        learningOutcomes: [
          "Understand the practical fundamentals of AI tools and prompt usage",
          "Learn the core logic behind programming and software thinking",
          "See how WordPress websites are structured and prepared for launch",
          "Build more confidence around technology-driven digital work",
        ],
        whyChoose: [
          "It gives you a clearer technical foundation without assuming advanced experience.",
          "It combines AI literacy, programming logic, and web structure in one practical track.",
          "It is a strong fit if you want to become more confident with modern tools, not just consume them passively.",
        ],
        seoTitle: "AI, Tech & Programming | teChia Digital Academy",
        seoDescription:
          "Explore practical AI, programming, and WordPress website-building skills with this teChia Digital Academy technology pack.",
      },
      fr: {
        slug: "ia-tech-programmation",
        title: "IA, tech & programmation",
        shortTitle: "IA & tech",
        category: "Compétences technologiques",
        tagline:
          "Une introduction pratique aux outils IA, à la logique de programmation et aux technologies digitales modernes.",
        summary:
          "Ce pack s’adresse aux apprenants qui veulent une orientation plus technique. Il introduit l’usage de l’IA, les bases de la programmation et la structure de création de sites de façon pratique et accessible.",
        longDescription:
          "Le pack IA, tech & programmation aide les apprenants à mieux comprendre le paysage technologique actuel sans hype inutile. Il donne une vision plus claire des outils IA, de la logique de code et des systèmes web pour développer une vraie confiance technique avec le temps.",
        bestFor: [
          "Apprenants curieux de l’IA et des outils digitaux modernes",
          "Débutants qui découvrent la programmation et la logique technique",
          "Personnes qui veulent une première base en création de sites",
          "Professionnels qui veulent renforcer leur productivité technique",
        ],
        learningOutcomes: [
          "Comprendre les bases pratiques des outils IA et du prompting",
          "Apprendre la logique centrale de la programmation",
          "Voir comment un site WordPress est structuré et préparé pour la mise en ligne",
          "Développer plus de confiance dans le travail digital orienté technologie",
        ],
        whyChoose: [
          "Il donne une base technique plus claire sans supposer un niveau avancé.",
          "Il combine culture IA, logique de programmation et structure web dans un même parcours.",
          "C’est un bon choix si vous voulez mieux utiliser les outils modernes et pas seulement les consommer.",
        ],
        seoTitle: "IA, tech & programmation | teChia Digital Academy",
        seoDescription:
          "Explorez l’IA pratique, la programmation et la création de sites WordPress avec ce pack technologique teChia Digital Academy.",
      },
    },
  },
  {
    id: "office-business-professional-skills",
    level: "Beginner to Intermediate",
    badge: "Professional Pack",
    checkoutEnvKey: CHARIOW_CHECKOUT_ENV_KEYS.officeBusinessProfessionalSkills,
    courseSlugs: [
      "office-secretarial-tools",
      "accounting-management",
      "professional-personal-development",
      "human-resources",
      "project-management",
    ],
    copy: {
      en: {
        slug: "office-business-professional-skills",
        title: "Office, Business & Professional Skills",
        shortTitle: "Office & Business",
        category: "Workplace productivity",
        tagline:
          "Practical workplace, business, and productivity skills for students, workers, and professionals.",
        summary:
          "This pack helps learners build stronger office confidence, business discipline, management awareness, and everyday professional habits that matter in real work environments.",
        longDescription:
          "The Office, Business & Professional Skills pack is designed for learners who want to work better, stay more organized, and build stronger professional credibility. It covers practical office tools, business structure, people processes, project coordination, and growth-minded professional habits.",
        bestFor: [
          "Students preparing for modern work environments",
          "Job seekers who want stronger office and business readiness",
          "Assistants, administrators, and early-career professionals",
          "Entrepreneurs who want better structure and internal discipline",
        ],
        learningOutcomes: [
          "Use office and productivity tools with more confidence",
          "Understand business records, management basics, and reporting discipline",
          "Build stronger workplace communication and personal development habits",
          "Improve your ability to coordinate projects and understand HR basics",
        ],
        whyChoose: [
          "It focuses on everyday professional skills that improve how you work and communicate.",
          "It is highly relevant for learners preparing for office roles, internal business work, or structured freelancing.",
          "It combines productivity tools with business and people-process understanding.",
        ],
        seoTitle:
          "Office, Business & Professional Skills | teChia Digital Academy",
        seoDescription:
          "Learn office tools, project management, HR, accounting awareness, and professional productivity with this teChia Digital Academy pack.",
      },
      fr: {
        slug: "bureautique-business-competences-professionnelles",
        title: "Bureautique, business & compétences professionnelles",
        shortTitle: "Bureautique & business",
        category: "Productivité professionnelle",
        tagline:
          "Des compétences pratiques de bureautique, business et productivité pour étudiants, salariés et professionnels.",
        summary:
          "Ce pack aide les apprenants à mieux maîtriser les outils de bureau, la discipline business, la gestion et les habitudes professionnelles utiles dans de vrais environnements de travail.",
        longDescription:
          "Le pack Bureautique, business & compétences professionnelles est conçu pour les apprenants qui veulent mieux travailler, mieux s’organiser et renforcer leur crédibilité professionnelle. Il couvre les outils de bureau, la structure business, les processus humains, la coordination de projets et les habitudes de progression utiles.",
        bestFor: [
          "Étudiants qui se préparent au monde du travail",
          "Chercheurs d’emploi qui veulent mieux maîtriser les outils bureautiques",
          "Assistants, administratifs et jeunes professionnels",
          "Entrepreneurs qui veulent plus de structure et de discipline interne",
        ],
        learningOutcomes: [
          "Utiliser les outils de bureau et de productivité avec plus d’assurance",
          "Comprendre les bases de gestion, de suivi business et de reporting",
          "Renforcer la communication professionnelle et le développement personnel",
          "Mieux coordonner des projets et comprendre les bases RH",
        ],
        whyChoose: [
          "Il se concentre sur des compétences professionnelles du quotidien qui améliorent votre manière de travailler.",
          "Il est très utile pour les apprenants qui visent des rôles de bureau, de gestion interne ou de freelance structuré.",
          "Il combine outils de productivité, compréhension business et gestion des personnes.",
        ],
        seoTitle:
          "Bureautique, business & compétences professionnelles | teChia Digital Academy",
        seoDescription:
          "Apprenez les outils bureautiques, la gestion de projet, les RH, les bases de comptabilité et la productivité professionnelle avec ce pack teChia Digital Academy.",
      },
    },
  },
  {
    id: "finance-market-education",
    level: "Beginner",
    badge: "Finance Pack",
    checkoutEnvKey: CHARIOW_CHECKOUT_ENV_KEYS.financeMarketEducation,
    courseSlugs: ["trading", "cryptocurrency"],
    copy: {
      en: {
        slug: "finance-market-education",
        title: "Finance & Market Education",
        shortTitle: "Finance & Markets",
        category: "Financial awareness",
        tagline:
          "Educational finance and market basics for learners who want clearer money and market awareness.",
        summary:
          "This pack introduces finance-adjacent market topics in an educational way, helping learners understand trading language, cryptocurrency concepts, and the mindset of risk awareness without treating speculation like a shortcut.",
        longDescription:
          "The Finance & Market Education pack is designed for learners who want to understand market conversations more clearly and build safer foundational awareness. It stays educational and avoids hype, focusing instead on vocabulary, risk thinking, and disciplined understanding.",
        bestFor: [
          "Learners curious about trading and crypto basics",
          "Beginners who want clearer market vocabulary",
          "People who want financial awareness before taking action",
          "Anyone who wants a more grounded view of digital and market assets",
        ],
        learningOutcomes: [
          "Understand beginner trading vocabulary and basic market structure",
          "Learn the fundamentals of cryptocurrency and blockchain terminology",
          "Develop stronger risk awareness and more disciplined expectations",
          "Interpret market conversations with more clarity and caution",
        ],
        whyChoose: [
          "It keeps finance and market learning educational instead of promotional.",
          "It helps beginners understand the language and structure before making decisions.",
          "It is a focused pack for learners who want awareness, not hype.",
        ],
        seoTitle: "Finance & Market Education | teChia Digital Academy",
        seoDescription:
          "Learn beginner-friendly trading and cryptocurrency fundamentals with a practical, educational finance pack from teChia Digital Academy.",
      },
      fr: {
        slug: "finance-education-marche",
        title: "Finance & éducation de marché",
        shortTitle: "Finance & marchés",
        category: "Culture financière",
        tagline:
          "Des bases éducatives sur la finance et les marchés pour mieux comprendre l’argent et les actifs digitaux.",
        summary:
          "Ce pack introduit les sujets de finance et de marché de façon éducative, pour aider les apprenants à comprendre le langage du trading, les concepts crypto et l’importance de la gestion du risque sans vendre du rêve.",
        longDescription:
          "Le pack Finance & éducation de marché est pensé pour les apprenants qui veulent mieux comprendre les conversations autour des marchés et développer une base plus prudente. Il reste éducatif et évite le sensationnel, en mettant l’accent sur le vocabulaire, la discipline et la compréhension du risque.",
        bestFor: [
          "Apprenants curieux du trading et de la crypto",
          "Débutants qui veulent mieux comprendre le vocabulaire des marchés",
          "Personnes qui veulent plus de conscience financière avant d’agir",
          "Toute personne qui veut une vision plus lucide des actifs digitaux et des marchés",
        ],
        learningOutcomes: [
          "Comprendre le vocabulaire débutant du trading et la structure de base des marchés",
          "Apprendre les fondamentaux de la cryptomonnaie et de la blockchain",
          "Développer une meilleure conscience du risque et des attentes plus disciplinées",
          "Lire les conversations de marché avec plus de clarté et de prudence",
        ],
        whyChoose: [
          "Il garde l’apprentissage financier dans un cadre éducatif et non promotionnel.",
          "Il aide les débutants à comprendre la structure avant de prendre des décisions.",
          "C’est un pack ciblé pour les apprenants qui veulent de la conscience, pas du hype.",
        ],
        seoTitle: "Finance & éducation de marché | teChia Digital Academy",
        seoDescription:
          "Apprenez les bases du trading et de la cryptomonnaie avec un pack éducatif, pratique et débutant-friendly de teChia Digital Academy.",
      },
    },
  },
];

export function getCoursePacks(locale: Locale): CoursePack[] {
  return COURSE_PACK_DEFINITIONS.map((definition) => {
    const copy = definition.copy[locale];

    return {
      id: definition.id,
      slug: copy.slug,
      title: copy.title,
      shortTitle: copy.shortTitle,
      category: copy.category,
      tagline: copy.tagline,
      summary: copy.summary,
      longDescription: copy.longDescription,
      bestFor: copy.bestFor,
      learningOutcomes: copy.learningOutcomes,
      includedCourses: definition.courseSlugs
        .map((slug) => COURSE_CATALOG_BY_SLUG[slug])
        .filter(Boolean)
        .map((course) => ({
          title: course.title,
          description: course.shortDescription,
        })),
      courseCount: definition.courseSlugs.length,
      level: definition.level,
      recommended: definition.recommended,
      badge: definition.badge,
      checkoutEnvKey: definition.checkoutEnvKey,
      checkoutUrl: getChariowCheckoutUrl(definition.checkoutEnvKey),
      seoTitle: copy.seoTitle,
      seoDescription: copy.seoDescription,
      locale,
      path: getPublicAppPath(`/courses/${definition.id}`),
      whyChoose: copy.whyChoose,
    };
  });
}

export function getCoursePackById(locale: Locale, packId: string) {
  return getCoursePacks(locale).find((pack) => pack.id === packId) || null;
}

export function getCoursePackBySlug(locale: Locale, slug: string) {
  return getCoursePacks(locale).find((pack) => pack.id === slug) || null;
}

export function getFullCoursePack(locale: Locale) {
  return getCoursePacks(locale).find((pack) => pack.recommended) || null;
}

export function getSubCoursePacks(locale: Locale) {
  return getCoursePacks(locale).filter((pack) => !pack.recommended);
}

export function getRelatedCoursePacks(locale: Locale, currentPackId: string) {
  return getCoursePacks(locale).filter((pack) => pack.id !== currentPackId);
}

export function getCourseAcademyFaqs(locale: Locale): CourseFaqItem[] {
  if (locale === "fr") {
    return [
      {
        question: "Que se passe-t-il après le paiement ?",
        answer:
          "Après votre achat via Chariow, vous recevez les instructions d’accès liées au pack choisi. Si vous avez un problème, vous pouvez contacter teChia via WhatsApp ou email si ces contacts sont configurés.",
      },
      {
        question: "Puis-je acheter un seul sous-pack ?",
        answer:
          "Oui. Chaque sous-pack est conçu pour un objectif d’apprentissage précis. Vous pouvez acheter uniquement le pack qui correspond à votre besoin actuel.",
      },
      {
        question: "Le pack complet est-il la meilleure valeur ?",
        answer:
          "Oui. Le pack complet donne accès aux 16 cours et reste le meilleur choix si vous voulez la bibliothèque entière au lieu d’acheter plusieurs petits packs séparément.",
      },
      {
        question: "Les cours conviennent-ils aux débutants ?",
        answer:
          "La plupart des packs conviennent aux débutants et aux apprenants qui veulent des compétences digitales pratiques et accessibles. Les sujets plus techniques demandent parfois un peu plus de patience, mais la structure reste pensée pour être abordable.",
      },
      {
        question: "Puis-je suivre les cours sur téléphone ?",
        answer:
          "Oui. L’expérience est pensée pour rester pratique sur mobile, afin que vous puissiez continuer aussi bien sur téléphone que sur ordinateur.",
      },
      {
        question: "Ai-je besoin d’une expérience préalable ?",
        answer:
          "Pas forcément. La majorité des packs sont conçus comme des points d’entrée accessibles, surtout pour les apprenants qui veulent progresser étape par étape.",
      },
      {
        question: "Que faire si j’ai un problème de paiement ?",
        answer:
          "Si vous rencontrez un souci pendant le paiement ou juste après, contactez teChia avant de recommencer. Cela permet de vérifier plus vite votre situation et de vous orienter correctement.",
      },
      {
        question: "Puis-je contacter teChia avant d’acheter ?",
        answer:
          "Oui. Si le lien WhatsApp ou l’email de support est configuré, vous pouvez contacter teChia avant l’achat pour vérifier quel pack correspond le mieux à votre objectif.",
      },
    ];
  }

  return [
    {
      question: "What happens after I pay?",
      answer:
        "After completing your purchase through Chariow, you will receive the access instructions connected to the course pack you selected. If you have any issue, you can contact teChia support through WhatsApp or email when those support links are available.",
    },
    {
      question: "Can I buy only one subpack?",
      answer:
        "Yes. Each subpack is designed for a specific learning goal. You can buy only the pack that matches your current need.",
    },
    {
      question: "Is the full pack better value?",
      answer:
        "Yes. The full pack gives you access to all 16 courses and is the best option if you want the complete learning library instead of buying smaller packs separately.",
    },
    {
      question: "Are the courses beginner-friendly?",
      answer:
        "Most packs are suitable for beginners and learners who want practical, easy-to-follow digital skills. Some tech-focused topics may require more patience, but the structure is designed to stay accessible.",
    },
    {
      question: "Can I access the courses on my phone?",
      answer:
        "Yes. The learning experience is designed to work well on mobile, so you can continue from your phone or laptop.",
    },
    {
      question: "Do I need previous experience?",
      answer:
        "Not necessarily. Most packs are structured as approachable entry points for learners who want to build skills step by step.",
    },
    {
      question: "What if I have payment issues?",
      answer:
        "If you run into any payment issue during or after checkout, contact teChia before trying multiple times so the situation can be reviewed more quickly.",
    },
    {
      question: "Can I contact teChia before buying?",
      answer:
        "Yes. If the WhatsApp link or support email is configured, you can contact teChia before buying to confirm which pack best fits your goal.",
    },
  ];
}

export function getCourseAcademySteps(locale: Locale) {
  if (locale === "fr") {
    return [
      "Choisissez le pack qui correspond à votre objectif",
      "Finalisez le paiement via Chariow",
      "Recevez les instructions d’accès",
      "Commencez à apprendre à votre rythme",
    ];
  }

  return [
    "Choose your pack",
    "Complete payment through Chariow",
    "Receive access instructions",
    "Start learning at your pace",
  ];
}

export function getCourseAcademyPositioning(locale: Locale) {
  if (locale === "fr") {
    return {
      eyebrow: "teChia Digital Academy",
      title:
        "teChia ne construit pas seulement des solutions digitales. Nous aidons aussi les personnes à développer les compétences utiles pour les utiliser, mieux travailler, faire grandir un business et accéder à de nouvelles opportunités.",
      body: "L’académie s’inscrit naturellement dans la mission de teChia: digitaliser, simplifier et faire grandir. Elle prolonge le rôle de teChia comme partenaire sérieux de croissance digitale, avec des packs d’apprentissage pratiques et orientés réalité.",
    };
  }

  return {
    eyebrow: "teChia Digital Academy",
    title:
      "teChia does not only build digital solutions. It also helps people learn the skills needed to use digital tools, grow businesses, work better, and access modern opportunities.",
    body: "The academy is a natural extension of teChia’s mission: digitalize, simplify, and grow. It continues teChia’s role as a serious digital growth partner through practical learning packs built for real-world progress.",
  };
}

export function getCoursePackLevelLabel(
  locale: Locale,
  level: CoursePackLevel,
) {
  if (locale === "fr") {
    if (level === "Beginner") return "Débutant";
    if (level === "Intermediate") return "Intermédiaire";
    return "Débutant à intermédiaire";
  }

  return level;
}
