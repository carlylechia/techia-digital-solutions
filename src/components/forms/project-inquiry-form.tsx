"use client";

import { MessageCircle, Send } from "lucide-react";
import { useRef, useState } from "react";
import { getDictionary, type Locale } from "@/content/site";
import { trackEvent } from "@/components/analytics/analytics";

const budgets = {
  en: ["Under $1,000", "$1,000 - $3,000", "$3,000 - $7,500", "$7,500 - $15,000", "$15,000+", "Not sure yet"],
  fr: ["Moins de 1 000 $", "1 000 $ - 3 000 $", "3 000 $ - 7 500 $", "7 500 $ - 15 000 $", "15 000 $+", "Pas encore sûr"]
};
const timelines = {
  en: ["ASAP", "2-4 weeks", "1-2 months", "3+ months", "Planning stage"],
  fr: ["Dès que possible", "2 à 4 semaines", "1 à 2 mois", "3 mois et plus", "Phase de planification"]
};

export function ProjectInquiryForm({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(data: Record<string, string>) {
    const errs: Record<string, string> = {};
    if (!data.name || data.name.length < 2) errs.name = locale === "fr" ? "Nom requis" : "Name required";
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = locale === "fr" ? "Email invalide" : "Valid email required";
    if (!data.phone || data.phone.length < 2) errs.phone = locale === "fr" ? "Téléphone requis" : "Phone required";
    if (!data.details || data.details.length < 20) errs.details = locale === "fr" ? "Détails requis (min 20 caractères)" : "Details required (min 20 chars)";
    if (data.consent !== "true" && data.consent !== "on") errs.consent = locale === "fr" ? "Consentement requis" : "Consent required";
    return errs;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const raw = Object.fromEntries(formData) as Record<string, string>;
    raw.consent = formData.get("consent") === "on" ? "true" : "false";
    const errs = validate(raw);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStatus("loading");
    const response = await fetch("/api/project-inquiry", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(raw) });
    if (response.ok) {
      trackEvent("project_estimator_submit", { locale });
      setStatus("success");
      formRef.current?.reset();
    } else {
      setStatus("error");
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="premium-card grid gap-5 p-6 md:p-8">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="form-label">{dict.forms.name} <span className="text-red-600 dark:text-red-300">*</span>
            <input className={`form-input mt-1 ${errors.name ? "border-red-500/60" : ""}`} name="name" required minLength={2} autoComplete="name" />
          </label>
          {errors.name ? <p className="mt-1 text-xs text-red-600 dark:text-red-300">{errors.name}</p> : null}
        </div>
        <div>
          <label className="form-label">{dict.forms.email} <span className="text-red-600 dark:text-red-300">*</span>
            <input className={`form-input mt-1 ${errors.email ? "border-red-500/60" : ""}`} name="email" type="email" required autoComplete="email" />
          </label>
          {errors.email ? <p className="mt-1 text-xs text-red-600 dark:text-red-300">{errors.email}</p> : null}
        </div>
        <div>
          <label className="form-label">{dict.forms.phone} <span className="text-red-600 dark:text-red-300">*</span>
            <input className={`form-input mt-1 ${errors.phone ? "border-red-500/60" : ""}`} name="phone" type="tel" required autoComplete="tel" placeholder="+1 234 567 8900" />
          </label>
          {errors.phone ? <p className="mt-1 text-xs text-red-600 dark:text-red-300">{errors.phone}</p> : null}
        </div>
        <div>
          <label className="form-label">
            <span className="flex items-center gap-1.5"><MessageCircle className="size-3.5 text-[#25D366]" />WhatsApp</span>
            <input className="form-input mt-1" name="whatsapp" type="tel" placeholder="+1 234 567 8900" />
          </label>
        </div>
        <div>
          <label className="form-label">{dict.forms.company}
            <input className="form-input mt-1" name="company" autoComplete="organization" />
          </label>
        </div>
        <div>
          <label className="form-label">{dict.forms.country} <span className="text-red-600 dark:text-red-300">*</span>
            <input className="form-input mt-1" name="country" required autoComplete="country-name" />
          </label>
        </div>
        <div>
          <label className="form-label">{dict.forms.language}
            <select className="form-input mt-1" name="preferredLanguage" defaultValue={locale === "fr" ? "French" : "English"}>
              <option value="English">{locale === "fr" ? "Anglais" : "English"}</option>
              <option value="French">{locale === "fr" ? "Français" : "French"}</option>
            </select>
          </label>
        </div>
        <div>
          <label className="form-label">{dict.forms.businessType}
            <select className="form-input mt-1" name="businessType">
              {dict.simulator.businessTypes.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <div>
          <label className="form-label">{dict.forms.need}
            <select className="form-input mt-1" name="need">
              {dict.simulator.problems.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <div>
          <label className="form-label">{dict.forms.budget}
            <select className="form-input mt-1" name="budgetRange">
              {budgets[locale].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <div>
          <label className="form-label">{dict.forms.timeline}
            <select className="form-input mt-1" name="timeline">
              {timelines[locale].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div>
        <label className="form-label">{dict.forms.details} <span className="text-red-600 dark:text-red-300">*</span>
          <textarea className={`form-input mt-1 min-h-40 ${errors.details ? "border-red-500/60" : ""}`} name="details" required minLength={20} />
        </label>
        {errors.details ? <p className="mt-1 text-xs text-red-600 dark:text-red-300">{errors.details}</p> : null}
      </div>

      <div>
        <label className={`flex items-start gap-3 text-sm ${errors.consent ? "text-red-600 dark:text-red-300" : "text-muted"}`}>
          <input type="checkbox" name="consent" required className="mt-1 size-4 accent-cyan-400" />
          <span>{dict.forms.consent}</span>
        </label>
        {errors.consent ? <p className="mt-1 text-xs text-red-600 dark:text-red-300">{errors.consent}</p> : null}
      </div>

      <input type="hidden" name="locale" value={locale} />
      <input className="hidden" name="honeypot" tabIndex={-1} autoComplete="off" />

      <button className="btn-primary w-full justify-center gap-2 disabled:opacity-60 sm:w-auto" type="submit" disabled={status === "loading"}>
        {status === "loading" ? (
          <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Send className="size-4" />
        )}
        {status === "loading" ? dict.forms.sending : dict.forms.submit}
      </button>

      {status === "success" ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4" role="status" aria-live="polite">
          <span className="mt-0.5 text-emerald-400">✓</span>
          <p className="text-sm text-emerald-300">{dict.forms.success}</p>
        </div>
      ) : null}
      {status === "error" ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4" role="alert">
          <p className="text-sm text-red-300">{dict.forms.error}</p>
        </div>
      ) : null}
    </form>
  );
}
