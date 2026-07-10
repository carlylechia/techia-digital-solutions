import { getLocalizedAppPath } from "@/lib/site-routes";

export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];

function normalizeSiteUrl(value?: string) {
  const fallback = "https://techiadigital.com";
  const rawValue = value?.trim() || fallback;

  try {
    const preparedValue = /^https?:\/\//i.test(rawValue)
      ? rawValue
      : `https://${rawValue}`;
    const url = new URL(preparedValue);
    const isLocalHost = /^(localhost|127\.0\.0\.1)$/i.test(url.hostname);

    if (!isLocalHost) {
      url.protocol = "https:";
    }

    if (url.hostname === "www.techiadigital.com") {
      url.hostname = "techiadigital.com";
    }

    url.pathname = "";
    url.search = "";
    url.hash = "";

    return url.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

export const siteConfig = {
  name: "teChia Digital Solutions",
  shortName: "teChia",
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  email:
    process.env.NEXT_PUBLIC_OFFICIAL_EMAIL || process.env.OFFICIAL_EMAIL || "",
  whatsapp:
    process.env.NEXT_PUBLIC_OFFICIAL_WHATSAPP ||
    process.env.OFFICIAL_WHATSAPP ||
    "",
  phone:
    process.env.NEXT_PUBLIC_OFFICIAL_CALL || process.env.OFFICIAL_CALL || "",
  location: "Douala, Cameroon — serving Africa and international SMEs",
  socials: {
    linkedin: "https://www.linkedin.com/company/techia-digital-solutions",
    github: "https://github.com/techia-digital-solutions",
    x: "https://x.com/techia",
  },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export const routeLabels = {
  en: {
    home: "Home",
    about: "About",
    founder: "Founder",
    services: "Services",
    solutions: "Solutions",
    industries: "Industries",
    portfolio: "Portfolio",
    demoLab: "Demo Lab",
    courses: "Courses",
    pricing: "Pricing",
    blog: "Blog",
    contact: "Contact",
    clientPortal: "Client portal",
    aiConsultant: "AI consultant",
    startProject: "Start a Project",
  },
  fr: {
    home: "Accueil",
    about: "À propos",
    founder: "Fondateur",
    services: "Services",
    solutions: "Solutions",
    industries: "Secteurs",
    portfolio: "Réalisations",
    demoLab: "Espace démo",
    courses: "Cours",
    pricing: "Offres",
    blog: "Blog",
    contact: "Contact",
    clientPortal: "Portail client",
    aiConsultant: "Agent IA",
    startProject: "Démarrer un projet",
  },
} satisfies Record<Locale, Record<string, string>>;

export type CardItem = {
  slug: string;
  title: string;
  description: string;
  eyebrow?: string;
  features?: string[];
  cta?: string;
  badge?: string;
};

const sharedServicesEn: CardItem[] = [
  {
    slug: "social-media-management",
    title: "Social Media Management",
    description:
      "If your brand posts inconsistently or gets ignored online, we plan and manage content that builds attention, trust, and steady customer conversations.",
    features: [
      "Content planning",
      "Creative direction",
      "Community management",
      "Performance reporting",
    ],
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing",
    description:
      "When leads are unpredictable and campaigns feel scattered, we build digital marketing systems that generate qualified demand and measurable business growth.",
    features: [
      "Campaign strategy",
      "Paid media support",
      "Email funnels",
      "Growth analytics",
    ],
  },
  {
    slug: "branding-graphic-design",
    title: "Branding & Graphic Design",
    description:
      "When the business looks unclear or forgettable, we sharpen positioning and design so customers recognize the value, trust the offer, and remember the brand.",
    features: [
      "Brand strategy",
      "Visual identity",
      "Sales collateral",
      "Message refinement",
    ],
  },
  {
    slug: "website-design-development",
    title: "Website Design & Development",
    description:
      "When visitors hesitate to trust or contact you, we design high-performance websites that clarify your offer, capture leads, and turn attention into opportunity.",
    features: [
      "Marketing websites",
      "Conversion pages",
      "UX copywriting",
      "CMS-ready structure",
    ],
  },
  {
    slug: "e-commerce-solutions",
    title: "E-commerce Solutions",
    description:
      "When sales depend on manual chats and fragmented payments, we build e-commerce experiences that streamline buying, increase order confidence, and make revenue easier to scale.",
    features: [
      "Product catalogs",
      "Checkout flows",
      "Payment integration",
      "Order journeys",
    ],
  },
  {
    slug: "seo",
    title: "SEO",
    description:
      "If customers cannot find you on Google, we improve technical SEO, content structure, and search intent alignment so your business earns visibility and long-term inbound leads.",
    features: [
      "Technical SEO",
      "On-page optimization",
      "Content mapping",
      "Search reporting",
    ],
  },
  {
    slug: "business-automation",
    title: "Business Automation",
    description:
      "When repetitive admin slows the team down, we automate follow-up, approvals, notifications, and workflows so operations become faster, cleaner, and less manual.",
    features: [
      "Workflow automation",
      "Follow-up sequences",
      "Notifications",
      "Process optimization",
    ],
  },
  {
    slug: "ai-solutions",
    title: "AI Solutions",
    description:
      "When growth is limited by slow response times or information overload, we deploy practical AI tools that guide customers, assist teams, and speed up decision-making.",
    features: [
      "AI assistants",
      "Knowledge tools",
      "Smart intake",
      "Decision support",
    ],
  },
  {
    slug: "custom-business-software",
    title: "Custom Business Software",
    description:
      "When off-the-shelf tools do not match how your business works, we develop custom software that centralizes operations, organizes data, and gives your team better control.",
    features: [
      "Admin dashboards",
      "Client portals",
      "Operational systems",
      "Data workflows",
    ],
  },
  {
    slug: "cloud-digital-transformation-consulting",
    title: "Cloud & Digital Transformation Consulting",
    description:
      "When systems feel disconnected or growth requires a bigger shift, we guide cloud and digital transformation decisions so technology investments stay aligned with business goals.",
    features: [
      "Transformation audits",
      "Cloud planning",
      "Systems roadmap",
      "Advisory support",
    ],
  },
];

const sharedServicesFr: CardItem[] = [
  {
    slug: "social-media-management",
    title: "Gestion des réseaux sociaux",
    description:
      "Si votre marque publie de façon irrégulière ou manque d’attention en ligne, nous pilotons un contenu qui crée de la visibilité, de la confiance et des conversations client régulières.",
    features: [
      "Plan de contenu",
      "Direction créative",
      "Community management",
      "Rapports de performance",
    ],
  },
  {
    slug: "digital-marketing",
    title: "Marketing digital",
    description:
      "Quand les leads sont imprévisibles et les campagnes dispersées, nous construisons un dispositif marketing digital qui génère une demande qualifiée et une croissance mesurable.",
    features: [
      "Stratégie de campagne",
      "Support média payant",
      "Funnels email",
      "Analytics de croissance",
    ],
  },
  {
    slug: "branding-graphic-design",
    title: "Branding & design graphique",
    description:
      "Quand l’entreprise paraît floue ou oubliable, nous clarifions le positionnement et le design pour que la valeur soit comprise, crédible et mémorable.",
    features: [
      "Stratégie de marque",
      "Identité visuelle",
      "Supports commerciaux",
      "Affinage du message",
    ],
  },
  {
    slug: "website-design-development",
    title: "Design & développement web",
    description:
      "Quand les visiteurs hésitent à vous faire confiance ou à vous contacter, nous concevons des sites performants qui clarifient l’offre, captent les demandes et soutiennent la conversion.",
    features: [
      "Sites marketing",
      "Pages de conversion",
      "UX writing",
      "Architecture évolutive",
    ],
  },
  {
    slug: "e-commerce-solutions",
    title: "Solutions e-commerce",
    description:
      "Quand les ventes dépendent de messages manuels et de paiements fragmentés, nous créons des expériences e-commerce qui fluidifient l’achat et facilitent la montée en chiffre d’affaires.",
    features: [
      "Catalogues produits",
      "Parcours de paiement",
      "Intégration de paiement",
      "Gestion des commandes",
    ],
  },
  {
    slug: "seo",
    title: "SEO",
    description:
      "Si vos prospects ne vous trouvent pas sur Google, nous améliorons le SEO technique, la structure de contenu et l’alignement avec l’intention de recherche pour gagner en visibilité durable.",
    features: [
      "SEO technique",
      "Optimisation on-page",
      "Cartographie de contenu",
      "Reporting search",
    ],
  },
  {
    slug: "business-automation",
    title: "Automatisation métier",
    description:
      "Quand les tâches répétitives ralentissent l’équipe, nous automatisons relances, validations, notifications et workflows pour rendre l’exécution plus rapide et plus propre.",
    features: [
      "Workflows automatisés",
      "Séquences de relance",
      "Notifications",
      "Optimisation de processus",
    ],
  },
  {
    slug: "ai-solutions",
    title: "Solutions IA",
    description:
      "Quand la croissance est freinée par des réponses lentes ou trop d’informations à traiter, nous déployons des outils IA pratiques pour guider les clients et assister les équipes.",
    features: [
      "Assistants IA",
      "Outils de connaissance",
      "Intake intelligent",
      "Aide à la décision",
    ],
  },
  {
    slug: "custom-business-software",
    title: "Logiciels métier sur mesure",
    description:
      "Quand les outils standards ne reflètent pas votre manière de travailler, nous développons un logiciel métier qui centralise les opérations, structure les données et améliore le pilotage.",
    features: [
      "Tableaux de bord",
      "Portails clients",
      "Systèmes opérationnels",
      "Flux de données",
    ],
  },
  {
    slug: "cloud-digital-transformation-consulting",
    title: "Conseil cloud & transformation digitale",
    description:
      "Quand les systèmes sont déconnectés ou que la croissance exige un changement plus profond, nous guidons les décisions cloud et transformation digitale pour garder la technologie alignée avec le business.",
    features: [
      "Audits de transformation",
      "Planification cloud",
      "Roadmap système",
      "Conseil stratégique",
    ],
  },
];

const industriesEn: CardItem[] = [
  {
    slug: "travel-agencies",
    title: "Websites for Travel Agencies",
    description:
      "Inquiry funnels, destination pages, document checklists, CRM-ready lead flows, and consultancy dashboards.",
  },
  {
    slug: "logistics-companies",
    title: "Websites for Logistics Companies",
    description:
      "Quote requests, shipment inquiry flows, fleet/service pages, lead capture, and customer communication systems.",
  },
  {
    slug: "schools",
    title: "Websites for Schools",
    description:
      "Admissions pages, student portals, parent communication, events, calendars, and digital credibility for institutions.",
  },
  {
    slug: "real-estate-agencies",
    title: "Websites for Real Estate Agencies",
    description:
      "Property listing systems, inquiry flows, lead routing, neighborhood pages, and premium brand presentation.",
  },
  {
    slug: "car-dealerships",
    title: "Websites for Car Dealerships",
    description:
      "Inventory showcases, quote requests, reservation flows, financing inquiries, and trust-first dealership websites.",
  },
  {
    slug: "consultants",
    title: "Websites for Consultants",
    description:
      "Authority-building pages, booking flows, service packages, proposals, and high-converting consulting funnels.",
  },
  {
    slug: "clinics",
    title: "Websites for Clinics",
    description:
      "Service pages, appointment requests, patient communication, secure inquiry forms, and professional health presence.",
  },
  {
    slug: "ngos",
    title: "Websites for NGOs",
    description:
      "Program pages, donation-ready structures, impact reporting, volunteer flows, and stakeholder credibility.",
  },
  {
    slug: "restaurants",
    title: "Websites for Restaurants",
    description:
      "Menus, reservations, delivery prompts, location SEO, WhatsApp actions, and campaign landing pages.",
  },
  {
    slug: "custom-systems-for-smes",
    title: "Custom Systems for SMEs",
    description:
      "Practical business systems that replace scattered spreadsheets, WhatsApp chaos, and manual tracking.",
  },
];

const industriesFr: CardItem[] = [
  {
    slug: "travel-agencies",
    title: "Sites pour agences de voyage",
    description:
      "Parcours de demande, pages destinations, listes de documents, CRM et tableaux de bord de conseil.",
  },
  {
    slug: "logistics-companies",
    title: "Sites pour entreprises logistiques",
    description:
      "Demandes de devis, suivi client, pages services, capture de prospects et communication structurée.",
  },
  {
    slug: "schools",
    title: "Sites pour écoles",
    description:
      "Admissions, portails étudiants, communication parents, événements et crédibilité digitale institutionnelle.",
  },
  {
    slug: "real-estate-agencies",
    title: "Sites pour agences immobilières",
    description:
      "Annonces, demandes clients, orientation des prospects, pages quartiers et présentation premium.",
  },
  {
    slug: "car-dealerships",
    title: "Sites pour concessions automobiles",
    description:
      "Catalogues véhicules, demandes de devis, réservations, financement et expérience client de confiance.",
  },
  {
    slug: "consultants",
    title: "Sites pour consultants",
    description:
      "Autorité, réservation, offres, propositions et tunnels de conversion pour services professionnels.",
  },
  {
    slug: "clinics",
    title: "Sites pour cliniques",
    description:
      "Services, demandes de rendez-vous, communication patient, formulaires sécurisés et image professionnelle.",
  },
  {
    slug: "ngos",
    title: "Sites pour ONG",
    description:
      "Programmes, dons, impact, volontariat et crédibilité auprès des partenaires.",
  },
  {
    slug: "restaurants",
    title: "Sites pour restaurants",
    description:
      "Menus, réservations, livraison, SEO local, WhatsApp et pages campagne.",
  },
  {
    slug: "custom-systems-for-smes",
    title: "Systèmes sur mesure pour PME",
    description:
      "Des outils pratiques pour remplacer les fichiers dispersés, le chaos WhatsApp et le suivi manuel.",
  },
];

const caseStudiesEn: CardItem[] = [
  {
    slug: "teloh-global-business",
    title: "Teloh Global Business",
    eyebrow: "Client project",
    description:
      "A multilingual company website and operations presence for logistics, household products, careers, lead capture, and scalable digital workflows.",
  },
  {
    slug: "teloh-global-travels",
    title: "Teloh Global Travels",
    eyebrow: "Client project",
    description:
      "A travel consultancy website and inquiry system for study, visit, work-abroad services, education guidance, and conversion-focused follow-up.",
  },
  {
    slug: "job-seeker-os",
    title: "Job Seeker OS",
    eyebrow: "Product platform",
    description:
      "A career operating system with modern Next.js architecture, authentication, dashboards, and organized job-search workflows.",
  },
  {
    slug: "mentora",
    title: "Mentor@",
    eyebrow: "AI platform",
    description:
      "An AI-powered career orientation and coaching platform for students, graduates, and professionals changing direction.",
  },
  {
    slug: "mickey-car-sales",
    title: "Mickey Car Sales",
    eyebrow: "Automotive commerce",
    description:
      "A premium automotive commerce presence with inventory, inquiry, and immersive vehicle showcase experience.",
  },
  {
    slug: "techia-digital-solutions",
    title: "teChia Digital Solutions",
    eyebrow: "Internal product",
    description:
      "The official digital home for teChia, designed to demonstrate premium websites, digital systems, automation, AI tools, and trust-first business positioning.",
  },
  {
    slug: "custom-business-os",
    title: "Custom Business OS",
    eyebrow: "Business system",
    description:
      "A reusable delivery model for dashboards, CRMs, quotes, client portals, admin workflows, and business automation modules.",
  },
];

const caseStudiesFr: CardItem[] = [
  {
    slug: "teloh-global-business",
    title: "Teloh Global Business",
    eyebrow: "Projet client",
    description:
      "Un site d’entreprise multilingue et une présence opérationnelle pour la logistique, les produits domestiques, les carrières, la capture de prospects et des processus digitaux évolutifs.",
  },
  {
    slug: "teloh-global-travels",
    title: "Teloh Global Travels",
    eyebrow: "Projet client",
    description:
      "Un site et un système de demandes pour le conseil voyage, les études, les séjours, le travail à l’étranger et le suivi commercial.",
  },
  {
    slug: "job-seeker-os",
    title: "Job Seeker OS",
    eyebrow: "Plateforme produit",
    description:
      "Un système de gestion de carrière avec architecture Next.js moderne, authentification, tableaux de bord et processus organisés de recherche d’emploi.",
  },
  {
    slug: "mentora",
    title: "Mentor@",
    eyebrow: "Plateforme IA",
    description:
      "Une plateforme IA d’orientation de carrière et de coaching pour étudiants, diplômés et professionnels en reconversion.",
  },
  {
    slug: "mickey-car-sales",
    title: "Mickey Car Sales",
    eyebrow: "Commerce automobile",
    description:
      "Une présence automobile premium avec catalogue, demandes clients et expérience visuelle immersive.",
  },
  {
    slug: "techia-digital-solutions",
    title: "teChia Digital Solutions",
    eyebrow: "Produit interne",
    description:
      "La vitrine officielle de teChia, conçue pour démontrer des sites premium, des systèmes numériques, des automatisations, des outils IA et une présence business crédible.",
  },
  {
    slug: "custom-business-os",
    title: "Custom Business OS",
    eyebrow: "Système métier",
    description:
      "Un modèle de livraison réutilisable pour tableaux de bord, CRM, devis, portails clients, workflows administratifs et automatisation métier.",
  },
];

const blogEn: CardItem[] = [
  {
    slug: "why-every-serious-business-needs-a-digital-home",
    title: "Why Every Serious Business Needs a Digital Home",
    description:
      "A professional website is only the front door. The real advantage is a connected system that helps the business operate better.",
  },
  {
    slug: "website-vs-business-management-system",
    title:
      "Website vs Business Management System: What Does Your Company Need?",
    description:
      "How to decide between a marketing site, a dashboard, a portal, or a full operating system for your business.",
  },
  {
    slug: "automation-helps-small-businesses-save-time",
    title: "How Automation Helps Small Businesses Save Time",
    description:
      "A practical guide to removing repetitive tasks without overcomplicating the company.",
  },
  {
    slug: "local-businesses-should-invest-in-seo",
    title: "Why Local Businesses Should Invest in SEO",
    description:
      "Search visibility builds trust, reduces dependence on referrals, and supports paid ads with stronger landing pages.",
  },
  {
    slug: "custom-dashboard-transform-business-operations",
    title: "How a Custom Dashboard Can Transform Business Operations",
    description:
      "Dashboards are not decoration. They help managers see what is happening, act faster, and reduce confusion.",
  },
  {
    slug: "build-trust-with-international-clients",
    title:
      "Building Trust With International Clients Through Better Digital Presence",
    description:
      "How African businesses can look credible to European and international clients before the first call.",
  },
];

const blogFr: CardItem[] = [
  {
    slug: "why-every-serious-business-needs-a-digital-home",
    title: "Pourquoi toute entreprise sérieuse a besoin d’une maison digitale",
    description:
      "Un site web est la porte d’entrée. Le vrai avantage vient d’un système connecté qui améliore l’opérationnel.",
  },
  {
    slug: "website-vs-business-management-system",
    title: "Site web ou système de gestion : que faut-il à votre entreprise ?",
    description:
      "Comment choisir entre site vitrine, tableau de bord, portail client ou système complet.",
  },
  {
    slug: "automation-helps-small-businesses-save-time",
    title: "Comment l’automatisation fait gagner du temps aux PME",
    description:
      "Un guide pratique pour réduire les tâches répétitives sans complexifier l’entreprise.",
  },
  {
    slug: "local-businesses-should-invest-in-seo",
    title: "Pourquoi les entreprises locales doivent investir dans le SEO",
    description:
      "La visibilité Google renforce la confiance, diminue la dépendance aux recommandations et améliore les campagnes payantes.",
  },
  {
    slug: "custom-dashboard-transform-business-operations",
    title: "Comment un tableau de bord sur mesure transforme les opérations",
    description:
      "Un tableau de bord aide les managers à voir, décider et agir plus vite.",
  },
  {
    slug: "build-trust-with-international-clients",
    title: "Construire la confiance avec des clients internationaux",
    description:
      "Comment les entreprises africaines peuvent inspirer confiance aux clients européens avant le premier appel.",
  },
];

export const dictionaries = {
  en: {
    localeName: "English",
    nav: routeLabels.en,
    meta: {
      title: "teChia Digital Solutions — Digitalize. Simplify. Grow.",
      description:
        "teChia Digital Solutions helps businesses grow through social media management, digital marketing, branding, websites, e-commerce, SEO, automation, AI solutions, custom software, and digital transformation consulting.",
    },
    common: {
      startProject: "Start a Project",
      exploreSolutions: "Explore Solutions",
      viewDemoLab: "View Demo Lab",
      requestQuote: "Request a Quote",
      learnMore: "Learn more",
      readMore: "Read more",
      viewCaseStudy: "View case study",
      buildLikeThis: "Create a similar solution",
    },
    hero: {
      eyebrow: "Business growth partner for ambitious companies",
      title: "Digitalize. Simplify. Grow.",
      description:
        "Helping businesses grow through social media management, digital marketing, branding, AI, websites, automation, and software built for real operations.",
      trust: [
        "Social Media Management",
        "Digital Marketing",
        "Branding",
        "Websites",
        "SEO",
        "Automation",
        "AI Solutions",
      ],
    },
    home: {
      problemTitle:
        "Growth slows down when visibility and operations are disconnected.",
      problemBody:
        "When your social media, campaigns, website, leads, customer communication, and internal workflows live in different places, revenue becomes harder than it should be. teChia connects the digital layer so the business can market better, operate better, and grow with more control.",
      digitalHomeTitle: "Technology should support growth, not create more noise.",
      digitalHomeBody:
        "Your branding, content, website, lead flow, reporting, automation, and internal systems should reinforce one another instead of competing for attention.",
      europeTitle: "Built for local relevance and international credibility.",
      europeBody:
        "Whether you serve Douala, Lagos, Paris, Berlin, London, or buyers anywhere online, your digital experience should feel clear, modern, and trustworthy.",
      finalCtaTitle:
        "Ready to grow your business with the right digital strategy?",
      finalCtaBody:
        "Tell us the growth goal, and teChia will shape the right mix of marketing, branding, websites, e-commerce, automation, AI, and software around it.",
    },
    pages: {
      home: {
        realityEyebrow: "Growth reality",
        servicesTitle: "Growth services led by teChia",
        servicesDescription:
          "Explore the capabilities teChia combines to attract customers, strengthen brand visibility, improve operations, and scale businesses with less friction.",
        demoTitle:
          "Interactive examples of the systems behind modern business growth",
        demoDescription:
          "Browse hands-on examples of portals, dashboards, quote tools, booking flows, and AI experiences built around real customer and operational needs.",
        caseTitle: "Growth-focused work",
        caseDescription:
          "Selected projects show how teChia turns business priorities into stronger visibility, smoother operations, and better customer journeys.",
        methodTitle: "How teChia moves from business goal to digital execution.",
        stackTitle: "Modern stack. Business-first execution.",
        securityTitle: "Trust, speed, and measurable growth built in.",
        pricingTitle:
          "Choose the right growth starting point, not a rigid package.",
        pricingDescription:
          "Use pricing to frame the first phase, then tailor the strategy, build, and rollout around the business.",
        faqTitle: "Questions before we grow together",
        finalCtaEyebrow: "Next move",
      },
      about: {
        metaTitle: "About teChia Digital Solutions",
        metaDescription:
          "Learn how teChia operates as a long-term growth partner across marketing, branding, web, automation, AI, and software.",
        eyebrow: "About",
        title: "A long-term partner for business growth.",
        description:
          "teChia Digital Solutions helps businesses grow through digital marketing, brand strategy, social media, websites, automation, AI, business systems, SEO, and digital transformation planning.",
        pillars: ["Growth strategy", "Operational clarity", "Scalable systems"],
        beliefTitle: "How teChia thinks",
        beliefs: [
          "Businesses rarely need technology for its own sake. They need better growth systems.",
          "Marketing, branding, and software work better when they are planned together.",
          "Automation should remove manual friction, not add complexity.",
          "Digital transformation should improve both customer experience and internal execution.",
        ],
      },
      services: {
        metaTitle: "Services — teChia Digital Solutions",
        metaDescription:
          "Social media management, digital marketing, branding, website design, e-commerce, SEO, automation, AI solutions, custom software, and digital transformation consulting.",
        title: "Growth services built around real business outcomes",
        description:
          "From social media and digital marketing to websites, automation, AI, and custom software, teChia helps businesses grow with the right digital mix.",
      },
      solutions: {
        metaTitle: "Solutions — teChia Digital Solutions",
        metaDescription:
          "Client portals, quote systems, dashboards, booking systems, AI assistants, and growth tools for modern businesses.",
        title: "Solution modules for customer growth and operational clarity",
        description:
          "Use these modules independently or combine them into a connected growth and operations system.",
      },
      industries: {
        metaTitle: "Industries — teChia Digital Solutions",
        metaDescription:
          "Growth-focused digital systems for travel agencies, logistics companies, schools, clinics, real estate teams, dealerships, NGOs, restaurants, and SMEs.",
        title: "Industry solutions shaped around visibility, conversion, and delivery",
        description:
          "Each industry page translates teChia’s growth approach into a specific business context with clearer messaging and operational relevance.",
        detailPillars: [
          "Lead capture",
          "Market visibility",
          "Growth system roadmap",
        ],
      },
      portfolio: {
        metaTitle: "Portfolio and Case Studies — teChia",
        metaDescription:
          "Case studies showing how teChia connects brand, marketing, websites, automation, AI, and software for business growth.",
        title: "Case studies shaped around business growth",
        description:
          "Proof of how teChia turns growth goals into stronger visibility, cleaner operations, and better customer journeys.",
        detailSections: [
          "Problem",
          "Solution",
          "Features",
          "Tech stack",
          "Business value",
        ],
        detailNarrative:
          "A concise project narrative showing how this work supports a serious digital asset for the business.",
        caseStudySuffix: "Case Study",
      },
      blog: {
        metaTitle: "Blog — teChia Digital Solutions",
        metaDescription:
          "Insights on social media management, digital marketing, branding, SEO, automation, AI, websites, and digital transformation.",
        title: "Practical thinking for businesses that want to grow digitally",
        description:
          "Useful guidance for leaders improving visibility, systems, customer experience, and measurable growth.",
        articleEyebrow: "teChia insights",
        intro:
          "This article gives business leaders a practical way to evaluate digital decisions through visibility, brand credibility, operations, and customer experience.",
        keyIdeaTitle: "Key idea",
        keyIdeaBody:
          "Growth improves when brand, marketing, customer experience, and operations are connected instead of handled in isolation.",
        nextStepTitle: "Practical next step",
        nextStepBody:
          "Start with the business goal. Then choose the right mix of marketing, branding, websites, automation, AI, or software.",
      },
      demoLab: {
        metaTitle: "Demo Lab — teChia Digital Solutions",
        metaDescription:
          "Interactive demos for quote systems, dashboards, portals, AI assistants, booking flows, and business software that support growth.",
        title: "Interactive proof of digital growth workflows",
        description:
          "These demos help prospects understand how structured systems improve visibility, operations, and customer follow-up.",
      },
      pricing: {
        metaTitle: "Pricing — teChia Digital Solutions",
        metaDescription:
          "Flexible growth packages across branding, web, marketing, automation, AI, and software support.",
        title: "Growth packages without one-size-fits-all thinking",
        description:
          "Every business starts from a different growth challenge. Use these packages to frame the first phase and next digital priorities.",
        addOnsTitle: "Common add-ons",
        addOns: [
          "Extra campaign landing pages",
          "Social media content support",
          "Brand refresh",
          "SEO content support",
          "Automation workflow",
          "AI assistant",
          "Analytics reporting",
          "Ongoing optimization",
        ],
      },
      contact: {
        metaTitle: "Contact — teChia Digital Solutions",
        metaDescription:
          "Contact teChia Digital Solutions for social media management, digital marketing, branding, websites, automation, AI, software, and digital transformation consulting.",
        title: "Tell us where your business wants to grow",
        description:
          "Share the goal, bottleneck, or opportunity. We will recommend the right marketing, branding, technology, or automation path.",
        detailsTitle: "Contact details",
        location: "Douala, Cameroon — serving Africa and international SMEs",
        emailLabel: "Email",
        emailDesc: "We reply within 1 business day",
        whatsappLabel: "WhatsApp",
        whatsappDesc: "Fastest way to reach us",
        callLabel: "Phone",
        callDesc: "Available Mon–Fri, 9am–6pm WAT",
      },
      startProject: {
        metaTitle: "Start a Project — teChia Digital Solutions",
        metaDescription:
          "Start a growth-focused project with teChia across marketing, branding, websites, e-commerce, SEO, automation, AI, software, and digital transformation.",
        title: "Start with your growth goal",
        description:
          "This inquiry flow helps teChia understand your business priorities and recommend the right combination of strategy, creative, and technology.",
      },
      landing: {
        eyebrow: "Google Ads landing page",
        titlePrefix: "Premium",
        titleConnector: "for",
        description:
          "teChia helps SMEs grow with stronger messaging, better visibility, conversion-ready digital experiences, and a roadmap toward automation and custom systems.",
        trust: [
          "Fast landing pages",
          "GA4 conversion events",
          "SEO metadata",
          "Mobile-first",
          "Bilingual-ready",
          "Secure forms",
        ],
        whyTitle: "Why this matters",
        whyDescription:
          "European buyers expect clarity, trust, security, speed, and a professional communication experience before they book a call.",
        benefits: [
          "Build trust fast",
          "Capture serious leads",
          "Measure conversions",
        ],
        benefitBody:
          "A focused landing page makes your offer easier to understand and easier to act on.",
        metaFallbackTitle: "Landing Page — teChia",
        metaDescription:
          "Conversion-focused landing page for European SMEs that need stronger visibility, better digital credibility, and scalable growth systems.",
      },
      admin: {
        metaTitle: "Admin Access — teChia",
        metaDescription:
          "Reserved administrative access for teChia Digital Solutions.",
        eyebrow: "Reserved access",
        title: "teChia command center",
        description:
          "This space is reserved for authorized teChia operations. Client inquiries, project requests, and content operations are handled through secure internal workflows.",
        sections: [
          "Lead management",
          "Project inquiries",
          "Content operations",
          "Service follow-up",
        ],
        statusTitle: "Operational focus",
        statusBody:
          "The team reviews qualified requests, prepares recommendations, and follows each project through discovery, proposal, delivery, and support.",
      },
    },
    sections: {
      services: "Growth services",
      solutions: "Growth systems",
      industries: "Industries served",
      method: "The teChia Method",
      stack: "Technology credibility",
      security: "Security, SEO, and performance foundation",
      testimonials: "Growth proof",
      faq: "Frequently asked questions",
      pricing: "Growth packages",
      demoLab: "Interactive demos",
      caseStudies: "Growth case studies",
    },
    solutions: [
      {
        slug: "client-portals",
        title: "Client Portals",
        description:
          "Give customers a private place to send requests, view progress, upload documents, and stay informed.",
      },
      {
        slug: "quote-generators",
        title: "Quote Generators",
        description:
          "Turn messy price requests into structured data, faster responses, and clearer follow-up.",
      },
      {
        slug: "booking-systems",
        title: "Booking Systems",
        description:
          "Let clients request appointments, consultations, tours, calls, and services without endless back-and-forth.",
      },
      {
        slug: "dashboards",
        title: "Admin Dashboards",
        description:
          "Give managers a clean command center for leads, orders, documents, reports, and operational decisions.",
      },
      {
        slug: "ai-assistants",
        title: "AI Business Assistants",
        description:
          "Use AI to answer common questions, guide prospects, summarize requests, and support internal workflows.",
      },
      {
        slug: "ads-landing-pages",
        title: "Google Ads Landing Pages",
        description:
          "Campaign-focused pages with analytics, conversion events, and a message matched to the target market.",
      },
    ],
    method: [
      "Clarify the real business growth challenge",
      "Design the right mix of marketing, brand, and technology",
      "Build fast with secure modern tools",
      "Launch with SEO, analytics, and conversion tracking",
      "Improve continuously as the business scales",
    ],
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Prisma",
      "PostgreSQL",
      "Vercel",
      "Cloudflare",
      "AWS S3",
      "Auth.js",
      "OpenAI API",
      "pgvector",
      "GA4",
      "Google Search Console",
      "Schema.org",
      "Technical SEO",
      "Core Web Vitals",
      "Lighthouse",
      "Resend",
    ],
    securityPromise: [
      "Server-side validation",
      "Rate-limited APIs",
      "Secure headers",
      "Edge-ready delivery",
      "Privacy-conscious analytics",
      "Schema markup and indexability checks",
      "Accessible UI",
      "Core Web Vitals focus",
    ],
    services: sharedServicesEn,
    industries: industriesEn,
    caseStudies: caseStudiesEn,
    blog: blogEn,
    pricing: [
      {
        slug: "digital-foundation",
        title: "Base de croissance",
        badge: "Best first step",
        description:
          "For businesses that need stronger branding, social media clarity, and a conversion-ready digital foundation to start attracting better opportunities.",
        features: [
          "Brand positioning refresh",
          "Social media setup",
          "Core web presence",
          "Lead capture workflow",
        ],
        cta: "Plan my launchpad",
      },
      {
        slug: "business-pro-website",
        title: "Moteur visibilité & demande",
        badge: "Most popular",
        description:
          "For businesses ready to grow visibility through digital marketing, landing pages, SEO, and campaigns that generate qualified leads.",
        features: [
          "Campaign landing pages",
          "SEO foundations",
          "Analytics and conversion events",
          "Content and funnel support",
        ],
        cta: "Plan my demand engine",
      },
      {
        slug: "business-os",
        title: "Système d’opérations croissance",
        badge: "Operations upgrade",
        description:
          "For teams that need marketing, leads, follow-up, internal workflows, and reporting connected inside one clearer business system.",
        features: [
          "Lead and inquiry management",
          "Automation workflows",
          "Dashboards and reporting",
          "Operational data structure",
        ],
        cta: "Discuss operations system",
      },
      {
        slug: "custom-enterprise-system",
        title: "Plateforme IA & logiciel sur mesure",
        badge: "Fully custom",
        description:
          "For businesses that need tailored software, AI support, and deeper digital transformation across departments or services.",
        features: [
          "Discovery workshop",
          "Custom software roadmap",
          "AI workflow design",
          "Role-based delivery",
        ],
        cta: "Book a strategy session",
      },
      {
        slug: "maintenance-growth",
        title: "Support croissance continu",
        badge: "Monthly support",
        description:
          "Ongoing optimization for campaigns, content, SEO, websites, automations, and digital systems after launch.",
        features: [
          "Performance reviews",
          "SEO and content updates",
          "Automation improvements",
          "Priority support",
        ],
        cta: "Request ongoing support",
      },
    ],
    testimonials: [
      {
        quote:
          "The system direction made the project feel bigger than a simple website, but still practical and organized.",
        name: "Local business owner",
        role: "Cameroon SME",
      },
      {
        quote:
          "The strongest part is how the website, dashboard, leads, and client communication are treated as one business layer.",
        name: "Operations lead",
        role: "Service business",
      },
      {
        quote:
          "It feels ready for international clients without losing the practical needs of local businesses.",
        name: "Founder",
        role: "Travel and consulting",
      },
    ],
    faqs: [
      {
        question: "Do you only help with websites?",
        answer:
          "No. Websites are only one part of the work. teChia can start with social media, digital marketing, branding, SEO, automation, AI, software, or a broader growth roadmap depending on what the business actually needs.",
      },
      {
        question: "Can teChia handle both marketing and technology?",
        answer:
          "Yes. teChia is designed to connect visibility, branding, customer acquisition, automation, AI, and software into one coherent growth system instead of treating each need separately.",
      },
      {
        question: "Can you work with businesses outside Cameroon?",
        answer:
          "Yes. teChia is designed for local businesses, African SMEs, and international clients, especially European SMEs that need premium digital systems.",
      },
      {
        question: "Can you stay involved after launch?",
        answer:
          "Yes. teChia can continue with campaign refinement, SEO, content updates, technical support, automation improvements, and the next digital layer as the business evolves.",
      },
    ],
    simulator: {
      title: "Business Digitalization Simulator",
      description:
        "Select your business reality and see the kind of digital solution teChia would recommend.",
      businessTypes: [
        "Travel agency",
        "Logistics company",
        "School",
        "Clinic",
        "Real estate agency",
        "Car dealership",
        "Restaurant",
        "Consultant",
        "NGO",
        "Custom business",
      ],
      problems: [
        "We need more customers",
        "We manage everything manually",
        "We lose track of client requests",
        "We need online bookings",
        "We need a professional website",
        "We need an admin dashboard",
        "We need better communication",
        "We need automation",
        "We need a customer portal",
        "We need quotes/invoices/documents organized",
      ],
      outcomes: [
        "More leads",
        "Better organization",
        "Faster customer response",
        "Better brand image",
        "Internal dashboard",
        "Customer portal",
        "Automated workflows",
        "International credibility",
        "SEO visibility",
        "Google Ads conversions",
      ],
      recommendationLabel: "Recommended digital solution",
      helperText:
        "Use this simulator to clarify the right starting point before a project conversation.",
      labels: { business: "Business", problem: "Problem", outcome: "Outcome" },
      packages: {
        businessOs: "Business OS",
        portal: "Business Pro Website + Portal",
        website: "Business Pro Website",
      },
      modules: {
        website: "Premium website",
        leadCapture: "Lead capture",
        adminDashboard: "Admin dashboard",
        conversionLandingPage: "Conversion landing page",
        clientPortal: "Client portal",
        analyticsTracking: "Analytics tracking",
      },
      recommendationSentence:
        "For a {business} that says “{problem}” and wants “{outcome}”.",
      requestCta: "Request this solution",
    },
    demos: [
      "Logistics Quote Generator Demo",
      "Travel Consultancy Dashboard Demo",
      "School Portal Demo",
      "Car Dealer Inventory Demo",
      "AI Business Assistant Demo",
      "Booking System Demo",
      "Client Portal Demo",
    ],
    demoGrid: {
      conceptPreview: "Interactive workflow preview",
      livePreview: "Operational demo",
      metrics: ["New requests", "Response time", "Conversion signal"],
      metricValues: ["24", "2h", "High"],
      workflow: [
        "Customer submitted structured request",
        "System recommends next action",
        "Admin sees priority and status",
        "Email/WhatsApp follow-up is prepared",
      ],
      status: "Ready",
      description:
        "This preview demonstrates how teChia turns a business idea into a useful digital workflow with clear requests, priorities, and follow-up.",
      requestTitle: "Request this demo",
      requestDescription:
        "Pick a workflow and send a short note. The admin team will see it in the demo request queue.",
      requestButton: "Request demo",
    },
    forms: {
      name: "Name",
      email: "Email",
      phone: "Phone / WhatsApp",
      company: "Company name",
      country: "Country",
      language: "Preferred language",
      businessType: "Business type",
      need: "What do you need?",
      budget: "Budget range",
      timeline: "Timeline",
      details: "Project details",
      message: "Message",
      consent: "I agree to be contacted about this project.",
      submit: "Submit inquiry",
      sending: "Sending...",
      success:
        "Your message has been received. We will review it and respond with the next best step.",
      error: "Something went wrong. Please try again or contact us directly.",
    },
    legal: {
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      cookies: "Cookie Policy",
      eyebrow: "Legal",
      metaDescription: "Legal information for teChia Digital Solutions.",
      pages: {
        privacy: [
          "teChia Digital Solutions collects the information needed to respond to inquiries, understand project needs, send requested updates, and improve the website experience.",
          "Information submitted through forms may include your name, email address, phone number, company, country, project details, and communication preferences.",
          "Forms are validated, rate-limited, and designed with privacy-conscious analytics. Please avoid submitting sensitive personal data through public forms.",
          "For privacy questions or data requests, contact the business using the details provided on the contact page.",
        ],
        terms: [
          "By using this website, you agree to interact with teChia Digital Solutions in a lawful, respectful, and accurate manner.",
          "Website content explains services, capabilities, and project approaches. Formal scope, pricing, timelines, and responsibilities are confirmed in written project agreements.",
          "All brand assets, copy, designs, systems, and technical work remain protected by applicable intellectual property rules unless a written agreement states otherwise.",
          "For service questions, project terms, or commercial clarifications, contact teChia through the contact page.",
        ],
        cookies: [
          "teChia Digital Solutions uses essential cookies and privacy-conscious analytics to keep the website reliable, understand performance, and improve the visitor experience.",
          "Analytics data is used in aggregate to measure page performance, traffic quality, and conversion events such as contact or project inquiry submissions.",
          "You can manage cookies through your browser settings. Some essential website functions may depend on cookies or similar local storage.",
          "For cookie or tracking questions, contact the business using the details provided on the contact page.",
        ],
      },
    },
    ui: {
      company: "Company",
      legal: "Legal",
      footerDescription:
        "teChia Digital Solutions helps businesses grow through social media management, digital marketing, branding, premium websites, SEO, automation, AI solutions, and custom software.",
      allRightsReserved: "All rights reserved.",
      footerPromise: "Digitalize. Simplify. Grow.",
      newsletterJoin: "Join",
      newsletterLoading: "...",
      newsletterSuccess: "Subscribed.",
      newsletterError: "Could not subscribe.",
      languageSwitcher: "Language switcher",
      mainNavigation: "Main navigation",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      toggleTheme: "Toggle theme",
      logoHome: "teChia Digital Solutions home",
      notFoundTitle: "Page not found",
      notFoundBody: "The page you are looking for does not exist or has moved.",
      backHome: "Back home",
      errorEyebrow: "Application error",
      errorTitle: "Something went wrong",
      errorBody:
        "Please try again. The application is designed not to expose sensitive production errors.",
      tryAgain: "Try again",
    },
  },
  fr: {
    localeName: "Français",
    nav: routeLabels.fr,
    meta: {
      title:
        "teChia Digital Solutions — Digitaliser. Simplifier. Grandir.",
      description:
        "teChia Digital Solutions aide les entreprises à grandir grâce à la gestion des réseaux sociaux, au marketing digital, au branding, au web, au e-commerce, au SEO, à l’automatisation, aux solutions IA, aux logiciels sur mesure et au conseil en transformation digitale.",
    },
    common: {
      startProject: "Démarrer un projet",
      exploreSolutions: "Explorer les solutions",
      viewDemoLab: "Voir l’espace démo",
      requestQuote: "Demander un devis",
      learnMore: "En savoir plus",
      readMore: "Lire l’article",
      viewCaseStudy: "Voir l’étude de cas",
      buildLikeThis: "Créer une solution similaire",
    },
    hero: {
      eyebrow: "Partenaire de croissance pour entreprises ambitieuses",
      title: "Digitaliser. Simplifier. Grandir.",
      description:
        "Nous aidons les entreprises à grandir grâce aux réseaux sociaux, au marketing digital, au branding, à l’IA, au web, à l’automatisation et aux logiciels pensés pour les vraies opérations.",
      trust: [
        "Réseaux sociaux",
        "Marketing digital",
        "Branding",
        "Web",
        "SEO",
        "Automatisations",
        "Solutions IA",
      ],
    },
    home: {
      problemTitle:
        "La croissance ralentit quand la visibilité et les opérations restent déconnectées.",
      problemBody:
        "Quand vos réseaux sociaux, campagnes, site, leads, messages clients et workflows internes vivent dans des outils séparés, la croissance devient plus difficile qu’elle ne devrait l’être. teChia relie la couche digitale pour mieux marketer, mieux opérer et mieux piloter.",
      digitalHomeTitle:
        "La technologie doit soutenir la croissance, pas créer plus de bruit.",
      digitalHomeBody:
        "Votre branding, votre contenu, votre site, votre acquisition, vos reportings, vos automatisations et vos systèmes internes doivent se renforcer mutuellement au lieu de se disperser.",
      europeTitle:
        "Pensé pour la pertinence locale et la crédibilité internationale.",
      europeBody:
        "Que vous serviez Douala, Lagos, Paris, Berlin, Londres ou des acheteurs ailleurs en ligne, votre expérience digitale doit paraître claire, moderne et fiable.",
      finalCtaTitle:
        "Prêt à faire grandir votre entreprise avec la bonne stratégie digitale ?",
      finalCtaBody:
        "Dites-nous votre objectif de croissance et teChia construira le bon mix de marketing, branding, web, e-commerce, automatisation, IA et logiciel autour de lui.",
    },
    pages: {
      home: {
        realityEyebrow: "Réalité croissance",
        servicesTitle:
          "Des services de croissance pilotés par teChia",
        servicesDescription:
          "Découvrez les capacités que teChia combine pour attirer des clients, renforcer la visibilité de marque, améliorer les opérations et soutenir une croissance plus fluide.",
        demoTitle: "Exemples interactifs des solutions que teChia peut créer",
        demoDescription:
          "Parcourez des exemples concrets de portails, dashboards, outils de devis, parcours de réservation et expériences IA pensés pour de vrais besoins de croissance et d’exécution.",
        caseTitle: "Travaux orientés croissance",
        caseDescription:
          "Des projets choisis qui montrent comment teChia transforme des priorités business en meilleure visibilité, opérations plus propres et parcours client plus solides.",
        methodTitle:
          "Comment teChia passe d’un objectif business à une exécution digitale claire.",
        stackTitle: "Stack moderne. Exécution orientée business.",
        securityTitle: "Confiance, vitesse et croissance mesurable intégrées.",
        pricingTitle:
          "Choisissez le bon point de départ croissance, pas un forfait rigide.",
        pricingDescription:
          "Utilisez les offres pour cadrer la première phase, puis adaptez la stratégie, la construction et le déploiement au contexte métier.",
        faqTitle: "Questions avant de grandir avec nous",
        finalCtaEyebrow: "Prochaine action",
      },
      about: {
        metaTitle: "À propos de teChia Digital Solutions",
        metaDescription:
          "Découvrez comment teChia agit comme partenaire de croissance de long terme entre marketing, branding, web, automatisation, IA et logiciel.",
        eyebrow: "À propos",
        title: "Un partenaire de long terme pour la croissance des entreprises.",
        description:
          "teChia Digital Solutions aide les entreprises à grandir grâce au marketing digital, à la stratégie de marque, aux réseaux sociaux, au web, à l’automatisation, à l’IA, aux systèmes métier, au SEO et à la transformation digitale.",
        pillars: [
          "Stratégie de croissance",
          "Clarté opérationnelle",
          "Systèmes évolutifs",
        ],
        beliefTitle: "La logique teChia",
        beliefs: [
          "Les entreprises ont rarement besoin de technologie pour la technologie. Elles ont besoin de meilleurs systèmes de croissance.",
          "Marketing, branding et logiciel sont plus puissants lorsqu’ils sont pensés ensemble.",
          "L’automatisation doit enlever la friction manuelle, pas ajouter de la complexité.",
          "La transformation digitale doit améliorer à la fois l’expérience client et l’exécution interne.",
        ],
      },
      services: {
        metaTitle: "Services — teChia Digital Solutions",
        metaDescription:
          "Gestion des réseaux sociaux, marketing digital, branding, création web, e-commerce, SEO, automatisation, solutions IA, logiciels sur mesure et conseil en transformation digitale.",
        title: "Des services de croissance construits autour de vrais résultats métier",
        description:
          "Des réseaux sociaux et du marketing digital jusqu’au web, à l’automatisation, à l’IA et au logiciel sur mesure, teChia aide les entreprises à grandir avec le bon mix digital.",
      },
      solutions: {
        metaTitle: "Solutions — teChia Digital Solutions",
        metaDescription:
          "Portails clients, systèmes de devis, tableaux de bord, réservations, assistants IA et outils de croissance pour entreprises modernes.",
        title: "Des modules conçus pour la croissance client et la clarté opérationnelle",
        description:
          "Utilisez ces modules séparément ou combinez-les dans un système connecté de croissance et d’opérations.",
      },
      industries: {
        metaTitle: "Secteurs — teChia Digital Solutions",
        metaDescription:
          "Systèmes digitaux orientés croissance pour agences de voyage, logistique, écoles, cliniques, immobilier, automobile, ONG, restaurants et PME.",
        title:
          "Des solutions sectorielles pensées pour la visibilité, la conversion et la livraison",
        description:
          "Chaque page sectorielle traduit l’approche croissance de teChia dans un contexte métier précis avec un message plus clair et une vraie pertinence opérationnelle.",
        detailPillars: [
          "Capture de prospects",
          "Visibilité marché",
          "Roadmap système de croissance",
        ],
      },
      portfolio: {
        metaTitle: "Réalisations et études de cas — teChia",
        metaDescription:
          "Des études de cas montrant comment teChia relie marque, marketing, web, automatisation, IA et logiciel pour soutenir la croissance.",
        title: "Des études de cas construites autour de la croissance métier",
        description:
          "La preuve que teChia transforme des objectifs de croissance en meilleure visibilité, opérations plus fluides et parcours client plus solides.",
        detailSections: [
          "Problème",
          "Solution",
          "Fonctionnalités",
          "Stack technique",
          "Valeur métier",
        ],
        detailNarrative:
          "Un récit concis du projet montrant comment ce travail soutient un actif digital sérieux pour l’entreprise.",
        caseStudySuffix: "Étude de cas",
      },
      blog: {
        metaTitle: "Blog — teChia Digital Solutions",
        metaDescription:
          "Analyses sur les réseaux sociaux, le marketing digital, le branding, le SEO, l’automatisation, l’IA, le web et la transformation digitale.",
        title: "Une réflexion pratique pour les entreprises qui veulent grandir digitalement",
        description:
          "Des analyses utiles pour les dirigeants qui veulent améliorer visibilité, systèmes, expérience client et croissance mesurable.",
        articleEyebrow: "Analyses teChia",
        intro:
          "Cet article donne aux dirigeants une manière pratique d’évaluer leurs décisions digitales à travers la visibilité, la crédibilité de marque, les opérations et l’expérience client.",
        keyIdeaTitle: "Idée clé",
        keyIdeaBody:
          "La croissance s’améliore quand la marque, le marketing, l’expérience client et les opérations sont connectés au lieu d’être traités séparément.",
        nextStepTitle: "Prochaine étape pratique",
        nextStepBody:
          "Commencez par l’objectif business. Choisissez ensuite le bon mix entre marketing, branding, web, automatisation, IA ou logiciel.",
      },
      demoLab: {
        metaTitle: "Espace Démo — teChia Digital Solutions",
        metaDescription:
          "Démos interactives de systèmes de devis, dashboards, portails, assistants IA, réservations et logiciels métier qui soutiennent la croissance.",
        title: "La preuve interactive des workflows de croissance digitale",
        description:
          "Ces démos aident à comprendre comment des systèmes structurés améliorent la visibilité, les opérations et le suivi client.",
      },
      pricing: {
        metaTitle: "Offres — teChia Digital Solutions",
        metaDescription:
          "Offres de croissance flexibles couvrant branding, web, marketing, automatisation, IA et support logiciel.",
        title: "Des offres de croissance sans faux forfait unique",
        description:
          "Chaque entreprise démarre avec un défi de croissance différent. Ces offres cadrent la première phase et les prochaines priorités digitales.",
        addOnsTitle: "Options fréquentes",
        addOns: [
          "Landing pages de campagne supplémentaires",
          "Support contenu réseaux sociaux",
          "Refresh de marque",
          "Support contenu SEO",
          "Workflow d’automatisation",
          "Assistant IA",
          "Rapports analytics",
          "Optimisation continue",
        ],
      },
      contact: {
        metaTitle: "Contact — teChia Digital Solutions",
        metaDescription:
          "Contactez teChia Digital Solutions pour la gestion des réseaux sociaux, le marketing digital, le branding, le web, l’automatisation, l’IA, le logiciel et la transformation digitale.",
        title: "Dites-nous où votre entreprise veut grandir",
        description:
          "Partagez l’objectif, le blocage ou l’opportunité. Nous recommanderons le bon chemin entre marketing, branding, technologie et automatisation.",
        detailsTitle: "Coordonnées",
        location:
          "Douala, Cameroun — accompagnement des PME africaines et internationales",
        emailLabel: "Email",
        emailDesc: "Réponse sous 1 jour ouvrable",
        whatsappLabel: "WhatsApp",
        whatsappDesc: "Le moyen le plus rapide pour nous joindre",
        callLabel: "Téléphone",
        callDesc: "Disponible Lun–Ven, 9h–18h WAT",
      },
      startProject: {
        metaTitle: "Démarrer un projet — teChia Digital Solutions",
        metaDescription:
          "Lancez un projet orienté croissance avec teChia autour du marketing, du branding, du web, du e-commerce, du SEO, de l’automatisation, de l’IA, du logiciel et de la transformation digitale.",
        title: "Commencez par votre objectif de croissance",
        description:
          "Ce formulaire aide teChia à comprendre vos priorités business et à recommander le bon mélange de stratégie, de création et de technologie.",
      },
      landing: {
        eyebrow: "Landing page Google Ads",
        titlePrefix: "Solutions premium de",
        titleConnector: "pour",
        description:
          "teChia aide les PME à grandir avec un meilleur message, plus de visibilité, des expériences digitales prêtes à convertir et une feuille de route vers l’automatisation et les systèmes sur mesure.",
        trust: [
          "Pages rapides",
          "Événements de conversion GA4",
          "Métadonnées SEO",
          "Mobile-first",
          "Structure bilingue",
          "Formulaires sécurisés",
        ],
        whyTitle: "Pourquoi c’est important",
        whyDescription:
          "Les acheteurs européens attendent clarté, confiance, sécurité, rapidité et communication professionnelle avant de réserver un appel.",
        benefits: [
          "Inspirer confiance rapidement",
          "Capturer des prospects sérieux",
          "Mesurer les conversions",
        ],
        benefitBody:
          "Une landing page ciblée rend votre offre plus facile à comprendre et plus facile à contacter.",
        metaFallbackTitle: "Landing Page — teChia",
        metaDescription:
          "Landing page orientée conversion pour les PME européennes qui veulent plus de visibilité, plus de crédibilité digitale et des systèmes de croissance évolutifs.",
      },
      admin: {
        metaTitle: "Accès admin — teChia",
        metaDescription:
          "Accès administratif réservé à teChia Digital Solutions.",
        eyebrow: "Accès réservé",
        title: "Centre de pilotage teChia",
        description:
          "Cet espace est réservé aux opérations autorisées de teChia. Les demandes clients, projets et contenus sont gérés à travers des processus internes sécurisés.",
        sections: [
          "Gestion des prospects",
          "Demandes de projet",
          "Opérations contenu",
          "Suivi des services",
        ],
        statusTitle: "Priorités opérationnelles",
        statusBody:
          "L’équipe analyse les demandes qualifiées, prépare les recommandations et suit chaque projet de la découverte à la proposition, puis de la livraison au support.",
      },
    },
    sections: {
      services: "Services de croissance",
      solutions: "Systèmes de croissance",
      industries: "Secteurs accompagnés",
      method: "La méthode teChia",
      stack: "Crédibilité technologique",
      security: "Fondation sécurité, SEO et performance",
      testimonials: "Preuves de croissance",
      faq: "Questions fréquentes",
      pricing: "Offres de croissance",
      demoLab: "Démos interactives",
      caseStudies: "Études de cas croissance",
    },
    solutions: [
      {
        slug: "client-portals",
        title: "Portails clients",
        description:
          "Un espace privé pour envoyer des demandes, suivre l’avancement, déposer des documents et rester informé.",
      },
      {
        slug: "quote-generators",
        title: "Générateurs de devis",
        description:
          "Transformer les demandes de prix en données structurées, réponses rapides et relances claires.",
      },
      {
        slug: "booking-systems",
        title: "Systèmes de réservation",
        description:
          "Permettre aux clients de demander rendez-vous, appels, consultations ou services sans discussions interminables.",
      },
      {
        slug: "dashboards",
        title: "Tableaux de bord admin",
        description:
          "Un centre de contrôle clair pour prospects, commandes, documents, rapports et décisions opérationnelles.",
      },
      {
        slug: "ai-assistants",
        title: "Assistants métier IA",
        description:
          "Utiliser l’IA pour répondre, guider les prospects, résumer les demandes et soutenir les processus internes.",
      },
      {
        slug: "ads-landing-pages",
        title: "Pages de conversion Google Ads",
        description:
          "Pages de campagne avec analytics, événements de conversion et message adapté au marché cible.",
      },
    ],
    method: [
      "Clarifier le vrai défi de croissance",
      "Concevoir le bon mix entre marketing, marque et technologie",
      "Construire vite avec des outils modernes et sécurisés",
      "Lancer avec SEO, analytics et suivi des conversions",
      "Améliorer continuellement à mesure que l’entreprise grandit",
    ],
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Prisma",
      "PostgreSQL",
      "Vercel",
      "Cloudflare",
      "AWS S3",
      "Auth.js",
      "OpenAI API",
      "pgvector",
      "GA4",
      "Google Search Console",
      "Schema.org",
      "SEO technique",
      "Core Web Vitals",
      "Lighthouse",
      "Resend",
    ],
    securityPromise: [
      "Validation côté serveur",
      "APIs protégées contre les abus",
      "En-têtes de sécurité",
      "Livraison edge-ready",
      "Analytics respectueux de la vie privée",
      "Balisage Schema et vérifications d’indexation",
      "Interface accessible",
      "Core Web Vitals",
    ],
    services: sharedServicesFr,
    industries: industriesFr,
    caseStudies: caseStudiesFr,
    blog: blogFr,
    pricing: [
      {
        slug: "digital-foundation",
        title: "Growth Launchpad",
        badge: "Meilleur premier pas",
        description:
          "Pour les entreprises qui ont besoin d’une marque plus claire, d’une présence sociale mieux posée et d’une base digitale prête à convertir.",
        features: [
          "Refresh de positionnement",
          "Setup réseaux sociaux",
          "Présence web essentielle",
          "Flux de capture de leads",
        ],
        cta: "Planifier mon launchpad",
      },
      {
        slug: "business-pro-website",
        title: "Visibility & Demand Engine",
        badge: "Le plus demandé",
        description:
          "Pour les entreprises prêtes à faire grandir leur visibilité avec marketing digital, landing pages, SEO et campagnes orientées leads qualifiés.",
        features: [
          "Landing pages de campagne",
          "Fondations SEO",
          "Analytics et conversions",
          "Support contenu et funnel",
        ],
        cta: "Planifier mon moteur de demande",
      },
      {
        slug: "business-os",
        title: "Growth Operations System",
        badge: "Opérations",
        description:
          "Pour les équipes qui veulent connecter marketing, leads, suivi, workflows internes et reporting dans un système métier plus lisible.",
        features: [
          "Gestion leads et demandes",
          "Workflows automatisés",
          "Dashboards et reporting",
          "Structure de données métier",
        ],
        cta: "Discuter du système d’opérations",
      },
      {
        slug: "custom-enterprise-system",
        title: "AI & Custom Software Platform",
        badge: "Sur mesure",
        description:
          "Pour les entreprises qui ont besoin d’un logiciel sur mesure, d’IA utile et d’une transformation digitale plus profonde entre plusieurs services.",
        features: [
          "Atelier découverte",
          "Roadmap logiciel",
          "Design de workflow IA",
          "Livraison par rôle",
        ],
        cta: "Réserver une session stratégie",
      },
      {
        slug: "maintenance-growth",
        title: "Continuous Growth Support",
        badge: "Support mensuel",
        description:
          "Optimisation continue des campagnes, contenus, SEO, sites, automatisations et systèmes digitaux après le lancement.",
        features: [
          "Revues de performance",
          "Mises à jour SEO et contenu",
          "Améliorations d’automatisation",
          "Support prioritaire",
        ],
        cta: "Demander un support continu",
      },
    ],
    testimonials: [
      {
        quote:
          "La direction système rend le projet plus fort qu’un simple site, tout en restant pratique.",
        name: "Dirigeant local",
        role: "PME camerounaise",
      },
      {
        quote:
          "Le meilleur point est l’unification du site, du tableau de bord, des prospects et de la communication client.",
        name: "Responsable opérations",
        role: "Entreprise de services",
      },
      {
        quote:
          "La présence semble prête pour l’international sans oublier les réalités locales.",
        name: "Fondatrice",
        role: "Voyage et conseil",
      },
    ],
    faqs: [
      {
        question: "Vous aidez seulement sur les sites web ?",
        answer:
          "Non. Le site n’est qu’une partie du travail. teChia peut commencer par les réseaux sociaux, le marketing digital, le branding, le SEO, l’automatisation, l’IA, le logiciel ou une feuille de route croissance plus large selon le vrai besoin.",
      },
      {
        question: "teChia peut gérer à la fois le marketing et la technologie ?",
        answer:
          "Oui. teChia est conçu pour relier visibilité, marque, acquisition, automatisation, IA et logiciel dans un seul système de croissance cohérent.",
      },
      {
        question: "Travaillez-vous hors du Cameroun ?",
        answer:
          "Oui. teChia s’adresse aux entreprises locales, PME africaines et clients internationaux, notamment les PME européennes.",
      },
      {
        question: "Restez-vous impliqués après le lancement ?",
        answer:
          "Oui. teChia peut continuer avec l’optimisation des campagnes, le SEO, les contenus, le support technique, les améliorations d’automatisation et la prochaine couche digitale à mesure que l’entreprise évolue.",
      },
    ],
    simulator: {
      title: "Simulateur de digitalisation d’entreprise",
      description:
        "Sélectionnez votre réalité et découvrez le type de solution digitale recommandée.",
      businessTypes: [
        "Agence de voyage",
        "Entreprise logistique",
        "École",
        "Clinique",
        "Agence immobilière",
        "Concession automobile",
        "Restaurant",
        "Consultant",
        "ONG",
        "Entreprise sur mesure",
      ],
      problems: [
        "Nous avons besoin de plus de clients",
        "Nous gérons tout manuellement",
        "Nous perdons le suivi des demandes",
        "Nous avons besoin de réservations en ligne",
        "Nous avons besoin d’un site professionnel",
        "Nous avons besoin d’un tableau de bord",
        "Nous avons besoin d’une meilleure communication",
        "Nous avons besoin d’automatisation",
        "Nous avons besoin d’un portail client",
        "Nous devons organiser devis/factures/documents",
      ],
      outcomes: [
        "Plus de prospects",
        "Meilleure organisation",
        "Réponse client plus rapide",
        "Meilleure image",
        "Tableau de bord interne",
        "Portail client",
        "Processus automatisés",
        "Crédibilité internationale",
        "Visibilité SEO",
        "Conversions Google Ads",
      ],
      recommendationLabel: "Solution digitale recommandée",
      helperText:
        "Utilisez ce simulateur pour clarifier le bon point de départ avant une discussion projet.",
      labels: {
        business: "Entreprise",
        problem: "Problème",
        outcome: "Résultat attendu",
      },
      packages: {
        businessOs: "Système métier",
        portal: "Site Pro + portail",
        website: "Site Pro",
      },
      modules: {
        website: "Site web premium",
        leadCapture: "Capture de prospects",
        adminDashboard: "Tableau de bord admin",
        conversionLandingPage: "Page de conversion",
        clientPortal: "Portail client",
        analyticsTracking: "Suivi analytics",
      },
      recommendationSentence:
        "Pour une activité de type {business} qui indique « {problem} » et souhaite « {outcome} ».",
      requestCta: "Demander cette solution",
    },
    demos: [
      "Démo générateur de devis logistique",
      "Démo tableau de bord agence de voyage",
      "Démo portail scolaire",
      "Démo catalogue automobile",
      "Démo assistant métier IA",
      "Démo système de réservation",
      "Démo portail client",
    ],
    demoGrid: {
      conceptPreview: "Aperçu interactif du processus",
      livePreview: "Démo opérationnelle",
      metrics: [
        "Nouvelles demandes",
        "Temps de réponse",
        "Signal de conversion",
      ],
      metricValues: ["24", "2h", "Élevé"],
      workflow: [
        "Le client envoie une demande structurée",
        "Le système recommande la prochaine action",
        "L’admin voit la priorité et le statut",
        "Le suivi email/WhatsApp est préparé",
      ],
      status: "Prêt",
      description:
        "Cet aperçu montre comment teChia transforme une idée métier en processus digital utile, avec des demandes claires, des priorités et un suivi structuré.",
      requestTitle: "Demander cette démo",
      requestDescription:
        "Choisissez un processus et envoyez une courte note. L’équipe admin le verra dans la file des demandes démo.",
      requestButton: "Demander la démo",
    },
    forms: {
      name: "Nom",
      email: "Adresse e-mail",
      phone: "Téléphone / WhatsApp",
      company: "Nom de l’entreprise",
      country: "Pays",
      language: "Langue préférée",
      businessType: "Type d’entreprise",
      need: "De quoi avez-vous besoin ?",
      budget: "Fourchette de budget",
      timeline: "Délai",
      details: "Détails du projet",
      message: "Message",
      consent: "J’accepte d’être contacté au sujet de ce projet.",
      submit: "Envoyer la demande",
      sending: "Envoi...",
      success:
        "Votre message a été reçu. Nous allons l’analyser et répondre avec la meilleure prochaine étape.",
      error:
        "Une erreur est survenue. Veuillez réessayer ou nous contacter directement.",
    },
    legal: {
      privacy: "Politique de confidentialité",
      terms: "Conditions d’utilisation",
      cookies: "Politique relative aux cookies",
      eyebrow: "Mentions légales",
      metaDescription: "Informations légales de teChia Digital Solutions.",
      pages: {
        privacy: [
          "teChia Digital Solutions collecte les informations nécessaires pour répondre aux demandes, comprendre les besoins de projet, envoyer les mises à jour demandées et améliorer l’expérience du site.",
          "Les informations envoyées via les formulaires peuvent inclure votre nom, adresse e-mail, téléphone, entreprise, pays, détails du projet et préférences de communication.",
          "Les formulaires sont validés, protégés contre les abus et conçus avec des analytics respectueux de la vie privée. Évitez d’envoyer des données personnelles sensibles via les formulaires publics.",
          "Pour toute question liée à la confidentialité ou aux données, contactez l’entreprise via les coordonnées de la page contact.",
        ],
        terms: [
          "En utilisant ce site, vous acceptez d’interagir avec teChia Digital Solutions de manière légale, respectueuse et exacte.",
          "Le contenu du site présente les services, capacités et approches de projet. Le périmètre, les prix, les délais et les responsabilités sont confirmés dans des accords de projet écrits.",
          "Les éléments de marque, textes, designs, systèmes et travaux techniques restent protégés par les règles de propriété intellectuelle applicables, sauf accord écrit contraire.",
          "Pour toute question de service, condition de projet ou précision commerciale, contactez teChia via la page contact.",
        ],
        cookies: [
          "teChia Digital Solutions utilise des cookies essentiels et des analytics respectueux de la vie privée pour assurer la fiabilité du site, comprendre les performances et améliorer l’expérience visiteur.",
          "Les données analytics sont utilisées de manière agrégée pour mesurer la performance des pages, la qualité du trafic et les événements de conversion comme les formulaires de contact ou de projet.",
          "Vous pouvez gérer les cookies depuis les paramètres de votre navigateur. Certaines fonctions essentielles du site peuvent dépendre des cookies ou du stockage local.",
          "Pour toute question sur les cookies ou le suivi, contactez l’entreprise via les coordonnées de la page contact.",
        ],
      },
    },
    ui: {
      company: "Entreprise",
      legal: "Légal",
      footerDescription:
        "teChia Digital Solutions aide les entreprises à grandir grâce à la gestion des réseaux sociaux, au marketing digital, au branding, aux sites premium, au SEO, à l’automatisation, aux solutions IA et aux logiciels sur mesure.",
      allRightsReserved: "Tous droits réservés.",
      footerPromise: "Digitaliser. Simplifier. Grandir.",
      newsletterJoin: "S’inscrire",
      newsletterLoading: "...",
      newsletterSuccess: "Inscription confirmée.",
      newsletterError: "Inscription impossible.",
      languageSwitcher: "Sélecteur de langue",
      mainNavigation: "Navigation principale",
      openMenu: "Ouvrir le menu",
      closeMenu: "Fermer le menu",
      toggleTheme: "Changer le thème",
      logoHome: "Accueil teChia Digital Solutions",
      notFoundTitle: "Page introuvable",
      notFoundBody: "La page recherchée n’existe pas ou a été déplacée.",
      backHome: "Retour à l’accueil",
      errorEyebrow: "Erreur d’application",
      errorTitle: "Une erreur est survenue",
      errorBody:
        "Veuillez réessayer. L’application est conçue pour ne pas exposer les erreurs sensibles de production.",
      tryAgain: "Réessayer",
    },
  },
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export const europeLandingPages = [
  {
    slug: "europe-business-websites",
    market: { en: "Europe", fr: "l’Europe" },
    service: { en: "business websites", fr: "sites web d’entreprise" },
  },
  {
    slug: "europe-custom-business-systems",
    market: { en: "Europe", fr: "l’Europe" },
    service: {
      en: "custom business systems",
      fr: "systèmes métiers sur mesure",
    },
  },
  {
    slug: "small-business-website-design-europe",
    market: { en: "European SMEs", fr: "les PME européennes" },
    service: {
      en: "small business website design",
      fr: "création de sites pour PME",
    },
  },
  {
    slug: "business-management-systems-for-smes",
    market: { en: "SMEs", fr: "les PME" },
    service: {
      en: "business management systems",
      fr: "systèmes de gestion d’entreprise",
    },
  },
  {
    slug: "uk-business-websites",
    market: { en: "UK", fr: "le Royaume-Uni" },
    service: { en: "business websites", fr: "sites web d’entreprise" },
  },
  {
    slug: "france-business-websites",
    market: { en: "France", fr: "la France" },
    service: { en: "business websites", fr: "sites web d’entreprise" },
  },
  {
    slug: "germany-business-websites",
    market: { en: "Germany", fr: "l’Allemagne" },
    service: { en: "business websites", fr: "sites web d’entreprise" },
  },
] as const;

export const mergedPageAnchors = {
  services: {
    overview: "services-overview",
    catalog: "services-catalog",
    solutions: "solution-modules",
    industries: "industry-focus",
    method: "delivery-method",
  },
  about: {
    overview: "about-overview",
    team: "team-capability",
    founder: "founder-bridge",
    portfolio: "portfolio-work",
    proof: "portfolio-feedback",
  },
} as const;

export function getLocalizedHref(locale: Locale, path = "") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const rootOnlyPrefixes = ["/client-portal", "/request-quote"];
  if (
    rootOnlyPrefixes.some(
      (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
    )
  ) {
    return normalized;
  }
  return getLocalizedAppPath(locale, normalized);
}

export function getLocalizedSectionHref(
  locale: Locale,
  path: string,
  hash: string,
) {
  return `${getLocalizedHref(locale, path)}#${hash}`;
}

export function getSolutionSectionId(slug: string) {
  return `solution-${slug}`;
}

export function getSolutionHrefPath(slug: string) {
  return `/services#${getSolutionSectionId(slug)}`;
}

export function getLocalizedSolutionHref(locale: Locale, slug: string) {
  return getLocalizedSectionHref(
    locale,
    "/services",
    getSolutionSectionId(slug),
  );
}
