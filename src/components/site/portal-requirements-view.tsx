"use client";

import { useState, useRef, useTransition } from "react";
import { AlertCircle, Upload, CheckCircle2, Clock, ChevronDown, ChevronUp, Send } from "lucide-react";
import type { PortalRequirement } from "@/lib/portal-data";
import { submitRequirementResponseAction } from "@/app/client-portal/actions";
import { usePortalLocale } from "@/lib/portal-locale-context";
import { formatPortalDate } from "@/lib/portal-i18n";


function RequirementCard({ requirement }: { requirement: PortalRequirement }) {
  const { locale, t } = usePortalLocale();
  const rq = t.requests;
  const statusMap: Record<string, { label: string; color: string; Icon: typeof AlertCircle }> = {
    PENDING:   { label: rq.status.PENDING,   color: "text-amber-400 bg-amber-400/10 ring-amber-400/20",   Icon: Clock },
    SUBMITTED: { label: rq.status.SUBMITTED, color: "text-cyan-400 bg-cyan-400/10 ring-cyan-400/20",     Icon: CheckCircle2 },
    APPROVED:  { label: rq.status.APPROVED,  color: "text-emerald-400 bg-emerald-400/10 ring-emerald-400/20", Icon: CheckCircle2 },
    REJECTED:  { label: rq.status.REJECTED,  color: "text-red-400 bg-red-400/10 ring-red-400/20",       Icon: AlertCircle },
  };
  const { label, color, Icon } = statusMap[requirement.status] ?? { label: requirement.status, color: "text-slate-400 bg-slate-400/10 ring-slate-400/20", Icon: AlertCircle };
  const typeDisplay = rq.types[requirement.type as keyof typeof rq.types] ?? requirement.type;
  const [open, setOpen] = useState(requirement.status === "PENDING");
  const [response, setResponse] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, startSubmitting] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!response.trim() && !file) return;
    setError(null);

    const fd = new FormData();
    fd.set("requirementId", requirement.id);
    if (response.trim()) fd.set("response", response.trim());
    if (file) fd.set("file", file);

    startSubmitting(async () => {
      const res = await submitRequirementResponseAction(fd);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
      }
    });
  }

  return (
    <article className={`rounded-xl border overflow-hidden transition ${requirement.status === "PENDING" ? "border-amber-500/20 bg-amber-500/[0.03]" : "border-white/[0.07] bg-white/[0.02]"}`}>
      <button
        type="button"
        className="flex w-full flex-wrap items-start gap-3 px-4 py-4 text-left sm:gap-4 sm:px-5"
        onClick={() => setOpen((v) => !v)}
      >
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ${color}`}>
          <Icon className="size-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 capitalize">{typeDisplay}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${color}`}>
              {label}
            </span>
          </div>
          <p className="mt-0.5 font-medium text-white">{requirement.title}</p>
          {requirement.dueDate && !open && (
            <p className="mt-0.5 text-xs text-slate-500">{rq.due(formatPortalDate(requirement.dueDate, locale) ?? "")}</p>
          )}
        </div>

        {open ? <ChevronUp className="size-4 shrink-0 text-slate-500 mt-1" /> : <ChevronDown className="size-4 shrink-0 text-slate-500 mt-1" />}
      </button>

      {open && (
        <div className="space-y-4 border-t border-white/[0.06] px-4 py-4 sm:px-5">
          {/* Description */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
            <p className="break-words text-sm leading-7 text-slate-300">{requirement.description}</p>
            {requirement.dueDate && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="size-3.5" />
              {rq.due(formatPortalDate(requirement.dueDate, locale) ?? "")}
              </p>
            )}
          </div>

          {/* Previous response */}
          {requirement.response && (
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{rq.yourResponse}</p>
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4">
                <p className="break-words text-sm text-slate-300">{requirement.response}</p>
                {requirement.submittedAt && (
                  <p className="mt-1 text-xs text-slate-600">{rq.submitted(formatPortalDate(requirement.submittedAt, locale) ?? "")}</p>
                )}
              </div>
            </div>
          )}

          {/* Admin notes/feedback */}
          {requirement.status === "REJECTED" && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4">
              <p className="text-xs font-semibold text-red-400 mb-1">{rq.techiaFeedback}</p>
              <p className="text-sm text-slate-300">{rq.needsRevisionNote}</p>
            </div>
          )}

          {/* Response form */}
          {(requirement.status === "PENDING" || requirement.status === "REJECTED") && !success && (
            <form onSubmit={handleSubmit} className="grid gap-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{rq.submitSection}</p>

              {error && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              )}

              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder={rq.responsePlaceholder}
                rows={4}
                maxLength={10000}
                disabled={submitting}
                className="w-full resize-none rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50"
              />

              {/* File attachment */}
              <div
                className="flex cursor-pointer flex-wrap items-center gap-2 rounded-xl border border-dashed border-white/[0.1] px-4 py-3 transition hover:border-white/20"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-4 text-slate-500" />
                <span className="min-w-0 flex-1 break-all text-sm text-slate-500">
                  {file ? file.name : rq.attachFile}
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || (!response.trim() && !file)}
                className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="size-4" />
                {submitting ? rq.submitting : rq.submit}
              </button>
            </form>
          )}

          {success && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <p className="text-sm font-medium text-emerald-300">{rq.successNote}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function PortalRequirementsView({
  requirements,
}: {
  requirements: PortalRequirement[];
}) {
  const { t } = usePortalLocale();
  const rq = t.requests;
  if (requirements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] py-16">
        <CheckCircle2 className="size-10 text-slate-600" />
        <p className="mt-3 text-sm font-medium text-slate-400">{rq.empty}</p>
        <p className="mt-1 text-xs text-slate-600">{rq.emptyNote}</p>
      </div>
    );
  }

  const pending = requirements.filter((r) => ["PENDING", "REJECTED"].includes(r.status));
  const done = requirements.filter((r) => !["PENDING", "REJECTED"].includes(r.status));

  return (
    <div className="grid gap-6">
      {pending.length > 0 && (
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-amber-400/70">
            {rq.pendingSection(pending.length)}
          </p>
          <div className="grid gap-3">
            {pending.map((r) => <RequirementCard key={r.id} requirement={r} />)}
          </div>
        </div>
      )}
      {done.length > 0 && (
        <div>
          {pending.length > 0 && (
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-600">
              {rq.completedSection}
            </p>
          )}
          <div className="grid gap-3">
            {done.map((r) => <RequirementCard key={r.id} requirement={r} />)}
          </div>
        </div>
      )}
    </div>
  );
}
