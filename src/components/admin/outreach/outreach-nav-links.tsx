"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/outreach", label: "Dashboard" },
  { href: "/admin/outreach/campaigns", label: "Campaigns" },
  { href: "/admin/outreach/prospects", label: "Prospects" },
  { href: "/admin/outreach/review", label: "Review queue" },
  { href: "/admin/outreach/conversations", label: "Conversations" },
  { href: "/admin/outreach/meetings", label: "Meetings" },
  { href: "/admin/outreach/suppression", label: "Suppression" },
  { href: "/admin/outreach/settings", label: "Settings" },
];

/**
 * Section navigation. A client component only because it needs the live pathname
 * to mark the active tab; the actual protection is the layout guard and the
 * per-action authorization, not this link.
 */
export function OutreachNavLinks({ reviewCount }: { reviewCount: number }) {
  const pathname = usePathname() || "";

  return (
    <nav aria-label="Outreach sections" className="flex flex-wrap gap-2">
      {LINKS.map((link) => {
        const active = link.href === "/admin/outreach" ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              active
                ? "border-accent bg-accent text-[#001018]"
                : "border-border text-muted hover:border-accent hover:text-accent"
            )}
          >
            {link.label}
            {link.href === "/admin/outreach/review" && reviewCount > 0 ? (
              <span className="rounded-full bg-amber-500/20 px-1.5 text-[10px] text-amber-300">{reviewCount}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
