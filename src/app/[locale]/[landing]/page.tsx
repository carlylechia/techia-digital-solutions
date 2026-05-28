import type { Metadata } from "next";
import { JsonLd } from "@/components/ui/json-ld";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import { notFound } from "next/navigation";
import { PageSections } from "@/components/sections/page-sections";
import { SectionHeading } from "@/components/ui/section-heading";
import { europeLandingPages, getDictionary, isLocale, locales, type Locale } from "@/content/site";
import { getPrisma } from "@/lib/prisma";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";

export function generateStaticParams() { return locales.flatMap((locale) => europeLandingPages.map((item) => ({ locale, landing: item.slug }))); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string; landing: string }> }): Promise<Metadata> {
  const { locale: rawLocale, landing } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const dict = getDictionary(locale);
  const staticPage = europeLandingPages.find((item) => item.slug === landing);
  if (staticPage) {
    return createMetadata({ locale, title: `${dict.pages.landing.titlePrefix} ${staticPage.service[locale]} ${dict.pages.landing.titleConnector} ${staticPage.market[locale]} — teChia`, description: dict.pages.landing.metaDescription, path: `/${landing}` });
  }
  const prisma = getPrisma();
  if (prisma) {
    const dbPage = await prisma.contentPage.findUnique({ where: { slug: landing }, include: { translations: { where: { locale } } } });
    if (dbPage?.status === "PUBLISHED") {
      const translation = dbPage.translations[0];
      return createMetadata({ locale, title: translation?.metaTitle ?? translation?.title ?? landing, description: translation?.metaDescription ?? translation?.excerpt ?? "", path: `/${landing}` });
    }
  }
  return createMetadata({ locale, title: dict.pages.landing.metaFallbackTitle, description: dict.pages.landing.metaDescription, path: `/${landing}` });
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string; landing: string }> }) {
  const { locale: rawLocale, landing } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);

  // Static landing pages
  const staticPage = europeLandingPages.find((item) => item.slug === landing);
  if (staticPage) {
    return (
      <main>
        <JsonLd data={breadcrumbJsonLd(locale, [{ name: dict.nav.home, path: "" }, { name: `${staticPage.service[locale]} ${dict.pages.landing.titleConnector} ${staticPage.market[locale]}`, path: `/${landing}` }])} />
        <PremiumPageHero
          locale={locale}
          eyebrow={dict.pages.landing.eyebrow}
          title={`${dict.pages.landing.titlePrefix} ${staticPage.service[locale]} ${dict.pages.landing.titleConnector} ${staticPage.market[locale]}`}
          description={dict.pages.landing.description}
          badges={dict.pages.landing.trust}
          actions={[
            { href: "/start-project", label: dict.common.startProject },
            { href: "/solutions", label: dict.common.exploreSolutions, variant: "secondary" }
          ]}
          aside={
            <div className="grid gap-4">
              <article className="gradient-border rounded-[1.5rem]">
                <div className="elevated-panel p-6">
                  <p className="eyebrow mb-3">{dict.pages.landing.whyTitle}</p>
                  <p className="text-sm leading-6 text-muted">{dict.pages.landing.whyDescription}</p>
                </div>
              </article>
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {dict.pages.landing.benefits.map((item) => (
                  <article key={item} className="gradient-border rounded-[1.5rem]">
                    <div className="elevated-panel h-full p-5">
                      <p className="text-base font-semibold text-foreground">{item}</p>
                      <p className="mt-3 text-sm leading-6 text-muted">{dict.pages.landing.benefitBody}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          }
        />

        <section className="container py-6 md:py-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="gradient-border rounded-[1.75rem]">
              <div className="elevated-panel p-8 md:p-10">
                <SectionHeading
                  eyebrow={dict.pages.landing.eyebrow}
                  title={dict.pages.landing.whyTitle}
                  description={dict.pages.landing.whyDescription}
                  align="left"
                  className="mb-0"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {dict.pages.landing.trust.map((item) => (
                <article key={item} className="gradient-border rounded-[1.5rem]">
                  <div className="elevated-panel h-full p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-2">{item}</p>
                    <p className="mt-3 text-sm leading-6 text-muted">{dict.pages.landing.benefitBody}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <PremiumPageCta
          locale={locale}
          eyebrow={dict.pages.landing.eyebrow}
          title={`${dict.common.startProject} ${dict.pages.landing.titleConnector} ${staticPage.market[locale]}`}
          description={dict.pages.landing.description}
          primaryAction={{ href: "/start-project", label: dict.common.startProject }}
          secondaryAction={{ href: "/contact", label: dict.nav.contact }}
        />
      </main>
    );
  }

  // DB-driven content pages (no /p/ prefix — lives at /[locale]/[slug])
  const prisma = getPrisma();
  if (!prisma) notFound();

  const dbPage = await prisma.contentPage.findUnique({
    where: { slug: landing },
    include: { translations: { where: { locale } } }
  });

  if (!dbPage || dbPage.status !== "PUBLISHED") notFound();

  const translation = dbPage.translations[0] ?? null;

  const hasSections = Array.isArray(dbPage.sections) && (dbPage.sections as unknown[]).length > 0;
  const fallbackTitle = translation?.title ?? landing;
  const fallbackDescription = translation?.excerpt ?? dict.pages.landing.metaDescription;

  return (
    <main>
      <JsonLd data={breadcrumbJsonLd(locale, [{ name: dict.nav.home, path: "" }, { name: fallbackTitle, path: `/${landing}` }])} />

      {hasSections ? (
        <section className="py-8 md:py-10">
          <PageSections sections={dbPage.sections} locale={locale} />
        </section>
      ) : (
        <>
          <PremiumPageHero
            locale={locale}
            title={fallbackTitle}
            description={fallbackDescription}
            actions={[
              { href: "/start-project", label: dict.common.startProject },
              { href: "/contact", label: dict.nav.contact, variant: "secondary" }
            ]}
          />
          {translation?.body ? (
            <section className="container py-6 md:py-8">
              <article className="gradient-border rounded-[1.75rem]">
                <div className="elevated-panel p-8 md:p-10">
                  <div className="prose prose-neutral dark:prose-invert max-w-none">
                    {translation.body.split("\n").filter(Boolean).map((paragraph, idx) => (
                      <p key={idx} className="mb-4 leading-8 text-muted">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </article>
            </section>
          ) : null}
        </>
      )}

      <PremiumPageCta
        locale={locale}
        eyebrow={dict.pages.landing.eyebrow}
        title={dict.home.finalCtaTitle}
        description={dict.home.finalCtaBody}
        primaryAction={{ href: "/start-project", label: dict.common.startProject }}
        secondaryAction={{ href: "/contact", label: dict.nav.contact }}
      />
    </main>
  );
}
