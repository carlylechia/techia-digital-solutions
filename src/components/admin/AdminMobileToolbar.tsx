"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUp, Menu } from "lucide-react";
import { usePathname } from "next/navigation";

export function AdminMobileToolbar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const isAdminHome = pathname === `/${locale}/admin`;

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3">
      {showScrollTop ? (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="grid size-11 place-items-center rounded-full border border-border bg-surface text-primary shadow-lg transition hover:border-accent hover:text-accent"
        >
          <ArrowUp className="size-5" aria-hidden="true" />
        </button>
      ) : null}

      {!isAdminHome ? (
        <Link
          href={`/${locale}/admin`}
          aria-label="Open admin menu"
          className="grid size-11 place-items-center rounded-full border border-accent/40 bg-accent text-[#001018] shadow-lg transition hover:bg-accent/90 lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
