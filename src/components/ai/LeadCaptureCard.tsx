"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

interface Props {
  conversationId: string | null;
  onSuccess: () => void;
}

export function LeadCaptureCard({ conversationId, onSuccess }: Props) {
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
          data: {
            name: form.name,
            email: form.email,
            phone: form.phone || undefined,
            companyName: form.companyName || undefined,
            serviceInterest: form.serviceInterest || "Digital Services",
            projectSummary:
              form.message ||
              `Lead from AI Growth Agent. Name: ${form.name}, Service interest: ${form.serviceInterest || "General"}`,
            leadScore: "WARM",
          },
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok && data.error) {
        setError(data.error);
      } else {
        setSubmitted(true);
        onSuccess();
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
          <p className="text-[13px] font-medium">Thanks — your request has been saved.</p>
        </div>
        <p className="mt-1 text-[12px] text-muted">
          The teChia team can now review your project details and follow up with you.
        </p>
      </div>
    );
  }

  return (
    <div className="my-3 rounded-2xl border border-accent/20 bg-accent/[0.03] p-4">
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
            onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-[12px] text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <input
          type="text"
          placeholder="What service are you looking for?"
          value={form.serviceInterest}
          onChange={(e) => setForm((p) => ({ ...p, serviceInterest: e.target.value }))}
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
