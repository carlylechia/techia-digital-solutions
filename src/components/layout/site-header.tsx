"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getDictionary, getLocalizedHref, type Locale } from "@/content/site";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NavRail } from "./nav-rail";

type NavItem = { id: string; labelEn: string; labelFr: string; href: string; visible: boolean; position: number; openNewTab: boolean };

export function SiteHeader({ locale, navItems = [] }: { locale: Locale; navItems?: NavItem[] }) {
  const dict = getDictionary(locale);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const liveLabel = locale === "fr" ? "Studio actif" : "Studio Live";
  const mobilePrompt = locale === "fr" ? "naviguer dans le flagship" : "navigate the flagship";
  const launchModeLabel = locale === "fr" ? "Mode lancement" : "Launch Mode";
  const scrollHintLabel = locale === "fr" ? "Défiler" : "Scroll";
  const scrollHintActionLabel = locale === "fr" ? "Faire défiler la navigation" : "Scroll navigation";

  useEffect(() => {
    if (!open) {
      document.body.removeAttribute("data-scroll-locked");
      return;
    }

    document.body.setAttribute("data-scroll-locked", "true");

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.removeAttribute("data-scroll-locked");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Use DB nav items when available, otherwise fall back to dictionary-based links
  const founderHref = getLocalizedHref(locale, "/founder");
  const aiConsultantHref = getLocalizedHref(locale, "/ai-consultant");
  const resolvedLinks: Array<{ label: string; href: string; external: boolean; openNewTab: boolean }> = navItems.length > 0
    ? navItems.map((item) => ({
        label: locale === "fr" ? item.labelFr : item.labelEn,
        href: item.href.startsWith("http") ? item.href : getLocalizedHref(locale, item.href),
        external: item.href.startsWith("http"),
        openNewTab: item.openNewTab
      }))
    : [
        { label: dict.nav.services, href: getLocalizedHref(locale, "/services"), external: false, openNewTab: false },
        { label: dict.nav.solutions, href: getLocalizedHref(locale, "/solutions"), external: false, openNewTab: false },
        { label: dict.nav.industries, href: getLocalizedHref(locale, "/industries"), external: false, openNewTab: false },
        { label: dict.nav.portfolio, href: getLocalizedHref(locale, "/portfolio"), external: false, openNewTab: false },
        { label: dict.nav.demoLab, href: getLocalizedHref(locale, "/demo-lab"), external: false, openNewTab: false },
        { label: dict.nav.pricing, href: getLocalizedHref(locale, "/pricing"), external: false, openNewTab: false },
        { label: dict.nav.blog, href: getLocalizedHref(locale, "/blog"), external: false, openNewTab: false },
        { label: dict.nav.contact, href: getLocalizedHref(locale, "/contact"), external: false, openNewTab: false },
        { label: dict.nav.aiConsultant, href: aiConsultantHref, external: false, openNewTab: false }
      ];

  if (!resolvedLinks.some((link) => link.href === founderHref || /\/founder(?:[?#]|$)/.test(link.href))) {
    const founderLink = { label: dict.nav.founder, href: founderHref, external: false, openNewTab: false };
    const portfolioIndex = resolvedLinks.findIndex((link) => link.href === getLocalizedHref(locale, "/portfolio"));
    if (portfolioIndex >= 0) resolvedLinks.splice(portfolioIndex + 1, 0, founderLink);
    else resolvedLinks.push(founderLink);
  }

  if (!resolvedLinks.some((link) => link.href === aiConsultantHref || /\/ai-consultant(?:[?#]|$)/.test(link.href))) {
    const aiConsultantLink = { label: dict.nav.aiConsultant, href: aiConsultantHref, external: false, openNewTab: false };
    const contactIndex = resolvedLinks.findIndex((link) => link.href === getLocalizedHref(locale, "/contact"));
    if (contactIndex >= 0) resolvedLinks.splice(contactIndex + 1, 0, aiConsultantLink);
    else resolvedLinks.push(aiConsultantLink);
  }

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4">
      <nav className="container header-shell" aria-label={dict.ui.mainNavigation}>
        <Logo locale={locale} variant="horizontal" size="md" theme="auto" priority interactive />

        <div className="hidden min-w-0 lg:block">
          <NavRail
            items={resolvedLinks.map((link) => ({
              href: link.href,
              label: link.label,
              openNewTab: link.openNewTab,
              active: !link.external && (pathname === link.href || pathname.startsWith(`${link.href}/`))
            }))}
            hintLabel={scrollHintLabel}
            hintActionLabel={scrollHintActionLabel}
          />
        </div>

        <div className="hidden items-center justify-end gap-3 lg:flex">
          <div className="header-action-cluster">
            <span className="header-status-pill">{liveLabel}</span>
            <LanguageSwitcher locale={locale} />
            <ThemeToggle locale={locale} />
            <Link
              href={getLocalizedHref(locale, "/start-project")}
              className="btn-primary px-5 py-3 text-sm"
              onClick={() => window.dispatchEvent(new CustomEvent("techia:analytics", { detail: { name: "start_project_click", params: { location: "navbar" } } }))}
            >
              {dict.nav.startProject}
            </Link>
          </div>
        </div>

        <button
          type="button"
          className="icon-button lg:hidden"
          aria-label={dict.ui.openMenu}
          aria-controls="locale-mobile-nav"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" />
        </button>
      </nav>
      {open ? (
        <div
          className="fixed inset-0 z-50 bg-[#040812]/82 p-4 backdrop-blur-2xl lg:hidden"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            id="locale-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label={dict.ui.mainNavigation}
            className="ml-auto flex h-full w-full max-w-sm flex-col rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,15,28,0.98),rgba(8,20,36,0.94))] p-5 text-white shadow-[0_32px_120px_rgba(0,0,0,0.42)]"
          >
            <div className="flex items-center justify-between">
              <Logo locale={locale} variant="horizontal" size="sm" theme="dark" interactive />
              <button
                type="button"
                className="icon-button border-white/10 bg-white/[0.06] text-white"
                aria-label={dict.ui.closeMenu}
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="font-script mt-6 text-3xl text-[#FDBA74]">{mobilePrompt}</p>
            <div className="mt-6 grid max-h-[70vh] gap-2 overflow-y-auto pr-1">
              {resolvedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-[1.3rem] border border-white/10 bg-white/[0.06] p-4 text-lg font-medium text-white"
                  onClick={() => setOpen(false)}
                  {...(link.openNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {link.label}
                </Link>
              ))}
              <Link href={getLocalizedHref(locale, "/start-project")} className="btn-primary mt-3 justify-center" onClick={() => setOpen(false)}>
                {dict.nav.startProject}
              </Link>
            </div>
            <div className="header-action-cluster mt-auto flex items-center justify-between gap-3 pt-6">
              <span className="header-status-pill border-white/10 text-white">{launchModeLabel}</span>
              <div className="flex items-center gap-3">
                <LanguageSwitcher locale={locale} />
                <ThemeToggle locale={locale} className="border-white/10 bg-white/[0.06] text-white" />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
