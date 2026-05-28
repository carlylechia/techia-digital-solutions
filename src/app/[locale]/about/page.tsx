import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/ui/json-ld";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import { getDictionary, getLocalizedHref, isLocale, type Locale } from "@/content/site";
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params; const locale = isLocale(rawLocale) ? rawLocale : "en";
  const dict = getDictionary(locale);
  return createMetadata({ locale, title: dict.pages.about.metaTitle, description: dict.pages.about.metaDescription, path: "/about" });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params; if (!isLocale(rawLocale)) notFound(); const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  return (
    <main>
      <JsonLd data={breadcrumbJsonLd(locale, [{ name: dict.nav.home, path: "" }, { name: dict.nav.about, path: "/about" }])} />
      <PremiumPageHero
        locale={locale}
        eyebrow={dict.pages.about.eyebrow}
        title={dict.pages.about.title}
        description={dict.pages.about.description}
        badges={dict.pages.about.pillars}
        actions={[{ href: "/start-project", label: dict.common.startProject }]}
      />
      <section className="container py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {dict.pages.about.pillars.map((title, index) => (
            <article key={title} className="gradient-border rounded-[1.75rem]">
              <div className="elevated-panel h-full p-6">
            <p className="eyebrow mb-3">0{index + 1}</p>
            <h2 className="text-2xl font-semibold text-primary">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{[dict.home.digitalHomeBody, dict.home.problemBody, dict.home.europeBody][index]}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="container py-6">
        <div className="gradient-border rounded-[1.75rem]">
          <div className="elevated-panel p-8 md:p-10">
        <h2 className="text-3xl font-semibold text-primary">{dict.pages.about.beliefTitle}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {dict.pages.about.beliefs.map((item) => <div key={item} className="rounded-3xl border border-border bg-background p-5 text-muted">{item}</div>)}
        </div>
        <Link href={getLocalizedHref(locale, "/start-project")} className="btn-primary mt-8">{dict.common.startProject}</Link>
          </div>
        </div>
      </section>
      <PremiumPageCta
        locale={locale}
        eyebrow={dict.pages.home.finalCtaEyebrow}
        title={dict.home.finalCtaTitle}
        description={dict.home.finalCtaBody}
        primaryAction={{ href: "/start-project", label: dict.common.startProject }}
        secondaryAction={{ href: "/contact", label: dict.nav.contact }}
      />
    </main>
  );
}
