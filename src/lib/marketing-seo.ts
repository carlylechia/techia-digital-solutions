import type { Metadata } from "next";
import { siteConfig } from "@/content/site";
import { fitDescription, fitTitle } from "@/lib/metadata-text";

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
  const normalizedTitle = fitTitle(title);
  const normalizedDescription = fitDescription(description);

  return {
    title: normalizedTitle,
    description: normalizedDescription,
    alternates: { canonical },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: normalizedTitle,
      description: normalizedDescription,
      url: canonical,
      siteName: siteConfig.name,
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: `${normalizedTitle} preview` }]
    },
    twitter: {
      card: "summary_large_image",
      title: normalizedTitle,
      description: normalizedDescription,
      images: [image]
    }
  };
}
