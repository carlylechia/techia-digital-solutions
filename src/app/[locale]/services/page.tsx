import type { Metadata } from "next";
import { ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { notFound } from "next/navigation";
import { AIConsultationSection } from "@/components/site/ai-consultation-section";
import { Reveal } from "@/components/site/reveal";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  getDictionary,
  getLocalizedSectionHref,
  isLocale,
  mergedPageAnchors,
  type Locale,
} from "@/content/site";
import { createMetadata } from "@/lib/seo";
import { FeatureCard } from "@/components/ui/feature-card";

function getMergedServicesMeta(locale: Locale) {
  if (locale === "fr") {
    return {
      title: "Services, solutions et secteurs — teChia Digital Solutions",
      description:
        "Un parcours structuré réunissant services, modules de solution et applications sectorielles premium pour aider les entreprises à choisir le bon système digital.",
    };
  }

  return {
    title: "Services, Solutions, and Industries — teChia Digital Solutions",
    description:
      "A structured teChia page combining premium services, solution modules, and industry applications so businesses can choose the right digital system with clarity.",
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const meta = getMergedServicesMeta(locale);

  return createMetadata({
    locale,
    title: meta.title,
    description: meta.description,
    path: "/services",
  });
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const combinedDescription =
    locale === "fr"
      ? "Cette page regroupe l’offre teChia, les modules de solution et les applications sectorielles dans un seul flux clair, pour aider une entreprise à passer de l’idée au bon système digital sans dispersion."
      : "This page brings teChia services, solution modules, and industry applications into one clear flow, so a business can move from idea to the right digital system without scattered decision-making.";
  const overviewCards = [
    {
      id: mergedPageAnchors.services.catalog,
      eyebrow: dict.sections.services,
      title: dict.pages.services.title,
      description: dict.pages.services.description,
      tags: dict.services.slice(0, 3).map((item) => item.title),
    },
    {
      id: mergedPageAnchors.services.solutions,
      eyebrow: dict.sections.solutions,
      title: dict.pages.solutions.title,
      description: dict.pages.solutions.description,
      tags: dict.solutions.slice(0, 3).map((item) => item.title),
    },
    {
      id: mergedPageAnchors.services.industries,
      eyebrow: dict.sections.industries,
      title: dict.pages.industries.title,
      description: dict.pages.industries.description,
      tags: dict.pages.industries.detailPillars,
    },
  ];
  const deliveryColumns = [
    {
      icon: Workflow,
      eyebrow: dict.sections.method,
      title: dict.pages.home.methodTitle,
      items: dict.method,
    },
    {
      icon: ShieldCheck,
      eyebrow: dict.sections.security,
      title: dict.pages.home.securityTitle,
      items: dict.securityPromise,
    },
  ];

  return (
    <main>
      <PremiumPageHero
        locale={locale}
        eyebrow={dict.sections.services}
        title={dict.pages.services.title}
        description={combinedDescription}
        badges={[
          dict.sections.services,
          dict.sections.solutions,
          dict.sections.industries,
          dict.common.startProject,
        ]}
        actions={[
          { href: "/start-project", label: dict.common.requestQuote },
          { href: "/contact", label: dict.nav.contact, variant: "secondary" },
        ]}
        aside={
          <div
            id={mergedPageAnchors.services.overview}
            className="surface-panel h-full p-5 md:p-6"
          >
            <p className="eyebrow">
              {locale === "fr" ? "Parcours structuré" : "Structured flow"}
            </p>
            <h2 className="mt-4 text-balance text-2xl font-semibold text-foreground md:text-3xl">
              {locale === "fr"
                ? "Commencez par la bonne couche digitale, pas par un simple mot-clé."
                : "Start with the right digital layer, not just a category label."}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              {locale === "fr"
                ? "Les services expliquent la capacité. Les solutions montrent la forme du système. Les secteurs montrent comment cette logique s’adapte au métier."
                : "Services explain the capability. Solutions show the system shape. Industries show how that logic adapts to a business context."}
            </p>
            <div className="mt-6 grid gap-3">
              {overviewCards.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="subtle-tile rounded-[1.2rem] p-4 text-left transition hover:-translate-y-0.5 hover:border-accent-2/30"
                >
                  <p className="eyebrow">{item.eyebrow}</p>
                  <p className="mt-3 text-base font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    {item.description}
                  </p>
                </a>
              ))}
            </div>
          </div>
        }
      />

      <section className="container py-8 md:py-10">
        <div className="grid gap-5 lg:grid-cols-3">
          {overviewCards.map((item, index) => (
            <Reveal key={item.id} delay={index * 0.04}>
              <div className="gradient-border rounded-[1.7rem]">
                <div className="elevated-panel h-full p-6">
                  <p className="eyebrow">{item.eyebrow}</p>
                  <h2 className="mt-4 text-balance text-2xl font-semibold text-foreground">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    {item.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="trust-pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section
        id={mergedPageAnchors.services.catalog}
        className="container scroll-mt-28 py-8 md:py-10"
      >
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow={dict.sections.services}
            title={dict.pages.services.title}
            description={dict.pages.services.description}
          />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {dict.services.map((item, index) => (
            <Reveal key={item.slug} delay={index * 0.04}>
              <FeatureCard
                item={item}
                locale={locale}
                hrefBase="services"
                cta={dict.common.learnMore}
              />
            </Reveal>
          ))}
        </div>
      </section>

      <section
        id={mergedPageAnchors.services.solutions}
        className="container scroll-mt-28 py-8 md:py-10"
      >
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow={dict.sections.solutions}
            title={dict.pages.solutions.title}
            description={dict.pages.solutions.description}
          />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {dict.solutions.map((item, index) => (
            <Reveal key={item.slug} delay={index * 0.04}>
              <FeatureCard
                item={item}
                locale={locale}
                cta={dict.common.learnMore}
              />
            </Reveal>
          ))}
        </div>
      </section>

      <section
        id={mergedPageAnchors.services.industries}
        className="container scroll-mt-28 py-8 md:py-10"
      >
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow={dict.sections.industries}
            title={dict.pages.industries.title}
            description={dict.pages.industries.description}
          />
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {dict.industries.map((item, index) => (
            <Reveal key={item.slug} delay={index * 0.03}>
              <FeatureCard
                item={item}
                locale={locale}
                hrefBase="industries"
                cta={dict.common.learnMore}
              />
            </Reveal>
          ))}
        </div>
      </section>

      <section
        id={mergedPageAnchors.services.method}
        className="container scroll-mt-28 py-8 md:py-12"
      >
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <Reveal>
            <div className="gradient-border rounded-[2rem]">
              <div className="elevated-panel h-full p-6 md:p-8">
                <p className="font-script text-3xl text-accent-3 md:text-4xl">
                  {locale === "fr"
                    ? "une logique claire du haut vers le bas"
                    : "one clear logic from top to bottom"}
                </p>
                <p className="eyebrow mt-3">
                  {locale === "fr" ? "Cadre de livraison" : "Delivery frame"}
                </p>
                <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold text-foreground md:text-5xl">
                  <span className="headline-gradient">
                    {locale === "fr"
                      ? "La même rigueur s’applique au conseil, à l’interface, à l’ingénierie et à la mise en ligne."
                      : "The same rigor carries through strategy, interface design, engineering, and launch quality."}
                  </span>
                </h2>
                <div className="headline-underline mt-5" aria-hidden="true" />
                <p className="mt-6 text-base leading-8 text-muted md:text-lg">
                  {locale === "fr"
                    ? "Cette structure fusionnée aide les visiteurs à comprendre la progression logique: ce que teChia fait, sous quelle forme cela peut être livré, puis comment cela s’adapte à un secteur concret."
                    : "This merged structure helps visitors understand the logical progression: what teChia does, the forms it can take, and how that maps into a concrete industry context."}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="trust-pill">
                    <Sparkles className="size-3.5" />
                    {locale === "fr"
                      ? "Présence, système, secteur"
                      : "Capability, system, industry"}
                  </span>
                  <span className="trust-pill">
                    {locale === "fr"
                      ? "Une seule lecture cohérente"
                      : "One coherent reading path"}
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="grid gap-5">
            {deliveryColumns.map((column, index) => {
              const Icon = column.icon;
              return (
                <Reveal key={column.title} delay={index * 0.05}>
                  <div className="gradient-border rounded-[1.7rem]">
                    <div className="surface-panel h-full p-6">
                      <span className="icon-chip inline-flex rounded-2xl p-3">
                        <Icon className="size-5" />
                      </span>
                      <p className="eyebrow mt-5">{column.eyebrow}</p>
                      <h3 className="mt-4 text-2xl font-semibold text-foreground">
                        {column.title}
                      </h3>
                      <div className="mt-5 grid gap-3">
                        {column.items.map((item) => (
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
              );
            })}
          </div>
        </div>
      </section>

      <AIConsultationSection
        locale={locale}
        secondaryAction={{
          href: getLocalizedSectionHref(
            locale,
            "/services",
            mergedPageAnchors.services.catalog,
          ),
          label: dict.nav.services,
        }}
      />

      <PremiumPageCta
        locale={locale}
        eyebrow={locale === "fr" ? "Prochaine étape" : "Next step"}
        title={dict.home.finalCtaTitle}
        description={combinedDescription}
        primaryAction={{
          href: "/start-project",
          label: dict.common.requestQuote,
        }}
        secondaryAction={{ href: "/contact", label: dict.nav.contact }}
      />
    </main>
  );
}
