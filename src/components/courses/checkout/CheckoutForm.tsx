"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Locale } from "@/content/site";
import type { PaymentProviderId } from "@/lib/payments/providers";
import {
  COUNTRY_CODES,
  flagEmojiForCountryCode,
  PRIORITY_COUNTRY_CODES,
} from "@/lib/countries";

type ProviderOption = {
  id: PaymentProviderId;
  label: string;
  description: string;
};

function randomKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Localized country label, falling back to the raw code. */
function countryName(
  code: string,
  locale: Locale,
  names: Intl.DisplayNames | null,
) {
  try {
    return names?.of(code) || code;
  } catch {
    return code;
  }
}

export function CheckoutForm({
  locale,
  itemType,
  itemSlug,
  providers,
}: {
  locale: Locale;
  itemType: "course" | "pack";
  itemSlug: string;
  providers: ProviderOption[];
}) {
  const [provider, setProvider] = useState<PaymentProviderId>(
    providers[0]?.id || "CHARIOW",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const idempotencyKey = useMemo(() => randomKey(), []);

  const copy =
    locale === "fr"
      ? {
          firstName: "Prénom",
          lastName: "Nom",
          email: "Adresse e-mail",
          phone: "Téléphone",
          countryCode: "Pays du numéro de téléphone",
          provider: "Moyen de paiement",
          submit: "Continuer vers le paiement sécurisé",
          processing: "Préparation du paiement...",
          secure:
            "Le paiement final est traité de manière sécurisée par le prestataire sélectionné. teChia ne stocke pas vos informations de carte.",
          popular: "Populaires",
          allCountries: "Tous les pays",
        }
      : {
          firstName: "First name",
          lastName: "Last name",
          email: "Email address",
          phone: "Phone number",
          countryCode: "Phone country",
          provider: "Payment method",
          submit: "Continue to secure payment",
          processing: "Preparing secure checkout...",
          secure:
            "Final payment is processed securely by the selected provider. teChia does not store your card details.",
          popular: "Popular",
          allCountries: "All countries",
        };

  // Localized country names for the dropdown, sorted alphabetically per locale.
  const countryGroups = useMemo(() => {
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      names = null;
    }
    const toOption = (code: string) => {
      const name = countryName(code, locale, names);
      return {
        code,
        name,
        label: `${flagEmojiForCountryCode(code)} ${name}`,
      };
    };
    const sortOptions = (options: ReturnType<typeof toOption>[]) =>
      [...options].sort((a, b) => a.name.localeCompare(b.name, locale));
    const prioritySet = new Set<string>(PRIORITY_COUNTRY_CODES);
    return {
      priority: sortOptions(PRIORITY_COUNTRY_CODES.map(toOption)),
      all: sortOptions(
        COUNTRY_CODES.filter((code) => !prioritySet.has(code)).map(toOption),
      ),
    };
  }, [locale]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/courses/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType,
          itemSlug,
          provider,
          firstName: String(form.get("firstName") || ""),
          lastName: String(form.get("lastName") || ""),
          email: String(form.get("email") || ""),
          phone: String(form.get("phone") || ""),
          countryCode: String(form.get("countryCode") || ""),
          locale,
          idempotencyKey,
          honeypot: String(form.get("website") || ""),
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            status?: string;
            checkoutUrl?: string;
            returnUrl?: string;
            message?: string;
          }
        | null;

      if (!response.ok || !data?.ok) {
        setError(data?.error || "Checkout could not be started.");
        setSubmitting(false);
        return;
      }

      if (data.status === "redirect" && data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }
      if (data.status === "verify" && data.returnUrl) {
        window.location.assign(data.returnUrl);
        return;
      }
      if (data.status === "already_purchased") {
        setNotice(
          data.message ||
            "This purchase is already recorded. Contact support if you need access.",
        );
        setSubmitting(false);
        return;
      }
      setError("Unexpected checkout response. Please try again.");
      setSubmitting(false);
    } catch {
      setError("A network error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-primary">
          {copy.firstName}
          <input
            name="firstName"
            required
            autoComplete="given-name"
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:border-cyan-500"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-primary">
          {copy.lastName}
          <input
            name="lastName"
            required
            autoComplete="family-name"
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:border-cyan-500"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium text-primary">
        {copy.email}
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:border-cyan-500"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-primary">
          {copy.phone}
          <input
            name="phone"
            required
            autoComplete="tel"
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:border-cyan-500"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-primary">
          {copy.countryCode}
          <span className="relative block">
            <select
              name="countryCode"
              required
              defaultValue="CM"
              autoComplete="tel-country-code"
              className="w-full appearance-none rounded-xl border border-border bg-background py-3 pl-4 pr-10 text-sm text-primary outline-none focus:border-cyan-500"
            >
              <optgroup label={copy.popular}>
                {countryGroups.priority.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label={copy.allCountries}>
                {countryGroups.all.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.label}
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            />
          </span>
        </label>
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium text-primary">{copy.provider}</legend>
        {providers.map((p) => (
          <label
            key={p.id}
            className={`cursor-pointer rounded-xl border p-4 transition ${
              provider === p.id
                ? "border-cyan-500 bg-cyan-500/10"
                : "border-border bg-background/70"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="provider"
                value={p.id}
                checked={provider === p.id}
                onChange={() => setProvider(p.id)}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-primary">{p.label}</div>
                <div className="mt-1 text-sm leading-6 text-muted">{p.description}</div>
              </div>
            </div>
          </label>
        ))}
      </fieldset>

      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-800 dark:text-cyan-100">
          {notice}
        </p>
      ) : null}

      <p className="text-xs leading-6 text-muted">{copy.secure}</p>
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full justify-center px-5 py-3 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? copy.processing : copy.submit}
      </button>
    </form>
  );
}
