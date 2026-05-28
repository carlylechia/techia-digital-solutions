"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ClipboardList,
  Files,
  FolderKanban,
  Globe2,
  LayoutDashboard,
  LogOut,
  MessageCircleMore,
  Receipt,
  Star,
  X,
} from "lucide-react";
import { type ReactNode, useState, useTransition } from "react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import type { PortalSession } from "@/lib/portal-auth";
import { portalLogoutAction } from "@/app/client-portal/actions";
import { PortalLocaleProvider, usePortalLocale } from "@/lib/portal-locale-context";
import type { PortalLocale } from "@/lib/portal-i18n";

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  unread,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  unread?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
        active
          ? "bg-white/10 text-white"
          : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? "text-cyan-300" : "text-slate-500 group-hover:text-slate-300"
        )}
      />
      <span className="flex-1 truncate">{label}</span>
      {unread && unread > 0 ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500/20 px-1.5 text-[10px] font-bold text-cyan-300 ring-1 ring-cyan-500/30">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
      {active && (
        <span className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-cyan-400" />
      )}
    </Link>
  );
}

/** Locale toggle button — updates cookie and triggers a full server re-render */
function LocaleToggle() {
  const { locale, t } = usePortalLocale();
  const router = useRouter();

  function toggle() {
    const next: PortalLocale = locale === "en" ? "fr" : "en";
    document.cookie = `techia-portal-locale=${next}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={t.shell.langToggleLabel}
      aria-label={t.shell.langToggleLabel}
      className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 transition hover:border-white/[0.15] hover:bg-white/[0.07] hover:text-white"
    >
      <Globe2 className="size-3.5" />
      {t.shell.langToggleCode}
    </button>
  );
}

function PortalShellInner({
  title,
  description,
  children,
  session,
  unreadMessages = 0,
  unreadNotifications = 0,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  session: PortalSession;
  unreadMessages?: number;
  unreadNotifications?: number;
}) {
  const { t } = usePortalLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const NAV_ITEMS = [
    { href: "/client-portal", label: t.nav.overview, icon: LayoutDashboard, exact: true },
    { href: "/client-portal/projects", label: t.nav.projects, icon: FolderKanban },
    { href: "/client-portal/messages", label: t.nav.messages, icon: MessageCircleMore },
    { href: "/client-portal/files", label: t.nav.files, icon: Files },
    { href: "/client-portal/invoices", label: t.nav.invoices, icon: Receipt },
    { href: "/client-portal/requirements", label: t.nav.requests, icon: ClipboardList },
    { href: "/client-portal/feedback", label: t.nav.feedback, icon: Star },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  function handleLogout() {
    startTransition(async () => {
      await portalLogoutAction();
      router.push("/client-portal/login");
    });
  }

  const initials = session.clientName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const SidebarContent = (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Logo + close */}
      <div className="flex h-16 shrink-0 items-center justify-between px-4">
        <Logo variant="horizontal" size="sm" theme="dark" />
        <button
          type="button"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label={t.shell.closeMenu}
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Client info card */}
      <div className="mx-3 mb-5 rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/80">
          {t.shell.yourWorkspace}
        </p>
        <p className="mt-1.5 break-words text-sm font-semibold text-white">
          {session.clientName}
        </p>
        <p className="mt-0.5 break-all text-xs text-slate-500">{session.clientEmail}</p>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={t.shell.navigation}
      >
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          {t.shell.navigation}
        </p>
        <div className="grid gap-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href, item.exact)}
              unread={item.href === "/client-portal/messages" ? unreadMessages : undefined}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-white/[0.07] p-3">
        <div className="relative">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-white/[0.06]"
            onClick={() => setShowUserMenu((v) => !v)}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="flex-1 overflow-hidden text-left">
              <p className="truncate text-sm font-medium text-white">{session.clientName}</p>
              <p className="text-xs text-slate-500">{t.shell.client}</p>
            </div>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-slate-500 transition-transform duration-200",
                showUserMenu && "rotate-180"
              )}
            />
          </button>
          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-white/[0.1] bg-[#0a1627] p-1.5 shadow-2xl">
              <button
                type="button"
                disabled={isPending}
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
              >
                <LogOut className="size-4" />
                {isPending ? t.shell.signingOut : t.shell.signOut}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="dark min-h-screen bg-[#030b16] text-white">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        {/* Desktop sidebar — fixed, scrolls independently */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-white/[0.07] bg-[#040d1c]">
            {SidebarContent}
          </div>
        </aside>

        {/* Mobile sidebar — slide from left */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100vw-1rem))] max-w-full flex-col border-r border-white/[0.07] bg-[#040d1c] shadow-2xl transition-transform duration-300 lg:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {SidebarContent}
        </aside>

        {/* Main area */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          {/* Sticky header */}
          <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#030b16]/90 backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-full max-w-[112rem] items-center gap-3 px-3 sm:px-4 lg:px-8">
              {/* Hamburger (mobile) */}
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label={t.shell.openMenu}
              >
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              <div className="flex-1 overflow-hidden">
                <h1 className="truncate text-sm font-semibold text-white sm:text-base lg:text-lg">
                  {title}
                </h1>
                {description && (
                  <p className="hidden truncate text-xs text-slate-500 lg:block">{description}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Language toggle */}
                <LocaleToggle />

                <button
                  type="button"
                  className="relative rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label={
                    unreadNotifications > 0
                      ? `${unreadNotifications} ${t.shell.notifications.toLowerCase()}`
                      : t.shell.notifications
                  }
                >
                  <Bell className="size-4.5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-cyan-400 ring-2 ring-[#030b16]" />
                  )}
                </button>

                {/* Avatar (mobile only — desktop shows in sidebar) */}
                <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white lg:hidden">
                  {initials}
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main id="main-content" className="flex-1 px-3 py-5 sm:px-4 sm:py-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-[112rem]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

export function ClientPortalShell({
  locale,
  ...props
}: {
  locale: PortalLocale;
  title: string;
  description?: string;
  children: ReactNode;
  session: PortalSession;
  unreadMessages?: number;
  unreadNotifications?: number;
}) {
  return (
    <PortalLocaleProvider locale={locale}>
      <PortalShellInner {...props} />
    </PortalLocaleProvider>
  );
}


