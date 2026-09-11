import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Great_Vibes, Manrope } from "next/font/google";
import "./globals.css";
import { brandIconAssets } from "@/components/brand/logo-assets";
import { ThemeProvider } from "@/components/theme/theme-provider";
import {
  DEFAULT_THEME,
  ENABLE_SYSTEM_THEME,
  getInitialThemeScript,
  THEME_STORAGE_KEY
} from "@/components/theme/theme-config";
import { siteConfig } from "@/content/site";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap"
});
const greatVibes = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-script",
  weight: "400",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "teChia Digital Solutions | Digitalize. Simplify. Grow.",
    template: `%s | ${siteConfig.shortName}`
  },
  description:
    "teChia Digital Solutions helps businesses grow through social media management, digital marketing, branding, websites, SEO, automation, AI solutions, custom software, and digital transformation consulting.",
  icons: {
    icon: [
      { url: brandIconAssets.faviconIco.src },
      { url: brandIconAssets.faviconSvg.src, type: "image/svg+xml" }
    ],
    shortcut: [brandIconAssets.faviconIco.src],
    apple: [{ url: brandIconAssets.appleTouch.src, sizes: "180x180", type: "image/png" }]
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "teChia Digital Solutions | Digitalize. Simplify. Grow.",
    description:
      "teChia Digital Solutions helps businesses grow through social media management, digital marketing, branding, websites, SEO, automation, AI solutions, custom software, and digital transformation consulting.",
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
    images: [{ url: "/og/og-default.svg", width: 1200, height: 630, alt: `${siteConfig.name} preview` }]
  },
  twitter: {
    card: "summary_large_image",
    title: "teChia Digital Solutions | Digitalize. Simplify. Grow.",
    description:
      "teChia Digital Solutions helps businesses grow through social media management, digital marketing, branding, websites, SEO, automation, AI solutions, custom software, and digital transformation consulting.",
    images: ["/og/og-default.svg"]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5FBFF" },
    { media: "(prefers-color-scheme: dark)", color: "#040812" }
  ]
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}${brandIconAssets.appleTouch.src}`,
  email: siteConfig.email || "contact@techiadigital.com",
  sameAs: Object.values(siteConfig.socials),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const initialThemeScript = getInitialThemeScript({
    storageKey: THEME_STORAGE_KEY,
    defaultTheme: DEFAULT_THEME,
    enableSystem: ENABLE_SYSTEM_THEME
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="techia-initial-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: initialThemeScript }}
        />
        <Script
          id="techia-organization-jsonld"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </head>
      <body className={`${manrope.variable} ${cormorant.variable} ${greatVibes.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
