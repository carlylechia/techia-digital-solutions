"use client";

import { useId, useState, useTransition } from "react";
import { subscribeToNewsletterAction } from "@/app/actions/subscribe-to-newsletter";
import { trackEvent } from "@/components/analytics/analytics";
import { getDictionary, type Locale } from "@/content/site";
import { NEWSLETTER_MESSAGES } from "@/lib/newsletter/constants";
import type { NewsletterSource } from "@/lib/newsletter/types";

type NewsletterStatus = "idle" | "success" | "duplicate" | "error";

export function NewsletterForm({
  locale,
  source = "footer",
}: {
  locale: Locale;
  source?: NewsletterSource;
}) {
  const dict = getDictionary(locale);
  const emailId = useId();
  const firstNameId = useId();
  const languageId = useId();
  const messageId = useId();
  const [status, setStatus] = useState<NewsletterStatus>("idle");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();

    if (!email || !form.checkValidity()) {
      setStatus("error");
      setMessage(NEWSLETTER_MESSAGES.error);
      form.reportValidity();
      return;
    }

    setStatus("idle");
    setMessage("");

    startTransition(async () => {
      const result = await subscribeToNewsletterAction(formData);

      if (result.status === "duplicate") {
        setStatus("duplicate");
        setMessage(result.message);
        trackEvent("newsletter_duplicate", { locale, source });
        return;
      }

      if (result.ok) {
        setStatus("success");
        setMessage(result.message);
        form.reset();
        trackEvent("newsletter_submit", { locale, source });
        return;
      }

      setStatus("error");
      setMessage(result.message || NEWSLETTER_MESSAGES.error);
    });
  }

  const firstNameLabel = locale === "fr" ? "Prénom" : "First name";
  const languageLabel = locale === "fr" ? "Langue" : "Language";

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3"
      aria-describedby={message ? messageId : undefined}
      noValidate
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="sr-only" htmlFor={firstNameId}>
          {firstNameLabel}
        </label>
        <input
          id={firstNameId}
          className="form-input text-sm"
          type="text"
          name="firstName"
          placeholder={firstNameLabel}
          autoComplete="given-name"
          maxLength={120}
        />

        <label className="sr-only" htmlFor={emailId}>
          {dict.forms.email}
        </label>
        <input
          id={emailId}
          className="form-input text-sm"
          type="email"
          name="email"
          placeholder={dict.forms.email}
          autoComplete="email"
          required
          maxLength={180}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="sr-only" htmlFor={languageId}>
          {languageLabel}
        </label>
        <select
          id={languageId}
          className="form-input text-sm"
          name="language"
          defaultValue={locale}
          aria-label={languageLabel}
        >
          <option value="en">English</option>
          <option value="fr">Français</option>
        </select>

        <button
          className="btn-secondary justify-center px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isPending}
        >
          {isPending ? dict.ui.newsletterLoading : dict.ui.newsletterJoin}
        </button>
      </div>

      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="interest" value="general" />
      <input type="hidden" name="source" value={source} />
      <input
        className="hidden"
        type="text"
        name="honeypot"
        tabIndex={-1}
        autoComplete="off"
      />

      {message ? (
        <p
          id={messageId}
          className={
            status === "success"
              ? "rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs leading-5 text-emerald-700 dark:text-emerald-300"
              : status === "duplicate"
                ? "rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-700 dark:text-amber-300"
                : "rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs leading-5 text-red-700 dark:text-red-300"
          }
          role={status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
