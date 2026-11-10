import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AIConsultationSection } from "@/components/site/ai-consultation-section";
import { ProcessTimeline } from "@/components/site/process-timeline";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import { getDictionary, getLocalizedHref, isLocale, type Locale } from "@/content/site";
import { createMetadata } from "@/lib/seo";

const processPageCopy = {
  en: {
    metaTitle: "Process — teChia Digital Solutions",
    metaDescription: "See how teChia moves from business discovery to premium delivery, launch, and ongoing optimization.",
    title: "A premium process from business clarity to launch-ready execution.",
    description: "We stay close to the business problem, reduce avoidable complexity, and build toward something that feels trustworthy on day one.",
    detailsTitle: "How teChia turns a business goal into delivery",
    details: [
      "Every teChia engagement starts by understanding the business goal, the customer journey, and the operational constraints behind the request. We clarify what is blocking growth, which channels matter most, and which systems need to change before any design or development begins.",
      "We then shape a practical mix of marketing, branding, website, automation, AI, or software work. The aim is not to add technology for its own sake, but to choose the smallest useful system that improves visibility, trust, lead capture, and internal execution.",
      "Delivery is structured around secure modern tools, clear milestones, SEO, analytics, and conversion tracking. After launch, teChia continues to refine messaging, workflows, and performance as the business learns from real customers and real operations.",
    ],
  },
  fr: {
    metaTitle: "Processus — teChia Digital Solutions",
    metaDescription: "Découvrez comment teChia passe de la découverte métier à la livraison premium, au lancement et à l’optimisation continue.",
    title: "Un processus premium, de la clarté métier à une exécution prête au lancement.",
    description: "Nous restons proches du vrai problème métier, réduisons la complexité évitable et construisons quelque chose de crédible dès le premier jour.",
    detailsTitle: "Comment teChia transforme un objectif business en livraison",
    details: [
      "Chaque accompagnement teChia commence par la compréhension de l’objectif business, du parcours client et des contraintes opérationnelles derrière la demande. Nous clarifions ce qui freine la croissance, les canaux qui comptent et les systèmes à faire évoluer avant tout design ou développement.",
      "Nous définissons ensuite un mélange pratique de marketing, branding, site web, automatisation, IA ou logiciel. L’objectif n’est pas d’ajouter de la technologie pour elle-même, mais de choisir le système le plus utile pour améliorer la visibilité, la confiance, la capture de prospects et l’exécution interne.",
      "La livraison s’appuie sur des outils modernes et sécurisés, des jalons clairs, le SEO, l’analytics et le suivi des conversions. Après le lancement, teChia continue d’affiner le message, les workflows et la performance selon les retours réels des clients et des opérations.",
    ],
  }
} as const satisfies Record<Locale, { metaTitle: string; metaDescription: string; title: string; description: string; detailsTitle: string; details: string[] }>;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const copy = processPageCopy[locale];
  return createMetadata({ locale, title: copy.metaTitle, description: copy.metaDescription, path: "/process" });
}

export default async function ProcessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const copy = processPageCopy[locale];

  return (
    <main>
      <PremiumPageHero
        locale={locale}
        eyebrow={dict.sections.method}
        title={copy.title}
        description={copy.description}
        badges={dict.method}
      />
      <section className="container py-6">
        <ProcessTimeline steps={dict.method} />
      </section>
      <section className="container py-6">
        <div className="gradient-border rounded-[1.75rem]">
          <div className="elevated-panel p-6 sm:p-8">
            <h2 className="text-3xl font-semibold text-primary">{copy.detailsTitle}</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-muted md:text-base">
              {copy.details.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="container py-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {dict.method.map((step, index) => (
            <div key={step} className="subtle-tile-strong rounded-[1.4rem] p-5">
              <p className="eyebrow">0{index + 1}</p>
              <h2 className="mt-3 text-lg font-semibold text-primary">{step}</h2>
            </div>
          ))}
        </div>
      </section>
      <AIConsultationSection
        locale={locale}
        secondaryAction={{ href: getLocalizedHref(locale, "/start-project"), label: dict.common.startProject }}
      />
      <PremiumPageCta
        locale={locale}
        title={dict.home.finalCtaTitle}
        description={dict.home.finalCtaBody}
        primaryAction={{ href: "/start-project", label: dict.common.startProject }}
        secondaryAction={{ href: "/contact", label: dict.nav.contact }}
      />
    </main>
  );
}
