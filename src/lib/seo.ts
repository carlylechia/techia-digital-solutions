import type { Metadata } from "next";
import { logoAssets } from "@/components/brand/logo-assets";
import { type Locale, siteConfig } from "@/content/site";
import { getPublicAppPath } from "@/lib/site-routes";

export function createMetadata({
  locale,
  title,
  description,
  path = "",
  image = "/og/og-default.svg",
  canonicalPath,
  robots,
}: {
  locale: Locale;
  title: string;
  description: string;
  path?: string;
  image?: string;
  canonicalPath?: string;
  robots?: Metadata["robots"];
}): Metadata {
  const cleanPath = path ? `/${path.replace(/^\//, "")}` : "";
  const canonical = canonicalPath
    ? `${siteConfig.url}${canonicalPath}`
    : `${siteConfig.url}${getPublicAppPath(cleanPath)}`;
  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    robots,
    alternates: {
      canonical,
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
        ? "Partenaire de croissance digitale aidant les entreprises via les réseaux sociaux, le marketing digital, le branding, le web, l’automatisation, l’IA et les logiciels métier."
        : "Digital growth partner helping businesses through social media management, digital marketing, branding, websites, automation, AI, and business software.",
  };
}

export function rootGatewayJsonLd() {
  const serviceTypes = [
    "Social Media Management",
    "Digital Marketing",
    "SEO",
    "Website Design and Development",
    "Business Automation",
    "AI-Powered Business Tools",
    "Business Dashboards",
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: siteConfig.name,
        alternateName: siteConfig.shortName,
        url: siteConfig.url,
        slogan: "Digitalize. Simplify. Grow.",
        description: "Smart digital solutions for businesses ready to grow.",
        logo: `${siteConfig.url}${logoAssets.primary.src}`,
        image: `${siteConfig.url}/og/og-default.svg`,
        areaServed: ["Cameroon", "Africa", "International"],
        sameAs: Object.values(siteConfig.socials),
        knowsAbout: serviceTypes,
        ...(siteConfig.email ? { email: siteConfig.email } : {}),
        ...(siteConfig.phone ? { telephone: siteConfig.phone } : {}),
      },
      {
        "@type": "ProfessionalService",
        name: siteConfig.name,
        alternateName: siteConfig.shortName,
        url: siteConfig.url,
        slogan: "Digitalize. Simplify. Grow.",
        description: "Smart digital solutions for businesses ready to grow.",
        logo: `${siteConfig.url}${logoAssets.primary.src}`,
        image: `${siteConfig.url}/og/og-default.svg`,
        areaServed: ["Cameroon", "Africa", "International"],
        availableLanguage: ["en", "fr"],
        serviceType: serviceTypes,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Douala",
          addressCountry: "CM",
        },
        ...(siteConfig.email ? { email: siteConfig.email } : {}),
        ...(siteConfig.phone ? { telephone: siteConfig.phone } : {}),
      },
    ],
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
      item: `${siteConfig.url}${getPublicAppPath(item.path)}`,
    })),
  };
}
