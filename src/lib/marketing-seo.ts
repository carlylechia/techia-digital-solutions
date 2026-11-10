import type { Metadata } from "next";
import { siteConfig } from "@/content/site";

type SeoInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
};

function fitDescription(description: string, max = 155) {
  const clean = description.trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max + 1);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > 60) return `${slice.slice(0, lastSpace).trim()}…`;
  return `${clean.slice(0, max - 1).trim()}…`;
}

export function createMarketingMetadata({
  title,
  description,
  path = "",
  image = "/og/og-default.svg",
  noIndex = false
}: SeoInput): Metadata {
  const cleanPath = path ? `/${path.replace(/^\//, "")}` : "";
  const canonical = `${siteConfig.url}${cleanPath}`;
  const normalizedDescription = fitDescription(description);

  return {
    title,
    description: normalizedDescription,
    alternates: { canonical },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description: normalizedDescription,
      url: canonical,
      siteName: siteConfig.name,
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: `${title} preview` }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: normalizedDescription,
      images: [image]
    }
  };
}
