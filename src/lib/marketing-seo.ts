import type { Metadata } from "next";
import { siteConfig } from "@/content/site";

type SeoInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
};

export function createMarketingMetadata({
  title,
  description,
  path = "",
  image = "/og/og-default.svg",
  noIndex = false
}: SeoInput): Metadata {
  const cleanPath = path ? `/${path.replace(/^\//, "")}` : "";
  const canonical = `${siteConfig.url}${cleanPath}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: `${title} preview` }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    }
  };
}
