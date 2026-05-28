import type { Metadata } from "next";
import { FeatureCard } from "@/components/ui/feature-card";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import { AIConsultationSection } from "@/components/site/ai-consultation-section";
import { getDictionary, getLocalizedHref, isLocale, type Locale } from "@/content/site";
import { createMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params; const locale = isLocale(rawLocale) ? rawLocale : "en";
  const dict = getDictionary(locale);
  return createMetadata({ locale, title: dict.pages.services.metaTitle, description: dict.pages.services.metaDescription, path: "/services" });
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params; if (!isLocale(rawLocale)) notFound(); const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  return (
    <main>
      <PremiumPageHero
        locale={locale}
        eyebrow={dict.sections.services}
        title={dict.pages.services.title}
        description={dict.pages.services.description}
        badges={dict.services.slice(0, 4).map((item) => item.title)}
        actions={[{ href: "/start-project", label: dict.common.requestQuote }]}
      />
      <section className="container py-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">{dict.services.map((item) => <FeatureCard key={item.slug} item={item} locale={locale} hrefBase="services" cta={dict.common.learnMore} />)}</div>
      </section>
      <AIConsultationSection
        locale={locale}
        secondaryAction={{ href: getLocalizedHref(locale, "/start-project"), label: dict.common.startProject }}
      />
      <PremiumPageCta
        locale={locale}
        title={dict.home.finalCtaTitle}
        description={dict.pages.services.description}
        primaryAction={{ href: "/start-project", label: dict.common.requestQuote }}
        secondaryAction={{ href: "/contact", label: dict.nav.contact }}
      />
    </main>
  );
}
