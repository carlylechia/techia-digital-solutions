"use client";

import { useState } from "react";
import { trackEvent } from "@/components/analytics/analytics";
import { getDictionary, type Locale } from "@/content/site";

export function NewsletterForm({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  async function submit(formData: FormData) {
    setStatus("loading");
    const res = await fetch("/api/newsletter", { method: "POST", body: JSON.stringify(Object.fromEntries(formData)), headers: { "content-type": "application/json" } });
    if (res.ok) {
      trackEvent("newsletter_submit", { locale });
      setStatus("success");
    } else setStatus("error");
  }
  return (
    <form action={submit} className="grid gap-2 sm:grid-cols-[1fr_auto]">
      <input className="form-input" type="email" name="email" placeholder={dict.forms.email} required />
      <input type="hidden" name="locale" value={locale} />
      <input className="hidden" type="text" name="honeypot" tabIndex={-1} autoComplete="off" />
      <button className="btn-secondary justify-center" type="submit" disabled={status === "loading"}>{status === "loading" ? dict.ui.newsletterLoading : dict.ui.newsletterJoin}</button>
      {status === "success" ? <p className="text-xs text-accent sm:col-span-2" role="status" aria-live="polite">{dict.ui.newsletterSuccess}</p> : null}
      {status === "error" ? <p className="text-xs text-red-600 dark:text-red-300 sm:col-span-2" role="alert">{dict.ui.newsletterError}</p> : null}
    </form>
  );
}
