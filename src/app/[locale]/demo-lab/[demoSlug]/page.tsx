import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Zap, ChevronRight } from "lucide-react";
import { getDictionary, isLocale, type Locale, getLocalizedHref } from "@/content/site";
import { demosData, getDemoBySlug, demoLabUi, DEMO_SLUGS } from "@/content/demo-lab";
import { createMetadata } from "@/lib/seo";
import { RelatedDemos } from "@/components/demos/related-demos";
import { DemoDetailCtaBar } from "./demo-detail-cta";

// Demo components
import { LogisticsQuoteDemo } from "@/components/demos/demos/logistics-quote-demo";
import { TravelDashboardDemo } from "@/components/demos/demos/travel-dashboard-demo";
import { BusinessDashboardDemo } from "@/components/demos/demos/business-dashboard-demo";
import { BookingSystemDemo } from "@/components/demos/demos/booking-system-demo";
import { AiDigitalAdvisorDemo } from "@/components/demos/demos/ai-digital-advisor-demo";

export function generateStaticParams() {
  const locales = ["en", "fr"];
  return locales.flatMap((locale) =>
    DEMO_SLUGS.map((demoSlug) => ({ locale, demoSlug }))
  );
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; demoSlug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, demoSlug } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const demo = getDemoBySlug(demoSlug);
  if (!demo) return {};
  return createMetadata({
    locale,
    title: `${demo.title[locale]} — teChia Demo Lab`,
    description: demo.description[locale],
    path: `/demo-lab/${demoSlug}`
  });
}

function DemoComponent({ slug, locale }: { slug: string; locale: Locale }) {
  switch (slug) {
    case "logistics-quote-generator":
      return <LogisticsQuoteDemo locale={locale} />;
    case "travel-consultancy-dashboard":
      return <TravelDashboardDemo locale={locale} />;
    case "business-management-dashboard":
      return <BusinessDashboardDemo locale={locale} />;
    case "booking-system":
      return <BookingSystemDemo locale={locale} />;
    case "ai-digital-advisor":
      return <AiDigitalAdvisorDemo locale={locale} />;
    default:
      return null;
  }
}

export default async function DemoDetailPage({
  params
}: {
  params: Promise<{ locale: string; demoSlug: string }>;
}) {
  const { locale: rawLocale, demoSlug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const demo = getDemoBySlug(demoSlug);
  if (!demo) notFound();

  const dict = getDictionary(locale);
  const ui = demoLabUi[locale];

  const relatedDemos = demosData.filter(
    (d) => demo.relatedSlugs.includes(d.slug) && d.slug !== demo.slug
  );

  return (
    <main className="pb-24">
      {/* Breadcrumb */}
      <div className="border-b border-border">
        <div className="container py-3">
          <nav className="flex flex-wrap items-center gap-1 text-xs text-muted" aria-label="Breadcrumb">
            <Link href={getLocalizedHref(locale, "")} className="hover:text-primary transition">
              {locale === "fr" ? "Accueil" : "Home"}
            </Link>
            <ChevronRight className="size-3 text-border" />
            <Link href={getLocalizedHref(locale, "demo-lab")} className="hover:text-primary transition">
              Demo Lab
            </Link>
            <ChevronRight className="size-3 text-border" />
            <span className="text-primary font-semibold truncate max-w-[200px]">{demo.shortTitle[locale]}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-background pointer-events-none" />
        <div className="container relative py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="eyebrow">{dict.sections.demoLab}</span>
            </div>
            <h1 className="headline-gradient text-3xl font-black leading-tight md:text-5xl">
              {demo.title[locale]}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted md:text-xl max-w-2xl">
              {demo.problem[locale]}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {demo.businessTypes[locale].slice(0, 4).map((bt) => (
                <span key={bt} className="trust-pill">{bt}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="container py-10 md:py-14">
        <div className="mb-6">
          <p className="eyebrow mb-2">{ui.tryDemo}</p>
          <h2 className="text-2xl font-bold text-primary md:text-3xl">{demo.shortTitle[locale]}</h2>
        </div>
        <div className="max-w-2xl">
          <DemoComponent slug={demo.slug} locale={locale} />
        </div>
      </section>

      {/* Modules */}
      <section className="border-t border-border">
        <div className="container py-10 md:py-14">
          <p className="eyebrow mb-2">{locale === "fr" ? "Modules inclus" : "Included Modules"}</p>
          <h2 className="mb-6 text-2xl font-bold text-primary md:text-3xl">
            {locale === "fr" ? "Ce que ce système comprend" : "What this system includes"}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {demo.modules[locale].map((mod) => (
              <li key={mod} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
                <Zap className="size-4 shrink-0 text-accent" />
                <span className="text-sm font-medium text-primary">{mod}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Business Value */}
      <section className="border-t border-border bg-surface/50">
        <div className="container py-10 md:py-14">
          <p className="eyebrow mb-2">{locale === "fr" ? "Valeur métier" : "Business Value"}</p>
          <h2 className="mb-6 text-2xl font-bold text-primary md:text-3xl">
            {locale === "fr" ? "Ce que ce système vous apporte" : "What this system does for you"}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {demo.businessValue[locale].map((val) => (
              <li key={val} className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" />
                <span className="text-sm leading-relaxed text-muted">{val}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Recommended Package */}
      <section className="border-t border-border">
        <div className="container py-10 md:py-14">
          <p className="eyebrow mb-2">{locale === "fr" ? "Package recommandé" : "Recommended Package"}</p>
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 max-w-2xl">
            <h3 className="text-xl font-bold text-primary mb-1">{demo.recommendedPackage[locale]}</h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">{demo.estimatedBuildType[locale]}</p>
            <a
              href={`/${locale}/pricing`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
            >
              {locale === "fr" ? "Voir les tarifs →" : "View pricing →"}
            </a>
          </div>
        </div>
      </section>

      {/* Related Demos */}
      {relatedDemos.length > 0 && (
        <section className="border-t border-border bg-surface/30">
          <div className="container py-10 md:py-14">
            <p className="eyebrow mb-2">{locale === "fr" ? "Autres démos" : "More Demos"}</p>
            <h2 className="mb-6 text-2xl font-bold text-primary">{locale === "fr" ? "Explorez d'autres systèmes" : "Explore other systems"}</h2>
            <RelatedDemos demos={relatedDemos} locale={locale} currentSlug={demo.slug} />
          </div>
        </section>
      )}

      {/* Sticky CTA bar */}
      <DemoDetailCtaBar demo={demo} locale={locale} />
    </main>
  );
}
