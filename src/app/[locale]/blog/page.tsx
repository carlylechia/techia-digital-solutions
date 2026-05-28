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
  return createMetadata({ locale, title: dict.pages.blog.metaTitle, description: dict.pages.blog.metaDescription, path: "/blog" });
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params; if (!isLocale(rawLocale)) notFound(); const locale = rawLocale as Locale; const dict = getDictionary(locale);
  return (
    <main>
      <PremiumPageHero
        locale={locale}
        eyebrow={dict.nav.blog}
        title={dict.pages.blog.title}
        description={dict.pages.blog.description}
        badges={dict.blog.slice(0, 4).map((item) => item.title)}
        actions={[{ href: "/start-project", label: dict.common.startProject }]}
      />
      <section className="container py-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{dict.blog.map((item) => <FeatureCard key={item.slug} item={item} locale={locale} hrefBase="blog" cta={dict.common.readMore} />)}</div>
      </section>
      <PremiumPageCta
        locale={locale}
        title={dict.home.finalCtaTitle}
        description={dict.pages.blog.description}
        primaryAction={{ href: "/start-project", label: dict.common.startProject }}
        secondaryAction={{ href: "/contact", label: dict.nav.contact }}
      />
    </main>
  );
}
