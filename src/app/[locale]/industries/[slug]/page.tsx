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
import { createMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    getDictionary(locale).industries.map((item) => ({
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
  const item = getDictionary(locale).industries.find(
    (industry) => industry.slug === slug,
  );
  const dict = getDictionary(locale);
  return createMetadata({
    locale,
    title: item ? `${item.title} — teChia` : `${dict.nav.industries} — teChia`,
    description: item?.description || dict.pages.industries.metaDescription,
    path: `/industries/${slug}`,
  });
}

export default async function IndustryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const industry = dict.industries.find((item) => item.slug === slug);
  if (!industry) notFound();
  return (
    <main>
      <PremiumPageHero
        locale={locale}
        eyebrow={dict.nav.industries}
        title={industry.title}
        description={industry.description}
        badges={dict.pages.industries.detailPillars}
        actions={[{ href: "/start-project", label: dict.common.startProject }]}
      />
      <section className="container pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {dict.pages.industries.detailPillars.map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-border bg-background p-5 text-muted"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
      <PremiumPageCta
        locale={locale}
        title={dict.home.finalCtaTitle}
        description={industry.description}
        primaryAction={{
          href: "/start-project",
          label: dict.common.startProject,
        }}
        secondaryAction={{
          href: getLocalizedSectionHref(
            locale,
            "/services",
            mergedPageAnchors.services.industries,
          ),
          label: dict.nav.industries,
        }}
      />
    </main>
  );
}
