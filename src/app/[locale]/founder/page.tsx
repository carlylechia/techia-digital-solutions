import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FounderPageAnalytics } from "@/components/founder/founder-page-analytics";
import { FounderRecommendationsSection } from "@/components/founder/founder-recommendations-section";
import {
  FounderDownload,
  FounderExperience,
  FounderFinalCta,
  FounderHero,
  FounderPrinciples,
  FounderProjects,
  FounderSkills,
  FounderSnapshot,
  FounderStory,
  FounderSummary,
  FounderTestimonials
} from "@/components/founder/founder-sections";
import {
  FOUNDER_NAME,
  getFounderContent,
  getFounderLinks
} from "@/content/founder";
import { getDictionary, isLocale, type Locale, siteConfig } from "@/content/site";
import { loadFounderFeedback, loadFounderProjects } from "@/lib/public-showcase";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/ui/json-ld";

function buildPersonJsonLd(locale: Locale) {
  const content = getFounderContent(locale);
  const links = getFounderLinks(locale);
  const sameAs = [links.linkedinHref, !links.usesCompanyGithubFallback ? links.githubHref : ""].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteConfig.url}/${locale}/founder#person`,
    name: FOUNDER_NAME,
    url: `${siteConfig.url}/${locale}/founder`,
    image: `${siteConfig.url}/images/carlyle.png`,
    jobTitle: locale === "fr" ? "Développeur Full-Stack et Fondateur" : "Full-Stack Developer and Founder",
    description: content.hero.subtext,
    homeLocation: {
      "@type": "Place",
      name: "Douala, Cameroon"
    },
    worksFor: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url
    },
    affiliation: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url
    },
    knowsAbout: [
      "Web Development",
      "Business Management Systems",
      "Digital Transformation",
      "Automation",
      "AI Tools",
      "SEO",
      "Dashboards",
      "Client Portals",
      "Custom Web Applications"
    ],
    ...(sameAs.length ? { sameAs } : {})
  };
}

function buildProfilePageJsonLd(locale: Locale) {
  const content = getFounderContent(locale);

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${siteConfig.url}/${locale}/founder#profile`,
    url: `${siteConfig.url}/${locale}/founder`,
    name: content.pageTitle,
    description: content.metadata.description,
    inLanguage: locale,
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url
    },
    mainEntity: {
      "@id": `${siteConfig.url}/${locale}/founder#person`
    }
  };
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const content = getFounderContent(locale);

  const metadata = createMetadata({
    locale,
    title: content.metadata.title,
    description: content.metadata.description,
    path: "/founder"
  });

  return {
    ...metadata,
    title: { absolute: content.metadata.title },
    openGraph: metadata.openGraph
      ? {
          ...metadata.openGraph,
          title: content.metadata.title
        }
      : undefined,
    twitter: metadata.twitter
      ? {
          ...metadata.twitter,
          title: content.metadata.title
        }
      : undefined
  };
}

export default async function FounderPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const content = getFounderContent(locale);
  const links = getFounderLinks(locale);
  const [projects, feedback] = await Promise.all([loadFounderProjects(locale), loadFounderFeedback(locale)]);

  return (
    <main className="founder-page page-frame">
      <FounderPageAnalytics locale={locale} />
      <JsonLd data={buildPersonJsonLd(locale)} />
      <JsonLd data={buildProfilePageJsonLd(locale)} />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: dict.nav.home, path: "" },
          { name: dict.nav.founder, path: "/founder" }
        ])}
      />

      <FounderHero locale={locale} content={content} links={links} />
      <FounderSnapshot content={content} locale={locale} />
      <FounderSummary content={content} locale={locale} links={links} />
      <FounderStory content={content} />
      <FounderSkills content={content} locale={locale} />
      <FounderProjects content={content} locale={locale} links={links} projects={projects} />
      <FounderExperience content={content} />
      <FounderRecommendationsSection locale={locale} linkedinHref={links.linkedinHref} />
      <FounderPrinciples content={content} />
      <FounderTestimonials content={content} locale={locale} feedback={feedback} projectOptions={projects.map((project) => ({ slug: project.slug, name: project.name }))} />
      <FounderDownload content={content} locale={locale} links={links} />
      <FounderFinalCta content={content} locale={locale} links={links} />
    </main>
  );
}
