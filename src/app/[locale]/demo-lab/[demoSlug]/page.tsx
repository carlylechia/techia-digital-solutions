import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Zap, ChevronRight } from "lucide-react";
import { getDictionary, isLocale, type Locale, getLocalizedHref } from "@/content/site";
import { demosData, getDemoBySlug, demoLabUi, DEMO_SLUGS } from "@/content/demo-lab";
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui/json-ld";
import { RelatedDemos } from "@/components/demos/related-demos";
import { DemoDetailCtaBar } from "./demo-detail-cta";

// Demo components
import { LogisticsQuoteDemo } from "@/components/demos/demos/logistics-quote-demo";
import { TravelDashboardDemo } from "@/components/demos/demos/travel-dashboard-demo";
import { BusinessDashboardDemo } from "@/components/demos/demos/business-dashboard-demo";
import { BookingSystemDemo } from "@/components/demos/demos/booking-system-demo";
import { AiDigitalAdvisorDemo } from "@/components/demos/demos/ai-digital-advisor-demo";

export function generateStaticParams() {
  const locales = ["en", "fr"];
  return locales.flatMap((locale) =>
    DEMO_SLUGS.map((demoSlug) => ({ locale, demoSlug }))
  );
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; demoSlug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, demoSlug } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const demo = getDemoBySlug(demoSlug);
  if (!demo) return {};
  return createMetadata({
    locale,
    title: `${demo.title[locale]} — teChia Demo Lab`,
    description: demo.description[locale],
    path: `/demo-lab/${demoSlug}`
  });
}

function DemoComponent({ slug, locale }: { slug: string; locale: Locale }) {
  switch (slug) {
    case "logistics-quote-generator":
      return <LogisticsQuoteDemo locale={locale} />;
    case "travel-consultancy-dashboard":
      return <TravelDashboardDemo locale={locale} />;
    case "business-management-dashboard":
      return <BusinessDashboardDemo locale={locale} />;
    case "booking-system":
      return <BookingSystemDemo locale={locale} />;
    case "ai-digital-advisor":
      return <AiDigitalAdvisorDemo locale={locale} />;
    default:
      return null;
  }
}

export default async function DemoDetailPage({
  params
}: {
  params: Promise<{ locale: string; demoSlug: string }>;
}) {
  const { locale: rawLocale, demoSlug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const demo = getDemoBySlug(demoSlug);
  if (!demo) notFound();

  const dict = getDictionary(locale);
  const ui = demoLabUi[locale];

  const relatedDemos = demosData.filter(
    (d) => demo.relatedSlugs.includes(d.slug) && d.slug !== demo.slug
  );

  return (
    <main className="pb-24">
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: locale === "fr" ? "Accueil" : "Home", path: "" },
          { name: "Demo Lab", path: "/demo-lab" },
          { name: demo.shortTitle[locale], path: `/demo-lab/${demo.slug}` },
        ])}
      />
      <div className="border-b border-border">
        <div className="container py-3">
          <nav className="flex flex-wrap items-center gap-1 text-xs text-muted" aria-label="Breadcrumb">
            <Link href={getLocalizedHref(locale, "")} className="hover:text-primary transition">
              {locale === "fr" ? "Accueil" : "Home"}
            </Link>
            <ChevronRight className="size-3 text-border" />
            <Link href={getLocalizedHref(locale, "demo-lab")} className="hover:text-primary transition">
              Demo Lab
            </Link>
            <ChevronRight className="size-3 text-border" />
            <span className="text-primary font-semibold truncate max-w-[200px]">{demo.shortTitle[locale]}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-background pointer-events-none" />
        <div className="container relative py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="eyebrow">{dict.sections.demoLab}</span>
            </div>
            <h1 className="headline-gradient text-3xl font-black leading-tight md:text-5xl">
              {demo.title[locale]}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted md:text-xl max-w-2xl">
              {demo.problem[locale]}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {demo.businessTypes[locale].slice(0, 4).map((bt) => (
                <span key={bt} className="trust-pill">{bt}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="container py-10 md:py-14">
        <div className="mb-6">
          <p className="eyebrow mb-2">{ui.tryDemo}</p>
          <h2 className="text-2xl font-bold text-primary md:text-3xl">{demo.shortTitle[locale]}</h2>
        </div>
        <div className="max-w-2xl">
          <DemoComponent slug={demo.slug} locale={locale} />
        </div>
      </section>

      {/* Modules */}
      <section className="border-t border-border">
        <div className="container py-10 md:py-14">
          <p className="eyebrow mb-2">{locale === "fr" ? "Modules inclus" : "Included Modules"}</p>
          <h2 className="mb-6 text-2xl font-bold text-primary md:text-3xl">
            {locale === "fr" ? "Ce que ce système comprend" : "What this system includes"}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {demo.modules[locale].map((mod) => (
              <li key={mod} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
                <Zap className="size-4 shrink-0 text-accent" />
                <span className="text-sm font-medium text-primary">{mod}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Business Value */}
      <section className="border-t border-border bg-surface/50">
        <div className="container py-10 md:py-14">
          <p className="eyebrow mb-2">{locale === "fr" ? "Valeur métier" : "Business Value"}</p>
          <h2 className="mb-6 text-2xl font-bold text-primary md:text-3xl">
            {locale === "fr" ? "Ce que ce système vous apporte" : "What this system does for you"}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {demo.businessValue[locale].map((val) => (
              <li key={val} className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" />
                <span className="text-sm leading-relaxed text-muted">{val}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SME Architecture & Workflows */}
      <section className="border-t border-border bg-surface/30">
        <div className="container py-10 md:py-14">
          <p className="eyebrow mb-2">{locale === "fr" ? "Architecture et flux" : "Architecture and workflows"}</p>
          <h2 className="mb-6 text-2xl font-bold text-primary md:text-3xl">
            {locale === "fr" ? "Comment ce système fonctionne pour une PME" : "How this system works for an SME"}
          </h2>
          <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-muted md:text-base">
            {locale === "fr" ? (
              <>
                <p>
                  Ce système a été conçu pour aider une entreprise à passer d’un fonctionnement dispersé sur WhatsApp, papier et tableurs à un parcours digital clair, traçable et professionnel. Chaque étape du flux collecte les bonnes informations, les structure, puis les présente à l’équipe dans un format exploitable, afin que le temps perdu en allers-retours manuels soit transformé en suivi fiable.
                </p>
                <p>
                  L’architecture technique repose sur une interface moderne et responsive, une validation côté serveur, une gestion d’état cohérente et des notifications automatiques. Les données sont organisées par entité métier, ce qui permet de retrouver rapidement un client, une demande, un document ou un statut, et de préparer des rapports utiles à la prise de décision.
                </p>
                <p>
                  Pour une PME, la valeur réside dans la simplicité d’adoption : les équipes n’ont pas besoin d’une formation lourde, et les clients bénéficient d’un parcours clair, rassurant et professionnel. Le système peut ensuite évoluer vers des tableaux de bord, des automatisations, des portails clients ou des assistants IA selon la croissance réelle de l’entreprise.
                </p>
                <p>
                  teChia conçoit ces systèmes comme des outils de croissance et non comme de simples vitrines : ils améliorent la visibilité, la qualité du service, la rapidité de réponse et la capacité à gérer plus de demandes sans ajouter de charge manuelle. C’est cette approche qui rend la solution durable, crédible et réellement utile pour le quotidien de l’entreprise.
                </p>
              </>
            ) : (
              <>
                <p>
                  This system is designed to help a business move from scattered WhatsApp messages, paper notes, and spreadsheets to a clear, traceable, and professional digital workflow. Each step of the flow collects the right information, structures it, and presents it to the team in a usable format, so time lost to manual back-and-forth becomes reliable follow-up.
                </p>
                <p>
                  The technical architecture is built on a modern responsive interface, server-side validation, consistent state management, and automated notifications. Data is organized by business entity, making it easy to find a customer, a request, a document, or a status quickly, and to prepare useful reports for decision-making.
                </p>
                <p>
                  For an SME, the value comes from simple adoption: teams do not need heavy training, and customers benefit from a clear, reassuring, and professional journey. The system can then evolve toward dashboards, automation, client portals, or AI assistants as the business actually grows.
                </p>
                <p>
                  teChia designs these systems as growth tools rather than simple showcases: they improve visibility, service quality, response speed, and the ability to handle more requests without adding manual workload. This approach makes the solution durable, credible, and genuinely useful in the company’s day-to-day operations.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Recommended Package */}
      <section className="border-t border-border">
        <div className="container py-10 md:py-14">
          <p className="eyebrow mb-2">{locale === "fr" ? "Package recommandé" : "Recommended Package"}</p>
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 max-w-2xl">
            <h3 className="text-xl font-bold text-primary mb-1">{demo.recommendedPackage[locale]}</h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">{demo.estimatedBuildType[locale]}</p>
            <Link
              href="/pricing"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
            >
              {locale === "fr" ? "Voir les tarifs →" : "View pricing →"}
            </Link>
          </div>
        </div>
      </section>

      {/* Related Demos */}
      {relatedDemos.length > 0 && (
        <section className="border-t border-border bg-surface/30">
          <div className="container py-10 md:py-14">
            <p className="eyebrow mb-2">{locale === "fr" ? "Autres démos" : "More Demos"}</p>
            <h2 className="mb-6 text-2xl font-bold text-primary">{locale === "fr" ? "Explorez d'autres systèmes" : "Explore other systems"}</h2>
            <RelatedDemos demos={relatedDemos} locale={locale} currentSlug={demo.slug} />
          </div>
        </section>
      )}

      {/* Sticky CTA bar */}
      <DemoDetailCtaBar demo={demo} locale={locale} />
    </main>
  );
}
