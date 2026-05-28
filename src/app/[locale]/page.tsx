import type { Metadata } from "next";
import {
  BadgeCheck,
  Cloud,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { DigitalizationSimulator } from "@/components/sections/digitalization-simulator";
import { CustomerFeedbackForm } from "@/components/forms/customer-feedback-form";
import { HeroSection } from "@/components/sections/HeroSection";
import { AIConsultationSection } from "@/components/site/ai-consultation-section";
import { AnimatedGridBackground } from "@/components/site/animated-grid-background";
import { InfiniteMarquee } from "@/components/site/infinite-marquee";
import { PageDirectorySection } from "@/components/site/page-directory-section";
import { DemoGrid } from "@/components/demos/demo-grid";
import { FeatureCard } from "@/components/ui/feature-card";
import { JsonLd } from "@/components/ui/json-ld";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { SectionHeading } from "@/components/ui/section-heading";
import { SwipeDotsCarousel } from "@/components/ui/swipe-dots-carousel";
import {
  getDictionary,
  getLocalizedHref,
  getLocalizedSectionHref,
  isLocale,
  mergedPageAnchors,
  type Locale,
} from "@/content/site";
import {
  loadHomepageFeedback,
  loadHomepageProjectCards,
  loadPortfolioCards,
} from "@/lib/public-showcase";
import { createMetadata, organizationJsonLd } from "@/lib/seo";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const dict = getDictionary(locale);
  return createMetadata({
    locale,
    title: dict.meta.title,
    description: dict.meta.description,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const [homepageProjects, portfolioProjects, homepageFeedback] =
    await Promise.all([
      loadHomepageProjectCards(locale),
      loadPortfolioCards(locale),
      loadHomepageFeedback(locale),
    ]);
  const marqueePrimary = [
    ...dict.hero.trust,
    ...dict.stack.slice(0, 4),
    ...dict.method.slice(0, 3),
  ];
  const marqueeSecondary = [
    ...dict.services.slice(0, 4).map((item) => item.title),
    ...dict.industries.slice(0, 4).map((item) => item.title),
    ...dict.demos.slice(0, 3),
  ];
  const credibilitySuites =
    locale === "fr"
      ? [
          {
            icon: Cloud,
            title: "Cloud & déploiement",
            description:
              "Une couche de livraison fiable pour les sites, portails, tableaux de bord et actifs médias.",
            items: ["Vercel", "Cloudflare", "AWS S3", "PostgreSQL"],
          },
          {
            icon: Sparkles,
            title: "IA & automatisation",
            description:
              "Des assistants, des couches intelligentes et des workflows orientés métier plutôt qu’un simple effet de mode.",
            items: ["OpenAI API", "pgvector", "Auth.js", "Resend"],
          },
          {
            icon: Search,
            title: "SEO & visibilité",
            description:
              "Une structure pensée pour l’indexation, la mesure et la crédibilité sur les marchés exigeants.",
            items: [
              "GA4",
              "Google Search Console",
              "Schema.org",
              "Core Web Vitals",
            ],
          },
        ]
      : [
          {
            icon: Cloud,
            title: "Cloud delivery",
            description:
              "A reliable delivery layer for websites, portals, dashboards, and media-heavy digital assets.",
            items: ["Vercel", "Cloudflare", "AWS S3", "PostgreSQL"],
          },
          {
            icon: Sparkles,
            title: "AI and automation",
            description:
              "Assistants, smart layers, and business-facing workflows instead of AI theatre for its own sake.",
            items: ["OpenAI API", "pgvector", "Auth.js", "Resend"],
          },
          {
            icon: Search,
            title: "SEO and discoverability",
            description:
              "An indexability, measurement, and trust layer shaped for search-conscious clients and markets.",
            items: [
              "GA4",
              "Google Search Console",
              "Schema.org",
              "Core Web Vitals",
            ],
          },
        ];
  const socialProofCopy =
    locale === "fr"
      ? {
          testimonialsTitle:
            "Des témoignages clients qui renforcent la crédibilité avant même le premier appel.",
          testimonialsDescription:
            "Une sélection administrée de retours mis en avant pour la page d’accueil, avec la liberté de les activer ensuite pour le portfolio ou la page fondateur.",
          feedbackEyebrow: "Canal de retour",
          feedbackTitle: "Partager un retour dans un flux structuré et modéré.",
          feedbackDescription:
            "Le formulaire de retour suit la même logique que le reste du site : clair, sérieux, multilingue et prêt pour une revue avant publication.",
          feedbackScript: "un signal venu de vraies collaborations",
          feedbackHighlights: [
            "Lier le retour à un projet précis si nécessaire",
            "Ajouter une note, un rôle et un contexte entreprise",
            "Faire relire le témoignage avant publication",
          ],
        }
      : {
          testimonialsTitle:
            "Client testimonials that strengthen trust before the first call even happens.",
          testimonialsDescription:
            "A curated, admin-managed testimonial library powers this homepage and can be featured across the portfolio and founder experience when needed.",
          feedbackEyebrow: "Feedback channel",
          feedbackTitle: "Share feedback through a structured, moderated flow.",
          feedbackDescription:
            "The feedback form follows the same standard as the rest of the site: clear, serious, multilingual, and ready for review before anything is published.",
          feedbackScript: "signal from real collaborations",
          feedbackHighlights: [
            "Attach the feedback to a specific project when relevant",
            "Include rating, role, and business context",
            "Review strong quotes before they go live",
          ],
        };
  const testimonialItems = homepageFeedback.map((item) => ({
    id: item.id,
    quote: item.quote,
    name: item.name,
    roleLine: [item.role, item.company].filter(Boolean).join(" · "),
    rating: item.rating,
    source: item.source,
  }));
  const testimonialDotLabels = testimonialItems.map((_, index) =>
    locale === "fr"
      ? `Voir le témoignage ${index + 1}`
      : `View testimonial ${index + 1}`,
  );
  const projectOptions = portfolioProjects
    .slice(0, 8)
    .map((item) => ({ slug: item.slug, name: item.title }));
  const signatureSuites =
    locale === "fr"
      ? [
          {
            title: "Présence signature",
            description:
              "Des expériences premium qui transforment la première impression en confiance durable.",
            items: dict.services.slice(0, 3).map((item) => item.title),
          },
          {
            title: "Systèmes intelligents",
            description:
              "Une architecture pensée pour les tableaux de bord, l’automatisation et la visibilité métier.",
            items: dict.stack.slice(0, 4),
          },
          {
            title: "Confiance globale",
            description:
              "Des signaux de sérieux visibles sur tous les écrans, pour les marchés locaux et internationaux.",
            items: dict.securityPromise.slice(0, 3),
          },
        ]
      : [
          {
            title: "Signature presence",
            description:
              "Premium experiences that turn first impressions into durable trust.",
            items: dict.services.slice(0, 3).map((item) => item.title),
          },
          {
            title: "System intelligence",
            description:
              "Architecture designed for dashboards, automation, and operational visibility.",
            items: dict.stack.slice(0, 4),
          },
          {
            title: "Global trust signals",
            description:
              "Confidence cues built for local markets and international buyers alike.",
            items: dict.securityPromise.slice(0, 3),
          },
        ];
  const pageDirectoryItems = [
    {
      title: dict.nav.about,
      description:
        locale === "fr"
          ? "Positionnement, équipe, fondateur, croyances produit et portfolio réunis dans un même parcours."
          : "Positioning, team capability, founder context, and portfolio proof brought into one page.",
      href: getLocalizedSectionHref(
        locale,
        "/about",
        mergedPageAnchors.about.overview,
      ),
      eyebrow: locale === "fr" ? "Vision" : "Vision",
      tags: [
        dict.nav.founder,
        dict.nav.portfolio,
        ...dict.pages.about.pillars,
      ].slice(0, 3),
    },
    {
      title: dict.nav.founder,
      description:
        locale === "fr"
          ? "Une page fondateur immersive sur l’exécution, la crédibilité, les recommandations et la réflexion produit."
          : "An immersive founder story covering execution, credibility, recommendations, and product thinking.",
      href: getLocalizedHref(locale, "/founder"),
      eyebrow: locale === "fr" ? "Fondateur" : "Founder",
      tags: [dict.nav.portfolio, dict.nav.contact],
    },
    {
      title: dict.nav.services,
      description:
        locale === "fr"
          ? "Services, modules de solution et applications sectorielles dans une seule lecture structurée."
          : "Services, solution modules, and industry applications in one structured reading flow.",
      href: getLocalizedSectionHref(
        locale,
        "/services",
        mergedPageAnchors.services.overview,
      ),
      eyebrow: locale === "fr" ? "Offres" : "Offers",
      tags: [
        dict.services[0]?.title,
        dict.solutions[0]?.title,
        dict.industries[0]?.title,
      ].filter(Boolean),
    },
    {
      title: dict.nav.demoLab,
      description: dict.pages.demoLab.description,
      href: getLocalizedHref(locale, "/demo-lab"),
      eyebrow: locale === "fr" ? "Interactif" : "Interactive",
      tags: dict.demos.slice(0, 3),
    },
    {
      title: dict.nav.pricing,
      description: dict.pages.pricing.description,
      href: getLocalizedHref(locale, "/pricing"),
      eyebrow: locale === "fr" ? "Commercial" : "Commercial",
      tags: dict.pages.pricing.addOns.slice(0, 3),
    },
    {
      title: dict.nav.blog,
      description: dict.pages.blog.description,
      href: getLocalizedHref(locale, "/blog"),
      eyebrow: locale === "fr" ? "Insights" : "Insights",
      tags: [dict.pages.blog.keyIdeaTitle, dict.pages.blog.nextStepTitle],
    },
    {
      title: dict.nav.contact,
      description: dict.pages.contact.description,
      href: getLocalizedHref(locale, "/contact"),
      eyebrow: locale === "fr" ? "Connexion" : "Connect",
      tags: [
        dict.pages.contact.emailLabel,
        dict.pages.contact.whatsappLabel,
        dict.pages.contact.callLabel,
      ],
    },
    {
      title: locale === "fr" ? "Processus" : "Process",
      description:
        locale === "fr"
          ? "La carte complète de la découverte à l’optimisation, avec les étapes et le rythme de livraison."
          : "The full delivery map from discovery to optimization, with steps and execution rhythm.",
      href: getLocalizedHref(locale, "/process"),
      eyebrow: locale === "fr" ? "Méthode" : "Method",
      tags: dict.method.slice(0, 3),
    },
    {
      title: dict.nav.startProject,
      description: dict.pages.startProject.description,
      href: getLocalizedHref(locale, "/start-project"),
      eyebrow: locale === "fr" ? "Démarrage" : "Kickoff",
      tags: [
        dict.sections.services,
        dict.sections.solutions,
        dict.sections.pricing,
      ],
    },
    {
      title: dict.nav.clientPortal,
      description:
        locale === "fr"
          ? "Prévisualisez l’espace client pour les projets, fichiers, messages et factures."
          : "Preview the client workspace for projects, files, messages, and invoices.",
      href: "/client-portal",
      eyebrow: locale === "fr" ? "Portail" : "Portal",
      tags:
        locale === "fr"
          ? ["Projets", "Fichiers", "Factures"]
          : ["Projects", "Files", "Invoices"],
    },
    {
      title: dict.nav.aiConsultant,
      description:
        locale === "fr"
          ? "Discutez avec l’agent IA teChia pour identifier le bon site, système, automatisation ou direction IA avant d’engager un projet."
          : "Chat with the teChia AI Growth Agent to map the right website, system, automation, or AI direction before you commit.",
      href: getLocalizedHref(locale, "/ai-consultant"),
      eyebrow: locale === "fr" ? "IA" : "AI",
      tags:
        locale === "fr"
          ? ["Chat", "Brief", "Recommandation"]
          : ["Chat", "Brief", "Recommendation"],
    },
    {
      title: locale === "fr" ? "Mentions & politiques" : "Legal & policies",
      description:
        locale === "fr"
          ? "Accédez aux pages de confidentialité, conditions d’utilisation et cookies depuis une entrée unique."
          : "Reach the privacy, terms, and cookies pages through one trust-and-compliance destination.",
      href: getLocalizedHref(locale, "/privacy"),
      eyebrow: locale === "fr" ? "Confiance" : "Trust",
      tags: [dict.legal.privacy, dict.legal.terms, dict.legal.cookies],
    },
  ];

  return (
    <main id="main-content">
      <JsonLd data={organizationJsonLd(locale)} />
      <HeroSection locale={locale} />

      <section id="homepage-trust-strip" className="container pb-6">
        <div className="gradient-border rounded-[1.75rem]">
          <div className="surface-panel relative overflow-hidden px-5 py-5 md:px-8">
            <AnimatedGridBackground />
            <div className="relative z-10 flex flex-wrap gap-3">
              {dict.hero.trust.map((item) => (
                <span key={item} className="trust-pill">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container py-10">
        <div className="gradient-border rounded-[2rem]">
          <div className="surface-panel relative overflow-hidden p-5 md:p-6">
            <AnimatedGridBackground className="opacity-60" />
            <div className="relative z-10">
              <p className="font-script text-3xl text-accent-3 md:text-4xl">
                {locale === "fr"
                  ? "un mouvement sans fin"
                  : "an infinite rhythm of capability"}
              </p>
              <p className="eyebrow mt-3">{dict.pages.home.servicesTitle}</p>
              <div className="mt-5 space-y-4">
                <InfiniteMarquee items={marqueePrimary} />
                <InfiniteMarquee
                  items={marqueeSecondary}
                  direction="right"
                  speed="36s"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="gradient-border rounded-[1.75rem]">
            <div className="elevated-panel h-full p-7 md:p-8">
              <p className="eyebrow">{dict.pages.home.realityEyebrow}</p>
              <h2 className="mt-4 text-balance text-3xl font-semibold text-foreground md:text-5xl">
                {dict.home.problemTitle}
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted">
                {dict.home.problemBody}
              </p>
            </div>
          </div>
          <div className="gradient-border rounded-[1.75rem]">
            <div className="elevated-panel h-full p-7 md:p-8">
              <p className="eyebrow">{dict.pages.home.servicesTitle}</p>
              <h2 className="mt-4 text-balance text-3xl font-semibold text-foreground md:text-5xl">
                {dict.home.digitalHomeTitle}
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted">
                {dict.home.digitalHomeBody}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <SectionHeading
          title={dict.home.digitalHomeTitle}
          description={dict.home.digitalHomeBody}
        />
        <div className="grid gap-5 md:grid-cols-3">
          {dict.solutions.slice(0, 6).map((item) => (
            <FeatureCard
              key={item.slug}
              item={item}
              locale={locale}
              hrefBase="solutions"
              cta={dict.common.learnMore}
            />
          ))}
        </div>
      </section>

      <section className="container py-16">
        <SectionHeading
          eyebrow={dict.sections.services}
          title={dict.pages.home.servicesTitle}
          description={dict.pages.home.servicesDescription}
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {dict.services.slice(0, 8).map((item) => (
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

      <AIConsultationSection
        locale={locale}
        secondaryAction={{
          href: getLocalizedHref(locale, "/start-project"),
          label: dict.common.startProject,
        }}
      />

      <DigitalizationSimulator locale={locale} />

      <section className="container py-16">
        <SectionHeading
          eyebrow={dict.sections.demoLab}
          title={dict.pages.home.demoTitle}
          description={dict.pages.home.demoDescription}
        />
        <DemoGrid locale={locale} />
      </section>

      <section className="container py-16">
        <SectionHeading
          eyebrow={dict.sections.caseStudies}
          title={dict.pages.home.caseTitle}
          description={dict.pages.home.caseDescription}
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {homepageProjects.map((item) => (
            <FeatureCard
              key={item.slug}
              item={item}
              locale={locale}
              hrefBase="portfolio"
              cta={dict.common.viewCaseStudy}
            />
          ))}
        </div>
      </section>

      <section className="container py-16">
        <SectionHeading
          eyebrow={dict.sections.industries}
          title={dict.home.europeTitle}
          description={dict.home.europeBody}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {dict.industries.map((item) => (
            <FeatureCard
              key={item.slug}
              item={item}
              locale={locale}
              hrefBase="industries"
              cta={dict.common.learnMore}
            />
          ))}
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="gradient-border rounded-[2rem]">
            <div className="elevated-panel h-full p-8 md:p-10">
              <p className="font-script text-3xl text-accent-3 md:text-4xl">
                {locale === "fr"
                  ? "des systèmes avec du panache"
                  : "systems with theatrical polish"}
              </p>
              <p className="eyebrow mt-3">{dict.sections.method}</p>
              <h2 className="mt-4 text-balance text-4xl font-semibold md:text-6xl">
                <span className="headline-gradient">
                  {dict.pages.home.methodTitle}
                </span>
              </h2>
              <div className="headline-underline mt-6" aria-hidden="true" />
              <p className="mt-6 text-base leading-8 text-muted md:text-lg">
                {dict.pages.home.servicesDescription}
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {dict.method.map((step) => (
                  <span key={step} className="trust-pill">
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {signatureSuites.map((suite) => (
              <article
                key={suite.title}
                className="gradient-border rounded-[1.6rem]"
              >
                <div className="surface-panel h-full p-6">
                  <h3 className="text-2xl font-semibold text-primary">
                    {suite.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    {suite.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {suite.items.map((item) => (
                      <span key={item} className="trust-pill">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PageDirectorySection
        accentScript={
          locale === "fr"
            ? "parcourir chaque destination"
            : "explore every destination"
        }
        eyebrow={locale === "fr" ? "Plan complet" : "Full map"}
        title={
          locale === "fr"
            ? "Chaque destination importante du site est accessible depuis la landing page."
            : "Every major destination in the site experience is represented from the landing page."
        }
        description={
          locale === "fr"
            ? "Utilisez cette section comme une table d’orientation premium vers les pages de vision, d’offre, de preuve, de confiance, de portail et de conversion."
            : "Use this section as a premium orientation table into the vision, offer, proof, trust, portal, and conversion pages across the whole site."
        }
        items={pageDirectoryItems}
      />

      <section className="container py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="premium-card p-6 lg:col-span-1">
            <p className="eyebrow mb-3">{dict.sections.method}</p>
            <h2 className="text-3xl font-semibold text-primary">
              {dict.pages.home.methodTitle}
            </h2>
          </div>
          <div className="grid gap-4 lg:col-span-2">
            {dict.method.map((step, index) => (
              <div key={step} className="premium-card flex gap-4 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent/10 text-sm font-bold text-accent">
                  {index + 1}
                </span>
                <p className="font-medium text-primary">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="premium-card grid gap-8 p-8 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">{dict.sections.stack}</p>
            <h2 className="text-3xl font-semibold text-primary md:text-4xl">
              {dict.pages.home.stackTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted md:text-base">
              {locale === "fr"
                ? "La crédibilité technologique ne dépend pas seulement du framework. Elle se construit avec l’infrastructure cloud, les couches IA, les signaux SEO et les garde-fous de performance."
                : "Technology credibility is not only about the framework. It comes from the cloud layer, the AI layer, the SEO layer, and the performance guardrails behind the experience."}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {dict.stack.map((item) => (
                <span key={item} className="trust-pill">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="eyebrow mb-3">
              <ShieldCheck className="size-4" /> {dict.sections.security}
            </p>
            <h2 className="text-3xl font-semibold text-primary md:text-4xl">
              {dict.pages.home.securityTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted md:text-base">
              {locale === "fr"
                ? "Les clients attentifs veulent savoir comment la sécurité, l’indexation, les analytics et la vitesse sont traités avant même la mise en ligne."
                : "Conscious clients want to know how security, indexability, analytics, and speed are handled before launch, not after problems appear."}
            </p>
            <div className="mt-6 grid gap-2">
              {dict.securityPromise.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border bg-background p-3 text-sm text-muted"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {credibilitySuites.map((suite) => {
            const Icon = suite.icon;
            return (
              <article
                key={suite.title}
                className="gradient-border rounded-[1.65rem]"
              >
                <div className="surface-panel h-full p-6">
                  <div className="icon-chip rounded-2xl p-3">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold text-primary">
                    {suite.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    {suite.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {suite.items.map((item) => (
                      <span key={item} className="trust-pill">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="container py-16">
        <SectionHeading
          eyebrow={dict.sections.pricing}
          title={dict.pages.home.pricingTitle}
          description={dict.pages.home.pricingDescription}
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {dict.pricing.map((item) => (
            <FeatureCard
              key={item.slug}
              item={item}
              locale={locale}
              href="/start-project"
              cta={item.cta || dict.common.requestQuote}
            />
          ))}
        </div>
      </section>

      <section className="container py-16">
        <SectionHeading
          eyebrow={dict.sections.faq}
          title={dict.pages.home.faqTitle}
        />
        <div className="mx-auto grid max-w-4xl gap-4">
          {dict.faqs.map((faq) => (
            <details key={faq.question} className="premium-card p-5">
              <summary className="cursor-pointer font-semibold text-primary">
                {faq.question}
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {testimonialItems.length ? (
        <section className="container py-16">
          <SectionHeading
            eyebrow={dict.sections.testimonials}
            title={socialProofCopy.testimonialsTitle}
            description={socialProofCopy.testimonialsDescription}
          />

          <div className="mx-auto max-w-5xl">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted">
                {locale === "fr"
                  ? "Faites glisser ou utilisez les points pour parcourir les retours disponibles."
                  : "Swipe or use the dots to move through the available client proof."}
              </p>
              <span className="trust-pill">
                {locale === "fr" ? "Preuves clients" : "Client proof"}
              </span>
            </div>

            <SwipeDotsCarousel
              className="homepage-testimonials-carousel"
              viewportClassName="homepage-testimonials-viewport"
              trackClassName="homepage-testimonials-track"
              slideClassName="homepage-testimonials-slide"
              dotsClassName="homepage-testimonials-dots"
              ariaLabel={
                locale === "fr"
                  ? "Carrousel de témoignages clients"
                  : "Client testimonials carousel"
              }
              autoplayMs={5600}
              pauseOnHover
              dotLabels={testimonialDotLabels}
            >
              {testimonialItems.map((item) => (
                <article
                  key={item.id}
                  className="gradient-border rounded-[1.75rem]"
                >
                  <div className="elevated-panel h-full p-6 md:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="founder-recommendation-badge">
                        <BadgeCheck className="size-4" />
                        {item.source.startsWith("seed_homepage")
                          ? locale === "fr"
                            ? "Témoignage mis en avant"
                            : "Featured testimonial"
                          : locale === "fr"
                            ? "Retour approuvé"
                            : "Approved feedback"}
                      </div>
                      <Quote className="size-5 text-accent-2" />
                    </div>

                    {item.rating ? (
                      <div className="mt-5 flex items-center gap-1 text-amber-400">
                        {Array.from({ length: item.rating }).map(
                          (_, starIndex) => (
                            <Star
                              key={`${item.id}-star-${starIndex}`}
                              className="size-4 fill-current"
                            />
                          ),
                        )}
                      </div>
                    ) : null}

                    <p className="mt-5 text-base leading-8 text-primary md:text-lg">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                    <div className="mt-6 border-t border-border pt-4">
                      <p className="text-sm font-semibold text-primary">
                        {item.name}
                      </p>
                      {item.roleLine ? (
                        <p className="mt-1 text-sm text-muted">
                          {item.roleLine}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </SwipeDotsCarousel>
          </div>
        </section>
      ) : null}

      <section className="container pb-16">
        <div className="gradient-border rounded-[2rem]">
          <div className="elevated-panel relative overflow-hidden p-6 md:p-10">
            <AnimatedGridBackground className="opacity-70" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_80%_22%,rgba(251,113,133,0.12),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(245,185,66,0.1),transparent_28%)]" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
              <div>
                <p className="font-script text-3xl text-accent-3 md:text-4xl">
                  {socialProofCopy.feedbackScript}
                </p>
                <p className="eyebrow mt-3">
                  {socialProofCopy.feedbackEyebrow}
                </p>
                <h2 className="mt-4 max-w-3xl text-balance text-4xl font-semibold md:text-6xl">
                  <span className="headline-gradient">
                    {socialProofCopy.feedbackTitle}
                  </span>
                </h2>
                <div className="headline-underline mt-6" aria-hidden="true" />
                <p className="mt-6 max-w-2xl text-base leading-8 text-muted md:text-lg">
                  {socialProofCopy.feedbackDescription}
                </p>

                <div className="mt-6 grid gap-3">
                  {socialProofCopy.feedbackHighlights.map((item) => (
                    <div
                      key={item}
                      className="subtle-tile rounded-[1.35rem] p-4 text-sm leading-7 text-muted"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="gradient-border rounded-[1.8rem]">
                <div className="surface-panel h-full p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-3 pt-1">
                    <span className="trust-pill">
                      {locale === "fr" ? "Flux modéré" : "Moderated flow"}
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-muted">
                      <Sparkles className="size-4 text-accent-2" />
                      {locale === "fr"
                        ? "Sérieux, propre, prêt pour publication"
                        : "Clean, serious, and publication-ready"}
                    </span>
                  </div>

                  <CustomerFeedbackForm
                    locale={locale}
                    projectOptions={projectOptions}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PremiumPageCta
        locale={locale}
        eyebrow={dict.pages.home.finalCtaEyebrow}
        title={dict.home.finalCtaTitle}
        description={dict.home.finalCtaBody}
        primaryAction={{
          href: "/start-project",
          label: dict.common.startProject,
        }}
        secondaryAction={{ href: "/contact", label: dict.nav.contact }}
      />
    </main>
  );
}
