import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Compass,
  LayoutDashboard,
  MessageCircleMore,
  MonitorSmartphone,
  Sparkles,
  Star,
  Workflow,
} from "lucide-react";
import { DemoGrid } from "@/components/demos/demo-grid";
import { CustomFitWorkflowSection } from "@/components/sections/custom-fit-workflow-section";
import { buttonVariants } from "@/components/site/button";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { getLocalizedHref, type CardItem, type Locale } from "@/content/site";
import { cn } from "@/lib/utils";

const patternBackgroundSrc =
  "/images/homepage/03-background-patterns/nexus-grid-background.svg";

const problemIllustrationSrc = {
  en: "/images/homepage/02-section-illustrations/problem-to-solution-illustration-en.svg",
  fr: "/images/homepage/02-section-illustrations/problem-to-solution-illustration-fr.svg",
} as const;

type PublicFeedbackItem = {
  id: string;
  quote: string;
  name: string;
  role: string | null;
  company: string | null;
  rating: number | null;
  source: string;
};

type PublicFaqItem = {
  id: string;
  question: string;
  answer: string;
};

type JourneyStage = {
  imageSrc: string;
  imageAlt: string;
  stageLabel: string;
  title: string;
  description: string;
  nextStep: string;
};

type PageCopy = {
  journeyEyebrow: string;
  journeyTitle: string;
  journeyDescription: string;
  journeyStages: JourneyStage[];
  journeyPromptTitle: string;
  journeyPromptDescription: string;
  journeyPromptPrimary: string;
  journeyPromptSecondary: string;
  journeyPromptNote: string;
  journeyPromptNoteLink: string;
  problemEyebrow: string;
  problemTitle: string;
  problemDescription: string;
  beforeLabel: string;
  beforeItems: string[];
  afterLabel: string;
  afterItems: string[];
  servicesEyebrow: string;
  servicesTitle: string;
  servicesDescription: string;
  demoEyebrow: string;
  demoTitle: string;
  demoDescription: string;
  reviewsEyebrow: string;
  reviewsTitle: string;
  reviewsDescription: string;
  workEyebrow: string;
  workTitle: string;
  workDescription: string;
  workCta: string;
  workMore: string;
  faqEyebrow: string;
  faqTitle: string;
  faqDescription: string;
  blogEyebrow: string;
  blogTitle: string;
  blogDescription: string;
  blogCta: string;
  blogMore: string;
  finalEyebrow: string;
  finalTitle: string;
  finalDescription: string;
  finalPrimaryLabel: string;
  finalSecondaryLabel: string;
  finalAiPrompt: string;
  finalAiLinkLabel: string;
  reviewSourceLabel: string;
  nextStepLabel: string;
};

const copy = {
  en: {
    journeyEyebrow: "Start from your reality",
    journeyTitle: "Where your business is today, we help it move forward.",
    journeyDescription:
      "Some businesses still depend on walk-ins and saved contacts. Some post online without a real brand. Some need a stronger website and better systems. teChia helps at each stage.",
    journeyStages: [
      {
        imageSrc:
          "/images/homepage/02-section-illustrations/journey-stage-offline.webp",
        imageAlt:
          "A small business owner serving customers in person with no visible digital presence yet.",
        stageLabel: "Stage 01",
        title: "You mostly rely on walk-ins, referrals, or your phone",
        description:
          "There is no real website or branded business presence yet, so opportunities stop where your location and saved contacts stop.",
        nextStep:
          "Build a professional digital home people can find, trust, and contact easily.",
      },
      {
        imageSrc:
          "/images/homepage/02-section-illustrations/journey-stage-social-only.webp",
        imageAlt:
          "A business owner replying to messages through WhatsApp and personal social accounts.",
        stageLabel: "Stage 02",
        title: "Your business is online, but mostly through WhatsApp or personal socials",
        description:
          "People can message you, but the business still feels tied to a personal account and the brand is hard to take seriously.",
        nextStep:
          "Separate the brand, clarify the offer, and capture inquiries properly.",
      },
      {
        imageSrc:
          "/images/homepage/02-section-illustrations/journey-stage-branding.webp",
        imageAlt:
          "A business owner with some social media presence and branding, but an inconsistent customer journey.",
        stageLabel: "Stage 03",
        title: "People can find you, but the experience still feels inconsistent",
        description:
          "You may have a logo, a page, or some activity online, but trust, follow-up, and brand clarity still need work.",
        nextStep:
          "Strengthen the brand presence and guide visitors into a clearer client journey.",
      },
      {
        imageSrc:
          "/images/homepage/02-section-illustrations/journey-stage-systems.webp",
        imageAlt:
          "A growing business owner reviewing digital systems, dashboards, and a stronger online presence with a team.",
        stageLabel: "Stage 04",
        title: "You are ready for a better website, smarter tools, or an audit",
        description:
          "If you already have traction online, teChia can build the website, systems, automation, and dashboards that support growth, or review what exists and improve it.",
        nextStep:
          "Turn visibility into a smoother business system that can scale confidently.",
      },
    ],
    journeyPromptTitle: "Not sure which digital step your business needs first?",
    journeyPromptDescription:
      "Tell the AI consultant how you currently attract clients and manage daily work. It will point you to the smartest next move before you commit.",
    journeyPromptPrimary: "Talk to the AI Consultant",
    journeyPromptSecondary: "Start a Project",
    journeyPromptNote: "Prefer a human conversation after that?",
    journeyPromptNoteLink: "Contact us",
    problemEyebrow: "Why businesses feel stuck",
    problemTitle: "From scattered work to smarter systems.",
    problemDescription:
      "Many businesses lose time because their website, customer inquiries, documents, and daily operations are disconnected. teChia helps you bring everything into one clearer digital flow.",
    beforeLabel: "Before",
    beforeItems: [
      "Weak online presence",
      "Missed inquiries",
      "Manual follow-up",
      "Scattered tools",
    ],
    afterLabel: "After",
    afterItems: [
      "Premium website",
      "Clear lead capture",
      "Smart automation",
      "Simple dashboards",
    ],
    servicesEyebrow: "What teChia can build",
    servicesTitle: "Simple digital building blocks that help businesses grow.",
    servicesDescription:
      "We keep the digital side practical: a stronger brand, clearer inquiries, smoother follow-up, and systems that support the way your business really works.",
    demoEyebrow: "See it in action",
    demoTitle: "Explore real digital workflows before you decide.",
    demoDescription:
      "The Demo Lab helps you picture what a stronger website, client flow, dashboard, or AI-powered experience can look like in practice.",
    reviewsEyebrow: "Client feedback",
    reviewsTitle: "What clients notice when the digital side starts making sense.",
    reviewsDescription:
      "The goal is not just to look better online. It is to feel clearer, more credible, and easier to do business with.",
    workEyebrow: "Selected work",
    workTitle: "A few examples of the direction your business can take.",
    workDescription:
      "These projects show how teChia turns business ideas into clearer online experiences, stronger systems, and more confident customer journeys.",
    workCta: "View project",
    workMore: "See more work",
    faqEyebrow: "Common questions",
    faqTitle: "Questions businesses usually ask before they begin.",
    faqDescription:
      "If you want a quicker recommendation, the AI consultant can help you understand what your business likely needs first.",
    blogEyebrow: "Helpful reading",
    blogTitle: "A few practical reads before you decide.",
    blogDescription:
      "Short articles for business owners who want better clarity around websites, visibility, systems, and digital growth.",
    blogCta: "Read article",
    blogMore: "Visit the blog",
    finalEyebrow: "Your next step",
    finalTitle: "Ready to build your business's digital home?",
    finalDescription:
      "Let's turn your website, operations, and customer flow into a smarter system built for growth.",
    finalPrimaryLabel: "Start a Project",
    finalSecondaryLabel: "Book a Consultation",
    finalAiPrompt: "Need help choosing first?",
    finalAiLinkLabel: "Talk to the AI consultant.",
    reviewSourceLabel: "Homepage review",
    nextStepLabel: "Best next step",
  },
  fr: {
    journeyEyebrow: "Partir de votre réalité",
    journeyTitle:
      "Quel que soit le niveau actuel de votre entreprise, nous l'aidons à avancer.",
    journeyDescription:
      "Certaines entreprises dépendent encore des passages en boutique et des contacts enregistrés. D'autres publient en ligne sans vraie marque. D'autres encore ont besoin d'un meilleur site et de meilleurs systèmes. teChia vous aide à chaque étape.",
    journeyStages: [
      {
        imageSrc:
          "/images/homepage/02-section-illustrations/journey-stage-offline.webp",
        imageAlt:
          "Une cheffe d'entreprise locale qui sert ses clients sur place sans présence digitale claire.",
        stageLabel: "Étape 01",
        title:
          "Vous dépendez surtout des passages, des recommandations ou du téléphone",
        description:
          "Il n'y a pas encore de vrai site web ni de présence de marque structurée, donc les opportunités s'arrêtent souvent à votre emplacement et à vos contacts enregistrés.",
        nextStep:
          "Construire une vraie maison digitale que les gens peuvent trouver, comprendre et contacter facilement.",
      },
      {
        imageSrc:
          "/images/homepage/02-section-illustrations/journey-stage-social-only.webp",
        imageAlt:
          "Une propriétaire d'entreprise qui répond aux clients via WhatsApp et des comptes personnels sur les réseaux sociaux.",
        stageLabel: "Étape 02",
        title:
          "Votre entreprise existe en ligne, mais surtout via WhatsApp ou vos réseaux personnels",
        description:
          "Les gens peuvent vous écrire, mais l'activité reste liée à un compte personnel et la marque est difficile à prendre au sérieux.",
        nextStep:
          "Distinguer la marque, clarifier l'offre et mieux capter les demandes.",
      },
      {
        imageSrc:
          "/images/homepage/02-section-illustrations/journey-stage-branding.webp",
        imageAlt:
          "Une entrepreneure avec une certaine présence visuelle en ligne, mais un parcours client encore incohérent.",
        stageLabel: "Étape 03",
        title:
          "On peut vous trouver, mais l'expérience reste encore incohérente",
        description:
          "Vous avez peut-être déjà un logo, une page ou une activité sur les réseaux, mais la confiance, le suivi et la clarté de marque peuvent encore être améliorés.",
        nextStep:
          "Renforcer la présence de marque et guider les visiteurs vers un parcours client plus clair.",
      },
      {
        imageSrc:
          "/images/homepage/02-section-illustrations/journey-stage-systems.webp",
        imageAlt:
          "Une dirigeante en croissance qui examine un site plus fort, des systèmes, des tableaux de bord et une équipe mieux organisée.",
        stageLabel: "Étape 04",
        title:
          "Vous êtes prêt pour un meilleur site, des outils plus intelligents ou un audit",
        description:
          "Si votre activité a déjà une traction en ligne, teChia peut créer le site, les systèmes, les automatisations et les tableaux de bord qui soutiennent la croissance, ou auditer l'existant et l'améliorer.",
        nextStep:
          "Transformer votre visibilité en système de travail plus fluide et plus évolutif.",
      },
    ],
    journeyPromptTitle:
      "Vous ne savez pas encore quelle solution digitale convient à votre entreprise ?",
    journeyPromptDescription:
      "Expliquez à l'agent IA comment vous attirez vos clients aujourd'hui et comment vous gérez le travail quotidien. Il vous indiquera la meilleure prochaine étape avant tout engagement.",
    journeyPromptPrimary: "Parler à l'agent IA",
    journeyPromptSecondary: "Démarrer un projet",
    journeyPromptNote: "Vous préférez un échange humain ensuite ?",
    journeyPromptNoteLink: "Contactez-nous",
    problemEyebrow: "Pourquoi beaucoup d'entreprises bloquent",
    problemTitle: "D'un travail dispersé à des systèmes plus intelligents.",
    problemDescription:
      "Beaucoup d'entreprises perdent du temps parce que leur site web, leurs demandes clients, leurs documents et leurs opérations quotidiennes sont déconnectés. teChia vous aide à rassembler tout cela dans un flux digital plus clair.",
    beforeLabel: "Avant",
    beforeItems: [
      "Présence en ligne faible",
      "Demandes manquées",
      "Suivi manuel",
      "Outils dispersés",
    ],
    afterLabel: "Après",
    afterItems: [
      "Site web premium",
      "Capture de prospects claire",
      "Automatisation intelligente",
      "Tableaux de bord simples",
    ],
    servicesEyebrow: "Ce que teChia peut créer",
    servicesTitle:
      "Des briques digitales simples qui aident les entreprises à grandir.",
    servicesDescription:
      "Nous gardons le digital concret : une marque plus forte, des demandes plus claires, un meilleur suivi et des systèmes qui soutiennent vraiment votre façon de travailler.",
    demoEyebrow: "Voir en pratique",
    demoTitle: "Explorez de vrais workflows digitaux avant de vous décider.",
    demoDescription:
      "L'Espace Démo vous aide à imaginer concrètement à quoi peuvent ressembler un meilleur site, un meilleur parcours client, un tableau de bord ou une expérience renforcée par l'IA.",
    reviewsEyebrow: "Avis clients",
    reviewsTitle:
      "Ce que les clients remarquent quand le digital devient plus clair.",
    reviewsDescription:
      "L'objectif n'est pas seulement d'être plus beau en ligne. Il s'agit d'être plus clair, plus crédible et plus facile à contacter.",
    workEyebrow: "Réalisations choisies",
    workTitle:
      "Quelques exemples de la direction que votre entreprise peut prendre.",
    workDescription:
      "Ces projets montrent comment teChia transforme des idées d'entreprise en expériences plus claires, en meilleurs systèmes et en parcours client plus convaincants.",
    workCta: "Voir le projet",
    workMore: "Voir plus de projets",
    faqEyebrow: "Questions fréquentes",
    faqTitle:
      "Les questions que les entreprises posent le plus souvent avant de commencer.",
    faqDescription:
      "Si vous voulez une recommandation plus rapide, l'agent IA peut vous aider à comprendre ce dont votre entreprise a probablement besoin en premier.",
    blogEyebrow: "Lectures utiles",
    blogTitle: "Quelques articles pratiques avant de vous décider.",
    blogDescription:
      "De courts articles pour les dirigeants qui veulent mieux comprendre les sites web, la visibilité, les systèmes et la croissance digitale.",
    blogCta: "Lire l'article",
    blogMore: "Voir le blog",
    finalEyebrow: "Votre prochaine étape",
    finalTitle: "Prêt à construire la maison digitale de votre entreprise ?",
    finalDescription:
      "Transformons votre site web, vos opérations et votre flux client en un système plus intelligent, pensé pour la croissance.",
    finalPrimaryLabel: "Démarrer un projet",
    finalSecondaryLabel: "Réserver une consultation",
    finalAiPrompt: "Besoin d'aide pour choisir d'abord ?",
    finalAiLinkLabel: "Parlez à l'agent IA.",
    reviewSourceLabel: "Avis homepage",
    nextStepLabel: "Meilleure prochaine étape",
  },
} as const satisfies Record<Locale, PageCopy>;

const services = {
  en: [
    {
      title: "Premium Websites",
      description:
        "Professional websites that help people take your business seriously.",
      icon: MonitorSmartphone,
    },
    {
      title: "Business Systems",
      description:
        "Internal tools that keep work, documents, and follow-up in one place.",
      icon: BriefcaseBusiness,
    },
    {
      title: "Automation",
      description:
        "Smart flows that reduce repetitive work and missed opportunities.",
      icon: Workflow,
    },
    {
      title: "Dashboards",
      description:
        "Clear views of your leads, activity, and performance in one place.",
      icon: LayoutDashboard,
    },
    {
      title: "AI Tools",
      description:
        "Helpful AI experiences for support, qualification, and speed.",
      icon: Bot,
    },
    {
      title: "Digital Strategy",
      description:
        "Clear guidance on what your business should build first.",
      icon: Compass,
    },
  ],
  fr: [
    {
      title: "Sites premium",
      description:
        "Des sites professionnels qui aident à prendre votre entreprise au sérieux.",
      icon: MonitorSmartphone,
    },
    {
      title: "Systèmes métier",
      description:
        "Des outils internes qui réunissent travail, documents et suivi au même endroit.",
      icon: BriefcaseBusiness,
    },
    {
      title: "Automatisation",
      description:
        "Des flux plus intelligents pour réduire les tâches répétitives et les opportunités manquées.",
      icon: Workflow,
    },
    {
      title: "Tableaux de bord",
      description:
        "Une vision claire de vos prospects, activités et performances.",
      icon: LayoutDashboard,
    },
    {
      title: "Outils IA",
      description:
        "Des expériences IA utiles pour le support, la qualification et la rapidité.",
      icon: Bot,
    },
    {
      title: "Stratégie digitale",
      description:
        "Une direction claire sur ce qu'il faut construire en premier.",
      icon: Compass,
    },
  ],
} as const;

const projectPreviewCopy = {
  en: {
    "teloh-global-business": {
      eyebrow: "Business website",
      description:
        "A premium company website built to present multiple services clearly and attract more serious leads.",
    },
    "teloh-global-travels": {
      eyebrow: "Travel platform",
      description:
        "A trust-building travel consultancy presence designed to guide visitors and simplify inquiries.",
    },
    "job-seeker-os": {
      eyebrow: "Digital product",
      description:
        "A structured platform that turns a messy job-search journey into a clearer digital experience.",
    },
    "mickey-car-sales": {
      eyebrow: "Sales showcase",
      description:
        "A polished automotive experience that makes browsing stock and reaching out feel simple and premium.",
    },
  },
  fr: {
    "teloh-global-business": {
      eyebrow: "Site d'entreprise",
      description:
        "Un site premium pense pour presenter plusieurs services clairement et attirer des prospects plus serieux.",
    },
    "teloh-global-travels": {
      eyebrow: "Plateforme voyage",
      description:
        "Une presence de conseil voyage concue pour inspirer confiance et simplifier les demandes.",
    },
    "job-seeker-os": {
      eyebrow: "Produit digital",
      description:
        "Une plateforme structuree qui transforme une recherche d'emploi dispersee en experience plus claire.",
    },
    "mickey-car-sales": {
      eyebrow: "Vitrine commerciale",
      description:
        "Une experience automobile soignee qui rend la decouverte du stock et la prise de contact plus simples.",
    },
  },
} as const;

function PatternOverlay({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 bg-center bg-cover opacity-[0.12]",
        className,
      )}
      style={{ backgroundImage: `url(${patternBackgroundSrc})` }}
    />
  );
}

function ChecklistCard({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "muted" | "accent";
}) {
  const dotColor =
    tone === "accent"
      ? "bg-gradient-to-r from-[#22D3EE] to-[#F5B942]"
      : "bg-white/35";

  return (
    <div className="gradient-border rounded-[1.6rem]">
      <div className="surface-panel h-full p-5 sm:p-6">
        <p className="eyebrow">{label}</p>
        <ul className="mt-5 grid gap-3 text-sm leading-7 text-muted sm:text-base">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-left">
              <span
                aria-hidden="true"
                className={cn("mt-2 h-2.5 w-2.5 shrink-0 rounded-full", dotColor)}
              />
              <span className="text-primary">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function JourneyStageCard({
  stage,
  nextStepLabel,
}: {
  stage: JourneyStage;
  nextStepLabel: string;
}) {
  return (
    <article className="gradient-border h-full rounded-[1.75rem]">
      <div className="surface-panel h-full overflow-hidden p-3 sm:p-4">
        <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#060912]">
          <Image
            src={stage.imageSrc}
            alt={stage.imageAlt}
            width={1200}
            height={900}
            sizes="(min-width: 1280px) 24vw, (min-width: 640px) 48vw, 100vw"
            className="h-auto w-full object-cover"
          />
        </div>
        <div className="px-1 pb-1 pt-5">
          <p className="eyebrow">{stage.stageLabel}</p>
          <h3 className="mt-3 text-xl font-semibold text-primary sm:text-2xl">
            {stage.title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
            {stage.description}
          </p>
          <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-2">
              {nextStepLabel}
            </p>
            <p className="mt-2 text-sm leading-7 text-primary">{stage.nextStep}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function ReviewCard({
  item,
  locale,
  sourceLabel,
}: {
  item: PublicFeedbackItem;
  locale: Locale;
  sourceLabel: string;
}) {
  const rating = Math.max(1, Math.min(5, item.rating ?? 5));
  const identity = [item.role, item.company].filter(Boolean).join(" · ");

  return (
    <article className="gradient-border h-full rounded-[1.7rem]">
      <div className="surface-panel h-full p-5 sm:p-6">
        <div className="flex items-center gap-1 text-[#F5B942]">
          {Array.from({ length: rating }).map((_, index) => (
            <Star key={`${item.id}-${index}`} className="size-4 fill-current" />
          ))}
        </div>
        <blockquote className="mt-5 text-pretty text-base leading-8 text-primary sm:text-lg">
          &ldquo;{item.quote}&rdquo;
        </blockquote>
        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="font-semibold text-primary">{item.name}</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            {identity || sourceLabel}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-accent-2">
            {locale === "fr" ? "Avis verifie" : "Verified feedback"}
          </p>
        </div>
      </div>
    </article>
  );
}

export function HomepageConversionFlow({
  locale,
  projectCards,
  feedbackItems,
  faqItems,
  blogPosts,
}: {
  locale: Locale;
  projectCards: CardItem[];
  feedbackItems: PublicFeedbackItem[];
  faqItems: PublicFaqItem[];
  blogPosts: CardItem[];
}) {
  const pageCopy = copy[locale];
  const serviceCards = services[locale];
  const previewCopy = projectPreviewCopy[locale];

  return (
    <>
      <section className="container overflow-hidden py-16 sm:py-20">
        <Reveal>
          <SectionHeading
            eyebrow={pageCopy.journeyEyebrow}
            title={pageCopy.journeyTitle}
            description={pageCopy.journeyDescription}
          />
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {pageCopy.journeyStages.map((stage, index) => (
            <Reveal key={stage.title} delay={index * 0.05}>
              <JourneyStageCard
                stage={stage}
                nextStepLabel={pageCopy.nextStepLabel}
              />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.12}>
          <div className="gradient-border mt-8 rounded-[2rem]">
            <div className="elevated-panel relative overflow-hidden px-5 py-8 sm:px-6 sm:py-9 md:px-8">
              <PatternOverlay className="opacity-[0.1]" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/55 to-transparent" />
              <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="eyebrow">{pageCopy.journeyPromptTitle}</p>
                  <p className="mt-4 max-w-3xl text-base leading-8 text-primary md:text-lg">
                    {pageCopy.journeyPromptDescription}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-muted">
                    {pageCopy.journeyPromptNote}{" "}
                    <Link
                      href={getLocalizedHref(locale, "/contact")}
                      className="font-semibold text-accent transition hover:text-accent-2"
                    >
                      {pageCopy.journeyPromptNoteLink}
                    </Link>
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Link
                    href={getLocalizedHref(locale, "/ai-consultant")}
                    className={cn(
                      buttonVariants({ variant: "primary", size: "lg" }),
                      "w-full justify-center sm:w-auto lg:w-full",
                    )}
                  >
                    <MessageCircleMore className="size-4" />
                    {pageCopy.journeyPromptPrimary}
                  </Link>
                  <Link
                    href={getLocalizedHref(locale, "/start-project")}
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "lg" }),
                      "w-full justify-center sm:w-auto lg:w-full",
                    )}
                  >
                    {pageCopy.journeyPromptSecondary}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <CustomFitWorkflowSection locale={locale} />

      <section className="container overflow-hidden py-16 sm:py-20">
        <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
          <Reveal>
            <div className="min-w-0">
              <SectionHeading
                eyebrow={pageCopy.problemEyebrow}
                title={pageCopy.problemTitle}
                description={pageCopy.problemDescription}
                align="left"
                className="mb-8 max-w-2xl"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Reveal delay={0.04}>
                  <ChecklistCard
                    label={pageCopy.beforeLabel}
                    items={pageCopy.beforeItems}
                    tone="muted"
                  />
                </Reveal>
                <Reveal delay={0.08}>
                  <ChecklistCard
                    label={pageCopy.afterLabel}
                    items={pageCopy.afterItems}
                    tone="accent"
                  />
                </Reveal>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="gradient-border rounded-[2rem]">
              <div className="elevated-panel relative overflow-hidden p-3 sm:p-4">
                <PatternOverlay className="opacity-[0.12]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/55 to-transparent" />
                <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#05070D]">
                  <Image
                    src={problemIllustrationSrc[locale]}
                    alt=""
                    aria-hidden="true"
                    width={1600}
                    height={900}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="h-auto w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container overflow-hidden py-16 sm:py-20">
        <Reveal>
          <SectionHeading
            eyebrow={pageCopy.servicesEyebrow}
            title={pageCopy.servicesTitle}
            description={pageCopy.servicesDescription}
          />
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {serviceCards.map((service, index) => {
            const Icon = service.icon;

            return (
              <Reveal key={service.title} delay={index * 0.05}>
                <article className="gradient-border rounded-[1.75rem]">
                  <div className="surface-panel relative h-full min-w-0 overflow-hidden p-5 sm:p-6">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/45 to-transparent" />
                    <div className="icon-chip rounded-2xl p-3">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-5 text-2xl font-semibold text-primary">
                      {service.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
                      {service.description}
                    </p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="container overflow-hidden py-16 sm:py-20">
        <div className="gradient-border rounded-[2rem]">
          <div className="elevated-panel relative overflow-hidden px-5 py-8 sm:px-6 sm:py-10 md:px-8">
            <PatternOverlay />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/55 to-transparent" />
            <div className="relative z-10">
              <Reveal>
                <SectionHeading
                  eyebrow={pageCopy.demoEyebrow}
                  title={pageCopy.demoTitle}
                  description={pageCopy.demoDescription}
                  className="mb-8"
                />
              </Reveal>

              <Reveal delay={0.06}>
                <DemoGrid locale={locale} />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="container overflow-hidden py-16 sm:py-20">
        <Reveal>
          <SectionHeading
            eyebrow={pageCopy.reviewsEyebrow}
            title={pageCopy.reviewsTitle}
            description={pageCopy.reviewsDescription}
          />
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-3">
          {feedbackItems.slice(0, 3).map((item, index) => (
            <Reveal key={item.id} delay={index * 0.05}>
              <ReviewCard
                item={item}
                locale={locale}
                sourceLabel={pageCopy.reviewSourceLabel}
              />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container overflow-hidden py-16 sm:py-20">
        <Reveal>
          <SectionHeading
            eyebrow={pageCopy.workEyebrow}
            title={pageCopy.workTitle}
            description={pageCopy.workDescription}
          />
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2">
          {projectCards.map((item, index) => {
            const preview = previewCopy[item.slug as keyof typeof previewCopy];

            return (
              <Reveal key={item.slug} delay={index * 0.05}>
                <Link
                  href={getLocalizedHref(locale, `/portfolio/${item.slug}`)}
                  className="group block"
                >
                  <article className="premium-card relative h-full min-w-0 overflow-hidden rounded-[1.8rem] p-5 transition duration-500 hover:-translate-y-1.5 hover:border-cyan-300/30 hover:shadow-[0_28px_80px_rgba(8,20,36,0.12)] sm:p-6">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/55 to-transparent" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(245,185,66,0.08),transparent_24%)] opacity-0 transition duration-500 group-hover:opacity-100" />
                    <div className="relative z-[1] min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="eyebrow">
                          {preview?.eyebrow || item.eyebrow || pageCopy.workEyebrow}
                        </p>
                        <Sparkles className="size-4 text-accent-2" />
                      </div>
                      <h3 className="mt-5 text-2xl font-semibold text-primary">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
                        {preview?.description || item.description}
                      </p>
                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                        {pageCopy.workCta}
                        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </article>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.08}>
          <div className="mt-8 flex justify-center">
            <Link
              href={getLocalizedHref(locale, "/portfolio")}
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "w-full justify-center sm:w-auto",
              )}
            >
              {pageCopy.workMore}
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="container overflow-hidden py-16 sm:py-20">
        <Reveal>
          <SectionHeading
            eyebrow={pageCopy.faqEyebrow}
            title={pageCopy.faqTitle}
            description={pageCopy.faqDescription}
          />
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-2">
          {faqItems.slice(0, 6).map((item, index) => (
            <Reveal key={item.id} delay={index * 0.04}>
              <details className="group gradient-border rounded-[1.6rem]">
                <summary className="surface-panel cursor-pointer list-none p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-left text-lg font-semibold text-primary sm:text-xl">
                      {item.question}
                    </h3>
                    <span className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-2 transition group-open:rotate-45">
                      +
                    </span>
                  </div>
                </summary>
                <div className="surface-panel -mt-2 px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
                  <p className="pr-6 text-left text-sm leading-7 text-muted sm:text-base">
                    {item.answer}
                  </p>
                </div>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container overflow-hidden py-16 sm:py-20">
        <Reveal>
          <SectionHeading
            eyebrow={pageCopy.blogEyebrow}
            title={pageCopy.blogTitle}
            description={pageCopy.blogDescription}
          />
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-3">
          {blogPosts.map((item, index) => (
            <Reveal key={item.slug} delay={index * 0.05}>
              <Link
                href={getLocalizedHref(locale, `/blog/${item.slug}`)}
                className="group block"
              >
                <article className="premium-card h-full min-w-0 overflow-hidden rounded-[1.75rem] p-5 transition duration-500 hover:-translate-y-1.5 hover:border-cyan-300/30 hover:shadow-[0_28px_80px_rgba(8,20,36,0.12)] sm:p-6">
                  <p className="eyebrow">{pageCopy.blogEyebrow}</p>
                  <h3 className="mt-4 text-2xl font-semibold text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
                    {item.description}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                    {pageCopy.blogCta}
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </article>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.08}>
          <div className="mt-8 flex justify-center">
            <Link
              href={getLocalizedHref(locale, "/blog")}
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "w-full justify-center sm:w-auto",
              )}
            >
              {pageCopy.blogMore}
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="container overflow-hidden pb-20 pt-16 sm:pt-20">
        <div className="gradient-border rounded-[2.1rem]">
          <div className="elevated-panel relative overflow-hidden px-5 py-9 text-center sm:px-7 md:px-10 md:py-14">
            <PatternOverlay className="opacity-[0.14]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_84%_80%,rgba(251,113,133,0.14),transparent_24%),radial-gradient(circle_at_12%_85%,rgba(245,185,66,0.12),transparent_20%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/60 to-transparent" />
            <div className="relative z-10">
              <Reveal>
                <p className="eyebrow mx-auto justify-center">
                  {pageCopy.finalEyebrow}
                </p>
              </Reveal>
              <Reveal delay={0.04}>
                <h2 className="mx-auto mt-4 max-w-4xl text-balance text-[clamp(2.6rem,9vw,5rem)] font-semibold text-foreground">
                  <span className="headline-gradient">{pageCopy.finalTitle}</span>
                </h2>
              </Reveal>
              <Reveal delay={0.08}>
                <div
                  className="headline-underline mx-auto mt-6"
                  aria-hidden="true"
                />
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-muted md:text-lg">
                  {pageCopy.finalDescription}
                </p>
              </Reveal>
              <Reveal delay={0.16}>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href={getLocalizedHref(locale, "/start-project")}
                    className={cn(
                      buttonVariants({ variant: "primary", size: "lg" }),
                      "w-full justify-center sm:w-auto",
                    )}
                  >
                    {pageCopy.finalPrimaryLabel}
                  </Link>
                  <Link
                    href={getLocalizedHref(locale, "/contact")}
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "lg" }),
                      "w-full justify-center sm:w-auto",
                    )}
                  >
                    {pageCopy.finalSecondaryLabel}
                  </Link>
                </div>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted">
                  {pageCopy.finalAiPrompt}{" "}
                  <Link
                    href={getLocalizedHref(locale, "/ai-consultant")}
                    className="font-semibold text-accent transition hover:text-accent-2"
                  >
                    {pageCopy.finalAiLinkLabel}
                  </Link>
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
