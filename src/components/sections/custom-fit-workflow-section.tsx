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
    eyebrow: "Custom-fit delivery",
    title: "We shape the right digital system around your business, not around a template.",
    description:
      "teChia does not push one-size-fits-all websites or systems. We study your business principles, your way of working, your brand identity, and your exact goals before we recommend what should be built.",
    promiseTitle: "Built around your business identity",
    promiseDescription:
      "Every project is tailored to your business norms, customer flow, internal needs, branding, colors, and the documents or assets your team actually uses.",
    promisePoints: [
      "We respect your brand identity, colors, tone, and positioning.",
      "We adapt to your business principles, workflow, and operational reality.",
      "We only recommend the digital layer your business actually needs right now.",
    ],
    visualTitle: "A clear client journey from discovery to continuity",
    visualLabels: ["Brand", "Scope", "Portal", "MVP", "Scale"],
    visualFooter:
      "Clear requirements, visible progress, tracked feedback, and long-term continuity.",
    stepsTitle: "How working with teChia actually flows",
    stepsDescription:
      "The process stays clear for the client from the first conversation to delivery, review, and future growth.",
    steps: [
      {
        icon: Bot,
        step: "01",
        title: "Identify the exact digital fit",
        description:
          "Start with the AI consultant or contact us directly so we can understand your business and point you to the right digital service first.",
      },
      {
        icon: Search,
        step: "02",
        title: "Check demos that match your need",
        description:
          "Explore the Demo Lab to see whether your closest use case already exists and request it more confidently.",
      },
      {
        icon: FileText,
        step: "03",
        title: "Submit a concise project request",
        description:
          "Send a focused request with the clearest version of your need. The AI consultant can also help you prepare it.",
      },
      {
        icon: Compass,
        step: "04",
        title: "Confirm scope, pricing, and payment rhythm",
        description:
          "We turn the request into an official teChia project with clear business requirements, scope, pricing, and payment intervals.",
      },
      {
        icon: FolderKanban,
        step: "05",
        title: "Move everything into the client portal",
        description:
          "You receive a portal code for payments, messages, documents, branding assets, logos, and feedback across each building phase.",
      },
      {
        icon: Rocket,
        step: "06",
        title: "Receive and confirm the MVP",
        description:
          "We build and deliver the first strong version of the project, then you review it and confirm the direction with structured feedback.",
      },
      {
        icon: Workflow,
        step: "07",
        title: "Scale and get post-build support",
        description:
          "After the first release, we continue improving, expanding, and supporting what the business needs next.",
      },
      {
        icon: Star,
        step: "08",
        title: "Stay in continuity as a long-term client",
        description:
          "Clients can leave a review through the portal, request future work, and keep every project conversation and asset in one continuous relationship.",
      },
    ],
    primaryAction: "Talk to the AI Consultant",
    secondaryAction: "Explore the Demo Lab",
    contactLead: "Prefer to discover this with a human first?",
    contactLabel: "Contact us",
    stageLabel: "Stage",
  },
  fr: {
    eyebrow: "Livraison sur mesure",
    title: "Nous construisons le bon systeme digital autour de votre entreprise, pas autour d'un modele fixe.",
    description:
      "teChia ne pousse pas des sites web ou systemes generiques. Nous etudions vos principes de travail, votre fonctionnement, votre identite de marque et vos objectifs exacts avant de recommander ce qu'il faut construire.",
    promiseTitle: "Construit autour de l'identite de votre entreprise",
    promiseDescription:
      "Chaque projet s'adapte a vos normes metier, a votre parcours client, a vos besoins internes, a votre marque, a vos couleurs et aux documents ou ressources que votre equipe utilise vraiment.",
    promisePoints: [
      "Nous respectons votre identite de marque, vos couleurs, votre ton et votre positionnement.",
      "Nous nous adaptons a vos principes metier, a votre workflow et a votre realite operationnelle.",
      "Nous recommandons seulement la couche digitale dont votre entreprise a vraiment besoin maintenant.",
    ],
    visualTitle: "Un parcours client clair, de la decouverte a la continuite",
    visualLabels: ["Marque", "Scope", "Portail", "MVP", "Scale"],
    visualFooter:
      "Des besoins clairs, un avancement visible, des retours traces et une continuite sur le long terme.",
    stepsTitle: "Comment la collaboration avec teChia se deroule concretement",
    stepsDescription:
      "Le processus reste clair pour le client depuis la premiere discussion jusqu'a la livraison, la validation et la suite.",
    steps: [
      {
        icon: Bot,
        step: "01",
        title: "Identifier le bon besoin digital",
        description:
          "Commencez avec l'agent IA ou contactez-nous directement afin que nous comprenions votre activite et que nous vous orientions vers le bon service.",
      },
      {
        icon: Search,
        step: "02",
        title: "Verifier les demos qui correspondent",
        description:
          "Explorez l'Espace Demo pour voir si votre cas le plus proche existe deja et le demander avec plus de clarte.",
      },
      {
        icon: FileText,
        step: "03",
        title: "Envoyer une demande de projet concise",
        description:
          "Soumettez une demande claire et concentree. L'agent IA peut aussi vous aider a la formuler de facon exploitable.",
      },
      {
        icon: Compass,
        step: "04",
        title: "Valider le scope, le prix et le rythme de paiement",
        description:
          "Nous transformons votre demande en projet teChia officiel avec des exigences metier claires, un scope defini, un prix et des intervalles de paiement.",
      },
      {
        icon: FolderKanban,
        step: "05",
        title: "Centraliser le projet dans le portail client",
        description:
          "Vous recevez un code portail pour les paiements, messages, documents, logos, elements de marque et retours pendant chaque phase de construction.",
      },
      {
        icon: Rocket,
        step: "06",
        title: "Recevoir et confirmer le MVP",
        description:
          "Nous construisons et livrons une premiere version solide du projet, puis vous validez la direction avec un retour structure.",
      },
      {
        icon: Workflow,
        step: "07",
        title: "Passer a l'echelle et beneficier du support",
        description:
          "Apres la premiere livraison, nous continuons a ameliorer, etendre et soutenir ce dont l'entreprise a besoin ensuite.",
      },
      {
        icon: Star,
        step: "08",
        title: "Rester dans une relation de continuite",
        description:
          "Les clients peuvent laisser un avis depuis le portail, demander de nouveaux projets et garder toutes les echanges et ressources dans une relation continue.",
      },
    ],
    primaryAction: "Parler a l'agent IA",
    secondaryAction: "Explorer l'Espace Demo",
    contactLead: "Vous preferez decouvrir cela avec un humain d'abord ?",
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
