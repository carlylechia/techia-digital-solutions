"use client";

import Link from "next/link";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type NavRailItem = {
  href: string;
  label: string;
  active?: boolean;
  openNewTab?: boolean;
};

export function NavRail({
  items,
  className,
  hintLabel = "Scroll",
  hintActionLabel = "Scroll navigation"
}: {
  items: NavRailItem[];
  className?: string;
  hintLabel?: string;
  hintActionLabel?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;

    const updateScrollState = () => {
      const { scrollLeft, scrollWidth, clientWidth } = node;
      const overflowing = scrollWidth - clientWidth > 12;
      const atStart = scrollLeft <= 4;
      const atEnd = scrollLeft + clientWidth >= scrollWidth - 4;

      setCanScroll(overflowing);
      setCanScrollLeft(overflowing && !atStart);
      setCanScrollRight(overflowing && !atEnd);
    };

    updateScrollState();

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(node);
    Array.from(node.children).forEach((child) => resizeObserver.observe(child));

    node.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      resizeObserver.disconnect();
      node.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [items]);

  const scrollByAmount = () => {
    const node = trackRef.current;
    if (!node) return;

    const direction = canScrollRight ? 1 : -1;
    node.scrollBy({
      left: Math.max(180, node.clientWidth * 0.45) * direction,
      behavior: "smooth"
    });
  };

  return (
    <div
      className={cn("nav-scroll-shell", className)}
      data-can-scroll={canScroll}
      data-can-scroll-left={canScrollLeft}
      data-can-scroll-right={canScrollRight}
    >
      <div ref={trackRef} className="nav-scroll-track scrollbar-hidden">
        {items.map((item) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className="nav-link"
            data-active={item.active}
            {...(item.openNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <button
        type="button"
        className="nav-scroll-button"
        onClick={scrollByAmount}
        aria-label={hintActionLabel}
        data-direction={canScrollRight ? "right" : "left"}
        hidden={!canScroll}
      >
        <span className="sr-only">{hintLabel}</span>
        {canScrollRight ? <ChevronsRight className="nav-scroll-button-icon size-4" /> : <ChevronsLeft className="nav-scroll-button-icon size-4" />}
      </button>
    </div>
  );
}
