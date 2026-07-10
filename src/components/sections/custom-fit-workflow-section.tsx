import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Compass,
  FileText,
  FolderKanban,
  Rocket,
  Search,
  Sparkles,
  Star,
  Workflow,
} from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { buttonVariants } from "@/components/site/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { getLocalizedHref, type Locale } from "@/content/site";
import { cn } from "@/lib/utils";

const patternBackgroundSrc =
  "/images/homepage/03-background-patterns/nexus-grid-background.svg";

type WorkflowStep = {
  icon: typeof Bot;
  step: string;
  title: string;
  description: string;
};

type WorkflowCopy = {
  eyebrow: string;
  title: string;
  description: string;
  promiseTitle: string;
  promiseDescription: string;
  promisePoints: string[];
  visualTitle: string;
  visualLabels: string[];
  visualFooter: string;
  stepsTitle: string;
  stepsDescription: string;
  steps: WorkflowStep[];
  primaryAction: string;
  secondaryAction: string;
  contactLead: string;
  contactLabel: string;
  stageLabel: string;
};

const workflowCopy = {
  en: {
    eyebrow: "Custom-fit growth delivery",
    title: "We shape the right growth system around your business, not around a template.",
    description:
      "teChia does not push one-size-fits-all services. We study your goals, market position, way of working, brand identity, and operational reality before we recommend what should be built.",
    promiseTitle: "Built around your business identity and growth goals",
    promiseDescription:
      "Every project is tailored to your customer journey, internal needs, brand standards, market priorities, and the tools your team already depends on.",
    promisePoints: [
      "We respect your brand identity, tone, positioning, and commercial reality.",
      "We adapt to your customer flow, internal workflow, and operational constraints.",
      "We only recommend the marketing, technology, or automation layer your business needs now.",
    ],
    visualTitle: "A clear client journey from discovery to continuity",
    visualLabels: ["Brand", "Scope", "Portal", "MVP", "Scale"],
    visualFooter:
      "Clear requirements, visible progress, tracked feedback, and long-term continuity.",
    stepsTitle: "How working with teChia actually flows",
    stepsDescription:
      "The process stays clear from the first growth conversation to delivery, review, and long-term support.",
    steps: [
      {
        icon: Bot,
        step: "01",
        title: "Clarify the exact growth need",
        description:
          "Start with the AI consultant or contact us directly so we can understand the business goal and point you to the right service mix first.",
      },
      {
        icon: Search,
        step: "02",
        title: "Review examples that match the need",
        description:
          "Explore the Demo Lab to see whether your closest use case already exists and request it with more confidence.",
      },
      {
        icon: FileText,
        step: "03",
        title: "Submit a focused growth brief",
        description:
          "Send a focused request with the clearest version of the challenge. The AI consultant can help you prepare it.",
      },
      {
        icon: Compass,
        step: "04",
        title: "Confirm scope, roadmap, and investment rhythm",
        description:
          "We turn the request into an official teChia engagement with clear business requirements, scope, pricing, and delivery phases.",
      },
      {
        icon: FolderKanban,
        step: "05",
        title: "Move the work into the client portal",
        description:
          "You receive a portal space for payments, messages, documents, brand assets, approvals, and feedback across each phase.",
      },
      {
        icon: Rocket,
        step: "06",
        title: "Review the first growth-ready version",
        description:
          "We deliver the first strong version of the work, then you review it and confirm the direction with structured feedback.",
      },
      {
        icon: Workflow,
        step: "07",
        title: "Scale with ongoing support",
        description:
          "After the first release, we continue improving, expanding, and supporting what the business needs next.",
      },
      {
        icon: Star,
        step: "08",
        title: "Stay in continuity as a long-term partner",
        description:
          "Clients can request future work, leave feedback, and keep every conversation and asset inside one continuous relationship.",
      },
    ],
    primaryAction: "Talk to the AI Consultant",
    secondaryAction: "Explore the Demo Lab",
    contactLead: "Prefer to talk through the growth strategy with a human first?",
    contactLabel: "Contact us",
    stageLabel: "Stage",
  },
  fr: {
    eyebrow: "Livraison sur mesure",
    title: "Nous construisons le bon système de croissance autour de votre entreprise, pas autour d'un modèle fixe.",
    description:
      "teChia ne pousse pas des services génériques. Nous étudions vos objectifs, votre positionnement, votre fonctionnement, votre identité de marque et votre réalité opérationnelle avant de recommander ce qu'il faut construire.",
    promiseTitle: "Construit autour de votre identité et de vos objectifs de croissance",
    promiseDescription:
      "Chaque projet s'adapte à votre parcours client, à vos besoins internes, à vos standards de marque, à vos priorités marché et aux outils que votre équipe utilise déjà.",
    promisePoints: [
      "Nous respectons votre identité de marque, votre ton, votre positionnement et votre réalité commerciale.",
      "Nous nous adaptons à votre parcours client, à votre workflow interne et à vos contraintes opérationnelles.",
      "Nous recommandons seulement la couche marketing, technologique ou automatisée dont votre entreprise a besoin maintenant.",
    ],
    visualTitle: "Un parcours client clair, de la decouverte a la continuite",
    visualLabels: ["Marque", "Scope", "Portail", "MVP", "Scale"],
    visualFooter:
      "Des besoins clairs, un avancement visible, des retours traces et une continuite sur le long terme.",
    stepsTitle: "Comment la collaboration avec teChia se deroule concretement",
    stepsDescription:
      "Le processus reste clair depuis la première discussion croissance jusqu'à la livraison, la validation et l'accompagnement dans la durée.",
    steps: [
      {
        icon: Bot,
        step: "01",
        title: "Clarifier le vrai besoin de croissance",
        description:
          "Commencez avec l'agent IA ou contactez-nous directement afin que nous comprenions l'objectif business et que nous vous orientions vers le bon mix de services.",
      },
      {
        icon: Search,
        step: "02",
        title: "Vérifier les exemples qui correspondent",
        description:
          "Explorez l'Espace Démo pour voir si votre cas le plus proche existe déjà et le demander avec plus de clarté.",
      },
      {
        icon: FileText,
        step: "03",
        title: "Envoyer un brief croissance ciblé",
        description:
          "Soumettez une demande claire et concentrée. L'agent IA peut aussi vous aider à la formuler de façon exploitable.",
      },
      {
        icon: Compass,
        step: "04",
        title: "Valider le scope, la roadmap et le rythme d'investissement",
        description:
          "Nous transformons votre demande en engagement teChia officiel avec des exigences métier claires, un scope défini, un prix et des phases de livraison.",
      },
      {
        icon: FolderKanban,
        step: "05",
        title: "Centraliser le travail dans le portail client",
        description:
          "Vous recevez un espace portail pour les paiements, messages, documents, éléments de marque, validations et retours pendant chaque phase.",
      },
      {
        icon: Rocket,
        step: "06",
        title: "Revoir la première version prête pour la croissance",
        description:
          "Nous construisons et livrons une première version solide du travail, puis vous validez la direction avec un retour structuré.",
      },
      {
        icon: Workflow,
        step: "07",
        title: "Passer à l'échelle avec support continu",
        description:
          "Après la première livraison, nous continuons à améliorer, étendre et soutenir ce dont l'entreprise a besoin ensuite.",
      },
      {
        icon: Star,
        step: "08",
        title: "Rester dans une relation de partenariat continue",
        description:
          "Les clients peuvent demander de nouveaux projets, laisser un avis et garder tous les échanges et ressources dans une relation continue.",
      },
    ],
    primaryAction: "Parler a l'agent IA",
    secondaryAction: "Explorer l'Espace Demo",
    contactLead: "Vous préférez parler d'abord de la stratégie de croissance avec un humain ?",
    contactLabel: "Contactez-nous",
    stageLabel: "Etape",
  },
} as const satisfies Record<Locale, WorkflowCopy>;

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

function WorkflowCard({
  step,
  stageLabel,
}: {
  step: WorkflowStep;
  stageLabel: string;
}) {
  const Icon = step.icon;

  return (
    <article className="gradient-border rounded-[1.7rem]">
      <div className="surface-panel h-full p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="icon-chip rounded-2xl p-3">
            <Icon className="size-5" />
          </span>
          <span className="status-pill rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
            {stageLabel} {step.step}
          </span>
        </div>
        <h3 className="mt-5 text-xl font-semibold text-primary sm:text-2xl">
          {step.title}
        </h3>
        <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
          {step.description}
        </p>
      </div>
    </article>
  );
}

export function CustomFitWorkflowSection({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const copy = workflowCopy[locale];

  return (
    <section className={cn("container overflow-hidden py-16 sm:py-20", className)}>
      <Reveal>
        <SectionHeading
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
        />
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-[0.96fr_1.04fr] lg:items-start">
        <Reveal>
          <div className="gradient-border rounded-[2rem]">
            <div className="elevated-panel relative overflow-hidden p-5 sm:p-6 md:p-7">
              <PatternOverlay className="opacity-[0.1]" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/55 to-transparent" />
              <div className="relative z-10">
                <p className="eyebrow">{copy.promiseTitle}</p>
                <h3 className="mt-4 max-w-2xl text-balance text-3xl font-semibold text-primary md:text-4xl">
                  <span className="headline-gradient">
                    {copy.visualTitle}
                  </span>
                </h3>
                <p className="mt-4 text-base leading-8 text-muted md:text-lg">
                  {copy.promiseDescription}
                </p>

                <div className="mt-6 grid gap-3">
                  {copy.promisePoints.map((point) => (
                    <div
                      key={point}
                      className="subtle-tile-strong rounded-[1.25rem] p-4 text-sm leading-7 text-primary"
                    >
                      {point}
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
                  <div className="flex flex-wrap gap-2">
                    {copy.visualLabels.map((label) => (
                      <span key={label} className="trust-pill">
                        <Sparkles className="size-3.5" />
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="subtle-tile rounded-[1.2rem] p-4">
                      <p className="eyebrow">
                        <BriefcaseBusiness className="size-3.5" />
                        {locale === "fr" ? "Approche metier" : "Business-first fit"}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-muted">
                        {locale === "fr"
                          ? "Le projet s'aligne sur votre maniere de travailler, pas sur une structure imposee."
                          : "The project aligns with the way your business actually works, not with a forced generic structure."}
                      </p>
                    </div>
                    <div className="subtle-tile rounded-[1.2rem] p-4">
                      <p className="eyebrow">
                        <FolderKanban className="size-3.5" />
                        {locale === "fr" ? "Portail de suivi" : "Tracked portal flow"}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-muted">
                        {locale === "fr"
                          ? "Documents, echanges, paiements et retours restent centralises."
                          : "Documents, conversations, payments, and feedback stay centralized and visible."}
                      </p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-7 text-muted">
                    {copy.visualFooter}
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href={getLocalizedHref(locale, "/ai-consultant")}
                    className={cn(
                      buttonVariants({ variant: "primary", size: "lg" }),
                      "w-full justify-center sm:w-auto",
                    )}
                  >
                    {copy.primaryAction}
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href={getLocalizedHref(locale, "/demo-lab")}
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "lg" }),
                      "w-full justify-center sm:w-auto",
                    )}
                  >
                    {copy.secondaryAction}
                  </Link>
                </div>

                <p className="mt-4 text-sm leading-7 text-muted">
                  {copy.contactLead}{" "}
                  <Link
                    href={getLocalizedHref(locale, "/contact")}
                    className="font-semibold text-accent transition hover:text-accent-2"
                  >
                    {copy.contactLabel}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="min-w-0">
          <Reveal delay={0.04}>
            <div className="mb-6 max-w-3xl">
              <p className="eyebrow">{copy.stepsTitle}</p>
              <p className="mt-4 text-base leading-8 text-muted md:text-lg">
                {copy.stepsDescription}
              </p>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {copy.steps.map((step, index) => (
              <Reveal key={step.step} delay={index * 0.04}>
                <WorkflowCard step={step} stageLabel={copy.stageLabel} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
