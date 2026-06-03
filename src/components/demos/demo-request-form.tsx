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

type FieldErrors = Partial<Record<string, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateDemoForm(
  body: Record<string, string | boolean | undefined>,
  locale: Locale
): FieldErrors {
  const e: FieldErrors = {};
  const t = locale === "fr";

  const name = (body.name as string | undefined)?.trim() ?? "";
  if (!name) e.name = t ? "Le nom est requis." : "Name is required.";
  else if (name.length < 2) e.name = t ? "Le nom est trop court." : "Name must be at least 2 characters.";

  const email = (body.email as string | undefined)?.trim() ?? "";
  if (!email) e.email = t ? "L'adresse e-mail est requise." : "Email address is required.";
  else if (!EMAIL_RE.test(email)) e.email = t ? "Adresse e-mail invalide." : "Enter a valid email address.";

  const need = (body.projectNeed as string | undefined)?.trim() ?? "";
  if (!need) e.projectNeed = t ? "Décrivez votre besoin." : "Please describe what you need.";
  else if (need.length < 5) e.projectNeed = t ? "Décrivez un peu plus votre besoin." : "Please provide a bit more detail.";

  if (!body.consent) e.consent = t ? "Votre consentement est requis." : "Please accept the terms to continue.";

  return e;
}

/** Map Zod issues from API back to field names */
function mapApiIssues(issues: Array<{ path: string[]; message: string }>): FieldErrors {
  const e: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (key && !e[key]) e[key] = issue.message;
  }
  return e;
}

export function DemoRequestForm({ demo, locale, onSuccess, onCancel, compact }: DemoRequestFormProps) {
  const ui = demoLabUi[locale];
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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

    // Client-side validation before hitting the network
    const validationErrors = validateDemoForm(body as Record<string, string | boolean | undefined>, locale);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }
    setFieldErrors({});

    setState("submitting");

    try {
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

        // Map server-side field issues back to per-field errors when available
        if (json?.issues && Array.isArray(json.issues) && json.issues.length > 0) {
          const apiErrors = mapApiIssues(json.issues);
          if (Object.keys(apiErrors).length > 0) {
            setFieldErrors(apiErrors);
            setState("idle");
            setErrorMsg(
              locale === "fr"
                ? "Veuillez corriger les erreurs ci-dessous."
                : "Please correct the errors below."
            );
            return;
          }
        }

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

  const inputCls = (field: string) =>
    `form-input rounded-lg text-sm${fieldErrors[field] ? " border-red-500 focus:ring-red-400" : ""}`;
  const labelCls = "form-label";
  const selectCls = "form-input rounded-lg text-sm";

  function FieldErr({ field }: { field: string }) {
    return fieldErrors[field] ? (
      <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
        <X className="size-3 shrink-0" />{fieldErrors[field]}
      </p>
    ) : null;
  }

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
            minLength={2}
            maxLength={180}
            className={inputCls("name")}
            placeholder="Jean Dupont"
            autoComplete="name"
            aria-invalid={!!fieldErrors.name}
            onChange={() => clearFieldError("name")}
          />
          <FieldErr field="name" />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="rlf-email" className={labelCls}>
            {ui.fields.email} <span className="text-accent">*</span>
          </label>
          <input
            id="rlf-email"
            name="email"
            type="email"
            className={inputCls("email")}
            placeholder="you@company.com"
            autoComplete="email"
            aria-invalid={!!fieldErrors.email}
            onChange={() => clearFieldError("email")}
          />
          <FieldErr field="email" />
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
            className={inputCls("phone")}
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
            className={inputCls("companyName")}
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
            className={inputCls("country")}
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
          className={inputCls("businessType")}
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
          minLength={5}
          maxLength={2000}
          rows={3}
          className={`${inputCls("projectNeed")} min-h-20 resize-y`}
          placeholder={
            locale === "fr"
              ? "Décrivez ce que vous voulez construire ou améliorer..."
              : "Describe what you want to build or improve..."
          }
          aria-invalid={!!fieldErrors.projectNeed}
          onChange={() => clearFieldError("projectNeed")}
        />
        <FieldErr field="projectNeed" />
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
      <div className="grid gap-1">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-muted">
          <input
            type="checkbox"
            name="consent"
            className="mt-0.5 size-4 shrink-0 accent-cyan-400"
            aria-invalid={!!fieldErrors.consent}
            onChange={() => clearFieldError("consent")}
          />
          <span>{ui.fields.consent}</span>
        </label>
        <FieldErr field="consent" />
      </div>

      {/* Global error */}
      {(state === "error" || errorMsg) && errorMsg && (
        <p className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400" role="alert">
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
