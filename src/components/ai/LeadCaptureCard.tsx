"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import type { AcademyRecommendation } from "@/lib/ai/recommendation";

interface Props {
  conversationId: string | null;
  onSuccess: (recommendation?: AcademyRecommendation | null) => void;
  recommendedItem?: AcademyRecommendation | null;
  checkoutUrl?: string;
  checkoutLabel?: string;
  locale?: "en" | "fr";
  /** Set to 0 in tests or when a caller wants to show the link only. */
  autoRedirectMs?: number;
}

export function LeadCaptureCard({
  conversationId,
  onSuccess,
  recommendedItem,
  checkoutUrl,
  checkoutLabel,
  locale = "en",
  autoRedirectMs = 1800,
}: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    serviceInterest: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  // Once the server has validated (or rejected) the recommendation, its answer
  // is authoritative. `attempted: true` with a null recommendation means the
  // item is no longer purchasable, so we must not fall back to a stale client
  // checkout URL.
  const [resolution, setResolution] = useState<{
    attempted: boolean;
    recommendation: AcademyRecommendation | null;
  }>({ attempted: false, recommendation: null });

  const effectiveRecommendation = resolution.attempted
    ? resolution.recommendation
    : (recommendedItem ?? null);
  const resolvedCheckoutUrl = resolution.attempted
    ? (effectiveRecommendation?.checkoutPath ?? null)
    : (effectiveRecommendation?.checkoutPath ?? checkoutUrl ?? null);
  const resolvedCheckoutLabel =
    (resolution.attempted ? null : checkoutLabel) ||
    (effectiveRecommendation
      ? `Continue to checkout for ${effectiveRecommendation.title}`
      : "Continue to secure checkout");
  const serviceInterestValue =
    form.serviceInterest ||
    (recommendedItem ? `Course purchase: ${recommendedItem.title}` : "");

  useEffect(() => {
    if (!submitted || !resolvedCheckoutUrl || autoRedirectMs <= 0) return;
    const timer = window.setTimeout(() => {
      window.location.assign(resolvedCheckoutUrl);
    }, autoRedirectMs);
    return () => window.clearTimeout(timer);
  }, [autoRedirectMs, resolvedCheckoutUrl, submitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/ai/techia-agent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_lead",
          conversationId,
          locale,
          recommendation: recommendedItem
            ? { type: recommendedItem.type, slug: recommendedItem.slug }
            : undefined,
          data: {
            name: form.name,
            email: form.email,
            phone: form.phone || undefined,
            companyName: form.companyName || undefined,
            serviceInterest:
              form.serviceInterest.trim() ||
              (effectiveRecommendation
                ? `Course purchase: ${effectiveRecommendation.title}`
                : "Digital Services"),
            projectSummary:
              form.message ||
              (effectiveRecommendation
                ? `AI Growth Agent lead for course purchase: ${effectiveRecommendation.title} (${effectiveRecommendation.slug}). Name: ${form.name}.`
                : `Lead from AI Growth Agent. Name: ${form.name}, Service interest: ${form.serviceInterest || "General"}`),
            leadScore: "WARM",
          },
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        recommendation?: AcademyRecommendation | null;
      };
      if (!data.ok && data.error) {
        setError(data.error);
      } else {
        const attempted = Object.prototype.hasOwnProperty.call(
          data,
          "recommendation",
        );
        const confirmed = attempted
          ? (data.recommendation ?? null)
          : (recommendedItem ?? null);
        setResolution({ attempted, recommendation: confirmed });
        setSubmitted(true);
        onSuccess(confirmed);
      }
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="my-3 rounded-2xl border border-success/30 bg-success/5 p-4">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <p className="text-[13px] font-medium">
            Thanks — your request has been saved.
          </p>
        </div>
        <p className="mt-1 text-[12px] text-muted">
          {resolvedCheckoutUrl
            ? "Taking you to the secure checkout for your recommended item. If the page does not open, use the button below."
            : "The teChia team can now review your request and follow up with you."}
        </p>
        {resolvedCheckoutUrl ? (
          <Link
            href={resolvedCheckoutUrl}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-[12px] font-semibold text-white transition-all hover:bg-accent/90"
          >
            {resolvedCheckoutLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="my-3 rounded-2xl border border-accent/20 bg-accent/[0.03] p-4">
      {effectiveRecommendation ? (
        <div className="mb-3 rounded-xl border border-accent/20 bg-surface/80 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
            Selected{" "}
            {effectiveRecommendation.type === "pack" ? "course pack" : "course"}
          </p>
          <p className="mt-0.5 text-[12px] font-semibold leading-5 text-primary">
            {effectiveRecommendation.title}
          </p>
          {effectiveRecommendation.priceLabel ? (
            <p className="mt-0.5 text-[11px] text-muted">
              {effectiveRecommendation.priceLabel}
            </p>
          ) : null}
        </div>
      ) : null}
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-accent">
        Share your details
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Your name *"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="col-span-2 rounded-lg border border-border bg-surface px-3 py-2 text-[12px] text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
            required
          />
          <input
            type="email"
            placeholder="Email address *"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="col-span-2 rounded-lg border border-border bg-surface px-3 py-2 text-[12px] text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
            required
          />
          <input
            type="text"
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-[12px] text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <input
            type="text"
            placeholder="Company (optional)"
            value={form.companyName}
            onChange={(e) =>
              setForm((p) => ({ ...p, companyName: e.target.value }))
            }
            className="rounded-lg border border-border bg-surface px-3 py-2 text-[12px] text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <input
          type="text"
          placeholder="What service are you looking for?"
          value={serviceInterestValue}
          onChange={(e) =>
            setForm((p) => ({ ...p, serviceInterest: e.target.value }))
          }
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[12px] text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        {error && <p className="text-[11px] text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-accent py-2 text-[12px] font-semibold text-white transition-all hover:bg-accent/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </>
          ) : (
            "Save my details →"
          )}
        </button>
      </form>
    </div>
  );
}
