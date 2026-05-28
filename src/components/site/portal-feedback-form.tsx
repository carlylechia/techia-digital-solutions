"use client";

import { useState, useTransition } from "react";
import { Star, Send, CheckCircle2, MessageSquare } from "lucide-react";
import type { PortalProject } from "@/lib/portal-data";
import type { PortalSession } from "@/lib/portal-auth";
import { submitPortalFeedbackAction } from "@/app/client-portal/actions";
import { usePortalLocale } from "@/lib/portal-locale-context";

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex flex-wrap gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`size-8 transition-colors ${
              star <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-slate-700"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function PortalFeedbackForm({
  projects,
  session,
}: {
  projects: PortalProject[];
  session: PortalSession;
}) {
  const { t } = usePortalLocale();
  const fb = t.feedback;
  const [rating, setRating] = useState(0);
  const [quote, setQuote] = useState("");
  const [name, setName] = useState(session.clientName);
  const [role, setRole] = useState("");
  const [consent, setConsent] = useState(false);
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [submitting, startSubmitting] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) {
      setError(fb.errors.noRating);
      return;
    }
    if (quote.trim().length < 10) {
      setError(fb.errors.tooShort);
      return;
    }
    setError(null);

    const fd = new FormData();
    if (projectId) fd.set("projectId", projectId);
    fd.set("rating", String(rating));
    fd.set("quote", quote.trim());
    fd.set("name", name.trim());
    if (role.trim()) fd.set("role", role.trim());
    fd.set("consent", String(consent));

    startSubmitting(async () => {
      const res = await submitPortalFeedbackAction(fd);
      if (res?.error) {
        setError(res.error);
      } else {
        setSubmitted(true);
      }
    });
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-6 py-16 text-center sm:px-8">
        <CheckCircle2 className="size-12 text-emerald-400" />
        <p className="mt-4 text-lg font-semibold text-white">{fb.successTitle}</p>
        <p className="mt-2 text-sm text-slate-400 max-w-md">{fb.successNote}</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] px-6 py-16 text-center">
        <MessageSquare className="size-10 text-slate-600" />
        <p className="mt-3 text-sm font-medium text-slate-400">{fb.empty}</p>
        <p className="mt-1 text-xs text-slate-600">{fb.emptyNote}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid w-full max-w-2xl gap-6">
      {/* Project selector */}
      {projects.length > 1 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">{fb.projectLabel}</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#0d1b2a]">
                {p.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Overall star rating */}
      <div>
        <label className="mb-3 block text-sm font-medium text-slate-300">{fb.satisfactionLabel}</label>
        <StarRating value={rating} onChange={setRating} />
        {rating > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            {fb.ratingLabels[rating]}
          </p>
        )}
      </div>

      {/* Name and role */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">{fb.nameLabel}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            required
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            {fb.roleLabel} <span className="text-slate-500 font-normal">{fb.optional}</span>
          </label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder={fb.rolePlaceholder}
            maxLength={120}
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
          />
        </div>
      </div>

      {/* Quote */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">{fb.experienceLabel}</label>
        <textarea
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder={fb.experiencePlaceholder}
          rows={5}
          maxLength={2000}
          disabled={submitting}
          className="w-full resize-none rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-slate-600">{quote.length}/2000 (min 10)</p>
      </div>

      {/* Testimonial consent */}
      <label className="flex cursor-pointer items-start gap-3">
        <div className="relative mt-0.5">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="sr-only"
          />
          <div className={`size-5 rounded border transition flex items-center justify-center ${consent ? "border-cyan-500 bg-cyan-600" : "border-white/20 bg-white/[0.04]"}`}>
            {consent && (
              <svg viewBox="0 0 12 10" className="size-3 fill-none stroke-white stroke-2">
                <polyline points="1,5 4,8 11,1" />
              </svg>
            )}
          </div>
        </div>
        <span className="text-sm text-slate-400">
          {fb.consentLabel}
          <span className="mt-0.5 block text-xs text-slate-600">{fb.consentNote}</span>
        </span>
      </label>

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !rating}
        className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:from-cyan-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Send className="size-4" />
        {submitting ? fb.submitting : fb.submit}
      </button>
    </form>
  );
}
