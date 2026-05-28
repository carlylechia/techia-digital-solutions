import type { Metadata } from "next";
import {
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/site/reveal";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { getDictionary, isLocale, type Locale } from "@/content/site";
import { createMetadata } from "@/lib/seo";
import { AIConsultantActionGroup } from "./ai-consultant-action-group";

function getPageCopy(locale: Locale) {
  if (locale === "fr") {
    return {
      metaTitle: "Agent IA",
      metaDescription:
        "Discutez avec l’agent IA teChia pour clarifier le bon site, système, automatisation ou parcours digital pour votre entreprise.",
      heroTitle:
        "Un consultant IA pour transformer une idée floue en prochaine étape claire.",
      heroDescription:
        "L’agent IA teChia aide les fondateurs, PME et équipes en croissance à comprendre s’il leur faut un site premium, un système métier, une automatisation, un portail ou une combinaison bien pensée.",
      heroBadges: ["Sites web", "Systèmes", "Automatisation", "IA"],
      heroLinkLabel: "Demander un cadrage",
      asideEyebrow: "Assistant en direct",
      asideTitle: "Commencez par une conversation guidée.",
      asideDescription:
        "Expliquez votre contexte, votre objectif ou votre blocage. L’agent structure l’échange et vous oriente vers la suite la plus utile.",
      asidePoints: [
        "Orientation rapide sans formulaire lourd",
        "Parcours bilingue pour équipes locales et internationales",
        "Transition simple vers un devis, une démo ou un démarrage de projet",
      ],
      capabilitiesEyebrow: "Capacités",
      capabilitiesTitle:
        "Plus qu’un chatbot, un vrai filtre stratégique avant projet.",
      capabilitiesDescription:
        "Le but n’est pas de faire durer la conversation. Le but est d’aider le visiteur à comprendre le bon besoin digital plus vite et avec plus de clarté.",
      capabilities: [
        {
          icon: Target,
          title: "Recommandation ciblée",
          description:
            "L’agent identifie si votre besoin relève d’un site, d’un système, d’un portail, d’une automatisation ou d’une couche IA.",
        },
        {
          icon: MessageSquare,
          title: "Qualification intelligente",
          description:
            "Il pose les bonnes questions sur votre activité, vos utilisateurs, votre budget, vos délais et vos blocages opérationnels.",
        },
        {
          icon: Sparkles,
          title: "Pré-brief exploitable",
          description:
            "La conversation aide à produire un brief initial plus propre pour que l’équipe teChia démarre avec un meilleur contexte.",
        },
        {
          icon: Zap,
          title: "Suite concrète",
          description:
            "Quand le besoin devient clair, l’agent vous renvoie vers le bon point d’entrée: démarrage de projet, contact ou orientation plus poussée.",
        },
      ],
      stepsEyebrow: "Parcours",
      stepsTitle: "Du premier message à la recommandation en quelques minutes.",
      stepsDescription:
        "Le flux reste simple, conversationnel et structuré pour éviter les échanges vagues qui n’aident ni le visiteur ni l’équipe.",
      steps: [
        {
          step: "01",
          title: "Décrivez le besoin ou l’objectif",
          description:
            "Parlez du problème à résoudre, de l’idée à lancer, ou de ce qui ralentit actuellement votre activité.",
        },
        {
          step: "02",
          title: "Répondez à quelques questions ciblées",
          description:
            "L’agent affine le contexte: type d’entreprise, utilisateurs, fonctionnalités attendues, niveau d’urgence et contraintes.",
        },
        {
          step: "03",
          title: "Recevez une orientation claire",
          description:
            "Vous obtenez une recommandation plus concrète sur le bon type de solution et sur le niveau de complexité à prévoir.",
        },
        {
          step: "04",
          title: "Continuez vers l’action utile",
          description:
            "Poursuivez vers un projet, un contact direct, ou une conversation plus avancée si le timing est bon.",
        },
      ],
      coverageEyebrow: "Couverture",
      coverageTitle: "L’agent couvre toute l’offre publique teChia.",
      coverageDescription:
        "Il peut expliquer les services, comparer les options, aider à prioriser et réduire l’incertitude avant même qu’un cadrage plus complet commence.",
      audienceEyebrow: "Pour qui",
      audienceTitle:
        "Particulièrement utile pour les équipes qui savent qu’il y a un besoin, sans encore connaître la bonne architecture.",
      audienceDescription:
        "C’est souvent le bon point de départ quand le problème est réel, mais que la forme de la solution reste encore floue.",
      audiences: [
        "Fondateurs",
        "PME",
        "Agences",
        "Entreprises de services",
        "Projets SaaS",
        "Équipes en structuration",
      ],
      outcomesEyebrow: "Résultat attendu",
      outcomes: [
        "Mieux distinguer un besoin de site marketing d’un besoin de système métier",
        "Comprendre quand un portail, une automatisation ou une interface IA devient pertinent",
        "Arriver au premier échange avec teChia dans un état de clarté beaucoup plus élevé",
      ],
      finalScript: "clarifions le prochain mouvement",
      finalEyebrow: "Prochaine étape",
      finalTitle:
        "Ouvrez la conversation ou passez directement au cadrage du projet.",
      finalDescription:
        "Utilisez l’agent pour obtenir une recommandation immédiate, puis continuez vers un démarrage plus concret quand vous êtes prêt.",
    };
  }

  return {
    metaTitle: "AI Consultant",
    metaDescription:
      "Talk to the teChia AI consultant to clarify the right website, system, automation, or digital product path for your business.",
    heroTitle:
      "An AI consultant that turns a vague idea into a clear next move.",
    heroDescription:
      "The teChia AI consultant helps founders, SMEs, and growing teams understand whether they need a premium website, business system, automation layer, portal, or a more thoughtful combination.",
    heroBadges: ["Websites", "Systems", "Automation", "AI"],
    heroLinkLabel: "Request project scoping",
    asideEyebrow: "Live assistant",
    asideTitle: "Start with a guided conversation.",
    asideDescription:
      "Share your context, your goal, or the friction you are trying to remove. The agent structures the conversation and points you toward the most useful next step.",
    asidePoints: [
      "Fast orientation without a heavy intake form",
      "Bilingual guidance for local and international teams",
      "A smooth handoff into a quote, demo, or project start",
    ],
    capabilitiesEyebrow: "Capabilities",
    capabilitiesTitle:
      "More than a chatbot, a real strategic filter before the project begins.",
    capabilitiesDescription:
      "The goal is not to prolong the conversation. The goal is to help visitors understand the right digital need faster and with better clarity.",
    capabilities: [
      {
        icon: Target,
        title: "Right-fit recommendation",
        description:
          "The agent identifies whether your need points to a website, system, portal, automation layer, or AI-supported experience.",
      },
      {
        icon: MessageSquare,
        title: "Intelligent qualification",
        description:
          "It asks the right questions about your business model, users, budget, timing, and operational friction.",
      },
      {
        icon: Sparkles,
        title: "Useful pre-brief",
        description:
          "The conversation helps produce a cleaner starting brief so the teChia team begins with stronger context.",
      },
      {
        icon: Zap,
        title: "Concrete next step",
        description:
          "Once the need becomes clearer, the agent routes you to the right path: project start, direct contact, or deeper orientation.",
      },
    ],
    stepsEyebrow: "Flow",
    stepsTitle: "From first message to recommendation in a few minutes.",
    stepsDescription:
      "The experience stays simple, conversational, and structured so the exchange does not become vague or wasteful for either side.",
    steps: [
      {
        step: "01",
        title: "Describe the need or outcome",
        description:
          "Explain the problem you want to solve, the idea you want to launch, or the friction slowing the business down today.",
      },
      {
        step: "02",
        title: "Answer a few targeted questions",
        description:
          "The agent sharpens the context: business type, users, expected features, urgency, and the constraints around delivery.",
      },
      {
        step: "03",
        title: "Receive a clear direction",
        description:
          "You get a more grounded recommendation on the right solution type and the level of complexity likely involved.",
      },
      {
        step: "04",
        title: "Continue into useful action",
        description:
          "Move forward into a project, direct contact, or a more advanced conversation when the timing makes sense.",
      },
    ],
    coverageEyebrow: "Coverage",
    coverageTitle: "The consultant covers the full public teChia offer.",
    coverageDescription:
      "It can explain the services, compare options, help with prioritization, and reduce uncertainty before a deeper scoping conversation even begins.",
    audienceEyebrow: "Best fit",
    audienceTitle:
      "Especially useful for teams that know there is a digital need, but do not yet know the right architecture.",
    audienceDescription:
      "This is often the best starting point when the business problem is real, but the final shape of the solution is still unclear.",
    audiences: [
      "Founders",
      "SMEs",
      "Agencies",
      "Service businesses",
      "SaaS ideas",
      "Scaling teams",
    ],
    outcomesEyebrow: "Expected outcome",
    outcomes: [
      "Separate a marketing-website need from a deeper business-system need",
      "Understand when a portal, automation flow, or AI interface is actually the right move",
      "Reach the first teChia conversation with much higher clarity and better internal alignment",
    ],
    finalScript: "let's clarify the next move",
    finalEyebrow: "Next step",
    finalTitle: "Open the conversation or move straight into project scoping.",
    finalDescription:
      "Use the consultant for an immediate recommendation, then continue into a more concrete project start when you are ready.",
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const copy = getPageCopy(locale);
  return createMetadata({
    locale,
    title: copy.metaTitle,
    description: copy.metaDescription,
    path: "/ai-consultant",
  });
}

export default async function AIConsultantPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const copy = getPageCopy(locale);

  return (
    <main>
      <PremiumPageHero
        locale={locale}
        eyebrow={dict.nav.aiConsultant}
        title={copy.heroTitle}
        description={copy.heroDescription}
        badges={copy.heroBadges}
        actions={[
          { href: "/start-project", label: copy.heroLinkLabel },
          { href: "/contact", label: dict.nav.contact, variant: "secondary" },
        ]}
        aside={
          <div className="surface-panel h-full p-5 md:p-6">
            <p className="eyebrow">{copy.asideEyebrow}</p>
            <h2 className="mt-4 text-balance text-2xl font-semibold text-foreground md:text-3xl">
              {copy.asideTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              {copy.asideDescription}
            </p>
            <AIConsultantActionGroup
              locale={locale}
              stacked
              className="mt-6"
              secondaryAction={{
                href: "/start-project",
                label: dict.nav.startProject,
              }}
            />
            <div className="mt-6 grid gap-3">
              {copy.asidePoints.map((item) => (
                <div
                  key={item}
                  className="subtle-tile rounded-[1.2rem] p-4 text-sm leading-7 text-muted"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        }
      />

      <section className="container py-8 md:py-10">
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow={copy.capabilitiesEyebrow}
            title={copy.capabilitiesTitle}
            description={copy.capabilitiesDescription}
          />
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {copy.capabilities.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={index * 0.04}>
                <div className="gradient-border rounded-[1.7rem]">
                  <div className="elevated-panel h-full p-6">
                    <span className="icon-chip inline-flex rounded-2xl p-3">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-5 text-2xl font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="container py-8 md:py-12">
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow={copy.stepsEyebrow}
            title={copy.stepsTitle}
            description={copy.stepsDescription}
          />
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-2">
          {copy.steps.map((item, index) => (
            <Reveal key={item.step} delay={index * 0.04}>
              <div className="gradient-border rounded-[1.7rem]">
                <div className="surface-panel h-full p-6 md:p-7">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-2">
                    {item.step}
                  </p>
                  <h3 className="mt-4 text-2xl font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    {item.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container py-8 md:py-12">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <Reveal>
            <div className="gradient-border rounded-[2rem]">
              <div className="elevated-panel h-full p-6 md:p-8">
                <p className="eyebrow">{copy.coverageEyebrow}</p>
                <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold text-foreground md:text-5xl">
                  <span className="headline-gradient">
                    {copy.coverageTitle}
                  </span>
                </h2>
                <div className="headline-underline mt-5" aria-hidden="true" />
                <p className="mt-6 max-w-2xl text-base leading-8 text-muted md:text-lg">
                  {copy.coverageDescription}
                </p>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  {dict.services.map((service) => (
                    <span key={service.slug} className="trust-pill">
                      {service.title}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          <div className="grid gap-5">
            <Reveal delay={0.04}>
              <div className="gradient-border rounded-[1.7rem]">
                <div className="surface-panel p-6">
                  <p className="eyebrow">{copy.audienceEyebrow}</p>
                  <h3 className="mt-4 text-balance text-2xl font-semibold text-foreground">
                    {copy.audienceTitle}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-muted">
                    {copy.audienceDescription}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {copy.audiences.map((item) => (
                      <span key={item} className="trust-pill">
                        <CheckCircle2 className="size-3.5" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="gradient-border rounded-[1.7rem]">
                <div className="surface-panel p-6">
                  <p className="eyebrow">{copy.outcomesEyebrow}</p>
                  <div className="mt-4 grid gap-3">
                    {copy.outcomes.map((item) => (
                      <div
                        key={item}
                        className="subtle-tile rounded-[1.2rem] p-4 text-sm leading-7 text-muted"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="container pb-20 pt-8">
        <Reveal>
          <div className="gradient-border rounded-[2.1rem]">
            <div className="elevated-panel relative overflow-hidden px-6 py-10 text-center md:px-10 md:py-14">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(251,113,133,0.14),transparent_24%),radial-gradient(circle_at_15%_85%,rgba(245,185,66,0.12),transparent_20%)]" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/60 to-transparent" />

              <div className="relative z-10">
                <span className="font-script text-3xl text-accent-3 md:text-4xl">
                  {copy.finalScript}
                </span>
                <p className="eyebrow mx-auto mb-3 mt-3 justify-center">
                  {copy.finalEyebrow}
                </p>
                <h2 className="mx-auto mt-2 max-w-4xl text-balance text-5xl font-semibold text-foreground md:text-7xl">
                  <span className="headline-gradient">{copy.finalTitle}</span>
                </h2>
                <div
                  className="headline-underline mx-auto mt-6"
                  aria-hidden="true"
                />
                <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted md:text-lg">
                  {copy.finalDescription}
                </p>

                <AIConsultantActionGroup
                  locale={locale}
                  centered
                  className="mt-8"
                  secondaryAction={{
                    href: "/start-project",
                    label: dict.nav.startProject,
                  }}
                />
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
