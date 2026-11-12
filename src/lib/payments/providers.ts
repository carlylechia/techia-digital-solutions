import "server-only";

import { cache } from "react";
import { getPrisma } from "@/lib/prisma";

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

export type PaymentProviderEnablement = {
  chariowEnabled: boolean;
  monerooEnabled: boolean;
};

const ENABLEMENT_DEFAULTS: PaymentProviderEnablement = {
  chariowEnabled: true,
  monerooEnabled: true,
};

/**
 * Admin-controlled visibility switches (/admin/academy → Payment methods).
 * Environment variables remain the source of truth for API keys; this only
 * decides whether a configured provider is offered on the storefront. Defaults
 * to "enabled" whenever the row or the database is unavailable (fail-open to
 * the env-only behavior). Memoized per request with React cache().
 */
export const getPaymentProviderEnablement = cache(
  async (): Promise<PaymentProviderEnablement> => {
    const prisma = getPrisma();
    if (!prisma) return ENABLEMENT_DEFAULTS;
    try {
      const row = await prisma.academyPaymentSettings.findUnique({
        where: { id: "singleton" },
      });
      if (!row) return ENABLEMENT_DEFAULTS;
      return {
        chariowEnabled: row.chariowEnabled,
        monerooEnabled: row.monerooEnabled,
      };
    } catch (error) {
      console.warn(
        "[payments] provider_enablement_read_failed",
        error instanceof Error ? error.message : error,
      );
      return ENABLEMENT_DEFAULTS;
    }
  },
);

/** A provider is offered only when its env key exists AND the admin enabled it. */
export function applyProviderEnablement(configured: boolean, enabled: boolean) {
  return configured && enabled;
}

export async function isProviderConfigured(provider: PaymentProviderId) {
  if (!internalCheckoutEnabled()) return false;
  const envConfigured =
    provider === "CHARIOW" ? Boolean(getChariowApiKey()) : Boolean(getMonerooSecretKey());
  if (!envConfigured) return false;
  const enablement = await getPaymentProviderEnablement();
  return applyProviderEnablement(
    true,
    provider === "CHARIOW" ? enablement.chariowEnabled : enablement.monerooEnabled,
  );
}

export type CheckoutHints = {
  internalEnabled: boolean;
  chariowConfigured: boolean;
  monerooConfigured: boolean;
};

/**
 * Server-side facts a storefront card or CTA needs to decide between internal
 * checkout, the legacy hosted checkout link, and "coming soon". Server
 * components read this and pass it to the client checkout button. "Configured"
 * here means usable: the env key exists AND the provider is enabled in
 * /admin/academy.
 */
export async function getCheckoutHints(): Promise<CheckoutHints> {
  const enablement = await getPaymentProviderEnablement();
  return {
    internalEnabled: internalCheckoutEnabled(),
    chariowConfigured: applyProviderEnablement(
      Boolean(getChariowApiKey()),
      enablement.chariowEnabled,
    ),
    monerooConfigured: applyProviderEnablement(
      Boolean(getMonerooSecretKey()),
      enablement.monerooEnabled,
    ),
  };
}

export function isWebhookConfigured(provider: PaymentProviderId) {
  return provider === "CHARIOW"
    ? Boolean(getChariowWebhookSecret())
    : Boolean(getMonerooWebhookSecret());
}

export async function getAvailablePaymentProviders(): Promise<PaymentProviderAvailability[]> {
  const [chariowConfigured, monerooConfigured] = await Promise.all([
    isProviderConfigured("CHARIOW"),
    isProviderConfigured("MONEROO"),
  ]);
  return [
    {
      id: "CHARIOW",
      label: "Chariow",
      description:
        "Secure hosted Chariow checkout for cards and mobile money where available.",
      configured: chariowConfigured,
      webhookConfigured: isWebhookConfigured("CHARIOW"),
    },
    {
      id: "MONEROO",
      label: "Moneroo",
      description:
        "Secure hosted Moneroo checkout for mobile money and card payments.",
      configured: monerooConfigured,
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
