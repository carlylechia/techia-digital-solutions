import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  Clock,
  Files,
  FolderKanban,
  MessageCircleMore,
  Receipt,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { getPortalSession, getPortalLocale } from "@/lib/portal-auth";
import { getPortalDict, formatPortalDate, formatPortalCurrency, timeAgoPortal } from "@/lib/portal-i18n";
import { loadPortalOverview } from "@/lib/portal-data";
import { ClientPortalShell } from "@/components/site/client-portal-shell";

export const metadata: Metadata = {
  title: "Overview — Client Portal | teChia",
  description: "Your project overview, latest messages, files, and invoices.",
  robots: { index: false, follow: false },
};

function statusColor(status: string) {
  switch (status) {
    case "ACTIVE": return "text-emerald-400 bg-emerald-400/10 ring-emerald-400/20";
    case "REVIEW": return "text-amber-400 bg-amber-400/10 ring-amber-400/20";
    case "DELIVERED": return "text-cyan-400 bg-cyan-400/10 ring-cyan-400/20";
    case "ON_HOLD": return "text-red-400 bg-red-400/10 ring-red-400/20";
    default: return "text-slate-400 bg-slate-400/10 ring-slate-400/20";
  }
}

function invoiceStatusColor(status: string) {
  switch (status) {
    case "PAID": return "text-emerald-400 bg-emerald-400/10";
    case "SENT": return "text-cyan-400 bg-cyan-400/10";
    case "OVERDUE": return "text-red-400 bg-red-400/10";
    case "DRAFT": return "text-slate-400 bg-slate-400/10";
    default: return "text-slate-400 bg-slate-400/10";
  }
}

export default async function ClientPortalOverviewPage() {
  const session = await getPortalSession();
  if (!session) redirect("/client-portal/login");

  const [locale, data] = await Promise.all([
    getPortalLocale(),
    loadPortalOverview(session.clientId),
  ]);
  const t = getPortalDict(locale);

  if (!data) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-[#030b16] text-white">
        <p className="text-slate-400">{t.overview.unableToLoad}</p>
      </div>
    );
  }

  const { projects, messages, files, invoices, requirements, unreadNotifications } = data;
  const unreadMessages = messages.filter((m) => !m.readAt && m.fromAdmin).length;
  const activeProjects = projects.filter((p) => ["ACTIVE", "REVIEW"].includes(p.status));
  const pendingInvoices = invoices.filter((i) => ["SENT", "OVERDUE"].includes(i.status));
  const pendingRequirements = requirements.filter((r) => r.status === "PENDING");

  const stats = [
    { label: t.overview.activeProjects, value: activeProjects.length, icon: FolderKanban, href: "/client-portal/projects", color: "text-blue-400" },
    { label: t.overview.unreadMessages, value: unreadMessages, icon: MessageCircleMore, href: "/client-portal/messages", color: "text-cyan-400" },
    { label: t.overview.pendingInvoices, value: pendingInvoices.length, icon: Receipt, href: "/client-portal/invoices", color: "text-amber-400" },
    { label: t.overview.openRequests, value: pendingRequirements.length, icon: AlertCircle, href: "/client-portal/requirements", color: "text-rose-400" },
  ];

  return (
    <ClientPortalShell
      locale={locale}
      title={t.overview.pageTitle}
      description={t.overview.pageDescription}
      session={session}
      unreadMessages={unreadMessages}
      unreadNotifications={unreadNotifications}
    >
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4 xl:gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 transition hover:border-white/[0.12] hover:bg-white/[0.05]"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{stat.label}</p>
              <stat.icon className={`size-4 ${stat.color} opacity-70 transition group-hover:opacity-100`} />
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Main content grid */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        {/* Projects */}
        <section className="rounded-xl border border-white/[0.07] bg-white/[0.02]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2">
              <FolderKanban className="size-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">{t.overview.activeProjectsSection}</h2>
            </div>
            <Link
              href="/client-portal/projects"
              className="shrink-0 text-xs text-cyan-400 transition-colors hover:text-cyan-300"
            >
              {t.overview.viewAll}
            </Link>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {projects.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500 sm:px-5">{t.overview.noProjectsYet}</div>
            ) : (
              projects.slice(0, 4).map((project) => (
                <div key={project.id} className="group px-4 py-4 transition hover:bg-white/[0.03] sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-white">{project.title}</p>
                      {project.description && (
                        <p className="mt-0.5 line-clamp-2 break-words text-xs text-slate-500">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${statusColor(project.status)}`}
                    >
                      {t.projects.status[project.status] ?? project.status}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>{t.projects.overallProgress}</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  {project.dueDate && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-600">
                      <Clock className="size-3" />
                      {t.overview.due} {formatPortalDate(project.dueDate, locale)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right column */}
        <div className="grid gap-6">
          {/* Messages preview */}
          <section className="rounded-xl border border-white/[0.07] bg-white/[0.02]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-4 sm:px-5">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <MessageCircleMore className="size-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-white">{t.overview.latestMessages}</h2>
                {unreadMessages > 0 && (
                  <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                    {unreadMessages} {t.messages.newBadge}
                  </span>
                )}
              </div>
              <Link
                href="/client-portal/messages"
                className="shrink-0 text-xs text-cyan-400 transition-colors hover:text-cyan-300"
              >
                {t.overview.viewAll}
              </Link>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {messages.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500 sm:px-5">{t.overview.noMessagesYet}</div>
              ) : (
                messages.slice(0, 3).map((message) => (
                  <Link
                    key={message.id}
                    href="/client-portal/messages"
                    className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-white/[0.03] sm:px-5"
                  >
                    <div className={`mt-0.5 size-2 shrink-0 rounded-full ${!message.readAt && message.fromAdmin ? "bg-cyan-400" : "bg-transparent"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{message.subject}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {message.admin?.name || t.messages.teChiaTeam} · {timeAgoPortal(message.createdAt, locale)}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Recent files */}
          <section className="rounded-xl border border-white/[0.07] bg-white/[0.02]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-4 sm:px-5">
              <div className="flex items-center gap-2">
                <Files className="size-4 text-violet-400" />
                <h2 className="text-sm font-semibold text-white">{t.overview.recentFiles}</h2>
              </div>
              <Link
                href="/client-portal/files"
                className="shrink-0 text-xs text-cyan-400 transition-colors hover:text-cyan-300"
              >
                {t.overview.viewAll}
              </Link>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {files.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500 sm:px-5">{t.overview.noFilesYet}</div>
              ) : (
                files.slice(0, 3).map((file) => (
                  <div
                    key={file.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:px-5"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                      <Files className="size-3.5 text-violet-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-white">{file.name}</p>
                      <p className="break-words text-xs capitalize text-slate-500">
                        {file.category} · {timeAgoPortal(file.createdAt, locale)}
                      </p>
                    </div>
                    {file.url && file.url !== "#not-uploaded" && file.url !== "#" && (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full shrink-0 rounded-lg border border-white/[0.08] px-2.5 py-1 text-center text-[11px] text-slate-400 transition hover:border-white/20 hover:text-white min-[420px]:w-auto"
                      >
                        {t.files.download}
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Invoice summary */}
          <section className="rounded-xl border border-white/[0.07] bg-white/[0.02]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-4 sm:px-5">
              <div className="flex items-center gap-2">
                <Receipt className="size-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white">{t.nav.invoices}</h2>
              </div>
              <Link
                href="/client-portal/invoices"
                className="shrink-0 text-xs text-cyan-400 transition-colors hover:text-cyan-300"
              >
                {t.overview.viewAll}
              </Link>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {invoices.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500 sm:px-5">{t.overview.noInvoicesYet}</div>
              ) : (
                invoices.slice(0, 3).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-white">{invoice.title}</p>
                      <p className="text-xs text-slate-500">{invoice.invoiceNumber}</p>
                    </div>
                    <div className="flex w-full shrink-0 flex-col items-start gap-1 min-[420px]:w-auto min-[420px]:items-end">
                      <p className="text-sm font-semibold text-white">
                        {formatPortalCurrency(invoice.amount, invoice.currency, locale)}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${invoiceStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Pending requirements callout */}
      {pendingRequirements.length > 0 && (
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-start gap-3">
            <AlertCircle className="size-5 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-white">
                {t.overview.pendingRequestsAlert(pendingRequirements.length)}
            </p>
              <p className="text-xs text-slate-400">
                {t.overview.pendingRequestsSubtext}
              </p>
            </div>
          </div>
          <Link
            href="/client-portal/requirements"
            className="w-full rounded-lg bg-amber-500/20 px-4 py-2 text-center text-sm font-semibold text-amber-300 transition hover:bg-amber-500/30 min-[420px]:w-auto"
          >
            {t.overview.respondNow}
          </Link>
        </div>
      )}

      {/* Activity summary */}
      <div className="mt-6 grid gap-3 min-[420px]:grid-cols-2 xl:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
            <CheckCircle2 className="size-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500">{t.overview.completed}</p>
            <p className="text-lg font-bold text-white">
              {projects.filter((p) => p.status === "DELIVERED").length}
              <span className="ml-1 text-xs font-normal text-slate-500">{t.overview.projects}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
            <Activity className="size-4 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500">{t.overview.filesShared}</p>
            <p className="text-lg font-bold text-white">
              {files.length}
              <span className="ml-1 text-xs font-normal text-slate-500">{t.overview.total}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10">
            <TrendingUp className="size-4 text-violet-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500">{t.overview.totalInvoiced}</p>
            <p className="text-lg font-bold text-white">
              {formatPortalCurrency(invoices.reduce((s, i) => s + i.amount, 0), invoices[0]?.currency || "USD", locale)}
            </p>
          </div>
        </div>
      </div>
    </ClientPortalShell>
  );
}
