"use client";

import { MessageCircle, Send } from "lucide-react";
import { useRef, useState } from "react";
import { getDictionary, type Locale } from "@/content/site";
import { trackEvent } from "@/components/analytics/analytics";

export function ContactForm({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(data: Record<string, string>) {
    const errs: Record<string, string> = {};
    if (!data.name || data.name.length < 2) errs.name = locale === "fr" ? "Nom requis (min 2 caractères)" : "Name required (min 2 chars)";
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = locale === "fr" ? "Email invalide" : "Valid email required";
    if (!data.message || data.message.length < 10) errs.message = locale === "fr" ? "Message requis (min 10 caractères)" : "Message required (min 10 chars)";
    return errs;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const raw = Object.fromEntries(formData) as Record<string, string>;
    const errs = validate(raw);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStatus("loading");
    const response = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(raw) });
    if (response.ok) {
      trackEvent("contact_form_submit", { locale });
      setStatus("success");
      formRef.current?.reset();
    } else {
      setStatus("error");
    }
  }

  const whatsappNumber = process.env.NEXT_PUBLIC_OFFICIAL_WHATSAPP;

  async function handleWhatsApp() {
    if (!formRef.current || !whatsappNumber) return;
    const fd = new FormData(formRef.current);
    const raw = Object.fromEntries(fd) as Record<string, string>;

    const errs = validate(raw);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStatus("loading");

    // Submit to dashboard first, then open WhatsApp regardless
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(raw),
      });
      if (res.ok) {
        trackEvent("contact_form_whatsapp", { locale });
        setStatus("success");
        formRef.current?.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }

    // Compose message from form data and open WhatsApp
    const isEN = locale !== "fr";
    const lines: string[] = [
      isEN ? "Hello teChia Digital Solutions! 👋" : "Bonjour teChia Digital Solutions ! 👋",
      "",
    ];
    if (raw.name) lines.push(isEN ? `Name: ${raw.name}` : `Nom : ${raw.name}`);
    if (raw.email) lines.push(isEN ? `Email: ${raw.email}` : `Email : ${raw.email}`);
    if (raw.company) lines.push(isEN ? `Company: ${raw.company}` : `Entreprise : ${raw.company}`);
    if (raw.message) {
      lines.push("");
      lines.push(isEN ? "Message:" : "Message :");
      lines.push(raw.message);
    }

    window.open(
      `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="premium-card grid gap-5 p-6 md:p-8">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="form-label">
            {dict.forms.name} <span className="text-red-600 dark:text-red-300">*</span>
            <input className={`form-input mt-1 ${errors.name ? "border-red-500/60" : ""}`} name="name" required minLength={2} autoComplete="name" />
          </label>
          {errors.name ? <p className="mt-1 text-xs text-red-600 dark:text-red-300">{errors.name}</p> : null}
        </div>
        <div>
          <label className="form-label">
            {dict.forms.email} <span className="text-red-600 dark:text-red-300">*</span>
            <input className={`form-input mt-1 ${errors.email ? "border-red-500/60" : ""}`} name="email" type="email" required autoComplete="email" />
          </label>
          {errors.email ? <p className="mt-1 text-xs text-red-600 dark:text-red-300">{errors.email}</p> : null}
        </div>
        <div>
          <label className="form-label">
            {dict.forms.phone}
            <input className="form-input mt-1" name="phone" type="tel" autoComplete="tel" placeholder="+1 234 567 8900" />
          </label>
        </div>
        <div>
          <label className="form-label">
            <span className="flex items-center gap-1.5">
              <MessageCircle className="size-3.5 text-[#25D366]" />
              WhatsApp
            </span>
            <input className="form-input mt-1" name="whatsapp" type="tel" placeholder="+1 234 567 8900" />
          </label>
        </div>
        <div className="md:col-span-2">
          <label className="form-label">
            {dict.forms.company}
            <input className="form-input mt-1" name="company" autoComplete="organization" />
          </label>
        </div>
      </div>
      <div>
        <label className="form-label">
          {dict.forms.message} <span className="text-red-600 dark:text-red-300">*</span>
          <textarea className={`form-input mt-1 min-h-36 ${errors.message ? "border-red-500/60" : ""}`} name="message" required minLength={10} />
        </label>
        {errors.message ? <p className="mt-1 text-xs text-red-600 dark:text-red-300">{errors.message}</p> : null}
      </div>
      <input type="hidden" name="locale" value={locale} />
      <input className="hidden" name="honeypot" tabIndex={-1} autoComplete="off" />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          className="btn-primary w-full justify-center gap-2 disabled:opacity-60 sm:w-auto"
          type="submit"
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Send className="size-4" />
          )}
          {status === "loading" ? dict.forms.sending : dict.forms.submit}
        </button>

        {typeof whatsappNumber === "string" && whatsappNumber ? (
          <button
            type="button"
            onClick={handleWhatsApp}
            disabled={status === "loading"}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-2.5 text-sm font-semibold text-[#25D366] transition hover:bg-[#25D366]/20 disabled:opacity-60 sm:w-auto"
          >
            <MessageCircle className="size-4" />
            {locale === "fr" ? "Contacter sur WhatsApp" : "Chat on WhatsApp"}
          </button>
        ) : null}
      </div>

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
