export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];

export const siteConfig = {
  name: "teChia Digital Solutions",
  shortName: "teChia",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://techiadigital.com",
  email: process.env.NEXT_PUBLIC_OFFICIAL_EMAIL || process.env.OFFICIAL_EMAIL || "",
  whatsapp: process.env.NEXT_PUBLIC_OFFICIAL_WHATSAPP || process.env.OFFICIAL_WHATSAPP || "",
  phone: process.env.NEXT_PUBLIC_OFFICIAL_CALL || process.env.OFFICIAL_CALL || "",
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
    slug: "website-design-development",
    title: "Website Design & Development",
    description:
      "Premium, SEO-ready websites that make your business look credible, fast, and international from the first click.",
    features: [
      "Marketing websites",
      "Landing pages",
      "Conversion copy",
      "CMS-ready structure",
    ],
  },
  {
    slug: "business-management-systems",
    title: "Business Management Systems",
    description:
      "Custom internal systems that organize leads, staff, workflows, documents, inventory, quotes, and customer requests.",
    features: [
      "Admin dashboards",
      "Role-based flows",
      "Data management",
      "Operational reporting",
    ],
  },
  {
    slug: "custom-web-applications",
    title: "Custom Web Applications",
    description:
      "Modern web applications built around your business model instead of forcing your business to fit generic tools.",
    features: [
      "Client portals",
      "Booking systems",
      "Quote systems",
      "Marketplaces",
    ],
  },
  {
    slug: "automation-workflow-systems",
    title: "Automation & Workflow Systems",
    description:
      "Automation that removes repetitive work and keeps customers, teams, and managers moving in the same direction.",
    features: [
      "Email workflows",
      "WhatsApp-ready flows",
      "Notifications",
      "Follow-up systems",
    ],
  },
  {
    slug: "ai-powered-business-tools",
    title: "AI-Powered Business Tools",
    description:
      "Practical AI assistants, content helpers, estimators, and decision-support tools for real business workflows.",
    features: [
      "AI assistants",
      "Smart forms",
      "Document helpers",
      "Knowledge interfaces",
    ],
  },
  {
    slug: "seo-google-ads-landing-pages",
    title: "SEO & Google Ads Landing Pages",
    description:
      "Focused pages designed for search visibility, paid traffic, lead capture, and strong conversion measurement.",
    features: [
      "Local SEO",
      "European landing pages",
      "GA4 events",
      "Campaign pages",
    ],
  },
  {
    slug: "maintenance-support",
    title: "Website Maintenance & Support",
    description:
      "Security, content updates, monitoring, technical improvements, and growth support after launch.",
    features: [
      "Bug fixes",
      "Performance checks",
      "Backups",
      "Monthly improvements",
    ],
  },
  {
    slug: "branding-digital-presence",
    title: "Branding & Digital Presence",
    description:
      "A sharper online presence across your website, messaging, proposal assets, and trust-building customer touchpoints.",
    features: [
      "Brand positioning",
      "Visual systems",
      "Copywriting",
      "Digital credibility",
    ],
  },
];

const sharedServicesFr: CardItem[] = [
  {
    slug: "website-design-development",
    title: "Création de sites web premium",
    description:
      "Des sites rapides, professionnels et optimisés SEO pour inspirer confiance dès la première visite.",
    features: [
      "Sites vitrines",
      "Pages de conversion",
      "Contenu orienté client",
      "Architecture évolutive",
    ],
  },
  {
    slug: "business-management-systems",
    title: "Systèmes de gestion d’entreprise",
    description:
      "Des plateformes internes pour organiser prospects, équipes, processus, documents, stocks, devis et demandes clients.",
    features: [
      "Tableaux de bord",
      "Rôles utilisateurs",
      "Gestion des données",
      "Rapports opérationnels",
    ],
  },
  {
    slug: "custom-web-applications",
    title: "Applications web sur mesure",
    description:
      "Des applications modernes construites autour de votre modèle d’affaires, pas autour d’un outil générique.",
    features: ["Portails clients", "Réservations", "Devis", "Places de marché"],
  },
  {
    slug: "automation-workflow-systems",
    title: "Automatisation & processus",
    description:
      "Des automatisations qui réduisent le travail répétitif et améliorent la coordination entre clients, équipes et managers.",
    features: [
      "Emails automatisés",
      "Parcours compatibles WhatsApp",
      "Notifications",
      "Relances",
    ],
  },
  {
    slug: "ai-powered-business-tools",
    title: "Outils métier alimentés par l’IA",
    description:
      "Des assistants IA, estimateurs et interfaces intelligentes adaptés à de vrais processus métier.",
    features: [
      "Assistants IA",
      "Formulaires intelligents",
      "Aide documentaire",
      "Interfaces de connaissance",
    ],
  },
  {
    slug: "seo-google-ads-landing-pages",
    title: "SEO & pages de conversion Google Ads",
    description:
      "Des pages conçues pour la visibilité, le trafic payant, la conversion et la mesure des résultats.",
    features: ["SEO local", "Pages Europe", "Événements GA4", "Pages campagne"],
  },
  {
    slug: "maintenance-support",
    title: "Maintenance & support",
    description:
      "Sécurité, mises à jour, surveillance, améliorations techniques et accompagnement après la mise en ligne.",
    features: [
      "Corrections",
      "Performance",
      "Sauvegardes",
      "Améliorations mensuelles",
    ],
  },
  {
    slug: "branding-digital-presence",
    title: "Image de marque & présence digitale",
    description:
      "Une présence plus crédible sur votre site, votre message, vos supports commerciaux et vos points de contact clients.",
    features: [
      "Positionnement",
      "Système visuel",
      "Rédaction persuasive",
      "Crédibilité digitale",
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
      title: "teChia Digital Solutions — Digital Homes for Modern Businesses",
      description:
        "Premium websites, business systems, automation tools, and AI-powered platforms for local businesses, African SMEs, and international clients.",
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
      eyebrow: "Digital transformation studio for ambitious businesses",
      title: "Digital Homes for Modern Businesses",
      description:
        "teChia Digital Solutions builds premium websites, custom business systems, automation tools, and AI-powered digital platforms that help businesses attract clients, organize operations, and grow with confidence.",
      trust: [
        "Premium Websites",
        "Business Systems",
        "Automation",
        "AI Tools",
        "SEO-Ready",
        "European Client Ready",
        "Local Business Friendly",
      ],
    },
    home: {
      problemTitle:
        "Most businesses do not need more complexity. They need better systems.",
      problemBody:
        "When your website, customer communication, documents, quotes, and follow-ups live in different places, growth becomes harder than it should be. We design the digital layer that makes the business easier to understand and easier to run.",
      digitalHomeTitle: "A digital home is more than a website.",
      digitalHomeBody:
        "It is your public brand, your lead engine, your client portal, your dashboard, your automation layer, and your data foundation working together.",
      europeTitle: "Built for local trust and international credibility.",
      europeBody:
        "Whether a client finds you from Douala, Lagos, Paris, Berlin, London, or a Google Ads campaign, your digital presence should feel serious, clear, and safe.",
      finalCtaTitle: "Ready to digitalize your business properly?",
      finalCtaBody:
        "Tell us what you are building. We will recommend the cleanest path from website to system to automation.",
    },
    pages: {
      home: {
        realityEyebrow: "Reality check",
        servicesTitle: "From website to operating system",
        servicesDescription:
          "Start with the digital presence you need now, then expand into dashboards, automation, portals, and growth support.",
        demoTitle: "See how teChia systems work",
        demoDescription:
          "Interactive demos show how digital workflows turn inquiries, operations, and follow-up into a clearer customer experience.",
        caseTitle: "Proof through projects, products, and systems",
        caseDescription:
          "Selected work showing how teChia connects business value, user experience, and operational clarity.",
        methodTitle: "A clear path from idea to delivery.",
        stackTitle: "Modern stack. Practical engineering.",
        securityTitle: "Built with trust signals from day one.",
        pricingTitle: "Start focused. Grow intelligently.",
        pricingDescription:
          "Flexible packages make it easy to begin with a strong digital presence and expand into systems, automation, and growth support.",
        faqTitle: "Questions before we start",
        finalCtaEyebrow: "Next step",
      },
      about: {
        metaTitle: "About teChia Digital Solutions",
        metaDescription:
          "Learn how teChia creates premium websites, smart systems, automation, and AI-powered tools for modern businesses.",
        eyebrow: "About",
        title: "Simple problems. Smart tech solutions.",
        description:
          "teChia Digital Solutions helps serious businesses create a professional digital layer that attracts clients, organizes operations, and creates room for growth.",
        pillars: ["Digital homes", "Operational clarity", "Global credibility"],
        beliefTitle: "What we believe",
        beliefs: [
          "A website should be a business asset, not decoration.",
          "Local businesses deserve international-quality digital presence.",
          "Good systems make teams calmer, faster, and more organized.",
          "Technology should reduce confusion, not create more of it.",
        ],
      },
      services: {
        metaTitle: "Services — teChia Digital Solutions",
        metaDescription:
          "Premium website design, business systems, automation, AI tools, SEO landing pages, and maintenance services.",
        title: "Services that turn a business into a digital system",
        description:
          "Start with a website, expand into dashboards, automation, portals, SEO, and ongoing growth.",
      },
      solutions: {
        metaTitle: "Solutions — teChia Digital Solutions",
        metaDescription:
          "Client portals, quote systems, dashboards, booking systems, AI assistants, and landing pages for modern businesses.",
        title: "Smart modules for real business problems",
        description:
          "Use these modules independently or combine them into a full business operating system.",
      },
      industries: {
        metaTitle: "Industries — teChia Digital Solutions",
        metaDescription:
          "Search-ready websites and custom systems for travel agencies, logistics companies, schools, clinics, real estate, car dealerships, NGOs, restaurants, and SMEs.",
        title: "Industry pages built for visibility and conversion",
        description:
          "Each industry page supports organic search, Google Ads, and clear business-specific messaging.",
        detailPillars: [
          "Lead capture",
          "Search visibility",
          "Business system roadmap",
        ],
      },
      portfolio: {
        metaTitle: "Portfolio and Case Studies — teChia",
        metaDescription:
          "A portfolio of client projects and digital products showing teChia capability across websites, dashboards, automation, and business systems.",
        title: "Projects, products, and business systems",
        description:
          "Clear case studies that show how teChia thinks about business value, not only visuals.",
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
          "Practical articles on digital homes, websites, business systems, automation, SEO, dashboards, and digital credibility.",
        title: "Thought leadership for serious business digitalization",
        description:
          "Practical insights for companies that want a stronger digital presence, clearer operations, and measurable growth.",
        articleEyebrow: "teChia insights",
        intro:
          "This article gives business leaders a practical way to evaluate digital decisions through brand credibility, lead generation, operations, and customer experience.",
        keyIdeaTitle: "Key idea",
        keyIdeaBody:
          "A serious digital presence connects brand, lead generation, customer communication, internal organization, and measurable growth. That is the difference between having a website and owning a digital home.",
        nextStepTitle: "Practical next step",
        nextStepBody:
          "Audit the business workflow first. Then choose whether the company needs a website, a dashboard, a portal, automation, or a combined system.",
      },
      demoLab: {
        metaTitle: "Demo Lab — teChia Digital Solutions",
        metaDescription:
          "Interactive demos for logistics quote systems, travel dashboards, school portals, car inventory, AI assistants, booking systems, and client portals.",
        title: "Interactive proof of digital workflows",
        description:
          "These demos help prospects understand how structured systems improve inquiries, operations, and customer follow-up.",
      },
      pricing: {
        metaTitle: "Pricing — teChia Digital Solutions",
        metaDescription:
          "Flexible website, business system, enterprise, and monthly maintenance packages for modern businesses.",
        title: "Premium packages without fake one-size-fits-all pricing",
        description:
          "Every business has a different starting point. Use these packages to frame the scope, timeline, and best next step.",
        addOnsTitle: "Common add-ons",
        addOns: [
          "Extra landing pages",
          "Blog setup",
          "Admin dashboard",
          "AI assistant",
          "Analytics reporting",
          "Content writing",
          "Maintenance",
          "SEO support",
        ],
      },
      contact: {
        metaTitle: "Contact — teChia Digital Solutions",
        metaDescription:
          "Contact teChia Digital Solutions for premium websites, business systems, automation, and digital transformation projects.",
        title: "Tell us what you are trying to create",
        description:
          "Send a message for websites, systems, automation, dashboards, AI tools, or digital transformation strategy.",
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
          "Start a serious project inquiry for websites, business systems, dashboards, automation, AI tools, and digital transformation.",
        title: "Start with clarity, not confusion",
        description:
          "This inquiry flow captures the information needed to recommend the right digital solution, package, and next step.",
      },
      landing: {
        eyebrow: "Google Ads landing page",
        titlePrefix: "Premium",
        titleConnector: "for",
        description:
          "teChia helps SMEs create a credible digital home: professional website, clear messaging, lead capture, analytics, SEO structure, and a roadmap toward custom business systems.",
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
          "Conversion-focused landing page for European SMEs needing premium websites, business systems, automation, and digital credibility.",
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
      services: "Premium services",
      solutions: "Smart solutions",
      industries: "Industries served",
      method: "The teChia Method",
      stack: "Technology credibility",
      security: "Security, SEO, and performance promise",
      testimonials: "Client-ready confidence",
      faq: "Frequently asked questions",
      pricing: "Flexible packages",
      demoLab: "Interactive demos",
      caseStudies: "Featured work",
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
      "Discover the real business problem",
      "Design a clean digital system",
      "Build fast with secure modern tools",
      "Launch with SEO, analytics, and conversion tracking",
      "Improve continuously after release",
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
        title: "Digital Foundation",
        badge: "Best first step",
        description:
          "A premium website foundation for a serious small business ready to look credible online.",
        features: [
          "5–8 core pages",
          "Bilingual-ready structure",
          "SEO setup",
          "Contact/inquiry flow",
        ],
        cta: "Request foundation quote",
      },
      {
        slug: "business-pro-website",
        title: "Business Pro Website",
        badge: "Most popular",
        description:
          "A stronger website with landing pages, richer content, analytics events, and conversion-focused architecture.",
        features: [
          "10–20 pages",
          "Industry landing pages",
          "GA4 conversion events",
          "Blog/content structure",
        ],
        cta: "Plan my pro website",
      },
      {
        slug: "business-os",
        title: "Business OS",
        badge: "Operations upgrade",
        description:
          "A custom website plus internal dashboard, leads, inquiries, workflows, and structured business data.",
        features: [
          "Admin dashboard",
          "Database",
          "Lead management",
          "Operational modules",
        ],
        cta: "Discuss Business OS",
      },
      {
        slug: "custom-enterprise-system",
        title: "Custom Enterprise System",
        badge: "Fully custom",
        description:
          "A tailored platform for complex workflows, multiple departments, role-based access, and automation.",
        features: [
          "Discovery workshop",
          "Custom architecture",
          "Role-based tools",
          "Roadmap delivery",
        ],
        cta: "Book a discovery call",
      },
      {
        slug: "maintenance-growth",
        title: "Maintenance & Growth",
        badge: "Monthly support",
        description:
          "Ongoing technical care, monitoring, improvements, content updates, and performance support.",
        features: [
          "Security checks",
          "Content updates",
          "SEO improvements",
          "Priority fixes",
        ],
        cta: "Request support plan",
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
        question: "Do you only build websites?",
        answer:
          "No. Websites are often the first step, but we also build dashboards, portals, automation flows, quote systems, booking tools, and full business operating systems.",
      },
      {
        question: "Can you work with businesses outside Cameroon?",
        answer:
          "Yes. teChia is designed for local businesses, African SMEs, and international clients, especially European SMEs that need premium digital systems.",
      },
      {
        question: "Can the website be bilingual?",
        answer:
          "Yes. teChia creates English and French routing, metadata, navigation, and content structures for bilingual projects, and the same architecture can support additional languages when your market needs them.",
      },
      {
        question: "Do you support after launch?",
        answer:
          "Yes. Maintenance and growth packages can cover security, performance, content updates, technical fixes, and new features.",
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
        "Premium websites, smart systems, automation tools, and digital homes for modern businesses.",
      allRightsReserved: "All rights reserved.",
      footerPromise:
        "Built for speed, trust, accessibility, and measurable growth.",
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
        "teChia Digital Solutions — Maisons digitales pour entreprises modernes",
      description:
        "Sites web premium, systèmes de gestion, automatisation et plateformes IA pour entreprises locales, PME africaines et clients internationaux.",
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
      eyebrow: "Studio de transformation digitale pour entreprises ambitieuses",
      title: "Maisons digitales pour entreprises modernes",
      description:
        "teChia Digital Solutions crée des sites premium, systèmes métiers, automatisations et plateformes digitales alimentées par l’IA pour aider les entreprises à attirer des clients, organiser leurs opérations et grandir avec confiance.",
      trust: [
        "Sites premium",
        "Systèmes métiers",
        "Automatisation",
        "Outils IA",
        "Optimisé SEO",
        "Crédibilité européenne",
        "Adapté aux entreprises locales",
      ],
    },
    home: {
      problemTitle:
        "La plupart des entreprises n’ont pas besoin de plus de complexité. Elles ont besoin de meilleurs systèmes.",
      problemBody:
        "Quand votre site, vos messages clients, documents, devis et relances sont dispersés, la croissance devient inutilement difficile. Nous concevons la couche digitale qui rend l’entreprise plus claire et plus facile à gérer.",
      digitalHomeTitle: "Une maison digitale est plus qu’un site web.",
      digitalHomeBody:
        "C’est votre marque publique, votre moteur de prospects, votre portail client, votre tableau de bord, votre automatisation et votre base de données qui travaillent ensemble.",
      europeTitle:
        "Conçu pour la confiance locale et la crédibilité internationale.",
      europeBody:
        "Qu’un client vous trouve depuis Douala, Lagos, Paris, Berlin, Londres ou une campagne Google Ads, votre présence digitale doit paraître sérieuse, claire et fiable.",
      finalCtaTitle: "Prêt à digitaliser votre entreprise sérieusement ?",
      finalCtaBody:
        "Expliquez votre projet. Nous recommanderons le parcours le plus clair du site web au système métier, puis à l’automatisation.",
    },
    pages: {
      home: {
        realityEyebrow: "Point de réalité",
        servicesTitle: "Du site web au système métier",
        servicesDescription:
          "Commencez par la présence digitale dont vous avez besoin maintenant, puis évoluez vers les tableaux de bord, l’automatisation, les portails et l’accompagnement croissance.",
        demoTitle: "Découvrez le fonctionnement des systèmes teChia",
        demoDescription:
          "Les démos interactives montrent comment les processus digitaux transforment les demandes, les opérations et le suivi en une expérience client plus claire.",
        caseTitle: "Des preuves à travers projets, produits et systèmes",
        caseDescription:
          "Une sélection de réalisations qui montre comment teChia relie valeur métier, expérience utilisateur et clarté opérationnelle.",
        methodTitle: "Un parcours clair de l’idée à la livraison.",
        stackTitle: "Stack moderne. Ingénierie pratique.",
        securityTitle: "Conçu avec des signaux de confiance dès le départ.",
        pricingTitle: "Commencer avec précision. Grandir intelligemment.",
        pricingDescription:
          "Des offres flexibles permettent de démarrer avec une présence digitale solide, puis d’évoluer vers les systèmes, l’automatisation et l’accompagnement croissance.",
        faqTitle: "Questions avant de commencer",
        finalCtaEyebrow: "Prochaine étape",
      },
      about: {
        metaTitle: "À propos de teChia Digital Solutions",
        metaDescription:
          "Découvrez comment teChia crée des sites premium, systèmes intelligents, automatisations et outils IA pour les entreprises modernes.",
        eyebrow: "À propos",
        title: "Des problèmes simples. Des solutions tech intelligentes.",
        description:
          "teChia Digital Solutions aide les entreprises sérieuses à créer une couche digitale professionnelle qui attire des clients, organise les opérations et ouvre de nouvelles possibilités de croissance.",
        pillars: [
          "Maisons digitales",
          "Clarté opérationnelle",
          "Crédibilité internationale",
        ],
        beliefTitle: "Ce que nous croyons",
        beliefs: [
          "Un site web doit être un actif métier, pas une simple décoration.",
          "Les entreprises locales méritent une présence digitale de niveau international.",
          "De bons systèmes rendent les équipes plus calmes, plus rapides et mieux organisées.",
          "La technologie doit réduire la confusion, pas en créer davantage.",
        ],
      },
      services: {
        metaTitle: "Services — teChia Digital Solutions",
        metaDescription:
          "Création de sites premium, systèmes métiers, automatisation, outils IA, pages de conversion SEO et services de maintenance.",
        title: "Des services qui transforment l’entreprise en système digital",
        description:
          "Commencez par un site web, puis évoluez vers les tableaux de bord, l’automatisation, les portails, le SEO et l’accompagnement continu.",
      },
      solutions: {
        metaTitle: "Solutions — teChia Digital Solutions",
        metaDescription:
          "Portails clients, systèmes de devis, tableaux de bord, réservations, assistants IA et pages de conversion pour entreprises modernes.",
        title: "Des modules intelligents pour de vrais problèmes métier",
        description:
          "Utilisez ces modules séparément ou combinez-les dans un système complet de gestion d’entreprise.",
      },
      industries: {
        metaTitle: "Secteurs — teChia Digital Solutions",
        metaDescription:
          "Sites optimisés pour la recherche et systèmes sur mesure pour agences de voyage, logistique, écoles, cliniques, immobilier, automobile, ONG, restaurants et PME.",
        title:
          "Des pages sectorielles conçues pour la visibilité et la conversion",
        description:
          "Chaque page sectorielle soutient le référencement naturel, Google Ads et un message clair adapté au métier.",
        detailPillars: [
          "Capture de prospects",
          "Visibilité Google",
          "Feuille de route système métier",
        ],
      },
      portfolio: {
        metaTitle: "Réalisations et études de cas — teChia",
        metaDescription:
          "Un portfolio de projets clients et de produits digitaux montrant les capacités de teChia en sites web, tableaux de bord, automatisation et systèmes métiers.",
        title: "Projets, produits et systèmes métiers",
        description:
          "Des études de cas claires qui montrent comment teChia pense la valeur métier, pas seulement l’apparence visuelle.",
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
          "Articles pratiques sur les maisons digitales, sites web, systèmes métiers, automatisation, SEO, tableaux de bord et crédibilité digitale.",
        title: "Articles de fond pour une digitalisation sérieuse",
        description:
          "Des analyses pratiques pour les entreprises qui veulent une présence digitale plus forte, des opérations plus claires et une croissance mesurable.",
        articleEyebrow: "Analyses teChia",
        intro:
          "Cet article donne aux dirigeants une manière pratique d’évaluer leurs décisions digitales à travers la crédibilité de marque, la génération de prospects, les opérations et l’expérience client.",
        keyIdeaTitle: "Idée clé",
        keyIdeaBody:
          "Une présence digitale sérieuse relie la marque, la génération de prospects, la communication client, l’organisation interne et la croissance mesurable. C’est la différence entre avoir un site web et posséder une maison digitale.",
        nextStepTitle: "Prochaine étape pratique",
        nextStepBody:
          "Auditez d’abord le processus de l’entreprise. Choisissez ensuite si l’entreprise a besoin d’un site, d’un tableau de bord, d’un portail, d’une automatisation ou d’un système combiné.",
      },
      demoLab: {
        metaTitle: "Espace Démo — teChia Digital Solutions",
        metaDescription:
          "Démos interactives pour systèmes de devis logistique, tableaux de bord voyage, portails scolaires, catalogues automobiles, assistants IA, réservations et portails clients.",
        title: "La preuve interactive des processus digitaux",
        description:
          "Ces démos aident les prospects à comprendre comment des systèmes structurés améliorent les demandes, les opérations et le suivi client.",
      },
      pricing: {
        metaTitle: "Offres — teChia Digital Solutions",
        metaDescription:
          "Offres flexibles pour sites web, systèmes métiers, plateformes sur mesure et maintenance mensuelle.",
        title: "Des offres premium sans faux tarif unique",
        description:
          "Chaque entreprise commence à un point différent. Ces offres cadrent le périmètre, le délai et la meilleure prochaine étape.",
        addOnsTitle: "Options fréquentes",
        addOns: [
          "Pages de conversion supplémentaires",
          "Mise en place du blog",
          "Tableau de bord admin",
          "Assistant IA",
          "Rapports analytics",
          "Rédaction de contenu",
          "Maintenance",
          "Support SEO",
        ],
      },
      contact: {
        metaTitle: "Contact — teChia Digital Solutions",
        metaDescription:
          "Contactez teChia Digital Solutions pour des sites premium, systèmes métiers, automatisations et projets de transformation digitale.",
        title: "Dites-nous ce que vous voulez créer",
        description:
          "Envoyez un message pour un site web, un système métier, une automatisation, un tableau de bord, un outil IA ou une stratégie de transformation digitale.",
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
          "Lancez une demande de projet sérieuse pour sites web, systèmes métiers, tableaux de bord, automatisation, outils IA et transformation digitale.",
        title: "Commencez avec clarté, pas avec confusion",
        description:
          "Ce formulaire recueille les informations nécessaires pour recommander la bonne solution digitale, la bonne offre et la meilleure prochaine étape.",
      },
      landing: {
        eyebrow: "Landing page Google Ads",
        titlePrefix: "Solutions premium de",
        titleConnector: "pour",
        description:
          "teChia aide les PME à créer une maison digitale crédible : site professionnel, message clair, capture de prospects, analytics, structure SEO et feuille de route vers des systèmes métiers sur mesure.",
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
          "Landing page orientée conversion pour les PME européennes qui recherchent sites premium, systèmes métiers, automatisation et crédibilité digitale.",
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
      services: "Services premium",
      solutions: "Solutions intelligentes",
      industries: "Secteurs accompagnés",
      method: "La méthode teChia",
      stack: "Crédibilité technologique",
      security: "Promesse sécurité, SEO et performance",
      testimonials: "Réassurance client",
      faq: "Questions fréquentes",
      pricing: "Offres flexibles",
      demoLab: "Démos interactives",
      caseStudies: "Réalisations clés",
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
      "Comprendre le vrai problème métier",
      "Concevoir un système digital clair",
      "Construire vite avec des outils modernes et sécurisés",
      "Lancer avec SEO, analytics et suivi des conversions",
      "Améliorer continuellement après le lancement",
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
        title: "Fondation digitale",
        badge: "Meilleur premier pas",
        description:
          "Une base web premium pour une petite entreprise sérieuse qui veut être crédible en ligne.",
        features: [
          "5–8 pages clés",
          "Structure bilingue",
          "Configuration SEO",
          "Flux de contact",
        ],
        cta: "Demander un devis fondation",
      },
      {
        slug: "business-pro-website",
        title: "Site Pro",
        badge: "Le plus demandé",
        description:
          "Un site plus solide avec pages de conversion, contenu riche, analytics et architecture orientée conversion.",
        features: [
          "10–20 pages",
          "Pages sectorielles",
          "Événements GA4",
          "Structure blog",
        ],
        cta: "Planifier mon site pro",
      },
      {
        slug: "business-os",
        title: "Système métier",
        badge: "Opérations",
        description:
          "Site web avec tableau de bord interne, prospects, demandes, processus et données métier structurées.",
        features: [
          "Tableau de bord",
          "Base de données",
          "Gestion des prospects",
          "Modules métier",
        ],
        cta: "Discuter du système métier",
      },
      {
        slug: "custom-enterprise-system",
        title: "Plateforme sur mesure",
        badge: "Sur mesure",
        description:
          "Plateforme adaptée aux processus complexes, aux rôles multiples et aux automatisations.",
        features: [
          "Atelier découverte",
          "Architecture sur mesure",
          "Outils par rôle",
          "Feuille de route",
        ],
        cta: "Réserver un appel découverte",
      },
      {
        slug: "maintenance-growth",
        title: "Maintenance & croissance",
        badge: "Support mensuel",
        description:
          "Suivi technique, monitoring, améliorations, contenu et performance après lancement.",
        features: [
          "Sécurité",
          "Mises à jour",
          "SEO",
          "Corrections prioritaires",
        ],
        cta: "Demander un plan support",
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
        question: "Construisez-vous seulement des sites web ?",
        answer:
          "Non. Le site est souvent la première étape, mais nous construisons aussi tableaux de bord, portails, automatisations, systèmes de devis, réservations et systèmes complets.",
      },
      {
        question: "Travaillez-vous hors du Cameroun ?",
        answer:
          "Oui. teChia s’adresse aux entreprises locales, PME africaines et clients internationaux, notamment les PME européennes.",
      },
      {
        question: "Le site peut-il être bilingue ?",
        answer:
          "Oui. teChia crée des routes, métadonnées, contenus et navigations en anglais et en français pour les projets bilingues, et la même architecture peut accueillir d’autres langues selon votre marché.",
      },
      {
        question: "Proposez-vous du support après lancement ?",
        answer:
          "Oui. Les offres de maintenance peuvent inclure sécurité, performance, contenu, corrections et nouvelles fonctionnalités.",
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
        "Sites premium, systèmes intelligents, automatisation et maisons digitales pour entreprises modernes.",
      allRightsReserved: "Tous droits réservés.",
      footerPromise:
        "Conçu pour la vitesse, la confiance, l’accessibilité et la croissance mesurable.",
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
  return `/${locale}${normalized === "/" ? "" : normalized}`;
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
  return getLocalizedSectionHref(locale, "/services", getSolutionSectionId(slug));
}
