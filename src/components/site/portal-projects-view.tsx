"use client";

import { FolderKanban, Clock, CheckCircle2, Files, Receipt, AlertCircle } from "lucide-react";
import type { PortalProject } from "@/lib/portal-data";
import { usePortalLocale } from "@/lib/portal-locale-context";
import { formatPortalDate } from "@/lib/portal-i18n";

function statusColor(status: string) {
  const map: Record<string, string> = {
    PLANNED: "text-slate-400 bg-slate-400/10 ring-slate-400/20",
    ACTIVE: "text-emerald-400 bg-emerald-400/10 ring-emerald-400/20",
    REVIEW: "text-amber-400 bg-amber-400/10 ring-amber-400/20",
    ON_HOLD: "text-red-400 bg-red-400/10 ring-red-400/20",
    DELIVERED: "text-cyan-400 bg-cyan-400/10 ring-cyan-400/20",
    ARCHIVED: "text-slate-500 bg-slate-500/10 ring-slate-500/20",
  };
  return map[status] || "text-slate-400 bg-slate-400/10 ring-slate-400/20";
}

export function PortalProjectsView({ projects }: { projects: PortalProject[] }) {
  const { locale, t } = usePortalLocale();

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] py-16">
        <FolderKanban className="size-10 text-slate-600" />
        <p className="mt-3 text-sm font-medium text-slate-400">{t.projects.empty}</p>
        <p className="mt-1 text-xs text-slate-600">{t.projects.emptyNote}</p>
      </div>
    );
  }

  const active = projects.filter((p) => ["ACTIVE", "REVIEW"].includes(p.status));
  const other = projects.filter((p) => !["ACTIVE", "REVIEW"].includes(p.status));

  function ProjectCard({ project }: { project: PortalProject }) {
    const label = t.projects.status[project.status as keyof typeof t.projects.status] ?? project.status;
    const color = statusColor(project.status);

    return (
      <article className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden transition hover:border-white/[0.1]">
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <h2 className="break-words text-base font-semibold text-white">{project.title}</h2>
              {project.description && (
                <p className="mt-1 line-clamp-3 break-words text-sm text-slate-400">
                  {project.description}
                </p>
              )}
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${color}`}>
              {label}
            </span>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>{t.projects.overallProgress}</span>
              <span className="font-semibold text-slate-300">{project.progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
            {project.startDate && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>{t.projects.started(formatPortalDate(project.startDate, locale) ?? "")}</span>
              </div>
            )}
            {project.dueDate && !project.completedAt && (
              <div className="flex items-center gap-1.5">
                <Clock className={`size-3.5 ${new Date(project.dueDate) < new Date() && project.status !== "DELIVERED" ? "text-red-400" : "text-slate-500"}`} />
                <span>{t.projects.due(formatPortalDate(project.dueDate, locale) ?? "")}</span>
              </div>
            )}
            {project.completedAt && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-cyan-400" />
                <span>{t.projects.delivered(formatPortalDate(project.completedAt, locale) ?? "")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats footer */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-white/[0.06] bg-white/[0.02] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Files className="size-3.5" />
            <span>{t.projects.files(project.portalFiles.length)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Receipt className="size-3.5" />
            <span>{t.projects.invoices(project.portalInvoices.length)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <AlertCircle className="size-3.5" />
            <span>{t.projects.requests(project.portalRequirements.length)}</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="grid gap-6">
      {active.length > 0 && (
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-emerald-400/70">
            {t.projects.sectionActive(active.length)}
          </p>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {active.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        </div>
      )}
      {other.length > 0 && (
        <div>
          {active.length > 0 && (
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-600">
              {t.projects.sectionOther}
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {other.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}


