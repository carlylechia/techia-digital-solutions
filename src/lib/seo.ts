import type { Metadata } from "next";
import { logoAssets } from "@/components/brand/logo-assets";
import { type Locale, locales, siteConfig } from "@/content/site";
import { getLocalizedAppPath } from "@/lib/site-routes";

export function createMetadata({
  locale,
  title,
  description,
  path = "",
  image = "/og/og-default.svg",
}: {
  locale: Locale;
  title: string;
  description: string;
  path?: string;
  image?: string;
}): Metadata {
  const cleanPath = path ? `/${path.replace(/^\//, "")}` : "";
  const canonical = `${siteConfig.url}${getLocalizedAppPath(locale, cleanPath)}`;
  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        locales.map((lang) => [
          lang,
          `${siteConfig.url}${getLocalizedAppPath(lang, cleanPath)}`,
        ]),
      ),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      locale: locale === "fr" ? "fr_FR" : "en_US",
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function organizationJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: siteConfig.url,
    logo: `${siteConfig.url}${logoAssets.primary.src}`,
    image: `${siteConfig.url}/og/og-default.svg`,
    email: siteConfig.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Douala",
      addressCountry: "CM",
    },
    areaServed: [
      "Cameroon",
      "Africa",
      "Europe",
      "United Kingdom",
      "France",
      "Germany",
    ],
    inLanguage: locale,
    description:
      locale === "fr"
        ? "Studio de transformation digitale créant des sites premium, systèmes métiers, automatisations et outils IA."
        : "Digital transformation studio building premium websites, business systems, automation, dashboards, and AI-powered tools.",
  };
}

export function breadcrumbJsonLd(
  locale: Locale,
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${getLocalizedAppPath(locale, item.path)}`,
    })),
  };
}
