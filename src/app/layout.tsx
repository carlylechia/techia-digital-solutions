import type { Metadata, Viewport } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "teChia Digital Solutions | Digitalize. Simplify. Grow.",
    template: `%s | ${siteConfig.shortName}`
  },
  description:
    "teChia Digital Solutions helps businesses grow through social media management, digital marketing, branding, websites, SEO, automation, AI solutions, custom software, and digital transformation consulting.",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const initialThemeScript = getInitialThemeScript({
    storageKey: THEME_STORAGE_KEY,
    defaultTheme: DEFAULT_THEME,
    enableSystem: ENABLE_SYSTEM_THEME
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
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
