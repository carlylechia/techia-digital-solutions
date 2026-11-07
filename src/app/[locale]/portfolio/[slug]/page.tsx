import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import {
  getDictionary,
  getLocalizedSectionHref,
  isLocale,
  locales,
  mergedPageAnchors,
  type Locale,
} from "@/content/site";
import { loadPortfolioCards } from "@/lib/public-showcase";
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui/json-ld";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    getDictionary(locale).caseStudies.map((item) => ({
      locale,
      slug: item.slug,
    })),
  );
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const dict = getDictionary(locale);
  const studies = await loadPortfolioCards(locale);
  const item = studies.find((study) => study.slug === slug);
  const caseStudyTitle =
    slug === "teloh-global-business"
      ? "Teloh Global Business Case Study"
      : item
        ? `${item.title} ${dict.pages.portfolio.caseStudySuffix}`
        : dict.pages.portfolio.caseStudySuffix;
  return createMetadata({
    locale,
    title: `${caseStudyTitle} — teChia`,    description: item?.description || dict.pages.portfolio.metaDescription,
    path: `/portfolio/${slug}`,
  });
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const studies = await loadPortfolioCards(locale);
  const study = studies.find((item) => item.slug === slug);
  if (!study) notFound();
  const caseStudyTitle =
    slug === "teloh-global-business"
      ? "Teloh Global Business Case Study by Techia Digital"
      : study.title;
  const caseStudyIntro =
    slug === "teloh-global-business"
      ? locale === "fr"
        ? "Ce projet a permis à Teloh Global Business de disposer d’un site web multilingue et d’une présence digitale structurée pour la logistique, les produits domestiques, les carrières, la capture de prospects et des flux e-commerce évolutifs."
        : "This project delivered a multilingual web presence and structured digital experience for Teloh Global Business, covering logistics, household products, careers, lead capture, and scalable e-commerce workflows."
      : study.description;
  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: locale === "fr" ? "Accueil" : "Home", path: "" },
          { name: dict.nav.portfolio, path: "/portfolio" },
          { name: caseStudyTitle, path: `/portfolio/${slug}` },
        ])}
      />
      <PremiumPageHero
        locale={locale}
        eyebrow={study.eyebrow}
        title={caseStudyTitle}
        description={caseStudyIntro}
        badges={dict.pages.portfolio.detailSections}
        actions={[{ href: "/start-project", label: dict.common.buildLikeThis }]}
      />
      <section className="container py-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {dict.pages.portfolio.detailSections.map((section) => (
            <article key={section} className="premium-card p-5">
              <h2 className="font-semibold text-primary">{section}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                {dict.pages.portfolio.detailNarrative}
              </p>
            </article>
          ))}
        </div>
      </section>
      <PremiumPageCta
        locale={locale}
        title={dict.home.finalCtaTitle}
        description={study.description}
        primaryAction={{
          href: "/start-project",
          label: dict.common.buildLikeThis,
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
