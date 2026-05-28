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

type NavItem = {
  id: string;
  labelEn: string;
  labelFr: string;
  href: string;
  visible: boolean;
  position: number;
  openNewTab: boolean;
};

function normalizeHref(href: string) {
  const [path] = href.split(/[?#]/, 1);
  if (!path || path === "/") return "/";
  return path.replace(/\/+$/, "");
}

function matchesHref(linkHref: string, expectedHref: string) {
  const linkPath = normalizeHref(linkHref);
  const expectedPath = normalizeHref(expectedHref);
  return linkPath === expectedPath || linkPath.startsWith(`${expectedPath}/`);
}

function isExternalHref(href: string) {
  return /^https?:\/\//.test(href);
}

export function SiteHeader({
  locale,
  navItems = [],
}: {
  locale: Locale;
  navItems?: NavItem[];
}) {
  const dict = getDictionary(locale);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const liveLabel = locale === "fr" ? "Studio actif" : "Studio Live";
  const mobilePrompt =
    locale === "fr" ? "naviguer dans le flagship" : "navigate the flagship";
  const launchModeLabel = locale === "fr" ? "Mode lancement" : "Launch Mode";
  const scrollHintLabel = locale === "fr" ? "Défiler" : "Scroll";
  const scrollHintActionLabel =
    locale === "fr" ? "Faire défiler la navigation" : "Scroll navigation";
  const coreNavOrder = [
    { href: getLocalizedHref(locale, "/founder"), label: dict.nav.founder },
    { href: getLocalizedHref(locale, "/demo-lab"), label: dict.nav.demoLab },
    { href: "/client-portal", label: dict.nav.clientPortal },
    {
      href: getLocalizedHref(locale, "/ai-consultant"),
      label: dict.nav.aiConsultant,
    },
    { href: getLocalizedHref(locale, "/services"), label: dict.nav.services },
    { href: getLocalizedHref(locale, "/about"), label: dict.nav.about },
    { href: getLocalizedHref(locale, "/contact"), label: dict.nav.contact },
  ] as const;

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

  const resolvedLinks: Array<{
    label: string;
    href: string;
    external: boolean;
    openNewTab: boolean;
  }> = (() => {
    if (!navItems.length) {
      return coreNavOrder.map((item) => ({
        ...item,
        external: false,
        openNewTab: false,
      }));
    }

    const mergedPathMap = new Map<string, string>([
      ["/solutions", "/services"],
      ["/industries", "/services"],
      ["/portfolio", "/about"],
    ]);
    const suppressedPaths = new Set([
      "/solutions",
      "/industries",
      "/portfolio",
      "/pricing",
      "/blog",
    ]);
    const coreLinkByHref = new Map<
      string,
      { label: string; href: string; external: boolean; openNewTab: boolean }
    >();
    const extraLinks: Array<{
      label: string;
      href: string;
      external: boolean;
      openNewTab: boolean;
    }> = [];

    for (const item of navItems) {
      const rawHref = item.href.trim();
      const external = isExternalHref(rawHref);
      const label = locale === "fr" ? item.labelFr : item.labelEn;

      if (external) {
        extraLinks.push({
          label,
          href: rawHref,
          external: true,
          openNewTab: item.openNewTab,
        });
        continue;
      }

      const normalizedLocalPath = normalizeHref(rawHref);
      const mergedPath =
        mergedPathMap.get(normalizedLocalPath) ?? normalizedLocalPath;

      const matchingCore = coreNavOrder.find((coreItem) =>
        matchesHref(coreItem.href, mergedPath),
      );

      if (matchingCore) {
        if (!coreLinkByHref.has(matchingCore.href)) {
          coreLinkByHref.set(matchingCore.href, {
            label: matchingCore.label,
            href: matchingCore.href,
            external: false,
            openNewTab: item.openNewTab,
          });
        }
        continue;
      }

      if (suppressedPaths.has(normalizedLocalPath)) {
        continue;
      }

      const localizedHref = getLocalizedHref(locale, rawHref);
      if (extraLinks.some((link) => matchesHref(link.href, localizedHref))) {
        continue;
      }

      extraLinks.push({
        label,
        href: localizedHref,
        external: false,
        openNewTab: item.openNewTab,
      });
    }

    return [
      ...coreNavOrder.map(
        (item) =>
          coreLinkByHref.get(item.href) ?? {
            ...item,
            external: false,
            openNewTab: false,
          },
      ),
      ...extraLinks.filter(
        (item) =>
          !coreNavOrder.some((coreItem) =>
            matchesHref(item.href, coreItem.href),
          ),
      ),
    ];
  })();

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4">
      <nav
        className="container header-shell"
        aria-label={dict.ui.mainNavigation}
      >
        <Logo
          locale={locale}
          variant="horizontal"
          size="md"
          theme="auto"
          priority
          interactive
        />

        <div className="hidden min-w-0 lg:block">
          <NavRail
            items={resolvedLinks.map((link) => ({
              href: link.href,
              label: link.label,
              openNewTab: link.openNewTab,
              active:
                !link.external &&
                (pathname === link.href ||
                  pathname.startsWith(`${link.href}/`)),
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
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("techia:analytics", {
                    detail: {
                      name: "start_project_click",
                      params: { location: "navbar" },
                    },
                  }),
                )
              }
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
              <Logo
                locale={locale}
                variant="horizontal"
                size="sm"
                theme="dark"
                interactive
              />
              <button
                type="button"
                className="icon-button border-white/10 bg-white/[0.06] text-white"
                aria-label={dict.ui.closeMenu}
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="font-script mt-6 text-3xl text-[#FDBA74]">
              {mobilePrompt}
            </p>
            <div className="mt-6 grid max-h-[70vh] gap-2 overflow-y-auto pr-1">
              {resolvedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-[1.3rem] border border-white/10 bg-white/[0.06] p-4 text-lg font-medium text-white"
                  onClick={() => setOpen(false)}
                  {...(link.openNewTab
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={getLocalizedHref(locale, "/start-project")}
                className="btn-primary mt-3 justify-center"
                onClick={() => setOpen(false)}
              >
                {dict.nav.startProject}
              </Link>
            </div>
            <div className="header-action-cluster mt-auto flex items-center justify-between gap-3 pt-6">
              <span className="header-status-pill border-white/10 text-white">
                {launchModeLabel}
              </span>
              <div className="flex items-center gap-3">
                <LanguageSwitcher locale={locale} />
                <ThemeToggle
                  locale={locale}
                  className="border-white/10 bg-white/[0.06] text-white"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
