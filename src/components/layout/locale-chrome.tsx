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
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/") || /^\/(?:en|fr)\/admin(?:\/|$)/.test(pathname);
  const isWriter = pathname === "/writer" || pathname.startsWith("/writer/") || /^\/(?:en|fr)\/writer(?:\/|$)/.test(pathname);
  const isInternal = isAdmin || isWriter;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <div className="page-frame relative min-h-screen">
      {!isInternal ? <Analytics /> : null}
      {!isInternal ? <PublicScrollEffects /> : null}
      {!isInternal ? (
        <a href="#content-start" className="skip-link">
          Skip to content
        </a>
      ) : null}
      {!isInternal ? <LanguageGate locale={locale} /> : null}
      {!isInternal ? <SiteHeader locale={locale} navItems={navItems} /> : null}
      <div id="content-start">{children}</div>
      {!isInternal ? <SiteFooter locale={locale} /> : null}
      {!isInternal ? <AIChatWidget /> : null}
    </div>
  );
}
