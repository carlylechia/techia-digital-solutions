import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
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

const manrope = localFont({
  src: "../fonts/manrope-latin.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "400 700",
});

const cormorant = localFont({
  src: "../fonts/cormorant-garamond-latin.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "500 700",
});

const greatVibes = localFont({
  src: "../fonts/great-vibes-latin.woff2",
  variable: "--font-script",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "teChia Digital Solutions | Digitalize. Simplify. Grow.",
    template: "%s"
  },
  description:
    "teChia Digital Solutions helps SMEs grow with social media management, digital marketing, SEO, websites, automation, AI, and custom software.",
  alternates: {
    types: {
      "application/rss+xml": "/blog/feed.xml",
    },
  },
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
      "teChia Digital Solutions helps SMEs grow with social media management, digital marketing, SEO, websites, automation, AI, and custom software.",
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
    images: [{ url: "/og/og-default.svg", width: 1200, height: 630, alt: `${siteConfig.name} preview` }]
  },
  twitter: {
    card: "summary_large_image",
    title: "teChia Digital Solutions | Digitalize. Simplify. Grow.",
    description:
      "teChia Digital Solutions helps SMEs grow with social media management, digital marketing, SEO, websites, automation, AI, and custom software.",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const initialThemeScript = getInitialThemeScript({
    storageKey: THEME_STORAGE_KEY,
    defaultTheme: DEFAULT_THEME,
    enableSystem: ENABLE_SYSTEM_THEME
  });

  return (
    <html lang="en" className={`${manrope.variable} ${cormorant.variable} ${greatVibes.variable}`} suppressHydrationWarning>
      <head>
        <Script
          id="techia-initial-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: initialThemeScript }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
