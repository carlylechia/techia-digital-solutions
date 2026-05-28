import type { Metadata } from "next";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/ui/json-ld";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/site/reveal";
import {
  getDictionary,
  getLocalizedHref,
  getLocalizedSectionHref,
  isLocale,
  mergedPageAnchors,
  type Locale,
} from "@/content/site";
import { FeatureCard } from "@/components/ui/feature-card";
import {
  loadPortfolioCards,
  loadPortfolioFeedback,
} from "@/lib/public-showcase";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";

function getMergedAboutMeta(locale: Locale) {
  if (locale === "fr") {
    return {
      title: "À propos, équipe et réalisations — teChia Digital Solutions",
      description:
        "Découvrez le positionnement teChia, la polyvalence de l’équipe et un portfolio de projets premium soutenu par la même exigence technique.",
    };
  }

  return {
    title: "About, Team, and Portfolio — teChia Digital Solutions",
    description:
      "Explore the teChia company story, versatile delivery team, and DB-backed portfolio of premium digital projects in one continuous page.",
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const meta = getMergedAboutMeta(locale);

  return createMetadata({
    locale,
    title: meta.title,
    description: meta.description,
    path: "/about",
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const [caseStudies, feedback] = await Promise.all([
    loadPortfolioCards(locale),
    loadPortfolioFeedback(locale),
  ]);
  const teamNarrative =
    locale === "fr"
      ? "teChia s’appuie sur un noyau fondateur fort et sur une équipe complète capable de couvrir le design produit, le développement, la qualité, l’infrastructure, la gouvernance produit, l’architecture système et la sécurité selon le périmètre du projet."
      : "teChia operates with a strong founder core and a versatile delivery team able to cover product design, development, quality, infrastructure, product leadership, systems architecture, and security according to project scope.";
  const teamCapabilityCards = [
    {
      icon: Sparkles,
      title:
        locale === "fr"
          ? "Design produit & interfaces"
          : "Product and interface designers",
      description:
        locale === "fr"
          ? "Des designers capables de traduire une vision business en interfaces crédibles, fluides et cohérentes sur tous les écrans."
          : "Designers who can translate business intent into credible, fluid, and cohesive interfaces across the entire product surface.",
    },
    {
      icon: Code2,
      title: locale === "fr" ? "Développeurs" : "Developers",
      description:
        locale === "fr"
          ? "Des ingénieurs front-end et full-stack pour construire des sites, systèmes métier, portails et applications web robustes."
          : "Front-end and full-stack engineers who build robust websites, business systems, portals, and web applications.",
    },
    {
      icon: CheckCircle2,
      title: locale === "fr" ? "QA & fiabilité" : "QA and reliability",
      description:
        locale === "fr"
          ? "Une attention forte portée aux tests, aux scénarios réels, à la cohérence fonctionnelle et à la stabilité avant livraison."
          : "Strong attention to testing, real usage scenarios, functional consistency, and delivery stability before release.",
    },
    {
      icon: Workflow,
      title: locale === "fr" ? "DevOps & opérations" : "DevOps and operations",
      description:
        locale === "fr"
          ? "Des profils capables de gérer la mise en ligne, l’environnement, la performance, la livraison continue et la résilience opérationnelle."
          : "Profiles able to handle deployment, environments, performance, continuous delivery, and operational resilience.",
    },
    {
      icon: BriefcaseBusiness,
      title:
        locale === "fr" ? "Pilotage produit" : "Product owners and managers",
      description:
        locale === "fr"
          ? "Des profils pour cadrer les priorités, clarifier les décisions produit et garder l’exécution alignée avec les objectifs métier."
          : "Product leads who help frame priorities, clarify decisions, and keep execution aligned with business goals.",
    },
    {
      icon: ShieldCheck,
      title:
        locale === "fr"
          ? "Architectes systèmes & sécurité"
          : "Systems architects and security engineers",
      description:
        locale === "fr"
          ? "Des experts capables de définir des fondations solides, sécurisées et évolutives pour les projets les plus exigeants."
          : "Experts who shape secure, scalable foundations for projects that need stronger architectural and security depth.",
    },
  ];
  const mergedHeroDescription =
    locale === "fr"
      ? `${dict.pages.about.description} ${teamNarrative}`
      : `${dict.pages.about.description} ${teamNarrative}`;

  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: dict.nav.home, path: "" },
          { name: dict.nav.about, path: "/about" },
        ])}
      />

      <PremiumPageHero
        locale={locale}
        eyebrow={dict.pages.about.eyebrow}
        title={dict.pages.about.title}
        description={mergedHeroDescription}
        badges={[
          ...dict.pages.about.pillars,
          locale === "fr" ? "Équipe polyvalente" : "Versatile team",
        ]}
        actions={[
          { href: "/start-project", label: dict.common.startProject },
          { href: "/founder", label: dict.nav.founder, variant: "secondary" },
        ]}
        aside={
          <div
            id={mergedPageAnchors.about.overview}
            className="surface-panel h-full p-5 md:p-6"
          >
            <p className="eyebrow">
              {locale === "fr" ? "Vue d’ensemble" : "At a glance"}
            </p>
            <h2 className="mt-4 text-balance text-2xl font-semibold text-foreground md:text-3xl">
              {locale === "fr"
                ? "Une équipe pensée pour rendre des projets sérieux réellement livrables."
                : "A team shape built to make serious digital projects genuinely deliverable."}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              {locale === "fr"
                ? "La page raconte à la fois le positionnement de teChia, la capacité d’exécution humaine derrière les projets, et les preuves concrètes déjà visibles dans le portfolio."
                : "This page ties together teChia’s positioning, the human delivery capability behind the work, and the concrete proof already visible across the portfolio."}
            </p>
            <div className="mt-6 grid gap-3">
              <a
                href={`#${mergedPageAnchors.about.team}`}
                className="subtle-tile rounded-[1.2rem] p-4 text-left transition hover:-translate-y-0.5 hover:border-accent-2/30"
              >
                <p className="eyebrow">{locale === "fr" ? "Équipe" : "Team"}</p>
                <p className="mt-3 text-base font-semibold text-foreground">
                  {locale === "fr"
                    ? "Profils de conception, ingénierie et delivery"
                    : "Design, engineering, and delivery profiles"}
                </p>
              </a>
              <a
                href={`#${mergedPageAnchors.about.founder}`}
                className="subtle-tile rounded-[1.2rem] p-4 text-left transition hover:-translate-y-0.5 hover:border-accent-2/30"
              >
                <p className="eyebrow">{dict.nav.founder}</p>
                <p className="mt-3 text-base font-semibold text-foreground">
                  {locale === "fr"
                    ? "Le point de vue du fondateur et la logique de construction"
                    : "Founder perspective and the logic behind the build"}
                </p>
              </a>
              <a
                href={`#${mergedPageAnchors.about.portfolio}`}
                className="subtle-tile rounded-[1.2rem] p-4 text-left transition hover:-translate-y-0.5 hover:border-accent-2/30"
              >
                <p className="eyebrow">{dict.nav.portfolio}</p>
                <p className="mt-3 text-base font-semibold text-foreground">
                  {locale === "fr"
                    ? "Projets et études de cas soutenus par la base de données"
                    : "DB-backed projects and case studies"}
                </p>
              </a>
            </div>
          </div>
        }
      />

      <section className="container py-8 md:py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {dict.pages.about.pillars.map((title, index) => (
            <Reveal key={title} delay={index * 0.04}>
              <article className="gradient-border rounded-[1.75rem]">
                <div className="elevated-panel h-full p-6">
                  <p className="eyebrow mb-3">0{index + 1}</p>
                  <h2 className="text-2xl font-semibold text-primary">
                    {title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    {
                      [
                        dict.home.digitalHomeBody,
                        dict.home.problemBody,
                        dict.home.europeBody,
                      ][index]
                    }
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section
        id={mergedPageAnchors.about.team}
        className="container scroll-mt-28 py-8 md:py-10"
      >
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow={locale === "fr" ? "Équipe teChia" : "The teChia team"}
            title={
              locale === "fr"
                ? "Une équipe complète pour servir des besoins digitaux complexes avec un vrai niveau d’exécution."
                : "A complete team to serve complex digital needs with real delivery depth."
            }
            description={teamNarrative}
          />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {teamCapabilityCards.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={index * 0.04}>
                <div className="gradient-border rounded-[1.7rem]">
                  <div className="surface-panel h-full p-6">
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

      <section
        id={mergedPageAnchors.about.founder}
        className="container scroll-mt-28 py-8 md:py-12"
      >
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <Reveal>
            <div className="gradient-border rounded-[2rem]">
              <div className="elevated-panel h-full p-6 md:p-8">
                <p className="font-script text-3xl text-accent-3 md:text-4xl">
                  {locale === "fr"
                    ? "une vision portée par l’exécution"
                    : "vision carried by execution"}
                </p>
                <p className="eyebrow mt-3">{dict.nav.founder}</p>
                <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold text-foreground md:text-5xl">
                  <span className="headline-gradient">
                    {locale === "fr"
                      ? "Le fondateur donne la direction, l’équipe donne l’amplitude."
                      : "The founder sets the direction, and the team expands the delivery range."}
                  </span>
                </h2>
                <div className="headline-underline mt-5" aria-hidden="true" />
                <p className="mt-6 text-base leading-8 text-muted md:text-lg">
                  {locale === "fr"
                    ? "La page fondateur détaille le parcours, la pensée produit et la manière dont teChia relie qualité technique, clarté métier et crédibilité digitale."
                    : "The founder page goes deeper into the technical background, product thinking, and the way teChia connects technical quality, business clarity, and digital credibility."}
                </p>
                <Link
                  href={getLocalizedHref(locale, "/founder")}
                  className="btn-secondary mt-8"
                >
                  {locale === "fr"
                    ? "Voir la page fondateur"
                    : "View the founder page"}
                </Link>
              </div>
            </div>
          </Reveal>

          <div className="grid gap-5">
            <Reveal delay={0.05}>
              <div className="gradient-border rounded-[1.7rem]">
                <div className="surface-panel p-6">
                  <p className="eyebrow">{dict.pages.about.beliefTitle}</p>
                  <div className="mt-4 grid gap-3">
                    {dict.pages.about.beliefs.map((item) => (
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

            <Reveal delay={0.09}>
              <div className="gradient-border rounded-[1.7rem]">
                <div className="surface-panel p-6">
                  <p className="eyebrow">
                    {locale === "fr"
                      ? "Ce que cela change"
                      : "What this changes"}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-muted">
                    {locale === "fr"
                      ? "Cela signifie qu’un client n’obtient pas seulement une jolie interface, mais aussi la combinaison de profils nécessaire pour livrer un produit stable, structuré et défendable dans le temps."
                      : "It means clients do not just get a polished interface, but the mix of roles needed to deliver a stable, structured, and durable product."}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section
        id={mergedPageAnchors.about.portfolio}
        className="container scroll-mt-28 py-8 md:py-10"
      >
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow={dict.sections.caseStudies}
            title={dict.pages.portfolio.title}
            description={dict.pages.portfolio.description}
          />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {caseStudies.map((item, index) => (
            <Reveal key={item.slug} delay={index * 0.04}>
              <FeatureCard
                item={item}
                locale={locale}
                hrefBase="portfolio"
                cta={dict.common.viewCaseStudy}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {feedback.length ? (
        <section
          id={mergedPageAnchors.about.proof}
          className="container scroll-mt-28 pb-12 pt-8"
        >
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow={locale === "fr" ? "Retour client" : "Client proof"}
              title={
                locale === "fr"
                  ? "Des retours qui prolongent naturellement la lecture du portfolio."
                  : "Feedback that naturally extends the portfolio story."
              }
              description={
                locale === "fr"
                  ? "Les réalisations montrent le type de travail. Les retours montrent la qualité perçue dans la collaboration."
                  : "Projects show the kind of work. Feedback shows how that work feels in collaboration."
              }
            />
          </Reveal>
          <div className="grid gap-4 md:grid-cols-2">
            {feedback.map((item, index) => (
              <Reveal key={item.id} delay={index * 0.04}>
                <article className="premium-card p-5">
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
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      <PremiumPageCta
        locale={locale}
        eyebrow={dict.pages.home.finalCtaEyebrow}
        title={dict.home.finalCtaTitle}
        description={mergedHeroDescription}
        primaryAction={{
          href: "/start-project",
          label: dict.common.startProject,
        }}
        secondaryAction={{
          href: getLocalizedSectionHref(
            locale,
            "/about",
            mergedPageAnchors.about.portfolio,
          ),
          label: dict.nav.portfolio,
        }}
      />
    </main>
  );
}
