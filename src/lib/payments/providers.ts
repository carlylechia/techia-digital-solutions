import "server-only";

export type PaymentProviderId = "CHARIOW" | "MONEROO";

export type PaymentProviderAvailability = {
  id: PaymentProviderId;
  label: string;
  description: string;
  configured: boolean;
  webhookConfigured: boolean;
};

export class PaymentProviderError extends Error {
  readonly provider: PaymentProviderId;
  readonly code: string;
  readonly status: number | null;

  constructor(
    provider: PaymentProviderId,
    message: string,
    code = "provider_error",
    status: number | null = null,
  ) {
    super(message);
    this.name = "PaymentProviderError";
    this.provider = provider;
    this.code = code;
    this.status = status;
  }
}

function clean(value: string | undefined) {
  if (!value) return "";
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function internalCheckoutEnabled() {
  return clean(process.env.ACADEMY_INTERNAL_CHECKOUT_ENABLED).toLowerCase() === "true";
}

export function getChariowApiKey() {
  return clean(process.env.CHARIOW_API_KEY);
}

export function getChariowWebhookSecret() {
  return clean(process.env.CHARIOW_WEBHOOK_SECRET);
}

export function getMonerooSecretKey() {
  return clean(process.env.MONEROO_SECRET_KEY);
}

export function getMonerooWebhookSecret() {
  return clean(process.env.MONEROO_WEBHOOK_SECRET);
}

export function isProviderConfigured(provider: PaymentProviderId) {
  if (!internalCheckoutEnabled()) return false;
  return provider === "CHARIOW"
    ? Boolean(getChariowApiKey())
    : Boolean(getMonerooSecretKey());
}

export type CheckoutHints = {
  internalEnabled: boolean;
  chariowConfigured: boolean;
  monerooConfigured: boolean;
};

/**
 * Server-side facts a storefront card or CTA needs to decide between internal
 * checkout, the legacy hosted checkout link, and "coming soon". Server
 * components read this and pass it to the client checkout button.
 */
export function getCheckoutHints(): CheckoutHints {
  return {
    internalEnabled: internalCheckoutEnabled(),
    chariowConfigured: Boolean(getChariowApiKey()),
    monerooConfigured: Boolean(getMonerooSecretKey()),
  };
}

export function isWebhookConfigured(provider: PaymentProviderId) {
  return provider === "CHARIOW"
    ? Boolean(getChariowWebhookSecret())
    : Boolean(getMonerooWebhookSecret());
}

export function getAvailablePaymentProviders(): PaymentProviderAvailability[] {
  return [
    {
      id: "CHARIOW",
      label: "Chariow",
      description:
        "Secure hosted Chariow checkout for cards and mobile money where available.",
      configured: isProviderConfigured("CHARIOW"),
      webhookConfigured: isWebhookConfigured("CHARIOW"),
    },
    {
      id: "MONEROO",
      label: "Moneroo",
      description:
        "Secure hosted Moneroo checkout for mobile money and card payments.",
      configured: isProviderConfigured("MONEROO"),
      webhookConfigured: isWebhookConfigured("MONEROO"),
    },
  ];
}

export function getSiteBaseUrl() {
  const raw =
    clean(process.env.NEXT_PUBLIC_SITE_URL) ||
    clean(process.env.NEXTAUTH_URL) ||
    "http://localhost:3000";
  try {
    const url = new URL(raw);
    return url.origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function getCheckoutReturnUrl(
  orderReference: string,
  provider: PaymentProviderId,
) {
  const url = new URL("/courses/checkout/return", getSiteBaseUrl());
  url.searchParams.set("order", orderReference);
  url.searchParams.set("provider", provider);
  return url.toString();
}

export function isProviderId(value: string): value is PaymentProviderId {
  return value === "CHARIOW" || value === "MONEROO";
}

export function assertHttpsCheckoutUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Payment provider returned an invalid checkout URL.");
  }
  if (url.protocol !== "https:") {
    throw new Error("Payment provider returned a non-HTTPS checkout URL.");
  }
  return url.toString();
}

import type { Prisma } from "@prisma/client";

export function toSafeJsonValue(value: unknown): Prisma.InputJsonValue {
  // Provider payloads occasionally contain undefined or non-JSON values. Store
  // only the JSON-safe shape and never persist credentials or request headers.
  const serialized = JSON.stringify(value ?? null);
  if (!serialized) return {};
  return JSON.parse(serialized) as Prisma.InputJsonValue;
}
