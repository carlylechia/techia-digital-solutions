import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Compass,
  LayoutDashboard,
  MonitorPlay,
  MessageCircleMore,
  MonitorSmartphone,
  Star,
  Workflow,
} from "lucide-react";
import { CustomFitWorkflowSection } from "@/components/sections/custom-fit-workflow-section";
import { buttonVariants } from "@/components/site/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { SwipeDotsCarousel } from "@/components/ui/swipe-dots-carousel";
import { getLocalizedHref, type CardItem, type Locale } from "@/content/site";
import { getBlogIndexPath, getBlogPostPath } from "@/lib/blog/slug";
import { cn } from "@/lib/utils";

const patternBackgroundSrc =
  "/images/homepage/03-background-patterns/nexus-grid-background.svg";
const sectionSpacing = "py-12 sm:py-16 lg:py-18";
const sectionSpacingCompact = "py-10 sm:py-14 lg:py-16";

const problemIllustrationSrc = {
  en: "/images/homepage/02-section-illustrations/problem-to-solution-illustration-en.svg",
  fr: "/images/homepage/02-section-illustrations/problem-to-solution-illustration-fr.svg",
} as const;

/**
 * Homepage reading card. The blog lineup is curated by editors in the blog
 * workspace, so it also carries the article image, topic, and reading time.
 * Static dictionary articles still satisfy this shape because every extra
 * field is optional.
 */
type ReadingCard = CardItem & {
  imageUrl?: string | null;
  imageAlt?: string | null;
  readingTime?: number;
};

function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

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
  demoPoints: string[];
  demoCta: string;
  reviewsEyebrow: string;
  reviewsTitle: string;
  reviewsDescription: string;
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
    journeyTitle: "Wherever your business is today, we help it grow from there.",
    journeyDescription:
      "Some businesses still depend on walk-ins. Some post online without a clear brand. Some need stronger campaigns, websites, or systems. teChia helps at each stage.",
    journeyStages: [
      {
        imageSrc:
          "/images/homepage/02-section-illustrations/journey-stage-offline.webp",
        imageAlt:
          "A small business owner serving customers in person with no visible digital presence yet.",
        stageLabel: "Stage 01",
        title: "You mostly rely on walk-ins, referrals, or your phone",
        description:
          "There is no real digital growth engine yet, so opportunities stop where your location, referrals, and saved contacts stop.",
        nextStep:
          "Build a credible brand presence people can find, trust, and contact easily.",
      },
      {
        imageSrc:
          "/images/homepage/02-section-illustrations/journey-stage-social-only.webp",
        imageAlt:
          "A business owner replying to messages through WhatsApp and personal social accounts.",
        stageLabel: "Stage 02",
        title: "Your business is online, but growth still depends on WhatsApp or personal socials",
        description:
          "People can message you, but the business still feels tied to a personal account and the brand is hard to take seriously.",
        nextStep:
          "Separate the brand, clarify the offer, and turn attention into structured inquiries.",
      },
      {
        imageSrc:
          "/images/homepage/02-section-illustrations/journey-stage-branding.webp",
        imageAlt:
          "A business owner with some social media presence and branding, but an inconsistent customer journey.",
        stageLabel: "Stage 03",
        title: "People notice you, but the brand and customer journey still feel uneven",
        description:
          "You may already have content, a logo, or some traction online, but trust, follow-up, and message clarity still need work.",
        nextStep:
          "Strengthen the brand, sharpen the message, and guide prospects into a clearer client journey.",
      },
      {
        imageSrc:
          "/images/homepage/02-section-illustrations/journey-stage-systems.webp",
        imageAlt:
          "A growing business owner reviewing digital systems, dashboards, and a stronger online presence with a team.",
        stageLabel: "Stage 04",
        title:
          "You are ready for stronger campaigns, smarter systems, or a full growth roadmap",
        description:
          "If you already have traction, teChia can strengthen the marketing, website, automation, and internal systems that support your next phase of growth.",
        nextStep:
          "Turn visibility into a connected growth system that can scale with more confidence.",
      },
    ],
    journeyPromptTitle: "Not sure which digital growth step should come first?",
    journeyPromptDescription:
      "Tell the AI consultant how you attract customers today and what is slowing growth. It will point you to the smartest next move before you commit.",
    journeyPromptPrimary: "Talk to the AI Consultant",
    journeyPromptSecondary: "Book a Free Consultation",
    journeyPromptNote: "Prefer to review the service catalog first?",
    journeyPromptNoteLink: "Explore our services",
    problemEyebrow: "Why businesses feel stuck",
    problemTitle: "From scattered activity to a connected growth system.",
    problemDescription:
      "Many businesses lose momentum because their brand, marketing, customer inquiries, and daily operations are disconnected. teChia helps bring them into one clearer digital flow.",
    beforeLabel: "Before",
    beforeItems: [
      "Inconsistent brand presence",
      "Unclear lead flow",
      "Manual follow-up",
      "Disconnected tools",
    ],
    afterLabel: "After",
    afterItems: [
      "Stronger visibility",
      "Qualified lead capture",
      "Automated follow-up",
      "Clearer operations",
    ],
    servicesEyebrow: "How teChia helps",
    servicesTitle: "The growth building blocks your business can combine.",
    servicesDescription:
      "We bring together marketing, branding, websites, commerce, SEO, and systems so growth does not depend on guesswork.",
    demoEyebrow: "See it in action",
    demoTitle: "Want to see examples before you decide?",
    demoDescription:
      "Visit the Demo Lab to explore dashboards, portals, booking flows, automations, and AI experiences that can sit behind a stronger growth strategy.",
    demoPoints: [
      "See realistic system examples",
      "Understand what fits your business",
      "Request the closest demo directly",
    ],
    demoCta: "Explore the Demo Lab",
    reviewsEyebrow: "Client feedback",
    reviewsTitle: "What clients notice when growth starts feeling more organized.",
    reviewsDescription:
      "The goal is not only to look better online. It is to attract better opportunities, operate with more confidence, and create a smoother customer experience.",
    faqEyebrow: "Common questions",
    faqTitle: "Questions businesses usually ask before they begin.",
    faqDescription:
      "If you want a quicker recommendation, the AI consultant can help you understand what your business likely needs first.",
    blogEyebrow: "Featured insights",
    blogTitle: "The reads our clients keep coming back to.",
    blogDescription:
      "A curated selection of practical teChia articles, chosen by our editorial team to help you make your next digital decision with confidence.",
    blogCta: "Read article",
    blogMore: "Visit the blog",
    finalEyebrow: "Your next step",
    finalTitle: "Ready to grow your business with a smarter digital strategy?",
    finalDescription:
      "Let's connect your visibility, customer journey, and operations into a system built for growth.",
    finalPrimaryLabel: "Book a Free Consultation",
    finalSecondaryLabel: "Explore Our Services",
    finalAiPrompt: "Prefer a tailored recommendation before that?",
    finalAiLinkLabel: "Talk to the AI Consultant.",
    reviewSourceLabel: "Homepage review",
    nextStepLabel: "Best next step",
  },
  fr: {
    journeyEyebrow: "Partir de votre réalité",
    journeyTitle:
      "Quel que soit le niveau actuel de votre entreprise, nous l’aidons à grandir à partir de là.",
    journeyDescription:
      "Certaines entreprises dépendent encore des passages en boutique. D’autres publient en ligne sans vraie marque. D’autres ont besoin de campagnes plus fortes, d’un meilleur site ou de meilleurs systèmes. teChia vous aide à chaque étape.",
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
          "Il n’y a pas encore de vrai moteur de croissance digital, donc les opportunités s’arrêtent souvent à votre emplacement, vos recommandations et vos contacts enregistrés.",
        nextStep:
          "Construire une présence de marque crédible que les gens peuvent trouver, comprendre et contacter facilement.",
      },
      {
        imageSrc:
          "/images/homepage/02-section-illustrations/journey-stage-social-only.webp",
        imageAlt:
          "Une propriétaire d'entreprise qui répond aux clients via WhatsApp et des comptes personnels sur les réseaux sociaux.",
        stageLabel: "Étape 02",
        title:
          "Votre entreprise existe en ligne, mais la croissance dépend encore surtout de WhatsApp ou de réseaux personnels",
        description:
          "Les gens peuvent vous écrire, mais l'activité reste liée à un compte personnel et la marque est difficile à prendre au sérieux.",
        nextStep:
          "Séparer la marque, clarifier l’offre et transformer l’attention en demandes structurées.",
      },
      {
        imageSrc:
          "/images/homepage/02-section-illustrations/journey-stage-branding.webp",
        imageAlt:
          "Une entrepreneure avec une certaine présence visuelle en ligne, mais un parcours client encore incohérent.",
        stageLabel: "Étape 03",
        title:
          "On vous remarque, mais la marque et le parcours client restent inégaux",
        description:
          "Vous avez peut-être déjà du contenu, un logo ou un début de traction, mais la confiance, le suivi et la clarté du message peuvent encore progresser.",
        nextStep:
          "Renforcer la marque, clarifier le message et guider les prospects vers un parcours plus net.",
      },
      {
        imageSrc:
          "/images/homepage/02-section-illustrations/journey-stage-systems.webp",
        imageAlt:
          "Une dirigeante en croissance qui examine un site plus fort, des systèmes, des tableaux de bord et une équipe mieux organisée.",
        stageLabel: "Étape 04",
        title:
          "Vous êtes prêt pour de meilleures campagnes, des systèmes plus intelligents ou une vraie roadmap de croissance",
        description:
          "Si votre activité a déjà une traction, teChia peut renforcer le marketing, le site, l’automatisation et les systèmes internes qui soutiennent votre prochaine phase de croissance.",
        nextStep:
          "Transformer la visibilité en système de croissance connecté, plus fluide et plus évolutif.",
      },
    ],
    journeyPromptTitle:
      "Vous ne savez pas encore quelle étape de croissance digitale doit venir en premier ?",
    journeyPromptDescription:
      "Expliquez à l’agent IA comment vous attirez vos clients aujourd’hui et ce qui freine la croissance. Il vous indiquera la meilleure prochaine étape avant tout engagement.",
    journeyPromptPrimary: "Parler à l'agent IA",
    journeyPromptSecondary: "Réserver une consultation gratuite",
    journeyPromptNote: "Vous préférez d’abord parcourir les services ?",
    journeyPromptNoteLink: "Explorer nos services",
    problemEyebrow: "Pourquoi beaucoup d'entreprises bloquent",
    problemTitle: "D’une activité dispersée à un système de croissance connecté.",
    problemDescription:
      "Beaucoup d’entreprises perdent de l’élan parce que leur marque, leur marketing, leurs demandes clients et leurs opérations quotidiennes sont déconnectés. teChia rassemble tout cela dans un flux digital plus clair.",
    beforeLabel: "Avant",
    beforeItems: [
      "Présence de marque incohérente",
      "Flux de leads flou",
      "Suivi manuel",
      "Outils déconnectés",
    ],
    afterLabel: "Après",
    afterItems: [
      "Visibilité renforcée",
      "Capture de leads qualifiés",
      "Suivi automatisé",
      "Opérations plus claires",
    ],
    servicesEyebrow: "Comment teChia aide",
    servicesTitle:
      "Les briques de croissance que votre entreprise peut combiner.",
    servicesDescription:
      "Nous réunissons marketing, branding, web, commerce, SEO et systèmes pour que la croissance ne dépende plus de suppositions.",
    demoEyebrow: "Voir en pratique",
    demoTitle: "Vous voulez voir des exemples avant de vous décider ?",
    demoDescription:
      "Visitez l’Espace Démo pour explorer dashboards, portails, réservations, automatisations et expériences IA qui peuvent soutenir une stratégie de croissance plus forte.",
    demoPoints: [
      "Voir des exemples réalistes",
      "Comprendre ce qui convient à votre activité",
      "Demander directement la démo la plus proche",
    ],
    demoCta: "Explorer l'Espace Démo",
    reviewsEyebrow: "Avis clients",
    reviewsTitle:
      "Ce que les clients remarquent quand la croissance devient mieux organisée.",
    reviewsDescription:
      "L’objectif n’est pas seulement d’être plus beau en ligne. Il s’agit d’attirer de meilleures opportunités, d’opérer avec plus d’assurance et d’offrir une expérience plus fluide.",
    faqEyebrow: "Questions fréquentes",
    faqTitle:
      "Les questions que les entreprises posent le plus souvent avant de commencer.",
    faqDescription:
      "Si vous voulez une recommandation plus rapide, l'agent IA peut vous aider à comprendre ce dont votre entreprise a probablement besoin en premier.",
    blogEyebrow: "À la une",
    blogTitle: "Les articles que nos clients relisent le plus.",
    blogDescription:
      "Une sélection d'articles pratiques teChia, choisis par notre équipe éditoriale pour vous aider à décider clairement de votre prochaine étape digitale.",
    blogCta: "Lire l'article",
    blogMore: "Voir le blog",
    finalEyebrow: "Votre prochaine étape",
    finalTitle:
      "Prêt à faire grandir votre entreprise avec une stratégie digitale plus intelligente ?",
    finalDescription:
      "Connectons votre visibilité, votre parcours client et vos opérations dans un système pensé pour la croissance.",
    finalPrimaryLabel: "Réserver une consultation gratuite",
    finalSecondaryLabel: "Explorer nos services",
    finalAiPrompt: "Vous préférez d’abord une recommandation plus ciblée ?",
    finalAiLinkLabel: "Parler à l’agent IA.",
    reviewSourceLabel: "Avis homepage",
    nextStepLabel: "Meilleure prochaine étape",
  },
} as const satisfies Record<Locale, PageCopy>;

const services = {
  en: [
    {
      title: "Social Media Management",
      description:
        "Consistent content and community management that keep your business visible and relevant.",
      icon: MonitorSmartphone,
    },
    {
      title: "Digital Marketing",
      description:
        "Campaigns and funnels that attract qualified leads and turn attention into measurable demand.",
      icon: BriefcaseBusiness,
    },
    {
      title: "Branding & Graphic Design",
      description:
        "Sharper strategy and visuals that make your business look credible and memorable.",
      icon: Workflow,
    },
    {
      title: "Website Design & Development",
      description:
        "High-performance websites that explain the offer clearly and convert visitors into inquiries.",
      icon: LayoutDashboard,
    },
    {
      title: "E-commerce Solutions",
      description:
        "Storefronts and buying journeys that make selling easier for customers and teams.",
      icon: Bot,
    },
    {
      title: "SEO",
      description:
        "Search optimization that helps the right customers discover your business sooner.",
      icon: Compass,
    },
  ],
  fr: [
    {
      title: "Gestion des réseaux sociaux",
      description:
        "Un contenu régulier et une gestion de communauté qui gardent votre entreprise visible et pertinente.",
      icon: MonitorSmartphone,
    },
    {
      title: "Marketing digital",
      description:
        "Des campagnes et des funnels qui attirent des leads qualifiés et transforment l’attention en demande mesurable.",
      icon: BriefcaseBusiness,
    },
    {
      title: "Branding & design graphique",
      description:
        "Une stratégie et des visuels plus solides pour rendre votre entreprise crédible et mémorable.",
      icon: Workflow,
    },
    {
      title: "Design & développement web",
      description:
        "Des sites performants qui expliquent clairement l’offre et transforment les visiteurs en demandes.",
      icon: LayoutDashboard,
    },
    {
      title: "Solutions e-commerce",
      description:
        "Des vitrines et parcours d’achat qui rendent la vente plus fluide pour les clients comme pour l’équipe.",
      icon: Bot,
    },
    {
      title: "SEO",
      description:
        "Une optimisation search qui aide les bons prospects à découvrir votre entreprise plus tôt.",
      icon: Compass,
    },
  ],
} as const;

function PatternOverlay({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 bg-center bg-cover opacity-[0.08]",
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
        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#060912] sm:aspect-[5/4]">
          <Image
            src={stage.imageSrc}
            alt={stage.imageAlt}
            width={1200}
            height={900}
            sizes="(min-width: 1280px) 24vw, (min-width: 640px) 48vw, 100vw"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="px-1 pb-1 pt-5">
          <p className="eyebrow">{stage.stageLabel}</p>
          <h3 className="mt-3 text-[1.25rem] font-semibold text-primary sm:text-[1.42rem]">
            {stage.title}
          </h3>
          <p className="mt-3 text-sm leading-[1.72] text-muted sm:text-[0.98rem] sm:leading-7">
            {stage.description}
          </p>
          <div className="mt-5 rounded-[1.35rem] border border-border bg-background/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-2">
              {nextStepLabel}
            </p>
            <p className="mt-2 text-sm leading-[1.72] text-primary sm:leading-7">
              {stage.nextStep}
            </p>
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
      <div className="elevated-panel flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-center gap-1 text-[#F5B942]">
          {Array.from({ length: rating }).map((_, index) => (
            <Star key={`${item.id}-${index}`} className="size-4 fill-current" />
          ))}
        </div>
        <blockquote className="mt-5 flex-1 text-pretty text-base leading-8 text-primary sm:text-lg">
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
  feedbackItems,
  faqItems,
  blogPosts,
}: {
  locale: Locale;
  feedbackItems: PublicFeedbackItem[];
  faqItems: PublicFaqItem[];
  blogPosts: ReadingCard[];
}) {
  const pageCopy = copy[locale];
  const serviceCards = services[locale];
  const testimonialDotLabels = feedbackItems.slice(0, 6).map((item, index) =>
    locale === "fr"
      ? `Voir l'avis ${index + 1} de ${item.name}`
      : `View testimonial ${index + 1} from ${item.name}`,
  );

  return (
    <>
      <section className={cn("container overflow-hidden", sectionSpacing)}>
        <Reveal>
          <SectionHeading
            eyebrow={pageCopy.journeyEyebrow}
            title={pageCopy.journeyTitle}
            description={pageCopy.journeyDescription}
            className="mb-8 sm:mb-9"
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
                      href={getLocalizedHref(locale, "/services")}
                      className="font-semibold text-accent underline decoration-accent/45 underline-offset-4 transition hover:text-accent-2 hover:decoration-accent-2"
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
                    href={getLocalizedHref(locale, "/contact")}
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

      <CustomFitWorkflowSection
        locale={locale}
        className="py-10 sm:py-14 lg:py-16"
      />

      <section className={cn("container overflow-hidden", sectionSpacingCompact)}>
        <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
          <Reveal>
            <div className="min-w-0">
              <SectionHeading
                eyebrow={pageCopy.problemEyebrow}
                title={pageCopy.problemTitle}
                description={pageCopy.problemDescription}
                align="left"
                className="mb-7 max-w-2xl sm:mb-8"
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

      <section className={cn("container overflow-hidden", sectionSpacingCompact)}>
        <Reveal>
          <SectionHeading
            eyebrow={pageCopy.servicesEyebrow}
            title={pageCopy.servicesTitle}
            description={pageCopy.servicesDescription}
            className="mb-8 sm:mb-9"
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
                    <h3 className="mt-5 text-[1.38rem] font-semibold text-primary sm:text-[1.52rem]">
                      {service.title}
                    </h3>
                    <p className="mt-3 text-sm leading-[1.72] text-muted sm:text-[0.98rem] sm:leading-7">
                      {service.description}
                    </p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className={cn("container overflow-hidden", sectionSpacingCompact)}>
        <div className="gradient-border rounded-[2rem]">
          <div className="surface-panel relative overflow-hidden px-5 py-7 sm:px-6 sm:py-8 md:px-8">
            <PatternOverlay />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/55 to-transparent" />
            <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <Reveal>
                  <SectionHeading
                    eyebrow={pageCopy.demoEyebrow}
                    title={pageCopy.demoTitle}
                    description={pageCopy.demoDescription}
                    align="left"
                    className="mb-0 max-w-3xl"
                  />
                </Reveal>

                <Reveal delay={0.06}>
                  <div className="mt-6 flex flex-wrap gap-2.5">
                    {pageCopy.demoPoints.map((item) => (
                      <span key={item} className="trust-pill bg-background/75 dark:bg-white/[0.04]">
                        <MonitorPlay className="size-3.5" />
                        {item}
                      </span>
                    ))}
                  </div>
                </Reveal>
              </div>

              <Reveal delay={0.1}>
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Link
                    href={getLocalizedHref(locale, "/demo-lab")}
                    className={cn(
                      buttonVariants({ variant: "primary", size: "lg" }),
                      "w-full justify-center sm:w-auto lg:w-full",
                    )}
                  >
                    {pageCopy.demoCta}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className={cn("container overflow-hidden", sectionSpacingCompact)}>
        <Reveal>
          <SectionHeading
            eyebrow={pageCopy.reviewsEyebrow}
            title={pageCopy.reviewsTitle}
            description={pageCopy.reviewsDescription}
            className="mb-8 sm:mb-9"
          />
        </Reveal>

        <Reveal delay={0.05}>
          <SwipeDotsCarousel
            className="homepage-testimonials-carousel"
            viewportClassName="homepage-testimonials-viewport"
            trackClassName="homepage-testimonials-track"
            slideClassName="homepage-testimonials-slide"
            ariaLabel={
              locale === "fr"
                ? "Carrousel d'avis clients"
                : "Client testimonials carousel"
            }
            autoplayMs={5600}
            loop
            pauseOnHover
            respectReducedMotion
            dotLabels={testimonialDotLabels}
          >
            {feedbackItems.slice(0, 6).map((item) => (
              <ReviewCard
                key={item.id}
                item={item}
                locale={locale}
                sourceLabel={pageCopy.reviewSourceLabel}
              />
            ))}
          </SwipeDotsCarousel>
        </Reveal>
      </section>

      <section className={cn("container overflow-hidden", sectionSpacingCompact)}>
        <Reveal>
          <SectionHeading
            eyebrow={pageCopy.faqEyebrow}
            title={pageCopy.faqTitle}
            description={pageCopy.faqDescription}
            className="mb-8 sm:mb-9"
          />
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-2">
          {faqItems.slice(0, 6).map((item, index) => (
            <Reveal key={item.id} delay={index * 0.04}>
              <details className="group gradient-border rounded-[1.6rem]">
                <summary className="surface-panel cursor-pointer list-none p-5 transition hover:bg-black/[0.01] focus-visible:outline-none sm:p-6 dark:hover:bg-white/[0.02]">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-left text-[1.05rem] font-semibold text-primary sm:text-[1.12rem]">
                      {item.question}
                    </h3>
                    <span className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-2 transition group-open:rotate-45">
                      +
                    </span>
                  </div>
                </summary>
                <div className="surface-panel -mt-2 px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
                  <p className="pr-6 text-left text-sm leading-[1.72] text-muted sm:text-[0.98rem] sm:leading-7">
                    {item.answer}
                  </p>
                </div>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      <section className={cn("container overflow-hidden", sectionSpacingCompact)}>
        <Reveal>
          <SectionHeading
            eyebrow={pageCopy.blogEyebrow}
            title={pageCopy.blogTitle}
            description={pageCopy.blogDescription}
            className="mb-8 sm:mb-9"
          />
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-3">
          {blogPosts.map((item, index) => (
            <Reveal key={item.slug} delay={index * 0.05}>
              <Link
                href={getBlogPostPath(locale, item.slug)}
                className="group block h-full"
              >
                <article className="premium-card flex h-full min-w-0 flex-col overflow-hidden rounded-[1.75rem] transition duration-500 hover:-translate-y-1.5 hover:border-cyan-300/30 hover:shadow-[0_28px_80px_rgba(8,20,36,0.12)]">
                  <div className="relative aspect-[16/9] overflow-hidden bg-surface-strong">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.imageAlt || item.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, 100vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.22),transparent_45%),linear-gradient(135deg,rgba(6,182,212,0.14),rgba(59,130,246,0.08))]" />
                    )}
                    <span className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <p className="eyebrow">{item.eyebrow || pageCopy.blogEyebrow}</p>
                    <h3 className="mt-4 text-[1.42rem] font-semibold text-primary sm:text-[1.55rem]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-[1.72] text-muted sm:text-[0.98rem] sm:leading-7">
                      {item.description}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                      {item.readingTime ? (
                        <span className="text-xs font-medium text-muted">
                          {locale === "fr"
                            ? `${item.readingTime} min de lecture`
                            : `${item.readingTime} min read`}
                        </span>
                      ) : null}
                      {pageCopy.blogCta}
                      <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  </div>
                </article>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.08}>
          <div className="mt-8 flex justify-center">
            <Link
              href={getBlogIndexPath(locale)}
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

      <section className="container overflow-hidden pb-18 pt-12 sm:pb-20 sm:pt-16 lg:pt-18">
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
                <h2 className="mx-auto mt-4 max-w-4xl text-balance text-[clamp(2.35rem,8vw,4.8rem)] font-semibold text-foreground">
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
                <p className="mx-auto mt-5 max-w-[42rem] text-[0.98rem] leading-7 text-muted md:text-[1.05rem] md:leading-8">
                  {pageCopy.finalDescription}
                </p>
              </Reveal>
              <Reveal delay={0.16}>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href={getLocalizedHref(locale, "/contact")}
                    className={cn(
                      buttonVariants({ variant: "primary", size: "lg" }),
                      "w-full justify-center sm:w-auto",
                    )}
                  >
                    {pageCopy.finalPrimaryLabel}
                  </Link>
                  <Link
                    href={getLocalizedHref(locale, "/services")}
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
                    className="font-semibold text-accent underline decoration-accent/45 underline-offset-4 transition hover:text-accent-2 hover:decoration-accent-2"
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
