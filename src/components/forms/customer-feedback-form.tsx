"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/content/site";
import { cn } from "@/lib/utils";

type CustomerFeedbackFormProps = {
  locale: Locale;
  projectOptions: Array<{ slug: string; name: string }>;
  className?: string;
};

export function CustomerFeedbackForm({
  locale,
  projectOptions,
  className
}: CustomerFeedbackFormProps) {
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setSuccess(false);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      role: String(formData.get("role") || ""),
      company: String(formData.get("company") || ""),
      projectSlug: String(formData.get("projectSlug") || ""),
      rating: Number(formData.get("rating") || 0) || undefined,
      quote: String(formData.get("quote") || ""),
      consent: formData.get("consent") === "on",
      locale,
      honeypot: String(formData.get("website") || "")
    };

    try {
      const response = await fetch("/api/customer-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("submit_failed");

      form.reset();
      setSuccess(true);
    } catch {
      setError(locale === "fr" ? "Échec de l'envoi. Réessayez." : "Submit failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "grid gap-3 rounded-[1.25rem] border border-border bg-background p-5 text-left sm:p-6",
        className
      )}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          {locale === "fr" ? "Nom" : "Name"}
          <input name="name" required className="form-input rounded-lg text-sm" />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          Email
          <input name="email" type="email" required className="form-input rounded-lg text-sm" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          {locale === "fr" ? "Rôle" : "Role"}
          <input name="role" className="form-input rounded-lg text-sm" />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          {locale === "fr" ? "Entreprise" : "Company"}
          <input name="company" className="form-input rounded-lg text-sm" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          {locale === "fr" ? "Projet concerné" : "Project"}
          <select name="projectSlug" className="form-input rounded-lg text-sm">
            <option value="">{locale === "fr" ? "Choisir (optionnel)" : "Select (optional)"}</option>
            {projectOptions.map((project) => (
              <option key={project.slug} value={project.slug}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          {locale === "fr" ? "Note (1-5)" : "Rating (1-5)"}
          <input name="rating" type="number" min={1} max={5} className="form-input rounded-lg text-sm" />
        </label>
      </div>

      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
        {locale === "fr" ? "Votre retour" : "Your feedback"}
        <textarea
          name="quote"
          required
          minLength={20}
          maxLength={2000}
          className="form-input min-h-24 rounded-lg text-sm"
        />
      </label>

      <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      <label className="flex items-start gap-2 text-sm text-primary">
        <input type="checkbox" name="consent" className="mt-0.5 size-4 accent-cyan-400" required />
        {locale === "fr"
          ? "J’accepte que ce témoignage soit examiné pour publication sur le site."
          : "I agree this feedback can be reviewed for publication on the website."}
      </label>

      <button type="submit" disabled={pending} className="btn-primary justify-center disabled:opacity-60">
        {pending ? (locale === "fr" ? "Envoi..." : "Submitting...") : locale === "fr" ? "Partager mon retour" : "Share feedback"}
      </button>

      {success ? (
        <p className="text-xs text-emerald-400">
          {locale === "fr"
            ? "Merci. Votre témoignage a été reçu et sera revu avant publication."
            : "Thank you. Your feedback was received and will be reviewed before publishing."}
        </p>
      ) : null}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </form>
  );
}
