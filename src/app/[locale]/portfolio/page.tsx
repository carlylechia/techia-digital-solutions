import type { Metadata } from "next";
import { FeatureCard } from "@/components/ui/feature-card";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import { getDictionary, isLocale, type Locale } from "@/content/site";
import { loadPortfolioCards, loadPortfolioFeedback } from "@/lib/public-showcase";
import { createMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params; const locale = isLocale(rawLocale) ? rawLocale : "en";
  const dict = getDictionary(locale);
  return createMetadata({ locale, title: dict.pages.portfolio.metaTitle, description: dict.pages.portfolio.metaDescription, path: "/portfolio" });
}

export default async function PortfolioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params; if (!isLocale(rawLocale)) notFound(); const locale = rawLocale as Locale; const dict = getDictionary(locale);
  const [caseStudies, feedback] = await Promise.all([loadPortfolioCards(locale), loadPortfolioFeedback(locale)]);
  return (
    <main>
      <PremiumPageHero
        locale={locale}
        eyebrow={dict.sections.caseStudies}
        title={dict.pages.portfolio.title}
        description={dict.pages.portfolio.description}
        badges={caseStudies.slice(0, 4).map((item) => item.eyebrow || item.title)}
        actions={[{ href: "/start-project", label: dict.common.buildLikeThis }]}
      />
      <section className="container py-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{caseStudies.map((item) => <FeatureCard key={item.slug} item={item} locale={locale} hrefBase="portfolio" cta={dict.common.viewCaseStudy} />)}</div>
      </section>
      {feedback.length ? (
        <section className="container pb-12">
          <div className="grid gap-4 md:grid-cols-2">
            {feedback.map((item) => (
              <article key={item.id} className="premium-card p-5">
                {item.rating ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-2">{"★".repeat(item.rating)}</p> : null}
                <p className="mt-2 text-sm leading-7 text-primary">&ldquo;{item.quote}&rdquo;</p>
                <p className="mt-3 text-xs text-muted">{item.name}{item.role || item.company ? ` · ${[item.role, item.company].filter(Boolean).join(" · ")}` : ""}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <PremiumPageCta
        locale={locale}
        title={dict.home.finalCtaTitle}
        description={dict.pages.portfolio.description}
        primaryAction={{ href: "/start-project", label: dict.common.buildLikeThis }}
        secondaryAction={{ href: "/contact", label: dict.nav.contact }}
      />
    </main>
  );
}
