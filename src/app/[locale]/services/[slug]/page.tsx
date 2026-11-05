import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomFitWorkflowSection } from "@/components/sections/custom-fit-workflow-section";
import { FeatureCard } from "@/components/ui/feature-card";
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
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui/json-ld";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    getDictionary(locale).services.map((item) => ({ locale, slug: item.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const dict = getDictionary(locale);
  const item = dict.services.find((service) => service.slug === slug);
  const title =
    slug === "seo"
      ? "Expert SEO Services in Cameroon | teChia Digital Solutions"
      : item
        ? `${item.title} — teChia`
        : `${dict.nav.services} — teChia`;
  return createMetadata({
    locale,
    title,
    description: item?.description || dict.pages.services.metaDescription,
    path: `/services/${slug}`,
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const service = dict.services.find((item) => item.slug === slug);
  if (!service) notFound();
  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: locale === "fr" ? "Accueil" : "Home", path: "" },
          { name: dict.nav.services, path: "/services" },
          { name: service.title, path: `/services/${slug}` },
        ])}
      />
      <PremiumPageHero
        locale={locale}
        eyebrow={dict.nav.services}
        title={service.title}
        description={service.description}
        badges={service.features || []}
        actions={[
          { href: "/start-project", label: dict.common.requestQuote },
          {
            href: "/ai-consultant",
            label: dict.nav.aiConsultant,
            variant: "secondary",
          },
        ]}
      />
      <section className="container py-8">
        <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-muted md:text-base">
          {locale === "fr" ? (
            <>
              <p>
                Ce service teChia est conçu pour aider les entreprises à clarifier leur positionnement, attirer des prospects qualifiés et transformer l’attention en opportunités commerciales. Plutôt que de proposer une solution générique, nous alignons la stratégie, le message, l’expérience utilisateur et les outils techniques avec les objectifs réels de l’entreprise.
              </p>
              <p>
                L’approche combine audit, recommandations, mise en œuvre et accompagnement. Les livrables sont pensés pour être utiles immédiatement : meilleure visibilité, parcours client plus clair, contenus mieux structurés, automatisations ciblées et données exploitables pour piloter la croissance.
              </p>
              <p>
                Pour une PME ou une organisation en croissance, ce type de service réduit la dépendance aux actions manuelles et aux messages dispersés. Il crée une base digitale crédible, mesurable et évolutive, capable de soutenir aussi bien la conquête de nouveaux clients que la fidélisation et l’organisation interne.
              </p>
            </>
          ) : (
            <>
              <p>
                This teChia service is designed to help businesses clarify their positioning, attract qualified prospects, and turn attention into commercial opportunities. Rather than offering a generic solution, we align strategy, messaging, user experience, and technical tools with the company’s real growth objectives.
              </p>
              <p>
                The approach combines audit, recommendations, implementation, and follow-up. Deliverables are built to be useful immediately: stronger visibility, clearer customer journeys, better-structured content, targeted automation, and actionable data to steer growth.
              </p>
              <p>
                For an SME or growing organization, this kind of service reduces dependence on manual actions and scattered messages. It creates a credible, measurable, and scalable digital foundation that supports both new customer acquisition and long-term retention and internal organization.
              </p>
            </>
          )}
        </div>
      </section>
      <CustomFitWorkflowSection locale={locale} className="py-8 md:py-12" />
      <section className="container py-6">
        <div className="grid gap-5 md:grid-cols-3">
          {dict.services
            .filter((item) => item.slug !== slug)
            .slice(0, 3)
            .map((item) => (
              <FeatureCard
                key={item.slug}
                item={item}
                locale={locale}
                hrefBase="services"
                cta={dict.common.learnMore}
              />
            ))}
        </div>
      </section>
      <PremiumPageCta
        locale={locale}
        title={dict.home.finalCtaTitle}
        description={service.description}
        primaryAction={{
          href: "/start-project",
          label: dict.common.requestQuote,
        }}
        secondaryAction={{
          href: getLocalizedSectionHref(
            locale,
            "/services",
            mergedPageAnchors.services.catalog,
          ),
          label: dict.nav.services,
        }}
      />
    </main>
  );
}
