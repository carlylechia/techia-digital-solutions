import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeatureCard } from "@/components/ui/feature-card";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import { getDictionary, isLocale, locales, type Locale } from "@/content/site";
import { createMetadata } from "@/lib/seo";

export function generateStaticParams() { return locales.flatMap((locale) => getDictionary(locale).services.map((item) => ({ locale, slug: item.slug }))); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params; const locale = isLocale(rawLocale) ? rawLocale : "en"; const dict = getDictionary(locale); const item = dict.services.find((service) => service.slug === slug);
  return createMetadata({ locale, title: item ? `${item.title} — teChia` : `${dict.nav.services} — teChia`, description: item?.description || dict.pages.services.metaDescription, path: `/services/${slug}` });
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug } = await params; if (!isLocale(rawLocale)) notFound(); const locale = rawLocale as Locale; const dict = getDictionary(locale); const service = dict.services.find((item) => item.slug === slug); if (!service) notFound();
  return (
    <main>
      <PremiumPageHero
        locale={locale}
        eyebrow={dict.nav.services}
        title={service.title}
        description={service.description}
        badges={service.features || []}
        actions={[{ href: "/start-project", label: dict.common.requestQuote }]}
      />
      <section className="container py-6">
        <div className="grid gap-5 md:grid-cols-3">
          {dict.services.filter((item) => item.slug !== slug).slice(0, 3).map((item) => (
            <FeatureCard key={item.slug} item={item} locale={locale} hrefBase="services" cta={dict.common.learnMore} />
          ))}
        </div>
      </section>
      <PremiumPageCta
        locale={locale}
        title={dict.home.finalCtaTitle}
        description={service.description}
        primaryAction={{ href: "/start-project", label: dict.common.requestQuote }}
        secondaryAction={{ href: "/services", label: dict.nav.services }}
      />
    </main>
  );
}
