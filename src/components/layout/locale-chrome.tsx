"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Analytics } from "@/components/analytics/analytics";
import { LanguageGate } from "@/components/i18n/language-gate";
import { type Locale } from "@/content/site";
import { AIChatWidget } from "@/components/ai/AIChatWidget";
import { PublicScrollEffects } from "@/components/site/public-scroll-effects";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

type NavItem = { id: string; labelEn: string; labelFr: string; href: string; visible: boolean; position: number; openNewTab: boolean };

export function LocaleChrome({ children, locale, navItems = [] }: { children: React.ReactNode; locale: Locale; navItems?: NavItem[] }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <div className="page-frame relative min-h-screen">
      <Analytics />
      <PublicScrollEffects />
      {!isAdmin ? (
        <a href="#content-start" className="skip-link">
          Skip to content
        </a>
      ) : null}
      {!isAdmin ? <LanguageGate locale={locale} /> : null}
      {!isAdmin ? <SiteHeader locale={locale} navItems={navItems} /> : null}
      <div id="content-start">{children}</div>
      {!isAdmin ? <SiteFooter locale={locale} /> : null}
      {!isAdmin ? <AIChatWidget /> : null}
    </div>
  );
}
