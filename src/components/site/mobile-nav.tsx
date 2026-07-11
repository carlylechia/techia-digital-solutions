"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { NavigationItem } from "@/content/nexus-site";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function MobileNav({
  items,
  ctaLabel,
  ctaHref,
}: {
  items: NavigationItem[];
  ctaLabel: string;
  ctaHref: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const portalTarget =
    typeof document === "undefined" ? null : document.body;

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

  return (
    <>
      <button
        type="button"
        className="icon-button marketing-navbar-menu-button justify-self-end lg:hidden"
        aria-label="Open navigation menu"
        aria-controls="mobile-site-nav"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </button>
      {portalTarget
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[90] bg-[linear-gradient(180deg,rgba(4,8,18,0.92),rgba(4,8,18,0.76))] p-3 backdrop-blur-2xl sm:p-4 lg:hidden"
                  onClick={(event) => {
                    if (event.target === event.currentTarget) setOpen(false);
                  }}
                >
                  <motion.div
                    id="mobile-site-nav"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Mobile navigation"
                    initial={{ x: "100%", opacity: 0.92 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0.92 }}
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    className="marketing-mobile-nav-panel ml-auto flex h-full w-full max-w-sm flex-col"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="marketing-mobile-nav-header-copy min-w-0">
                        <p className="eyebrow text-white/70">Navigation</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          Browse the teChia gateway without duplicating the
                          header branding.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="icon-button border-white/10 bg-white/[0.06] text-white"
                        aria-label="Close navigation menu"
                        onClick={() => setOpen(false)}
                      >
                        <X className="size-5" />
                      </button>
                    </div>

                    <div className="marketing-mobile-nav-intro mt-6">
                      <span className="header-status-pill border-white/10 text-white">
                        Global gateway
                      </span>
                      <p className="font-script mt-4 text-3xl text-[#FDBA74]">
                        enter the showcase
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        Navigate the full teChia experience with a clearer,
                        distraction-free mobile menu.
                      </p>
                    </div>

                    <div className="marketing-mobile-nav-links mt-6 grid gap-2 overflow-y-auto pr-1">
                      {items.map((item) => {
                        const active =
                          pathname === item.href ||
                          pathname.startsWith(`${item.href}/`);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "marketing-mobile-nav-link rounded-[1.3rem] px-4 py-4 text-base font-semibold sm:text-lg",
                              active &&
                                "border-cyan-300/30 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(255,255,255,0.1))] text-white shadow-[0_18px_40px_rgba(6,182,212,0.18)]",
                            )}
                            onClick={() => setOpen(false)}
                          >
                            <span>{item.label}</span>
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-white/55">
                              {active ? "Current page" : "Open page"}
                            </span>
                          </Link>
                        );
                      })}
                    </div>

                    <Link
                      href={ctaHref}
                      className={cn(
                        buttonVariants({ variant: "primary", size: "lg" }),
                        "mt-4 justify-center",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      {ctaLabel}
                    </Link>

                    <div className="mt-auto flex flex-wrap items-center gap-3 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-6">
                      <div className="header-action-cluster w-fit">
                        <LanguageToggle
                          className="bg-white/[0.06] text-white"
                          tone="inverted"
                        />
                        <ThemeToggle
                          className="border-white/10 bg-white/[0.06] text-white"
                          label="Toggle theme"
                        />
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            portalTarget,
          )
        : null}
    </>
  );
}
