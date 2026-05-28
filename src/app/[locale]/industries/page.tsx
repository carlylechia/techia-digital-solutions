import type { Metadata } from "next";
import { FeatureCard } from "@/components/ui/feature-card";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import { getDictionary, isLocale, type Locale } from "@/content/site";
import { createMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params; const locale = isLocale(rawLocale) ? rawLocale : "en";
  const dict = getDictionary(locale);
  return createMetadata({ locale, title: dict.pages.industries.metaTitle, description: dict.pages.industries.metaDescription, path: "/industries" });
}

export default async function IndustriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params; if (!isLocale(rawLocale)) notFound(); const locale = rawLocale as Locale; const dict = getDictionary(locale);
  return (
    <main>
      <PremiumPageHero
        locale={locale}
        eyebrow={dict.sections.industries}
        title={dict.pages.industries.title}
        description={dict.pages.industries.description}
        badges={dict.pages.industries.detailPillars}
        actions={[{ href: "/start-project", label: dict.common.startProject }]}
      />
      <section className="container py-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">{dict.industries.map((item) => <FeatureCard key={item.slug} item={item} locale={locale} hrefBase="industries" cta={dict.common.learnMore} />)}</div>
      </section>
      <PremiumPageCta
        locale={locale}
        title={dict.home.finalCtaTitle}
        description={dict.pages.industries.description}
        primaryAction={{ href: "/start-project", label: dict.common.startProject }}
        secondaryAction={{ href: "/contact", label: dict.nav.contact }}
      />
    </main>
  );
}
