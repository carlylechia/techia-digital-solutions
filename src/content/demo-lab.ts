export type DemoSlug =
  | "logistics-quote-generator"
  | "travel-consultancy-dashboard"
  | "business-management-dashboard"
  | "booking-system"
  | "ai-digital-advisor";

export type DemoComplexity = "Simple" | "Medium" | "Advanced" | "Enterprise";

export type DemoDefinition = {
  slug: DemoSlug;
  title: { en: string; fr: string };
  shortTitle: { en: string; fr: string };
  eyebrow: { en: string; fr: string };
  category: { en: string; fr: string };
  businessTypes: { en: string[]; fr: string[] };
  problem: { en: string; fr: string };
  solution: { en: string; fr: string };
  description: { en: string; fr: string };
  modules: { en: string[]; fr: string[] };
  businessValue: { en: string[]; fr: string[] };
  recommendedPackage: { en: string; fr: string };
  complexity: DemoComplexity;
  estimatedBuildType: { en: string; fr: string };
  relatedSlugs: DemoSlug[];
};

export const demosData: DemoDefinition[] = [
  {
    slug: "logistics-quote-generator",
    title: {
      en: "Logistics Quote Generator",
      fr: "Générateur de Devis Logistique"
    },
    shortTitle: { en: "Quote Generator", fr: "Générateur de devis" },
    eyebrow: { en: "Logistics system", fr: "Système logistique" },
    category: { en: "Quote & Operations System", fr: "Système de devis et opérations" },
    businessTypes: {
      en: ["Logistics companies", "Shipping businesses", "Delivery services", "Cargo operators", "Courier services"],
      fr: ["Entreprises de logistique", "Transporteurs", "Services de livraison", "Opérateurs cargo", "Services de messagerie"]
    },
    problem: {
      en: "Customers need to request quotes quickly while the business needs structured tracking of every request.",
      fr: "Les clients ont besoin de demander des devis rapidement tandis que l'entreprise doit suivre chaque demande de façon structurée."
    },
    solution: {
      en: "A smart quote system that collects shipment details, generates a sample estimate, and routes requests to an admin dashboard for structured follow-up.",
      fr: "Un système de devis intelligent qui collecte les détails d'expédition, génère une estimation et achemine les demandes vers un tableau de bord pour un suivi structuré."
    },
    description: {
      en: "Try the interactive quote flow. Enter shipment details and see how the system calculates a sample estimate and creates a structured request for your operations team.",
      fr: "Testez le parcours de devis interactif. Entrez les détails de l'expédition et voyez comment le système calcule une estimation et crée une demande structurée."
    },
    modules: {
      en: [
        "Quote request form",
        "Multi-step estimate logic",
        "Request tracking dashboard",
        "Admin review panel",
        "Email & WhatsApp notification",
        "PDF quote generation",
        "Status pipeline (New → Approved → Sent)",
        "Customer quote history"
      ],
      fr: [
        "Formulaire de demande de devis",
        "Logique d'estimation multi-étapes",
        "Tableau de suivi des demandes",
        "Panneau de révision admin",
        "Notification email & WhatsApp",
        "Génération de devis PDF",
        "Pipeline de statuts (Nouveau → Approuvé → Envoyé)",
        "Historique des devis clients"
      ]
    },
    businessValue: {
      en: [
        "Customers request quotes faster without calling or messaging manually",
        "Team tracks all requests in one structured dashboard",
        "Reduced scattered WhatsApp messages",
        "Faster response time and professional impression",
        "Better quote records and audit trail",
        "PDF quote generation for professional follow-up",
        "Better analytics for pricing and demand decisions"
      ],
      fr: [
        "Les clients demandent des devis plus rapidement sans appel ni message manuel",
        "L'équipe suit toutes les demandes dans un tableau de bord structuré",
        "Moins de messages WhatsApp dispersés",
        "Temps de réponse plus rapide et impression professionnelle",
        "Meilleur suivi des devis et piste d'audit",
        "Génération de devis PDF pour un suivi professionnel",
        "Meilleures analyses pour les décisions de prix et de demande"
      ]
    },
    recommendedPackage: {
      en: "Business OS",
      fr: "Business OS"
    },
    complexity: "Advanced",
    estimatedBuildType: {
      en: "Custom quote system + admin dashboard + notification flow",
      fr: "Système de devis sur mesure + tableau de bord admin + flux de notification"
    },
    relatedSlugs: ["business-management-dashboard", "ai-digital-advisor"]
  },
  {
    slug: "travel-consultancy-dashboard",
    title: {
      en: "Travel Consultancy Dashboard",
      fr: "Tableau de Bord Agence de Voyage"
    },
    shortTitle: { en: "Travel Dashboard", fr: "Tableau de bord voyage" },
    eyebrow: { en: "Travel system", fr: "Système voyage" },
    category: { en: "Client Management System", fr: "Système de gestion clients" },
    businessTypes: {
      en: ["Travel agencies", "Visa consultants", "Study abroad consultants", "Immigration advisors", "Work permit services"],
      fr: ["Agences de voyage", "Consultants en visa", "Conseillers études à l'étranger", "Conseillers en immigration", "Services de permis de travail"]
    },
    problem: {
      en: "Client applications, documents, appointments, and statuses are hard to manage manually across WhatsApp, spreadsheets, and email.",
      fr: "Les dossiers clients, documents, rendez-vous et statuts sont difficiles à gérer manuellement sur WhatsApp, tableurs et email."
    },
    solution: {
      en: "A complete client management platform that tracks every application from first inquiry to final approval with real-time status, document checklists, and appointment management.",
      fr: "Une plateforme complète de gestion clients qui suit chaque dossier de la première demande à l'approbation finale avec statut en temps réel, listes de documents et gestion des rendez-vous."
    },
    description: {
      en: "Explore the dashboard simulation. Click applications, filter by status, see document checklists, track progress, and understand how a real Travel Business OS works.",
      fr: "Explorez la simulation du tableau de bord. Cliquez sur les dossiers, filtrez par statut, consultez les listes de documents et comprenez comment un vrai Business OS voyage fonctionne."
    },
    modules: {
      en: [
        "Lead intake and qualification form",
        "Application tracking pipeline",
        "Document checklist per application",
        "Appointment request and scheduling",
        "Status pipeline (8 stages)",
        "Admin insight dashboard",
        "Progress bar per client",
        "Next action tracking",
        "Client communication log"
      ],
      fr: [
        "Formulaire de prise en charge et qualification",
        "Pipeline de suivi des dossiers",
        "Liste de documents par dossier",
        "Demande et planification de rendez-vous",
        "Pipeline de statuts (8 étapes)",
        "Tableau de bord de synthèse admin",
        "Barre de progression par client",
        "Suivi de la prochaine action",
        "Journal de communication client"
      ]
    },
    businessValue: {
      en: [
        "Better client organization and less manual confusion",
        "Clear application status visible at a glance",
        "Reduced lost documents and missed follow-ups",
        "Faster response time and professional customer experience",
        "Stronger internal workflow and team accountability",
        "Better data for reporting and business decisions"
      ],
      fr: [
        "Meilleure organisation clients et moins de confusion manuelle",
        "Statut du dossier clair visible d'un coup d'œil",
        "Moins de documents perdus et de suivis manqués",
        "Temps de réponse plus rapide et expérience client professionnelle",
        "Workflow interne plus solide et responsabilisation de l'équipe",
        "Meilleures données pour les rapports et les décisions métier"
      ]
    },
    recommendedPackage: {
      en: "Business OS",
      fr: "Business OS"
    },
    complexity: "Advanced",
    estimatedBuildType: {
      en: "Custom Travel Business OS with admin portal and client tracking",
      fr: "Business OS voyage sur mesure avec portail admin et suivi client"
    },
    relatedSlugs: ["booking-system", "business-management-dashboard"]
  },
  {
    slug: "business-management-dashboard",
    title: {
      en: "Business Management Dashboard",
      fr: "Tableau de Bord de Gestion d'Entreprise"
    },
    shortTitle: { en: "Business Dashboard", fr: "Tableau de bord métier" },
    eyebrow: { en: "Operations system", fr: "Système opérationnel" },
    category: { en: "Business Operating System", fr: "Système d'exploitation métier" },
    businessTypes: {
      en: ["SMEs and agencies", "Service companies", "Consultancies", "Growing startups", "Local businesses"],
      fr: ["PME et agences", "Entreprises de services", "Cabinets de conseil", "Startups en croissance", "Entreprises locales"]
    },
    problem: {
      en: "Leads, customers, tasks, and requests are scattered across WhatsApp, paper, and spreadsheets with no clear picture of business performance.",
      fr: "Les prospects, clients, tâches et demandes sont dispersés sur WhatsApp, papier et tableurs sans vue claire des performances de l'entreprise."
    },
    solution: {
      en: "A central command center that brings together CRM, task management, request tracking, and performance metrics in one clean, actionable dashboard.",
      fr: "Un centre de commandement central qui regroupe CRM, gestion des tâches, suivi des demandes et métriques de performance dans un tableau de bord clair."
    },
    description: {
      en: "Navigate the business dashboard. Switch between overview, lead pipeline, task board, and customer list to see how a full Business OS consolidates operations.",
      fr: "Naviguez dans le tableau de bord métier. Passez d'une vue d'ensemble au pipeline de prospects, au tableau des tâches et à la liste clients pour voir comment un Business OS consolide les opérations."
    },
    modules: {
      en: [
        "CRM-style customer list and records",
        "Lead pipeline (5-stage Kanban)",
        "Task board with priority levels",
        "Request status cards",
        "Revenue and performance metrics",
        "Today's Focus section",
        "Team activity feed",
        "Quick filters and search"
      ],
      fr: [
        "Liste et fiches clients de type CRM",
        "Pipeline de prospects (Kanban 5 étapes)",
        "Tableau des tâches avec niveaux de priorité",
        "Cartes de statut des demandes",
        "Métriques de revenus et de performance",
        "Section Focus du jour",
        "Fil d'activité de l'équipe",
        "Filtres rapides et recherche"
      ]
    },
    businessValue: {
      en: [
        "One place for all business operations",
        "Better customer tracking and relationship management",
        "Better team visibility and accountability",
        "Less manual confusion and missed follow-ups",
        "Clear daily priorities and next actions",
        "Better decision making with real-time data"
      ],
      fr: [
        "Un seul endroit pour toutes les opérations",
        "Meilleur suivi clients et gestion des relations",
        "Meilleure visibilité et responsabilisation de l'équipe",
        "Moins de confusion manuelle et de suivis manqués",
        "Priorités quotidiennes et prochaines actions claires",
        "Meilleures décisions avec des données en temps réel"
      ]
    },
    recommendedPackage: {
      en: "Business OS",
      fr: "Business OS"
    },
    complexity: "Advanced",
    estimatedBuildType: {
      en: "Custom Business OS with CRM, tasks, and performance dashboard",
      fr: "Business OS sur mesure avec CRM, tâches et tableau de bord performance"
    },
    relatedSlugs: ["logistics-quote-generator", "travel-consultancy-dashboard"]
  },
  {
    slug: "booking-system",
    title: {
      en: "Booking System",
      fr: "Système de Réservation"
    },
    shortTitle: { en: "Booking System", fr: "Système de réservation" },
    eyebrow: { en: "Scheduling system", fr: "Système de planification" },
    category: { en: "Appointment & Booking Platform", fr: "Plateforme de rendez-vous et réservation" },
    businessTypes: {
      en: ["Clinics and healthcare providers", "Consultants and coaches", "Salons and beauty services", "Agencies and service providers", "Event and venue businesses"],
      fr: ["Cliniques et professionnels de santé", "Consultants et coaches", "Salons et services de beauté", "Agences et prestataires de services", "Entreprises événementielles"]
    },
    problem: {
      en: "Customers need to book services online while the business needs a clear, manageable schedule without endless back-and-forth messages.",
      fr: "Les clients ont besoin de réserver des services en ligne tandis que l'entreprise a besoin d'un planning clair et gérable sans échanges de messages interminables."
    },
    solution: {
      en: "A structured booking flow that lets clients select services, choose dates and times, and receive confirmation while the business gets a clean admin schedule.",
      fr: "Un parcours de réservation structuré qui permet aux clients de choisir des services, des dates et heures, et de recevoir une confirmation pendant que l'entreprise dispose d'un planning admin clair."
    },
    description: {
      en: "Try the booking simulation. Select a service, pick a date and time slot, and see the full confirmation flow. No real booking is submitted from this demo.",
      fr: "Testez la simulation de réservation. Sélectionnez un service, choisissez une date et un créneau horaire, et voyez le flux de confirmation complet. Aucune réservation réelle n'est soumise depuis cette démo."
    },
    modules: {
      en: [
        "Service selection and description",
        "Date and time slot picker",
        "Booking summary and review",
        "Confirmation flow and receipt",
        "Admin schedule view",
        "Automated reminder concept",
        "Service-specific booking rules",
        "Contact preference selection"
      ],
      fr: [
        "Sélection et description des services",
        "Sélecteur de date et créneau horaire",
        "Récapitulatif et révision de réservation",
        "Flux de confirmation et reçu",
        "Vue planning admin",
        "Concept de rappel automatisé",
        "Règles de réservation spécifiques au service",
        "Sélection des préférences de contact"
      ]
    },
    businessValue: {
      en: [
        "Customers book online 24/7 without calling",
        "Fewer missed appointments and scheduling gaps",
        "Better schedule visibility for the entire team",
        "Automated confirmation reduces admin workload",
        "Reduced back-and-forth messaging",
        "Professional service experience that builds trust"
      ],
      fr: [
        "Les clients réservent en ligne 24h/24 sans appeler",
        "Moins de rendez-vous manqués et de créneaux libres",
        "Meilleure visibilité du planning pour toute l'équipe",
        "La confirmation automatisée réduit la charge admin",
        "Moins d'échanges de messages",
        "Expérience de service professionnelle qui renforce la confiance"
      ]
    },
    recommendedPackage: {
      en: "Business Pro Website or Business OS",
      fr: "Business Pro Website ou Business OS"
    },
    complexity: "Medium",
    estimatedBuildType: {
      en: "Booking website with admin calendar and automated confirmations",
      fr: "Site de réservation avec calendrier admin et confirmations automatisées"
    },
    relatedSlugs: ["travel-consultancy-dashboard", "ai-digital-advisor"]
  },
  {
    slug: "ai-digital-advisor",
    title: {
      en: "AI Digital Advisor",
      fr: "Conseiller Numérique IA"
    },
    shortTitle: { en: "AI Advisor", fr: "Conseiller IA" },
    eyebrow: { en: "AI-powered tool", fr: "Outil IA" },
    category: { en: "AI-Powered Business Advisor", fr: "Conseiller métier alimenté par l'IA" },
    businessTypes: {
      en: ["All business types", "Entrepreneurs and founders", "SME owners", "Growing businesses", "Organizations seeking digital clarity"],
      fr: ["Tous types d'entreprises", "Entrepreneurs et fondateurs", "Dirigeants de PME", "Entreprises en croissance", "Organisations cherchant la clarté digitale"]
    },
    problem: {
      en: "Business owners are unsure what they need: a website, a dashboard, automation, a client portal, or a complete operating system.",
      fr: "Les dirigeants d'entreprise ne savent pas ce dont ils ont besoin : un site web, un tableau de bord, une automatisation, un portail client ou un système complet."
    },
    solution: {
      en: "An interactive digital advisor that guides business owners through a discovery conversation, diagnoses their situation, and recommends the right teChia solution.",
      fr: "Un conseiller digital interactif qui guide les dirigeants à travers une conversation de découverte, diagnostique leur situation et recommande la bonne solution teChia."
    },
    description: {
      en: "Answer a few questions about your business, your challenges, and what you want to achieve. The AI Advisor will recommend the most relevant teChia system for your needs.",
      fr: "Répondez à quelques questions sur votre entreprise, vos défis et ce que vous souhaitez accomplir. Le Conseiller IA recommandera le système teChia le plus pertinent pour vos besoins."
    },
    modules: {
      en: [
        "AI discovery conversation flow",
        "Business type diagnosis",
        "Problem and challenge identification",
        "Desired outcome mapping",
        "Solution recommendation engine",
        "Package suggestion with rationale",
        "Lead capture after recommendation",
        "Conversation memory within session"
      ],
      fr: [
        "Flux de conversation de découverte IA",
        "Diagnostic du type d'entreprise",
        "Identification des problèmes et défis",
        "Cartographie des résultats souhaités",
        "Moteur de recommandation de solutions",
        "Suggestion de forfait avec justification",
        "Capture de prospects après recommandation",
        "Mémoire de conversation dans la session"
      ]
    },
    businessValue: {
      en: [
        "Guides visitors who don't know what they need",
        "Qualifies leads before they contact the team",
        "Demonstrates teChia technical and consulting ability",
        "Reduces friction in the sales process",
        "Creates a more engaging demo lab experience",
        "Captures structured lead data for follow-up"
      ],
      fr: [
        "Guide les visiteurs qui ne savent pas ce dont ils ont besoin",
        "Qualifie les prospects avant qu'ils contactent l'équipe",
        "Démontre la capacité technique et conseil de teChia",
        "Réduit les frictions dans le processus de vente",
        "Crée une expérience de lab de démo plus engageante",
        "Capture des données prospects structurées pour le suivi"
      ]
    },
    recommendedPackage: {
      en: "Business Pro Website, Business OS, or Custom Enterprise System",
      fr: "Business Pro Website, Business OS ou Système Entreprise Personnalisé"
    },
    complexity: "Advanced",
    estimatedBuildType: {
      en: "AI-powered advisor with recommendation engine and lead capture",
      fr: "Conseiller IA avec moteur de recommandation et capture de prospects"
    },
    relatedSlugs: ["business-management-dashboard", "booking-system"]
  }
];

export function getDemoBySlug(slug: string): DemoDefinition | undefined {
  return demosData.find((d) => d.slug === slug);
}

export const DEMO_SLUGS: DemoSlug[] = demosData.map((d) => d.slug);

export const complexityColors: Record<DemoComplexity, string> = {
  Simple: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  Advanced: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  Enterprise: "text-red-400 bg-red-400/10 border-red-400/20"
};

// Bilingual UI strings for demo lab pages
export const demoLabUi = {
  en: {
    indexTitle: "Demo Lab",
    indexHeadline: "Explore What teChia Can Build for Your Business",
    indexDescription:
      "Try interactive previews of business systems, dashboards, automation flows, booking tools, quote generators, and AI-powered advisors designed to help companies work smarter.",
    tryDemo: "Try Demo",
    requestSystem: "Request This System",
    buildLikeThis: "Build Something Like This",
    requestDemo: "Request a Demo",
    talkToTechia: "Talk to teChia",
    problemSection: "The Business Problem",
    solutionSection: "The Solution",
    modulesSection: "What This System Can Include",
    valueSection: "Business Value",
    packageSection: "Recommended teChia Package",
    relatedSection: "Explore Related Demos",
    ctaSection: "Ready to Build This for Your Business?",
    ctaBody:
      "Tell us about your business and what you want to build. teChia will recommend the cleanest path from idea to production system.",
    complexity: "Complexity",
    businessTypes: "Business types",
    demoDisclaimer:
      "Sample estimate for demonstration only. Not a commercial quote or service guarantee.",
    successTitle: "Your demo request has been received.",
    successBody:
      "teChia will review your business needs and contact you with the best next step.",
    successExplore: "Explore another demo",
    successAdvisor: "Talk to AI Digital Advisor",
    successStart: "Start a project",
    requestFormTitle: "Request This System",
    requestFormSubtitle:
      "Tell us what you want to build. We will follow up with a recommendation and next step.",
    fields: {
      name: "Full name",
      email: "Business email",
      phone: "Phone / WhatsApp",
      company: "Company name",
      country: "Country",
      language: "Preferred language",
      businessType: "Business type",
      projectNeed: "What do you want to build?",
      budget: "Budget range",
      timeline: "Timeline",
      consent:
        "I agree that teChia Digital Solutions may store my contact information and project details to follow up about my request."
    },
    budgetOptions: [
      "Not sure yet",
      "Under $500",
      "$500 – $1,500",
      "$1,500 – $3,000",
      "$3,000 – $7,500",
      "$7,500+"
    ],
    timelineOptions: [
      "As soon as possible",
      "Within 2 weeks",
      "Within 1 month",
      "Within 3 months",
      "Just exploring"
    ]
  },
  fr: {
    indexTitle: "Laboratoire de Démonstration",
    indexHeadline: "Découvrez Ce que teChia Peut Construire Pour Votre Entreprise",
    indexDescription:
      "Testez des aperçus interactifs de systèmes métiers, tableaux de bord, automatisations, outils de réservation, générateurs de devis et assistants IA conçus pour aider les entreprises à travailler plus intelligemment.",
    tryDemo: "Essayer la démo",
    requestSystem: "Demander ce système",
    buildLikeThis: "Créer un Système Comme Celui-ci",
    requestDemo: "Demander une Démo",
    talkToTechia: "Parler à teChia",
    problemSection: "Le problème métier",
    solutionSection: "La solution",
    modulesSection: "Ce que ce système peut inclure",
    valueSection: "Valeur métier",
    packageSection: "Offre teChia recommandée",
    relatedSection: "Explorer les démos connexes",
    ctaSection: "Prêt à construire ceci pour votre entreprise ?",
    ctaBody:
      "Parlez-nous de votre entreprise et de ce que vous voulez construire. teChia recommandera le chemin le plus clair de l'idée au système en production.",
    complexity: "Complexité",
    businessTypes: "Types d'entreprises",
    demoDisclaimer:
      "Estimation d'exemple à titre de démonstration uniquement. Pas un devis commercial ou une garantie de service.",
    successTitle: "Votre demande de démo a bien été reçue.",
    successBody:
      "teChia analysera vos besoins et vous contactera avec la meilleure prochaine étape.",
    successExplore: "Explorer une autre démo",
    successAdvisor: "Parler au Conseiller IA",
    successStart: "Démarrer un projet",
    requestFormTitle: "Demander ce système",
    requestFormSubtitle:
      "Dites-nous ce que vous voulez construire. Nous vous répondrons avec une recommandation.",
    fields: {
      name: "Nom complet",
      email: "Email professionnel",
      phone: "Téléphone / WhatsApp",
      company: "Nom de l'entreprise",
      country: "Pays",
      language: "Langue préférée",
      businessType: "Type d'entreprise",
      projectNeed: "Que souhaitez-vous construire ?",
      budget: "Budget indicatif",
      timeline: "Délai souhaité",
      consent:
        "J'accepte que teChia Digital Solutions conserve mes informations de contact et les détails de mon projet afin de me recontacter au sujet de ma demande."
    },
    budgetOptions: [
      "Pas encore sûr",
      "Moins de 500 $",
      "500 $ – 1 500 $",
      "1 500 $ – 3 000 $",
      "3 000 $ – 7 500 $",
      "7 500 $+"
    ],
    timelineOptions: [
      "Le plus tôt possible",
      "Dans 2 semaines",
      "Dans 1 mois",
      "Dans 3 mois",
      "Juste explorer"
    ]
  }
} as const;

export type DemoLabLocale = keyof typeof demoLabUi;
