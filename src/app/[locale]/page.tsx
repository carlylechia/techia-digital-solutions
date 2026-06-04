import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Cloud,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { DemoGrid } from "@/components/demos/demo-grid";
import { HomepageHeroBridge } from "@/components/sections/homepage-hero-bridge";
import { HomepageSystemShowcase } from "@/components/sections/homepage-system-showcase";
import { HeroSection } from "@/components/sections/HeroSection";
import { AIConsultationSection } from "@/components/site/ai-consultation-section";
import { AnimatedGridBackground } from "@/components/site/animated-grid-background";
import { buttonVariants } from "@/components/site/button";
import { Reveal } from "@/components/site/reveal";
import { FeatureCard } from "@/components/ui/feature-card";
import { JsonLd } from "@/components/ui/json-ld";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { SectionHeading } from "@/components/ui/section-heading";
import { SwipeDotsCarousel } from "@/components/ui/swipe-dots-carousel";
import {
  getDictionary,
  getLocalizedHref,
  isLocale,
  type Locale,
} from "@/content/site";
import {
  loadHomepageFeedback,
  loadHomepageProjectCards,
} from "@/lib/public-showcase";
import { createMetadata, organizationJsonLd } from "@/lib/seo";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const dict = getDictionary(locale);
  return createMetadata({
    locale,
    title: dict.meta.title,
    description: dict.meta.description,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const [homepageProjects, homepageFeedback] = await Promise.all([
    loadHomepageProjectCards(locale),
    loadHomepageFeedback(locale),
  ]);
  const credibilitySuites =
    locale === "fr"
      ? [
          {
            icon: Cloud,
            title: "Cloud & déploiement",
            description:
              "Une fondation fiable pour les sites, portails, dashboards et contenus lourds.",
            items: ["Vercel", "Cloudflare", "AWS S3", "PostgreSQL"],
          },
          {
            icon: Sparkles,
            title: "IA & automatisation",
            description:
              "Des assistants et workflows conçus pour de vrais cas d’usage métier, pas pour l’effet de mode.",
            items: ["OpenAI API", "pgvector", "Auth.js", "Resend"],
          },
          {
            icon: Search,
            title: "SEO & découvrabilité",
            description:
              "Des garde-fous de structure, de mesure et de crédibilité pour soutenir la visibilité.",
            items: [
              "GA4",
              "Google Search Console",
              "Schema.org",
              "Core Web Vitals",
            ],
          },
        ]
      : [
          {
            icon: Cloud,
            title: "Cloud delivery",
            description:
              "A reliable foundation for websites, portals, dashboards, and media-heavy assets.",
            items: ["Vercel", "Cloudflare", "AWS S3", "PostgreSQL"],
          },
          {
            icon: Sparkles,
            title: "AI and automation",
            description:
              "Assistants and workflows designed for real business use cases instead of novelty.",
            items: ["OpenAI API", "pgvector", "Auth.js", "Resend"],
          },
          {
            icon: Search,
            title: "SEO and discoverability",
            description:
              "Structural, measurement, and credibility guardrails that support visibility from the start.",
            items: [
              "GA4",
              "Google Search Console",
              "Schema.org",
              "Core Web Vitals",
            ],
          },
        ];
  const methodCopy =
    locale === "fr"
      ? {
          script: "stratégie, design, développement, lancement",
          description:
            "Chaque projet teChia commence par le besoin métier, puis avance avec UX, développement, SEO, analytics et accompagnement au lancement.",
        }
      : {
          script: "strategy, design, build, launch",
          description:
            "Every teChia project starts with the business need, then moves through UX, development, SEO, analytics, and launch support.",
        };
  const pricingCopy =
    locale === "fr"
      ? {
          viewPortfolio: "Voir le portfolio",
          viewAll: "Voir les offres",
        }
      : {
          viewPortfolio: "View portfolio",
          viewAll: "View full pricing",
        };
  const socialProofCopy =
    locale === "fr"
      ? {
          title: "Des retours clients concrets qui renforcent la confiance.",
          description:
            "Des témoignages courts et précis montrent le type de clarté, de structure et de confiance que les clients ressentent une fois le projet en place.",
        }
      : {
          title: "Specific client proof that builds trust faster.",
          description:
            "Short, concrete testimonials show the kind of clarity, structure, and confidence clients feel once the work is live.",
        };
  const testimonialItems = homepageFeedback.map((item) => ({
    id: item.id,
    quote: item.quote,
    name: item.name,
    roleLine: [item.role, item.company].filter(Boolean).join(" · "),
    rating: item.rating,
    source: item.source,
  }));
  const testimonialDotLabels = testimonialItems.map((_, index) =>
    locale === "fr"
      ? `Voir le témoignage ${index + 1}`
      : `View testimonial ${index + 1}`,
  );

  return (
    <main id="main-content">
      <JsonLd data={organizationJsonLd(locale)} />
      <HeroSection locale={locale} />

      <HomepageHeroBridge locale={locale} />

      <HomepageSystemShowcase locale={locale} />

      <section className="container py-16">
        <Reveal>
          <SectionHeading
            eyebrow={dict.sections.services}
            title={dict.pages.home.servicesTitle}
            description={dict.pages.home.servicesDescription}
          />
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {dict.services.slice(0, 4).map((item, index) => (
            <Reveal key={item.slug} delay={index * 0.05}>
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

      <AIConsultationSection
        locale={locale}
        secondaryAction={{
          href: getLocalizedHref(locale, "/start-project"),
          label: dict.common.startProject,
        }}
      />

      <section className="container py-16">
        <Reveal>
          <SectionHeading
            eyebrow={dict.sections.demoLab}
            title={dict.pages.home.demoTitle}
            description={dict.pages.home.demoDescription}
          />
        </Reveal>

        <Reveal delay={0.04}>
          <DemoGrid locale={locale} />
        </Reveal>

        {homepageProjects.length ? (
          <div className="mt-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">{dict.pages.home.caseTitle}</p>
                <p className="mt-3 max-w-3xl text-base leading-7 text-muted">
                  {dict.pages.home.caseDescription}
                </p>
              </div>

              <Link
                href={getLocalizedHref(locale, "/portfolio")}
                className={`${buttonVariants({ variant: "secondary", size: "lg" })} w-full sm:w-auto`}
              >
                {pricingCopy.viewPortfolio}
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {homepageProjects.slice(0, 3).map((item, index) => (
                <Reveal key={item.slug} delay={index * 0.05}>
                  <FeatureCard
                    item={item}
                    locale={locale}
                    hrefBase="portfolio"
                    cta={dict.common.viewCaseStudy}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="container py-16">
        <Reveal>
          <SectionHeading
            eyebrow={dict.sections.method}
            title={dict.pages.home.methodTitle}
            description={methodCopy.description}
          />
        </Reveal>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <Reveal>
            <div className="gradient-border rounded-[2rem]">
              <div className="elevated-panel relative overflow-hidden p-6 md:p-8">
                <AnimatedGridBackground className="opacity-60" />
                <div className="relative z-10">
                  <p className="font-script text-3xl text-accent-3 md:text-4xl">
                    {methodCopy.script}
                  </p>
                  <div className="mt-7 grid gap-3">
                    {dict.method.map((step, index) => (
                      <div
                        key={step}
                        className="subtle-tile flex gap-4 rounded-[1.5rem] p-4"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent/10 text-sm font-bold text-accent">
                          {index + 1}
                        </span>
                        <p className="font-medium text-primary">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="gradient-border rounded-[2rem]">
              <div className="surface-panel h-full p-6 md:p-8">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-accent-2">
                  <ShieldCheck className="size-4" />
                  {dict.pages.home.securityTitle}
                </div>
                <h3 className="mt-5 text-3xl font-semibold text-primary md:text-4xl">
                  {dict.pages.home.stackTitle}
                </h3>
                <p className="mt-4 text-sm leading-7 text-muted md:text-base">
                  {locale === "fr"
                    ? "La crédibilité technique vient autant de la structure invisible que de l’interface visible."
                    : "Technical credibility comes as much from the invisible structure as it does from the visible interface."}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {dict.stack.map((item) => (
                    <span key={item} className="trust-pill">
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-6 grid gap-3">
                  {dict.securityPromise.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.35rem] border border-border bg-background p-4 text-sm leading-7 text-muted"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {credibilitySuites.map((suite, index) => {
            const Icon = suite.icon;

            return (
              <Reveal key={suite.title} delay={index * 0.05}>
                <article className="gradient-border rounded-[1.65rem]">
                  <div className="surface-panel h-full p-6">
                    <div className="icon-chip rounded-2xl p-3">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-5 text-2xl font-semibold text-primary">
                      {suite.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted">
                      {suite.description}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {suite.items.map((item) => (
                        <span key={item} className="trust-pill">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {testimonialItems.length ? (
        <section className="container py-16">
          <Reveal>
            <SectionHeading
              eyebrow={dict.sections.testimonials}
              title={socialProofCopy.title}
              description={socialProofCopy.description}
            />
          </Reveal>

          <Reveal delay={0.04}>
            <div className="mx-auto max-w-5xl">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-muted">
                  {locale === "fr"
                    ? "Faites glisser ou utilisez les points pour parcourir les retours disponibles."
                    : "Swipe or use the dots to move through the available client proof."}
                </p>
                <span className="trust-pill">
                  {locale === "fr" ? "Preuves clients" : "Client proof"}
                </span>
              </div>

              <SwipeDotsCarousel
                className="homepage-testimonials-carousel"
                viewportClassName="homepage-testimonials-viewport"
                trackClassName="homepage-testimonials-track"
                slideClassName="homepage-testimonials-slide"
                dotsClassName="homepage-testimonials-dots"
                ariaLabel={
                  locale === "fr"
                    ? "Carrousel de témoignages clients"
                    : "Client testimonials carousel"
                }
                autoplayMs={5600}
                pauseOnHover
                dotLabels={testimonialDotLabels}
              >
                {testimonialItems.map((item) => (
                  <article
                    key={item.id}
                    className="gradient-border rounded-[1.75rem]"
                  >
                    <div className="elevated-panel h-full p-6 md:p-7">
                      <div className="flex items-start justify-between gap-4">
                        <div className="founder-recommendation-badge">
                          <BadgeCheck className="size-4" />
                          {item.source.startsWith("seed_homepage")
                            ? locale === "fr"
                              ? "Témoignage mis en avant"
                              : "Featured testimonial"
                            : locale === "fr"
                              ? "Retour approuvé"
                              : "Approved feedback"}
                        </div>
                        <Quote className="size-5 text-accent-2" />
                      </div>

                      {item.rating ? (
                        <div className="mt-5 flex items-center gap-1 text-amber-400">
                          {Array.from({ length: item.rating }).map(
                            (_, starIndex) => (
                              <Star
                                key={`${item.id}-star-${starIndex}`}
                                className="size-4 fill-current"
                              />
                            ),
                          )}
                        </div>
                      ) : null}

                      <p className="mt-5 text-base leading-8 text-primary md:text-lg">
                        &ldquo;{item.quote}&rdquo;
                      </p>
                      <div className="mt-6 border-t border-border pt-4">
                        <p className="text-sm font-semibold text-primary">
                          {item.name}
                        </p>
                        {item.roleLine ? (
                          <p className="mt-1 text-sm text-muted">
                            {item.roleLine}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </SwipeDotsCarousel>
            </div>
          </Reveal>
        </section>
      ) : null}

      <section className="container py-16">
        <Reveal>
          <SectionHeading
            eyebrow={dict.sections.pricing}
            title={dict.pages.home.pricingTitle}
            description={dict.pages.home.pricingDescription}
          />
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {dict.pricing.slice(0, 3).map((item, index) => (
            <Reveal key={item.slug} delay={index * 0.05}>
              <FeatureCard
                item={item}
                locale={locale}
                href="/pricing"
                cta={item.cta || dict.common.requestQuote}
              />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.08}>
          <div className="mt-8 flex justify-center">
            <Link
              href={getLocalizedHref(locale, "/pricing")}
              className={`${buttonVariants({ variant: "secondary", size: "lg" })} w-full sm:w-auto`}
            >
              {pricingCopy.viewAll}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </Reveal>
      </section>

      <PremiumPageCta
        locale={locale}
        eyebrow={dict.pages.home.finalCtaEyebrow}
        title={dict.home.finalCtaTitle}
        description={dict.home.finalCtaBody}
        primaryAction={{
          href: "/start-project",
          label: dict.common.startProject,
        }}
        secondaryAction={{ href: "/contact", label: dict.nav.contact }}
      />
    </main>
  );
}
