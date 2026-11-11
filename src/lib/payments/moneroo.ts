import "server-only";

import {
  assertHttpsCheckoutUrl,
  getMonerooSecretKey,
  PaymentProviderError,
  type PaymentProviderId,
} from "./providers";

const MONEROO_API_BASE = "https://api.moneroo.io/v1";
const PROVIDER: PaymentProviderId = "MONEROO";

type JsonObject = Record<string, unknown>;

export type MonerooCheckoutInput = {
  amountMinor: number;
  currency: string;
  description: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  returnUrl: string;
  orderReference: string;
  itemType: string;
  itemSlug: string;
};

export type MonerooCheckoutResult = {
  paymentId: string;
  checkoutUrl: string;
};

function asObject(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

async function monerooFetch(path: string, init: RequestInit) {
  const secretKey = getMonerooSecretKey();
  if (!secretKey) {
    throw new PaymentProviderError(
      PROVIDER,
      "Moneroo is not configured.",
      "not_configured",
    );
  }

  let response: Response;
  try {
    response = await fetch(`${MONEROO_API_BASE}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
        ...(init.headers || {}),
      },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    throw new PaymentProviderError(
      PROVIDER,
      "Moneroo could not be reached.",
      "network_error",
    );
  }

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const object = asObject(payload);
    throw new PaymentProviderError(
      PROVIDER,
      stringValue(object?.message) || "Moneroo rejected the request.",
      response.status === 429 ? "rate_limited" : "provider_error",
      response.status,
    );
  }
  return payload;
}

export async function createMonerooCheckout(
  input: MonerooCheckoutInput,
): Promise<MonerooCheckoutResult> {
  const payload = await monerooFetch("/payments/initialize", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amountMinor,
      currency: input.currency,
      description: input.description.slice(0, 200),
      return_url: input.returnUrl,
      customer: {
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
        ...(input.phone ? { phone: input.phone } : {}),
      },
      metadata: {
        order_ref: input.orderReference,
        item_type: input.itemType,
        item_slug: input.itemSlug,
      },
    }),
  });

  const data = asObject(asObject(payload)?.data);
  const paymentId = stringValue(data?.id);
  const checkoutUrl = stringValue(data?.checkout_url);
  if (!paymentId || !checkoutUrl) {
    throw new PaymentProviderError(
      PROVIDER,
      "Moneroo returned an unexpected checkout response.",
      "invalid_response",
    );
  }

  return {
    paymentId,
    checkoutUrl: assertHttpsCheckoutUrl(checkoutUrl),
  };
}

export type MonerooPayment = {
  id: string;
  status: string;
  amountMinor: number | null;
  currency: string;
  customMetadata: Record<string, string> | null;
  raw: JsonObject;
};

export async function verifyMonerooPayment(
  paymentId: string,
): Promise<MonerooPayment> {
  if (!paymentId) {
    throw new PaymentProviderError(
      PROVIDER,
      "A Moneroo payment ID is required.",
      "invalid_request",
    );
  }
  const payload = await monerooFetch(
    `/payments/${encodeURIComponent(paymentId)}/verify`,
    { method: "GET" },
  );
  const data = asObject(asObject(payload)?.data);
  if (!data || stringValue(data.id) !== paymentId) {
    throw new PaymentProviderError(
      PROVIDER,
      "Moneroo returned an invalid payment.",
      "invalid_response",
    );
  }

  const currency = asObject(data.currency);
  const metadata = asObject(data.metadata);
  const amount =
    typeof data.amount === "number" && Number.isFinite(data.amount)
      ? data.amount
      : null;

  return {
    id: paymentId,
    status: stringValue(data.status).toLowerCase(),
    amountMinor: amount,
    currency: stringValue(currency?.code).toUpperCase(),
    customMetadata: metadata
      ? Object.fromEntries(
          Object.entries(metadata)
            .filter(([, value]) => typeof value === "string")
            .map(([key, value]) => [key, value as string]),
        )
      : null,
    raw: data,
  };
}
