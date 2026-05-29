"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
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
        className="icon-button justify-self-end lg:hidden"
        aria-label="Open navigation menu"
        aria-controls="mobile-site-nav"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-[#040812]/82 p-4 backdrop-blur-xl lg:hidden"
            onClick={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <motion.div
              id="mobile-site-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="ml-auto flex h-full w-full max-w-sm flex-col rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,15,28,0.98),rgba(8,20,36,0.94))] p-5 text-white shadow-[0_32px_120px_rgba(0,0,0,0.42)]"
            >
              <div className="flex items-center justify-between gap-4">
                <Logo variant="horizontal" size="sm" theme="dark" interactive />
                <button
                  type="button"
                  className="icon-button border-white/10 bg-white/[0.06] text-white"
                  aria-label="Close navigation menu"
                  onClick={() => setOpen(false)}
                >
                  <X className="size-5" />
                </button>
              </div>

              <p className="font-script mt-6 text-3xl text-[#FDBA74]">
                enter the showcase
              </p>

              <div className="mt-6 grid gap-2">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-[1.3rem] border border-white/10 bg-white/[0.06] px-4 py-4 text-lg font-medium text-white"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <Link
                href={ctaHref}
                className={cn(
                  buttonVariants({ variant: "primary", size: "lg" }),
                  "mt-4",
                )}
                onClick={() => setOpen(false)}
              >
                {ctaLabel}
              </Link>

              <div className="header-action-cluster mt-auto flex items-center gap-3 pt-6">
                <LanguageToggle
                  className="bg-white/[0.06] text-white"
                  tone="inverted"
                />
                <ThemeToggle
                  className="border-white/10 bg-white/[0.06] text-white"
                  label="Toggle theme"
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
