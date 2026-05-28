import type { Metadata } from "next";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import { getDictionary, isLocale, type Locale } from "@/content/site";
import { demosData, demoLabUi } from "@/content/demo-lab";
import { createMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { DemoCard } from "@/components/demos/demo-card";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params; const locale = isLocale(rawLocale) ? rawLocale : "en";
  const dict = getDictionary(locale);
  return createMetadata({ locale, title: dict.pages.demoLab.metaTitle, description: dict.pages.demoLab.metaDescription, path: "/demo-lab" });
}

export default async function DemoLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params; if (!isLocale(rawLocale)) notFound(); const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const ui = demoLabUi[locale];

  return (
    <main>
      <PremiumPageHero
        locale={locale}
        eyebrow={dict.sections.demoLab}
        title={ui.indexTitle}
        description={ui.indexDescription}
        badges={demosData.map((d) => d.shortTitle[locale])}
        actions={[
          { href: "/demo-lab/ai-digital-advisor", label: locale === "fr" ? "Trouver mon système" : "Find My System", variant: "primary" },
          { href: "/start-project", label: dict.common.startProject, variant: "secondary" }
        ]}
      />
      <section className="container py-12 md:py-16">
        <h2 className="headline-gradient mb-2 text-3xl font-black md:text-4xl lg:text-5xl">
          {ui.indexHeadline}
        </h2>
        <p className="mb-10 max-w-2xl text-base text-muted md:text-lg">{ui.indexDescription}</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {demosData.map((demo) => (
            <DemoCard key={demo.slug} demo={demo} locale={locale} />
          ))}
        </div>
      </section>
      <PremiumPageCta
        locale={locale}
        title={dict.home.finalCtaTitle}
        description={dict.pages.demoLab.description}
        primaryAction={{ href: "/start-project", label: dict.common.startProject }}
        secondaryAction={{ href: "/contact", label: dict.nav.contact }}
      />
    </main>
  );
}
