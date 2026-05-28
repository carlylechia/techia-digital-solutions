"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, X, ExternalLink } from "lucide-react";
import type { DemoDefinition } from "@/content/demo-lab";
import { demoLabUi } from "@/content/demo-lab";

type Locale = "en" | "fr";

type FormState = "idle" | "submitting" | "success" | "error";

interface DemoRequestFormProps {
  demo: DemoDefinition;
  locale: Locale;
  onSuccess?: () => void;
  onCancel?: () => void;
  compact?: boolean;
}

export function DemoRequestForm({ demo, locale, onSuccess, onCancel, compact }: DemoRequestFormProps) {
  const ui = demoLabUi[locale];
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    setErrorMsg("");

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: (fd.get("phone") as string) || undefined,
      whatsapp: (fd.get("phone") as string) || undefined,
      companyName: (fd.get("companyName") as string) || undefined,
      country: (fd.get("country") as string) || undefined,
      preferredLanguage: (fd.get("preferredLanguage") as string) || locale,
      businessType: (fd.get("businessType") as string) || undefined,
      demoSlug: demo.slug,
      demoTitle: demo.title[locale],
      projectNeed: fd.get("projectNeed") as string,
      budgetRange: (fd.get("budgetRange") as string) || undefined,
      timeline: (fd.get("timeline") as string) || undefined,
      source: "demo_lab",
      consent: fd.get("consent") === "on",
      honeypot: (fd.get("_h") as string) || ""
    };

    try {
      // Analytics
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("techia:analytics", {
            detail: { name: "demo_request_submitted", params: { demo: demo.slug, locale } }
          })
        );
      }

      const res = await fetch("/api/demo-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setState("success");
        onSuccess?.();
      } else {
        const json = await res.json().catch(() => ({}));
        setErrorMsg(
          locale === "fr"
            ? "Une erreur s'est produite. Veuillez réessayer."
            : (typeof json?.error === "string" ? json.error : null) || "Something went wrong. Please try again."
        );
        setState("error");
        window.dispatchEvent(
          new CustomEvent("techia:analytics", {
            detail: { name: "demo_request_failed", params: { demo: demo.slug, locale } }
          })
        );
      }
    } catch {
      setErrorMsg(
        locale === "fr"
          ? "Impossible de soumettre. Vérifiez votre connexion."
          : "Unable to submit. Please check your connection."
      );
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="grid gap-4 py-6 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="size-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-primary">{ui.successTitle}</h3>
        <p className="text-sm text-muted">{ui.successBody}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <a href={`/${locale}/demo-lab`} className="btn-secondary rounded-lg px-4 py-2.5 text-sm font-semibold">
            {ui.successExplore}
          </a>
          <a
            href={`/${locale}/demo-lab/ai-digital-advisor`}
            className="btn-primary rounded-lg px-4 py-2.5 text-sm font-semibold"
          >
            {ui.successAdvisor}
          </a>
        </div>
      </div>
    );
  }

  const inputCls = "form-input rounded-lg text-sm";
  const labelCls = "form-label";
  const selectCls = "form-input rounded-lg text-sm";

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      {/* Honeypot */}
      <input type="text" name="_h" aria-hidden="true" tabIndex={-1} className="hidden" autoComplete="off" />

      {!compact && (
        <div className="mb-1">
          <h3 className="text-lg font-bold text-primary">{ui.requestFormTitle}</h3>
          <p className="mt-1 text-sm text-muted">{ui.requestFormSubtitle}</p>
        </div>
      )}

      {/* Name + Email */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="rlf-name" className={labelCls}>
            {ui.fields.name} <span className="text-accent">*</span>
          </label>
          <input
            id="rlf-name"
            name="name"
            required
            minLength={2}
            maxLength={180}
            className={inputCls}
            placeholder="Jean Dupont"
            autoComplete="name"
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="rlf-email" className={labelCls}>
            {ui.fields.email} <span className="text-accent">*</span>
          </label>
          <input
            id="rlf-email"
            name="email"
            type="email"
            required
            className={inputCls}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </div>
      </div>

      {/* Phone + Company */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="rlf-phone" className={labelCls}>{ui.fields.phone}</label>
          <input
            id="rlf-phone"
            name="phone"
            type="tel"
            maxLength={30}
            className={inputCls}
            placeholder="+237 6XX XXX XXX"
            autoComplete="tel"
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="rlf-company" className={labelCls}>{ui.fields.company}</label>
          <input
            id="rlf-company"
            name="companyName"
            maxLength={180}
            className={inputCls}
            placeholder="Acme Logistics"
            autoComplete="organization"
          />
        </div>
      </div>

      {/* Country + Language */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="rlf-country" className={labelCls}>{ui.fields.country}</label>
          <input
            id="rlf-country"
            name="country"
            maxLength={80}
            className={inputCls}
            placeholder="Cameroon, France, Canada…"
            autoComplete="country-name"
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="rlf-lang" className={labelCls}>{ui.fields.language}</label>
          <select id="rlf-lang" name="preferredLanguage" defaultValue={locale} className={selectCls}>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>
      </div>

      {/* Business type */}
      <div className="grid gap-1.5">
        <label htmlFor="rlf-biztype" className={labelCls}>{ui.fields.businessType}</label>
        <input
          id="rlf-biztype"
          name="businessType"
          maxLength={180}
          className={inputCls}
          placeholder={
            locale === "fr"
              ? "Ex: Agence de voyage, Clinique, PME..."
              : "e.g. Travel agency, Clinic, Logistics company…"
          }
        />
      </div>

      {/* What do you want to build */}
      <div className="grid gap-1.5">
        <label htmlFor="rlf-need" className={labelCls}>
          {ui.fields.projectNeed} <span className="text-accent">*</span>
        </label>
        <textarea
          id="rlf-need"
          name="projectNeed"
          required
          minLength={5}
          maxLength={2000}
          rows={3}
          className={`${inputCls} min-h-20 resize-y`}
          placeholder={
            locale === "fr"
              ? "Décrivez ce que vous voulez construire ou améliorer..."
              : "Describe what you want to build or improve..."
          }
        />
      </div>

      {/* Budget + Timeline */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="rlf-budget" className={labelCls}>{ui.fields.budget}</label>
          <select id="rlf-budget" name="budgetRange" className={selectCls}>
            <option value="">—</option>
            {ui.budgetOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="rlf-timeline" className={labelCls}>{ui.fields.timeline}</label>
          <select id="rlf-timeline" name="timeline" className={selectCls}>
            <option value="">—</option>
            {ui.timelineOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Consent */}
      <label className="flex cursor-pointer items-start gap-3 text-sm text-muted">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 size-4 shrink-0 accent-cyan-400"
        />
        <span>{ui.fields.consent}</span>
      </label>

      {/* Error */}
      {state === "error" && errorMsg && (
        <p className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
          <X className="mt-0.5 size-3 shrink-0" />
          {errorMsg}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={state === "submitting"}
          className="btn-primary flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold disabled:opacity-60"
        >
          {state === "submitting" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {locale === "fr" ? "Envoi…" : "Sending…"}
            </>
          ) : (
            <>
              <ExternalLink className="size-4" />
              {ui.buildLikeThis}
            </>
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted hover:text-primary"
          >
            {locale === "fr" ? "Annuler" : "Cancel"}
          </button>
        )}
      </div>
    </form>
  );
}
