"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LayoutDashboard, Target, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminSectionBreadcrumbs({ locale }: { locale: string }) {
  const pathname = usePathname() || "";
  const inCrm = pathname.startsWith(`/${locale}/admin/crm`);
  const inOutreach = pathname.startsWith(`/${locale}/admin/outreach`);

  const crumbs = [
    { href: `/${locale}/admin`, label: "Admin workspace", icon: LayoutDashboard, active: false },
    {
      href: `/${locale}/admin/crm`,
      label: "CRM contacts",
      icon: Users,
      active: inCrm,
    },
    {
      href: `/${locale}/admin/outreach`,
      label: "Outreach console",
      icon: Target,
      active: inOutreach,
    },
  ];

  return (
    <nav aria-label="Admin sections" className="flex flex-wrap items-center gap-1.5 text-xs">
      {crumbs.map((crumb, index) => {
        const Icon = crumb.icon;
        return (
          <span key={crumb.href} className="inline-flex items-center gap-1.5">
            {index > 0 ? <ChevronRight className="size-3 text-muted" /> : null}
            <Link
              href={crumb.href}
              aria-current={crumb.active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors",
                crumb.active
                  ? "bg-accent/10 font-semibold text-accent"
                  : "text-muted hover:bg-surface hover:text-primary"
              )}
            >
              <Icon className="size-3.5" />
              {crumb.label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}