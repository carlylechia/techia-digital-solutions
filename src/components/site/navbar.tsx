"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { marketingNav } from "@/content/nexus-site";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonVariants } from "./button";
import { LanguageToggle } from "./language-toggle";
import { MobileNav } from "./mobile-nav";
import { NavRail } from "@/components/layout/nav-rail";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4">
      <nav className="container header-shell" aria-label="Primary">
        <Logo
          variant="horizontal"
          size="sm"
          theme="auto"
          priority
          interactive
          className="marketing-navbar-logo lg:hidden"
        />
        <Logo
          variant="horizontal"
          size="md"
          theme="auto"
          priority
          interactive
          className="marketing-navbar-logo hidden lg:inline-flex"
        />

        <div className="hidden min-w-0 lg:block">
          <NavRail
            items={marketingNav.map((item) => ({
              href: item.href,
              label: item.label,
              active: pathname === item.href || pathname.startsWith(`${item.href}/`)
            }))}
            hintLabel="Scroll"
            hintActionLabel="Scroll navigation"
          />
        </div>

        <div className="hidden items-center justify-end gap-3 lg:flex">
          <div className="header-action-cluster">
            <span className="header-status-pill">Design Lab</span>
            <LanguageToggle />
            <ThemeToggle label="Toggle color theme" />
            <Link href="/request-quote" className={cn(buttonVariants({ variant: "primary", size: "md" }), "px-5 py-3")}>
              Start a Project
            </Link>
          </div>
        </div>

        <MobileNav
          key={pathname}
          items={marketingNav}
          ctaLabel="Start a Project"
          ctaHref="/request-quote"
        />
      </nav>
    </header>
  );
}
