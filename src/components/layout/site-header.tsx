"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getDictionary,
  getLocalizedHref,
  getLocalizedSectionHref,
  mergedPageAnchors,
  type Locale,
} from "@/content/site";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { DesktopNav, type DesktopNavEntry } from "./desktop-nav";
import { getBlogIndexPath } from "@/lib/blog/slug";

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
  const mobilePrompt =
    locale === "fr" ? "naviguer dans le flagship" : "navigate the flagship";
  const coreNavOrder = [
    { href: getLocalizedHref(locale, "/services"), label: dict.nav.services },
    { href: getLocalizedHref(locale, "/courses"), label: dict.nav.courses },
    { href: getBlogIndexPath(locale), label: dict.nav.blog },
    { href: getLocalizedHref(locale, "/demo-lab"), label: dict.nav.demoLab },
    {
      href: getLocalizedHref(locale, "/ai-consultant"),
      label: dict.nav.aiConsultant,
    },
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

      const corePath = normalizedLocalPath === "/blog" ? getBlogIndexPath(locale) : mergedPath;
      const matchingCore = coreNavOrder.find((coreItem) =>
        matchesHref(coreItem.href, corePath),
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

  const navCopy =
    locale === "fr"
      ? {
          resources: "Ressources",
          more: "Plus",
          servicesHint: "Le catalogue complet des capacités teChia.",
          allServices: "Tous les services",
          allServicesHint: "Explorer toute l’offre de croissance.",
          solutions: "Modules de solutions",
          industries: "Secteurs servis",
          pricing: "Offres",
          aboutHint: "L’entreprise, l’équipe et les principes de travail.",
          founderHint: "L’histoire et la vision derrière teChia.",
          portfolioHint: "Des projets sélectionnés et leurs résultats.",
          processHint: "Comment teChia passe du brief au lancement.",
          portal: "Portail client",
          portalHint: "Un espace privé pour les clients actifs.",
          blogHint: "Conseils pratiques sur la croissance digitale.",
          coursesHint: "Des packs de compétences digitales concrètes.",
          demoHint: "Des exemples interactifs de systèmes livrés.",
          aiHint: "Obtenir une recommandation guidée en quelques minutes.",
        }
      : {
          resources: "Resources",
          more: "More",
          servicesHint: "The full teChia capability catalogue.",
          allServices: "All services",
          allServicesHint: "Explore the full growth-service catalogue.",
          solutions: "Solution modules",
          industries: "Industries served",
          pricing: "Pricing",
          aboutHint: "The company, team, and operating principles.",
          founderHint: "The story and thinking behind teChia.",
          portfolioHint: "Selected projects and business outcomes.",
          processHint: "How teChia moves from brief to launch.",
          portal: "Client portal",
          portalHint: "A private workspace for active clients.",
          blogHint: "Practical growth and digital strategy insights.",
          coursesHint: "Practical digital skills packs for teams.",
          demoHint: "Hands-on examples of systems we build.",
          aiHint: "Get a guided recommendation in minutes.",
        };

  const servicesHref = getLocalizedHref(locale, "/services");
  const contactHref = getLocalizedHref(locale, "/contact");
  const portfolioHref = getLocalizedSectionHref(
    locale,
    "/about",
    mergedPageAnchors.about.portfolio,
  );

  const desktopEntries: DesktopNavEntry[] = [
    {
      kind: "menu",
      id: "services",
      label: dict.nav.services,
      wide: true,
      items: [
        {
          label: navCopy.allServices,
          href: servicesHref,
          description: navCopy.allServicesHint,
          active: matchesHref(pathname, servicesHref),
        },
        ...dict.services.slice(0, 6).map((service) => {
          const href = getLocalizedHref(locale, `/services/${service.slug}`);
          return {
            label: service.title,
            href,
            description: service.description,
            active: matchesHref(pathname, href),
          };
        }),
      ],
      footerLinks: [
        {
          label: navCopy.solutions,
          href: getLocalizedSectionHref(
            locale,
            "/services",
            mergedPageAnchors.services.solutions,
          ),
          active: matchesHref(
            pathname,
            getLocalizedSectionHref(
              locale,
              "/services",
              mergedPageAnchors.services.solutions,
            ),
          ),
        },
        {
          label: navCopy.industries,
          href: getLocalizedSectionHref(
            locale,
            "/services",
            mergedPageAnchors.services.industries,
          ),
          active: matchesHref(
            pathname,
            getLocalizedSectionHref(
              locale,
              "/services",
              mergedPageAnchors.services.industries,
            ),
          ),
        },
        {
          label: navCopy.pricing,
          href: getLocalizedHref(locale, "/pricing"),
          active: matchesHref(pathname, getLocalizedHref(locale, "/pricing")),
        },
      ],
    },
    {
      kind: "menu",
      id: "company",
      label: dict.ui.company,
      items: [
        {
          label: dict.nav.about,
          href: getLocalizedHref(locale, "/about"),
          description: navCopy.aboutHint,
          active: matchesHref(pathname, getLocalizedHref(locale, "/about")),
        },
        {
          label: dict.nav.founder,
          href: getLocalizedHref(locale, "/founder"),
          description: navCopy.founderHint,
          active: matchesHref(pathname, getLocalizedHref(locale, "/founder")),
        },
        {
          label: dict.nav.portfolio,
          href: portfolioHref,
          description: navCopy.portfolioHint,
          active: matchesHref(pathname, portfolioHref),
        },
        {
          label: locale === "fr" ? "Processus" : "Process",
          href: getLocalizedHref(locale, "/process"),
          description: navCopy.processHint,
          active: matchesHref(pathname, getLocalizedHref(locale, "/process")),
        },
        {
          label: navCopy.portal,
          href: "/client-portal",
          description: navCopy.portalHint,
          active: matchesHref(pathname, "/client-portal"),
        },
      ],
    },
    {
      kind: "menu",
      id: "resources",
      label: navCopy.resources,
      items: [
        {
          label: dict.nav.blog,
          href: getBlogIndexPath(locale),
          description: navCopy.blogHint,
          active: matchesHref(pathname, getBlogIndexPath(locale)),
        },
        {
          label: dict.nav.courses,
          href: getLocalizedHref(locale, "/courses"),
          description: navCopy.coursesHint,
          active: matchesHref(pathname, getLocalizedHref(locale, "/courses")),
        },
        {
          label: dict.nav.demoLab,
          href: getLocalizedHref(locale, "/demo-lab"),
          description: navCopy.demoHint,
          active: matchesHref(pathname, getLocalizedHref(locale, "/demo-lab")),
        },
        {
          label: dict.nav.aiConsultant,
          href: getLocalizedHref(locale, "/ai-consultant"),
          description: navCopy.aiHint,
          active: matchesHref(pathname, getLocalizedHref(locale, "/ai-consultant")),
        },
      ],
    },
    {
      kind: "link",
      id: "contact",
      label: dict.nav.contact,
      href: contactHref,
      active: matchesHref(pathname, contactHref),
    },
  ];

  const usedDesktopHrefs = new Set<string>();
  for (const entry of desktopEntries) {
    if (entry.kind === "link") {
      usedDesktopHrefs.add(entry.href);
      continue;
    }
    entry.items.forEach((item) => usedDesktopHrefs.add(item.href.split("#")[0]));
    entry.footerLinks?.forEach((item) =>
      usedDesktopHrefs.add(item.href.split("#")[0]),
    );
  }

  const extraDesktopLinks = resolvedLinks.filter(
    (link) => !usedDesktopHrefs.has(link.href.split("#")[0]),
  );

  if (extraDesktopLinks.length) {
    desktopEntries.push({
      kind: "menu",
      id: "more",
      label: navCopy.more,
      items: extraDesktopLinks.map((link) => ({
        label: link.label,
        href: link.href,
        external: link.external,
        openNewTab: link.openNewTab,
        active: !link.external && matchesHref(pathname, link.href),
      })),
    });
  }

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

        <div className="hidden min-w-0 justify-center lg:flex">
          <DesktopNav entries={desktopEntries} />
        </div>

        <div className="hidden items-center justify-end gap-2 lg:flex">
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

        <button
          type="button"
          className="icon-button justify-self-end lg:hidden"
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
          className="fixed inset-0 z-[80] bg-[#040812]/82 p-4 backdrop-blur-2xl lg:hidden"
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
            <div className="header-action-cluster mt-auto flex flex-wrap items-center justify-between gap-3 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-6">
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
