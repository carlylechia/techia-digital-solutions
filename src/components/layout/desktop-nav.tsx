"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type DesktopNavItem = {
  label: string;
  href: string;
  description?: string;
  active?: boolean;
  external?: boolean;
  openNewTab?: boolean;
};

export type DesktopNavEntry =
  | {
      kind: "menu";
      id: string;
      label: string;
      items: DesktopNavItem[];
      footerLinks?: DesktopNavItem[];
      wide?: boolean;
    }
  | {
      kind: "link";
      id: string;
      label: string;
      href: string;
      active?: boolean;
      external?: boolean;
      openNewTab?: boolean;
    };

function NavLink({
  item,
  className,
  onNavigate,
}: {
  item: DesktopNavItem;
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      className={className}
      data-active={item.active}
      onClick={onNavigate}
      {...(item.external || item.openNewTab
        ? {
            target: "_blank",
            rel: "noopener noreferrer",
          }
        : {})}
    >
      {item.label}
    </Link>
  );
}

/**
 * Minimal desktop navigation with accessible disclosure menus.
 * The menus support pointer hover, click, Escape, and ArrowDown to enter.
 */
export function DesktopNav({ entries }: { entries: DesktopNavEntry[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenId(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!openId) return;
    const activeId = openId;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      triggerRefs.current[activeId]?.focus();
      setOpenId(null);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openId]);

  function focusFirstItem(id: string) {
    window.requestAnimationFrame(() => {
      const panel = document.getElementById(`desktop-nav-panel-${id}`);
      panel?.querySelector<HTMLElement>("a, button")?.focus();
    });
  }

  return (
    <ul ref={navRef} className="desktop-nav">
      {entries.map((entry) => {
        if (entry.kind === "link") {
          return (
            <li key={entry.id}>
              <Link
                href={entry.href}
                className="desktop-nav-link"
                data-active={entry.active}
                {...(entry.external || entry.openNewTab
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {entry.label}
              </Link>
            </li>
          );
        }

        const isOpen = openId === entry.id;
        const isActive = entry.items.some((item) => item.active);

        return (
          <li
            key={entry.id}
            className="desktop-nav-item"
            onMouseEnter={() => setOpenId(entry.id)}
            onMouseLeave={() => setOpenId(null)}
          >
            <button
              ref={(node) => {
                triggerRefs.current[entry.id] = node;
              }}
              type="button"
              className="desktop-nav-link"
              data-active={isActive}
              aria-expanded={isOpen}
              aria-controls={`desktop-nav-panel-${entry.id}`}
              onClick={() =>
                setOpenId((current) => (current === entry.id ? null : entry.id))
              }
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setOpenId(entry.id);
                  focusFirstItem(entry.id);
                }
              }}
            >
              {entry.label}
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "desktop-nav-chevron size-3.5",
                  isOpen && "rotate-180",
                )}
              />
            </button>

            {isOpen ? (
              <div
                id={`desktop-nav-panel-${entry.id}`}
                className={cn(
                  "desktop-nav-panel",
                  entry.wide && "desktop-nav-panel--wide",
                )}
              >
                <p className="desktop-nav-panel-eyebrow">{entry.label}</p>
                <ul className="desktop-nav-grid">
                  {entry.items.map((item) => (
                    <li key={`${item.href}-${item.label}`}>
                      <NavLink
                        item={item}
                        className="desktop-nav-panel-link"
                        onNavigate={() => setOpenId(null)}
                      />
                      {item.description ? (
                        <p className="desktop-nav-panel-description">
                          {item.description}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>

                {entry.footerLinks?.length ? (
                  <div className="desktop-nav-panel-footer">
                    {entry.footerLinks.map((item) => (
                      <NavLink
                        key={`${item.href}-${item.label}`}
                        item={item}
                        className="desktop-nav-panel-footer-link"
                        onNavigate={() => setOpenId(null)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
