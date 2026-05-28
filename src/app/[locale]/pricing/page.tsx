import type { Metadata } from "next";
import Link from "next/link";
import { FeatureCard } from "@/components/ui/feature-card";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import { getDictionary, getLocalizedHref, isLocale, type Locale } from "@/content/site";
import { createMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params; const locale = isLocale(rawLocale) ? rawLocale : "en";
  const dict = getDictionary(locale);
  return createMetadata({ locale, title: dict.pages.pricing.metaTitle, description: dict.pages.pricing.metaDescription, path: "/pricing" });
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params; if (!isLocale(rawLocale)) notFound(); const locale = rawLocale as Locale; const dict = getDictionary(locale);
  return (
    <main>
      <PremiumPageHero
        locale={locale}
        eyebrow={dict.sections.pricing}
        title={dict.pages.pricing.title}
        description={dict.pages.pricing.description}
        badges={dict.pricing.map((item) => item.badge || item.title)}
        actions={[{ href: "/start-project", label: dict.common.requestQuote }]}
      />
      <section className="container py-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">{dict.pricing.map((item) => <FeatureCard key={item.slug} item={item} locale={locale} href="/start-project" cta={item.cta || dict.common.requestQuote} />)}</div>
      </section>
      <section className="container py-6">
        <div className="gradient-border rounded-[1.75rem]">
          <div className="elevated-panel p-8">
            <h2 className="text-3xl font-semibold text-primary">{dict.pages.pricing.addOnsTitle}</h2>
            <div className="mt-5 flex flex-wrap gap-2">{dict.pages.pricing.addOns.map((item) => <span key={item} className="trust-pill">{item}</span>)}</div>
            <Link href={getLocalizedHref(locale, "/start-project")} className="btn-primary mt-8" data-event="pricing_cta_click">{dict.common.requestQuote}</Link>
          </div>
        </div>
      </section>
      <PremiumPageCta
        locale={locale}
        title={dict.home.finalCtaTitle}
        description={dict.pages.pricing.description}
        primaryAction={{ href: "/start-project", label: dict.common.requestQuote }}
        secondaryAction={{ href: "/contact", label: dict.nav.contact }}
      />
    </main>
  );
}
