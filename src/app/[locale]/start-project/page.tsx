import type { Metadata } from "next";
import { QuoteForm } from "@/components/site/forms";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import { getDictionary, isLocale, type Locale } from "@/content/site";
import { createMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale: rawLocale } = await params; const locale = isLocale(rawLocale) ? rawLocale : "en"; const dict = getDictionary(locale); return createMetadata({ locale, title: dict.pages.startProject.metaTitle, description: dict.pages.startProject.metaDescription, path: "/start-project" }); }
export default async function StartProjectPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);

  return (
    <main>
      <PremiumPageHero
        locale={locale}
        eyebrow={dict.nav.startProject}
        title={dict.pages.startProject.title}
        description={dict.pages.startProject.description}
        badges={[dict.sections.services, dict.sections.solutions, dict.sections.pricing]}
        actions={[
          { href: "/contact", label: dict.nav.contact, variant: "secondary" }
        ]}
        aside={
          <div className="grid gap-4">
            {[
              dict.home.problemTitle,
              dict.home.digitalHomeTitle,
              dict.home.europeTitle
            ].map((item) => (
              <div key={item} className="subtle-tile-strong rounded-[1.4rem] p-5 text-sm leading-7 text-muted">
                {item}
              </div>
            ))}
          </div>
        }
      />

      <section className="container pb-20">
        <QuoteForm locale={locale} />
      </section>

      <PremiumPageCta
        locale={locale}
        title={dict.home.finalCtaTitle}
        description={dict.pages.startProject.description}
        primaryAction={{ href: "/contact", label: dict.nav.contact }}
        secondaryAction={{ href: "/portfolio", label: dict.nav.portfolio }}
      />
    </main>
  );
}
