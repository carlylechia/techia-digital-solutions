import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  Download,
  Globe2,
  Layers3,
  LayoutDashboard,
  MapPin,
  MessageSquareText,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  WandSparkles,
  Workflow,
  Wrench,
} from "lucide-react";
import {
  FOUNDER_NAME,
  type FounderContent,
  type FounderProject,
} from "@/content/founder";
import { getLocalizedHref, siteConfig, type Locale } from "@/content/site";
import { FounderFeedbackForm } from "./founder-feedback-form";
import { FounderHeroPortrait } from "./founder-hero-portrait";
import { FounderHeroVisual } from "./founder-hero-visual";
import { FounderReveal } from "./founder-reveal";
import { FounderSkillsMatrix } from "./founder-skills-matrix";
import { FounderTrackedLink } from "./founder-tracked-link";

const snapshotIconMap = {
  code: Code2,
  layout: LayoutDashboard,
  briefcase: BriefcaseBusiness,
  globe: Globe2,
  sparkles: Sparkles,
} as const;

const principleIconMap = {
  briefcase: BriefcaseBusiness,
  layers: Layers3,
  search: Search,
  shield: ShieldCheck,
  smartphone: Smartphone,
  workflow: Workflow,
  sparkles: WandSparkles,
  message: MessageSquareText,
  wrench: Wrench,
} as const;

const heroServiceIconMap = [
  Sparkles,
  LayoutDashboard,
  Workflow,
  WandSparkles,
] as const;

type FounderFeedbackItem = {
  id: string;
  quote: string;
  name: string;
  role: string | null;
  company: string | null;
  rating: number | null;
};

type FounderLinks = {
  portfolioHref: string;
  projectHref: string;
  solutionsHref: string;
  contactHref: string;
  linkedinHref: string;
  githubHref: string;
  downloadHref: string;
  hasDirectCvDownload: boolean;
};

export function FounderHero({
  locale,
  content,
  links,
}: {
  locale: Locale;
  content: FounderContent;
  links: FounderLinks;
}) {
  const linkedinAriaLabel =
    locale === "fr"
      ? "Visiter le profil LinkedIn de Chia Carlyle"
      : "Visit Chia Carlyle's LinkedIn profile";
  const githubAriaLabel =
    locale === "fr"
      ? "Visiter le profil GitHub de Chia Carlyle"
      : "Visit Chia Carlyle's GitHub profile";
  const resumeAriaLabel =
    locale === "fr"
      ? "Prévisualiser et télécharger le CV fondateur de Chia Carlyle"
      : "Preview and download Chia Carlyle's founder CV";
  const trustSignals = content.hero.trustHighlights
    .slice(0, 4)
    .map((title, index) => {
      const details =
        locale === "fr"
          ? [
              "Présence web premium pensée pour inspirer confiance dès la première visite.",
              "Espaces connectés pour suivre les opérations, les clients et la livraison.",
              "Workflows structurés qui réduisent les tâches répétitives et les oublis.",
              "Outils intelligents qui ajoutent de la vitesse et de la clarté là où cela compte.",
            ]
          : [
              "Premium web presence designed to build confidence from the first visit.",
              "Connected spaces for operations, customer visibility, and delivery tracking.",
              "Structured workflows that reduce repetition, lag, and missed follow-up.",
              "Intelligent tools that add speed and clarity where it matters most.",
            ];

      return {
        title,
        detail: details[index] ?? "",
        Icon: heroServiceIconMap[index] ?? Sparkles,
      };
    });

  return (
    <section className="relative overflow-hidden pt-8 pb-14 md:pt-10 md:pb-20 lg:pt-12 lg:pb-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.18),transparent_26%),radial-gradient(circle_at_85%_10%,rgba(139,92,246,.2),transparent_24%),linear-gradient(180deg,transparent,rgba(34,211,238,.04)_55%,transparent)]" />
      <div className="container grid items-start gap-10 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:gap-14">
        <FounderReveal variant="jump" className="self-start">
          <h1 className="max-w-4xl text-balance font-display text-4xl font-semibold tracking-tight text-primary sm:text-5xl md:text-[3.8rem] md:leading-[1.02]">
            {content.hero.headline}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted md:text-xl">
            {content.hero.subtext}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <p className="eyebrow mb-0">{content.hero.badge}</p>
            <span className="status-pill inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
              <span className="inline-flex size-2 rounded-full bg-cyan-300" />
              {locale === "fr"
                ? "Livraison dirigée par le fondateur"
                : "Founder-led delivery"}
            </span>
          </div>
          <p className="mt-6 max-w-2xl text-sm font-semibold uppercase tracking-[0.22em] text-accent-2">
            {content.title}
          </p>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            {content.hero.positioning}
          </p>

          <div className="mt-8 xl:hidden">
            <FounderHeroPortrait locale={locale} />
          </div>

          <div className="mt-9 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <FounderTrackedLink
                href={links.projectHref}
                className="btn-primary founder-hero-primary justify-center"
                eventName="founder_start_project_click"
                eventParams={{ location: "hero", locale }}
                ariaLabel={content.hero.secondaryCta}
              >
                {content.hero.secondaryCta}
                <ArrowRight className="size-4" />
              </FounderTrackedLink>
              <FounderTrackedLink
                href={links.portfolioHref}
                className="btn-secondary founder-hero-secondary justify-center"
                ariaLabel={content.hero.primaryCta}
              >
                {content.hero.primaryCta}
                <ArrowUpRight className="size-4" />
              </FounderTrackedLink>
            </div>

            <div className="founder-cta-grid">
              <FounderTrackedLink
                href={links.downloadHref}
                download={links.hasDirectCvDownload}
                className="founder-cta-card founder-hover-card"
                eventName="founder_cv_download_click"
                eventParams={{
                  location: "hero",
                  locale,
                  direct: links.hasDirectCvDownload,
                }}
                ariaLabel={resumeAriaLabel}
              >
                <div className="founder-cta-topline">
                  <span className="founder-cta-kicker">
                    {locale === "fr" ? "Profil fondateur" : "Founder profile"}
                  </span>
                  <Download className="size-4 text-accent-2" />
                </div>
                <p className="founder-cta-label">{content.hero.downloadCta}</p>
                <p className="founder-cta-copy">
                  {locale === "fr"
                    ? "Prévisualisez le CV de Chia dans votre navigateur et téléchargez-le depuis l'aperçu."
                    : "Preview Chia's CV in your browser — and download directly from the preview."}
                </p>
              </FounderTrackedLink>

              <FounderTrackedLink
                href={links.linkedinHref}
                external
                className="founder-cta-card founder-hover-card"
                eventName="founder_linkedin_click"
                eventParams={{ location: "hero", locale }}
                ariaLabel={linkedinAriaLabel}
              >
                <div className="founder-cta-topline">
                  <span className="founder-cta-kicker">LinkedIn</span>
                  <BriefcaseBusiness className="size-4 text-accent-2" />
                </div>
                <p className="founder-cta-label">{content.hero.linkedinCta}</p>
                <p className="founder-cta-copy">
                  {locale === "fr"
                    ? "Parcours, crédibilité professionnelle et réseau fondateur."
                    : "Professional profile, founder credibility, and network context."}
                </p>
              </FounderTrackedLink>

              <FounderTrackedLink
                href={links.githubHref}
                external
                className="founder-cta-card founder-hover-card"
                eventName="founder_github_click"
                eventParams={{ location: "hero", locale }}
                ariaLabel={githubAriaLabel}
              >
                <div className="founder-cta-topline">
                  <span className="founder-cta-kicker">GitHub</span>
                  <Code2 className="size-4 text-accent-2" />
                </div>
                <p className="founder-cta-label">{content.hero.githubCta}</p>
                <p className="founder-cta-copy">
                  {locale === "fr"
                    ? "Voir le travail technique, les patterns de code et la rigueur d’exécution."
                    : "See technical work, code patterns, and execution discipline."}
                </p>
              </FounderTrackedLink>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="subtle-tile founder-hover-card inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm text-primary">
              <MapPin className="size-4 text-accent" />
              {locale === "fr"
                ? "Douala, Cameroun — pour l’Afrique et les clients internationaux"
                : siteConfig.location}
            </div>
            <div className="subtle-tile founder-hover-card inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm text-primary">
              <Globe2 className="size-4 text-accent" />
              {locale === "fr"
                ? "Livraison locale et internationale"
                : "Local and international delivery"}
            </div>
          </div>
        </FounderReveal>

        <FounderReveal variant="glide" delay={0.06} className="self-start">
          <div className="space-y-4">
            <div className="hidden xl:block">
              <FounderHeroPortrait locale={locale} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {trustSignals.map((item, index) => (
                <FounderReveal
                  key={item.title}
                  variant="float"
                  delay={0.14 + index * 0.06}
                >
                  <article className="founder-signal-card founder-hover-card">
                    <div className="flex items-start justify-between gap-4">
                      <span className="founder-signal-index">0{index + 1}</span>
                      <span className="icon-chip founder-signal-icon rounded-2xl p-3">
                        <item.Icon className="size-5" />
                      </span>
                    </div>
                    <div className="mt-6">
                      <p className="founder-signal-title">{item.title}</p>
                      <p className="founder-signal-detail">{item.detail}</p>
                    </div>
                  </article>
                </FounderReveal>
              ))}
            </div>
          </div>
        </FounderReveal>
      </div>
    </section>
  );
}

export function FounderSnapshot({
  content,
  locale,
}: {
  content: FounderContent;
  locale: Locale;
}) {
  return (
    <section
      aria-labelledby="founder-snapshot-heading"
      className="container py-10 md:py-14"
    >
      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <FounderReveal variant="glide">
          <div className="space-y-5">
            <FounderHeroVisual locale={locale} />
            <div className="premium-card founder-hover-card p-5 sm:p-6">
              <p className="eyebrow mb-3">
                {locale === "fr"
                  ? "Systèmes en démonstration"
                  : "Systems in motion"}
              </p>
              <p className="text-base leading-7 text-muted">
                {locale === "fr"
                  ? "Le visual n’est plus la pièce principale du hero. Il devient ici une preuve de la manière dont teChia relie présence digitale, opérations, automatisation et IA dans un même système."
                  : "The visual no longer competes with the portrait in the hero. It now works here as a proof-of-thinking panel showing how teChia connects digital presence, operations, automation, and AI into one system."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {content.hero.trustHighlights.slice(4).map((item) => (
                  <span key={item} className="trust-pill">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </FounderReveal>

        <FounderReveal variant="jump" delay={0.05}>
          <div>
            <div className="max-w-3xl">
              <p className="eyebrow mb-3">{content.snapshot.eyebrow}</p>
              <h2
                id="founder-snapshot-heading"
                className="text-balance text-3xl font-semibold text-primary md:text-5xl"
              >
                {content.snapshot.title}
              </h2>
              <p className="mt-4 text-base leading-7 text-muted md:text-lg">
                {content.snapshot.description}
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {content.snapshot.items.map((item, index) => {
                const Icon = snapshotIconMap[item.icon];

                return (
                  <FounderReveal
                    key={item.title}
                    variant="float"
                    delay={0.1 + index * 0.05}
                  >
                    <article
                      className={`premium-card founder-hover-card h-full p-5 sm:p-6 ${index === 0 ? "sm:col-span-2" : ""}`}
                    >
                      <div className="icon-chip inline-flex rounded-2xl p-3">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="mt-5 text-lg font-semibold text-primary">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-muted">
                        {item.detail}
                      </p>
                    </article>
                  </FounderReveal>
                );
              })}
            </div>
          </div>
        </FounderReveal>
      </div>
    </section>
  );
}

export function FounderSummary({
  content,
  locale,
  links,
}: {
  content: FounderContent;
  locale: Locale;
  links: FounderLinks;
}) {
  const linkedinAriaLabel =
    locale === "fr"
      ? "Visiter le profil LinkedIn de Chia Carlyle"
      : "Visit Chia Carlyle's LinkedIn profile";

  return (
    <section
      aria-labelledby="founder-summary-heading"
      className="container py-10 md:py-14"
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <FounderReveal variant="jump">
          <article className="premium-card founder-hover-card p-6 sm:p-8">
            <p className="eyebrow mb-3">{content.summary.eyebrow}</p>
            <h2
              id="founder-summary-heading"
              className="text-balance text-3xl font-semibold text-primary md:text-4xl"
            >
              {content.summary.title}
            </h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-muted">
              {content.summary.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        </FounderReveal>

        <FounderReveal variant="glide" delay={0.08}>
          <aside className="premium-card founder-hover-card p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="icon-chip rounded-2xl p-3">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent-2">
                  {FOUNDER_NAME}
                </p>
                <p className="mt-2 text-lg font-semibold text-primary">
                  {content.title}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {content.summary.highlights.map((item, index) => (
                <FounderReveal
                  key={item}
                  variant="float"
                  delay={0.12 + index * 0.05}
                >
                  <div className="subtle-tile founder-hover-card rounded-[1.25rem] px-4 py-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                      <p className="text-sm leading-6 text-primary">{item}</p>
                    </div>
                  </div>
                </FounderReveal>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <FounderTrackedLink
                href={links.linkedinHref}
                external
                className="btn-secondary justify-center"
                eventName="founder_linkedin_click"
                eventParams={{ location: "summary", locale }}
                ariaLabel={linkedinAriaLabel}
              >
                <BriefcaseBusiness className="size-4" />
                {content.hero.linkedinCta}
              </FounderTrackedLink>
              <FounderTrackedLink
                href={links.contactHref}
                className="btn-ghost justify-center rounded-full border border-border px-4 py-3 text-primary"
                ariaLabel={content.finalCta.tertiaryCta}
              >
                {content.finalCta.tertiaryCta}
              </FounderTrackedLink>
            </div>
          </aside>
        </FounderReveal>
      </div>
    </section>
  );
}

export function FounderStory({ content }: { content: FounderContent }) {
  return (
    <section
      aria-labelledby="founder-story-heading"
      className="container py-10 md:py-14"
    >
      <FounderReveal variant="jump">
        <div className="dark-section overflow-hidden rounded-[2rem] p-6 sm:p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_.92fr]">
            <div>
              <h2
                id="founder-story-heading"
                className="max-w-3xl text-balance text-3xl font-semibold text-white md:text-4xl"
              >
                {content.story.title}
              </h2>
              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
                {content.story.body}
              </p>
            </div>
            <div className="grid gap-4">
              {content.story.painPoints.map((item, index) => (
                <FounderReveal
                  key={item}
                  variant="float"
                  delay={0.12 + index * 0.07}
                >
                  <article className="founder-hover-card rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                    <p className="text-sm leading-7 text-slate-200">{item}</p>
                  </article>
                </FounderReveal>
              ))}
            </div>
          </div>
        </div>
      </FounderReveal>
    </section>
  );
}

export function FounderSkills({
  content,
  locale,
}: {
  content: FounderContent;
  locale: Locale;
}) {
  return (
    <section
      aria-labelledby="founder-skills-heading"
      className="container py-10 md:py-14"
    >
      <FounderReveal variant="jump">
        <div className="mb-8 max-w-3xl">
          <p className="eyebrow mb-3">{content.skills.eyebrow}</p>
          <h2
            id="founder-skills-heading"
            className="text-balance text-3xl font-semibold text-primary md:text-5xl"
          >
            {content.skills.title}
          </h2>
          <p className="mt-4 text-base leading-7 text-muted md:text-lg">
            {content.skills.description}
          </p>
        </div>
      </FounderReveal>
      <FounderReveal variant="glide" delay={0.08}>
        <FounderSkillsMatrix
          categories={content.skills.categories}
          locale={locale}
        />
      </FounderReveal>
    </section>
  );
}

export function FounderProjects({
  content,
  locale,
  links,
  projects,
}: {
  content: FounderContent;
  locale: Locale;
  links: FounderLinks;
  projects: FounderProject[];
}) {
  return (
    <section
      aria-labelledby="founder-projects-heading"
      className="container py-10 md:py-14"
    >
      <FounderReveal variant="jump">
        <div className="mb-8 max-w-3xl">
          <p className="eyebrow mb-3">{content.projects.eyebrow}</p>
          <h2
            id="founder-projects-heading"
            className="text-balance text-3xl font-semibold text-primary md:text-5xl"
          >
            {content.projects.title}
          </h2>
          <p className="mt-4 text-base leading-7 text-muted md:text-lg">
            {content.projects.description}
          </p>
        </div>
      </FounderReveal>

      <div className="grid gap-5 xl:grid-cols-2">
        {projects.map((project, index) => (
          <FounderReveal
            key={project.slug}
            variant="jump"
            delay={0.08 + index * 0.04}
          >
            <article className="premium-card founder-hover-card h-full p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow mb-3">{project.category}</p>
                  <h3 className="text-2xl font-semibold text-primary">
                    {project.name}
                  </h3>
                </div>
                <div className="status-pill rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {project.techStack.length}{" "}
                  {locale === "fr" ? "briques" : "stack points"}
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-muted">
                {project.description}
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="subtle-tile founder-hover-card rounded-[1.25rem] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-2">
                    {locale === "fr" ? "Problème" : "Problem"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-primary">
                    {project.problem}
                  </p>
                </div>
                <div className="subtle-tile founder-hover-card rounded-[1.25rem] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-2">
                    {locale === "fr" ? "Solution" : "Solution"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-primary">
                    {project.solution}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="subtle-tile founder-hover-card rounded-[1.25rem] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-2">
                    {locale === "fr" ? "Rôle" : "Role"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-primary">
                    {project.role}
                  </p>
                </div>
                <div className="subtle-tile founder-hover-card rounded-[1.25rem] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-2">
                    {locale === "fr" ? "Valeur business" : "Business value"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-primary">
                    {project.businessValue}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {project.techStack.map((item) => (
                  <span key={item} className="trust-pill">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <FounderTrackedLink
                  href={getLocalizedHref(locale, project.caseStudyPath)}
                  className="btn-secondary justify-center"
                  eventName="founder_project_card_click"
                  eventParams={{
                    locale,
                    project: project.slug,
                    action: "case-study",
                  }}
                  ariaLabel={`${content.projects.caseStudyCta}: ${project.name}`}
                >
                  {content.projects.caseStudyCta}
                  <ArrowUpRight className="size-4" />
                </FounderTrackedLink>
                <FounderTrackedLink
                  href={`${links.projectHref}?context=${project.slug}`}
                  className="btn-primary justify-center"
                  eventName="founder_project_card_click"
                  eventParams={{
                    locale,
                    project: project.slug,
                    action: "build-similar",
                  }}
                  ariaLabel={`${content.projects.buildSimilarCta}: ${project.name}`}
                >
                  {content.projects.buildSimilarCta}
                  <ArrowRight className="size-4" />
                </FounderTrackedLink>
              </div>
            </article>
          </FounderReveal>
        ))}
      </div>
    </section>
  );
}

export function FounderExperience({ content }: { content: FounderContent }) {
  return (
    <section
      aria-labelledby="founder-experience-heading"
      className="container py-10 md:py-14"
    >
      <FounderReveal variant="jump">
        <div className="mb-8 max-w-3xl">
          <p className="eyebrow mb-3">{content.experience.eyebrow}</p>
          <h2
            id="founder-experience-heading"
            className="text-balance text-3xl font-semibold text-primary md:text-5xl"
          >
            {content.experience.title}
          </h2>
          <p className="mt-4 text-base leading-7 text-muted md:text-lg">
            {content.experience.description}
          </p>
        </div>
      </FounderReveal>

      <ol className="relative border-l border-border pl-6 md:pl-8">
        {content.experience.items.map((item, index) => (
          <li
            key={`${item.stage}-${item.title}`}
            className="relative pb-8 last:pb-0"
          >
            <span className="absolute -left-[2.05rem] top-1.5 inline-flex size-4 rounded-full border-4 border-background bg-accent md:-left-[2.55rem]" />
            <FounderReveal variant="float" delay={0.08 + index * 0.06}>
              <article className="premium-card founder-hover-card p-5 sm:p-6">
                <p className="eyebrow mb-3">{item.stage}</p>
                <h3 className="text-xl font-semibold text-primary">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-accent">
                  {item.organization}
                </p>
                <p className="mt-4 text-sm leading-7 text-muted">
                  {item.summary}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {item.highlights.map((highlight) => (
                    <span key={highlight} className="trust-pill">
                      {highlight}
                    </span>
                  ))}
                </div>
              </article>
            </FounderReveal>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function FounderPrinciples({ content }: { content: FounderContent }) {
  return (
    <section
      aria-labelledby="founder-principles-heading"
      className="container py-10 md:py-14"
    >
      <FounderReveal variant="jump">
        <div className="mb-8 max-w-3xl">
          <p className="eyebrow mb-3">{content.principles.eyebrow}</p>
          <h2
            id="founder-principles-heading"
            className="text-balance text-3xl font-semibold text-primary md:text-5xl"
          >
            {content.principles.title}
          </h2>
          <p className="mt-4 text-base leading-7 text-muted md:text-lg">
            {content.principles.description}
          </p>
        </div>
      </FounderReveal>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {content.principles.items.map((item, index) => {
          const Icon = principleIconMap[item.icon];

          return (
            <FounderReveal
              key={item.title}
              variant="float"
              delay={0.08 + index * 0.04}
            >
              <article className="premium-card founder-hover-card h-full p-5">
                <div className="icon-chip inline-flex rounded-2xl p-3">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-primary">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {item.description}
                </p>
              </article>
            </FounderReveal>
          );
        })}
      </div>
    </section>
  );
}

export function FounderTestimonials({
  content,
  locale,
  feedback,
  projectOptions,
}: {
  content: FounderContent;
  locale: Locale;
  feedback: FounderFeedbackItem[];
  projectOptions: Array<{ slug: string; name: string }>;
}) {
  return (
    <section
      aria-labelledby="founder-testimonials-heading"
      className="container py-10 md:py-14"
    >
      <FounderReveal variant="jump">
        <div className="premium-card founder-hover-card p-6 text-center sm:p-8 md:p-10">
          <p className="eyebrow mx-auto mb-3 justify-center">
            {content.testimonials.eyebrow}
          </p>
          <h2
            id="founder-testimonials-heading"
            className="text-balance text-3xl font-semibold text-primary md:text-4xl"
          >
            {content.testimonials.title}
          </h2>
          {feedback.length ? (
            <div className="mx-auto mt-6 grid max-w-5xl gap-4 text-left md:grid-cols-2">
              {feedback.map((item) => (
                <article
                  key={item.id}
                  className="subtle-tile founder-hover-card rounded-[1.2rem] p-4"
                >
                  {item.rating ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-2">
                      {"★".repeat(item.rating)}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm leading-7 text-primary">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <p className="mt-3 text-xs text-muted">
                    {item.name}
                    {item.role || item.company
                      ? ` · ${[item.role, item.company].filter(Boolean).join(" · ")}`
                      : ""}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted">
              {content.testimonials.placeholder}
            </p>
          )}

          <FounderFeedbackForm
            locale={locale}
            projectOptions={projectOptions}
          />
        </div>
      </FounderReveal>
    </section>
  );
}

export function FounderDownload({
  content,
  locale,
  links,
}: {
  content: FounderContent;
  locale: Locale;
  links: FounderLinks;
}) {
  const resumeAriaLabel =
    locale === "fr"
      ? "Prévisualiser et télécharger le CV fondateur de Chia Carlyle"
      : "Preview and download Chia Carlyle's founder CV";

  return (
    <section
      aria-labelledby="founder-download-heading"
      className="container py-10 md:py-14"
    >
      <FounderReveal variant="jump">
        <div className="gradient-border rounded-[2rem]">
          <div className="premium-card founder-hover-card overflow-hidden rounded-[2rem] p-6 sm:p-8 md:p-10">
            <div className="grid gap-6 lg:grid-cols-[1.08fr_.92fr]">
              <div>
                <h2
                  id="founder-download-heading"
                  className="text-balance text-3xl font-semibold text-primary md:text-4xl"
                >
                  {content.download.title}
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-muted">
                  {content.download.body}
                </p>
                {!links.hasDirectCvDownload ? (
                  <p className="mt-4 text-sm leading-6 text-muted">
                    {content.download.placeholderNote}
                  </p>
                ) : null}
              </div>

              <div className="elevated-panel founder-hover-card rounded-[1.75rem] p-5 sm:p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent-2">
                  {locale === "fr" ? "Profil fondateur" : "Founder profile"}
                </p>
                <div className="mt-5 grid gap-3">
                  {[
                    FOUNDER_NAME,
                    content.title,
                    locale === "fr"
                      ? "Douala, Cameroun — pour l’Afrique et les clients internationaux"
                      : siteConfig.location,
                  ].map((item) => (
                    <div
                      key={item}
                      className="subtle-tile founder-hover-card rounded-[1.2rem] px-4 py-3 text-sm text-primary"
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <FounderTrackedLink
                  href={links.downloadHref}
                  download={links.hasDirectCvDownload}
                  className="btn-primary mt-6 w-full justify-center"
                  eventName="founder_cv_download_click"
                  eventParams={{
                    location: "download-section",
                    locale,
                    direct: links.hasDirectCvDownload,
                  }}
                  ariaLabel={resumeAriaLabel}
                >
                  {content.download.cta}
                  <Download className="size-4" />
                </FounderTrackedLink>
              </div>
            </div>
          </div>
        </div>
      </FounderReveal>
    </section>
  );
}

export function FounderFinalCta({
  content,
  locale,
  links,
}: {
  content: FounderContent;
  locale: Locale;
  links: FounderLinks;
}) {
  return (
    <section
      aria-labelledby="founder-final-cta-heading"
      className="container py-14 md:py-20"
    >
      <FounderReveal variant="jump">
        <div className="premium-card overflow-hidden p-6 text-center sm:p-8 md:p-12">
          <p className="eyebrow mx-auto mb-3 justify-center">
            {content.finalCta.eyebrow}
          </p>
          <h2
            id="founder-final-cta-heading"
            className="text-balance text-4xl font-semibold text-primary md:text-6xl"
          >
            {content.finalCta.title}
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-muted md:text-lg">
            {content.finalCta.body}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <FounderTrackedLink
              href={links.projectHref}
              className="btn-primary justify-center"
              eventName="founder_start_project_click"
              eventParams={{ location: "final-cta", locale }}
              ariaLabel={content.finalCta.primaryCta}
            >
              {content.finalCta.primaryCta}
              <ArrowRight className="size-4" />
            </FounderTrackedLink>
            <FounderTrackedLink
              href={links.solutionsHref}
              className="btn-secondary justify-center"
              ariaLabel={content.finalCta.secondaryCta}
            >
              {content.finalCta.secondaryCta}
            </FounderTrackedLink>
            <FounderTrackedLink
              href={links.contactHref}
              className="btn-ghost justify-center rounded-full border border-border px-4 py-3 text-primary"
              ariaLabel={content.finalCta.tertiaryCta}
            >
              {content.finalCta.tertiaryCta}
            </FounderTrackedLink>
          </div>
        </div>
      </FounderReveal>
    </section>
  );
}
