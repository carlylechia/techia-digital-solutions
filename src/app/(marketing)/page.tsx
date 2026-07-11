import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BrainCircuit,
  Globe2,
  LayoutTemplate,
  MapPin,
  Megaphone,
  PanelTopOpen,
  Search,
  Sparkles,
  Workflow,
} from "lucide-react";
import { LanguageGatewayActions } from "@/components/i18n/language-gateway-actions";
import { AnimatedGridBackground } from "@/components/site/animated-grid-background";
import { GradientBadge } from "@/components/site/gradient-badge";
import { Reveal } from "@/components/site/reveal";
import { JsonLd } from "@/components/ui/json-ld";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/content/site";
import { rootGatewayJsonLd } from "@/lib/seo";

const gatewayServices: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    icon: Megaphone,
    title: "Social Media Management",
    description:
      "Plan, structure, and manage content that helps your business look active, trusted, and professional.",
  },
  {
    icon: Globe2,
    title: "Digital Marketing",
    description:
      "Create campaigns that improve visibility, attract better leads, and support business growth.",
  },
  {
    icon: Search,
    title: "SEO & Google Visibility",
    description:
      "Optimize your website and content so customers can find your business more easily online.",
  },
  {
    icon: LayoutTemplate,
    title: "Website Design & Development",
    description:
      "Build premium, responsive websites that present your business clearly and convert visitors into leads.",
  },
  {
    icon: PanelTopOpen,
    title: "Business Dashboards",
    description:
      "Track requests, leads, orders, bookings, and business activity from one organized place.",
  },
  {
    icon: BrainCircuit,
    title: "Automation & AI Tools",
    description:
      "Reduce manual work with smart workflows, AI assistants, and digital systems built around your business.",
  },
];

const serviceAreaPills = [
  "Douala",
  "Yaoundé",
  "Bamenda",
  "Africa",
  "International",
];

const nextStepLinks: Array<{
  href: string;
  label: string;
  helper: string;
  icon: LucideIcon;
}> = [
  {
    href: "/en",
    label: "English homepage",
    helper: "Full site experience in English",
    icon: Sparkles,
  },
  {
    href: "/fr",
    label: "Accueil en français",
    helper: "Expérience complète en français",
    icon: Globe2,
  },
  {
    href: "/en/services",
    label: "English services",
    helper: "Explore offers, demos, and growth systems",
    icon: Workflow,
  },
  {
    href: "/fr/services",
    label: "Services en français",
    helper: "Voir les offres et systèmes de croissance",
    icon: BarChart3,
  },
];

export const metadata: Metadata = {
  title:
    "teChia Digital Solutions | Digital Growth, Marketing, SEO & Business Automation",
  description:
    "teChia Digital Solutions helps SMEs grow with social media management, digital marketing, SEO, premium websites, dashboards, automation, and AI-powered business tools.",
  keywords: [
    "teChia Digital Solutions",
    "digital marketing Cameroon",
    "social media management Cameroon",
    "website design Cameroon",
    "SEO Cameroon",
    "business automation",
    "AI tools for business",
    "SME digital solutions",
    "digital transformation Cameroon",
  ],
  alternates: {
    canonical: `${siteConfig.url}/`,
    languages: {
      "x-default": `${siteConfig.url}/`,
      en: `${siteConfig.url}/en`,
      fr: `${siteConfig.url}/fr`,
    },
  },
  openGraph: {
    title: "teChia Digital Solutions | Digitalize. Simplify. Grow.",
    description: "Smart digital solutions for businesses ready to grow.",
    url: `${siteConfig.url}/`,
    siteName: siteConfig.name,
    type: "website",
    images: [
      {
        url: "/og/og-default.svg",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "teChia Digital Solutions | Digitalize. Simplify. Grow.",
    description: "Smart digital solutions for businesses ready to grow.",
    images: ["/og/og-default.svg"],
  },
};

export default function HomePage() {
  return (
    <main id="main-content">
      <JsonLd data={rootGatewayJsonLd()} />

      <section className="container pb-10 pt-16 md:pb-14 md:pt-20">
        <Reveal>
          <div className="gradient-border rounded-[2rem]">
            <div className="surface-panel relative overflow-hidden px-6 py-8 md:px-10 md:py-12">
              <AnimatedGridBackground className="opacity-70" />
              <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_58%),radial-gradient(circle_at_top_right,rgba(251,113,133,0.14),transparent_36%)]" />
              <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <div>
                  <GradientBadge>Global gateway / Portail bilingue</GradientBadge>
                  <p className="eyebrow mt-5">teChia Digital Solutions</p>
                  <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
                    <span className="headline-gradient">
                      Digitalize. Simplify. Grow.
                    </span>
                  </h1>
                  <p className="mt-5 max-w-3xl text-lg leading-8 text-foreground/90 md:text-2xl">
                    Smart digital solutions for businesses ready to grow.
                  </p>
                  <p className="mt-6 max-w-3xl text-base leading-8 text-muted md:text-lg">
                    teChia Digital Solutions helps SMEs build stronger digital
                    presence, attract better leads, manage operations, and grow
                    through social media management, digital marketing, SEO,
                    premium websites, dashboards, automation, and AI-powered
                    business tools.
                  </p>

                  <div className="mt-6 grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
                    <div className="subtle-tile rounded-[1.5rem] p-4">
                      <p className="eyebrow">Français</p>
                      <p className="mt-3 text-sm leading-7 text-muted">
                        Des solutions digitales intelligentes pour les
                        entreprises prêtes à grandir. teChia accompagne les PME
                        avec les réseaux sociaux, le marketing digital, le SEO,
                        les sites premium, les tableaux de bord,
                        l’automatisation et les outils IA.
                      </p>
                    </div>

                    <div className="subtle-tile rounded-[1.5rem] p-4">
                      <p className="eyebrow">Service area</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {serviceAreaPills.map((item) => (
                          <span key={item} className="trust-pill">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  id="gateway-language-selector"
                  className="gradient-border rounded-[1.75rem]"
                >
                  <div className="elevated-panel relative h-full overflow-hidden p-6 md:p-7">
                    <AnimatedGridBackground className="opacity-50" />
                    <div className="relative z-10">
                      <p className="eyebrow">Choose your language</p>
                      <h2 className="mt-4 text-balance text-3xl font-semibold text-foreground">
                        Start with the full teChia experience in English or
                        French.
                      </h2>
                      <p className="mt-4 text-sm leading-7 text-muted">
                        This page stays available for Google and first-time
                        visitors. Your language choice is saved so future visits
                        can stay consistent.
                      </p>
                      <LanguageGatewayActions className="mt-6" />
                      <div className="mt-6 grid gap-3">
                        <div className="subtle-tile rounded-[1.3rem] p-4 text-sm leading-7 text-muted">
                          <span className="font-semibold text-foreground">
                            English:
                          </span>{" "}
                          Explore the full homepage, services, demos, pricing,
                          portfolio, and contact flow at <code>/en</code>.
                        </div>
                        <div className="subtle-tile rounded-[1.3rem] p-4 text-sm leading-7 text-muted">
                          <span className="font-semibold text-foreground">
                            Français:
                          </span>{" "}
                          Accédez à l’accueil, aux services, aux démos, aux
                          offres et au contact sur <code>/fr</code>.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="container py-10 md:py-14">
        <Reveal>
          <SectionHeading
            eyebrow="Service preview"
            title="What we help businesses do"
            description="A compact preview of teChia’s highest-priority growth services before you continue in English or French."
            align="left"
            className="max-w-4xl"
          />
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {gatewayServices.map((service, index) => {
            const Icon = service.icon;

            return (
              <Reveal key={service.title} delay={index * 0.04}>
                <article className="gradient-border h-full rounded-[1.5rem]">
                  <div className="surface-panel flex h-full flex-col p-6">
                    <span className="icon-chip inline-flex rounded-2xl p-3">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-5 text-xl font-semibold text-foreground">
                      {service.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted">
                      {service.description}
                    </p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="container py-10 md:py-14">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
            <div className="gradient-border rounded-[1.75rem]">
              <div className="surface-panel relative overflow-hidden p-7 md:p-8">
                <AnimatedGridBackground className="opacity-55" />
                <div className="relative z-10">
                  <p className="eyebrow">Location and fit</p>
                  <h2 className="mt-4 text-balance text-3xl font-semibold text-foreground md:text-5xl">
                    Based in Cameroon. Serving SMEs in Douala, Yaoundé,
                    Bamenda, across Africa, and internationally.
                  </h2>
                  <p className="mt-5 max-w-3xl text-base leading-8 text-muted md:text-lg">
                    Built for businesses that want to become easier to find,
                    easier to trust, easier to manage, and easier to grow.
                  </p>

                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    <div className="subtle-tile rounded-[1.35rem] p-4 text-sm leading-7 text-muted">
                      Stronger visibility for SMEs that need better digital
                      positioning, clearer offers, and better lead quality.
                    </div>
                    <div className="subtle-tile rounded-[1.35rem] p-4 text-sm leading-7 text-muted">
                      Connected systems for businesses ready to align websites,
                      campaigns, dashboards, automation, and AI around one
                      growth direction.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="gradient-border rounded-[1.75rem]">
              <div className="elevated-panel h-full p-7 md:p-8">
                <p className="eyebrow">Continue from here</p>
                <h2 className="mt-4 text-balance text-3xl font-semibold text-foreground md:text-4xl">
                  Choose the route that matches your next step.
                </h2>
                <div className="mt-6 grid gap-3">
                  {nextStepLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="subtle-tile group flex items-start gap-4 rounded-[1.35rem] p-4 transition hover:-translate-y-0.5"
                      >
                        <span className="icon-chip inline-flex rounded-2xl p-3">
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-foreground">
                            {item.label}
                          </span>
                          <span className="mt-1 block text-sm leading-7 text-muted">
                            {item.helper}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container pb-16 pt-8 md:pb-20">
        <Reveal>
          <div className="gradient-border rounded-[2rem]">
            <div className="elevated-panel p-7 md:p-10">
              <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                <div>
                  <p className="font-script text-3xl text-accent-3 md:text-4xl">
                    choose the next growth layer
                  </p>
                  <p className="eyebrow mt-3">Gateway CTA</p>
                  <h2 className="mt-4 max-w-3xl text-balance text-4xl font-semibold md:text-5xl">
                    <span className="headline-gradient">
                      Continue to the full teChia site in the language that
                      fits your audience.
                    </span>
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-8 text-muted md:text-lg">
                    Visit <code>/en</code> for the English homepage or{" "}
                    <code>/fr</code> for the French homepage. You can switch
                    language later from the localized navigation.
                  </p>
                </div>

                <div>
                  <LanguageGatewayActions source="gateway-footer" />
                  <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted">
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="size-4 text-accent-2" />
                      Cameroon-based, international delivery
                    </span>
                    <Link
                      href="/en"
                      hrefLang="en"
                      className="footer-link inline-flex"
                    >
                      /en
                    </Link>
                    <Link
                      href="/fr"
                      hrefLang="fr"
                      className="footer-link inline-flex"
                    >
                      /fr
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
