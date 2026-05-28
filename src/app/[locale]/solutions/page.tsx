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
  return createMetadata({ locale, title: dict.pages.solutions.metaTitle, description: dict.pages.solutions.metaDescription, path: "/solutions" });
}

export default async function SolutionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params; if (!isLocale(rawLocale)) notFound(); const locale = rawLocale as Locale; const dict = getDictionary(locale);
  return (
    <main>
      <PremiumPageHero
        locale={locale}
        eyebrow={dict.sections.solutions}
        title={dict.pages.solutions.title}
        description={dict.pages.solutions.description}
        badges={dict.solutions.map((item) => item.title)}
        actions={[{ href: "/start-project", label: dict.common.startProject }]}
      />
      <section className="container py-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{dict.solutions.map((item) => <FeatureCard key={item.slug} item={item} locale={locale} cta={dict.common.learnMore} />)}</div>
      </section>
      <PremiumPageCta
        locale={locale}
        title={dict.home.finalCtaTitle}
        description={dict.pages.solutions.description}
        primaryAction={{ href: "/start-project", label: dict.common.startProject }}
        secondaryAction={{ href: "/contact", label: dict.nav.contact }}
      />
    </main>
  );
}
