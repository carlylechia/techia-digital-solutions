import "server-only";

import {
  assertHttpsCheckoutUrl,
  getChariowApiKey,
  PaymentProviderError,
  type PaymentProviderId,
} from "./providers";

const CHARIOW_API_BASE = "https://api.chariow.com/v1";
const PROVIDER: PaymentProviderId = "CHARIOW";

export type ChariowCheckoutInput = {
  productId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  countryCode: string;
  redirectUrl: string;
  orderReference: string;
  itemType: string;
  itemSlug: string;
  currency: string;
  customerIp?: string;
};

export type ChariowCheckoutResult =
  | {
      step: "payment";
      saleId: string;
      checkoutUrl: string;
      transactionId: string | null;
    }
  | {
      step: "completed";
      saleId: string;
      checkoutUrl: null;
      transactionId: null;
    }
  | {
      step: "already_purchased";
      saleId: null;
      checkoutUrl: null;
      transactionId: null;
    };

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function chariowFetch(path: string, init: RequestInit) {
  const apiKey = getChariowApiKey();
  if (!apiKey) {
    throw new PaymentProviderError(
      PROVIDER,
      "Chariow is not configured.",
      "not_configured",
    );
  }

  let response: Response;
  try {
    response = await fetch(`${CHARIOW_API_BASE}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(init.headers || {}),
      },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    throw new PaymentProviderError(
      PROVIDER,
      "Chariow could not be reached.",
      "network_error",
    );
  }

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const object = asObject(payload);
    const message =
      stringValue(object?.message) || "Chariow rejected the request.";
    throw new PaymentProviderError(
      PROVIDER,
      message,
      response.status === 429 ? "rate_limited" : "provider_error",
      response.status,
    );
  }
  return payload;
}

export async function createChariowCheckout(
  input: ChariowCheckoutInput,
): Promise<ChariowCheckoutResult> {
  const payload = await chariowFetch("/checkout", {
    method: "POST",
    body: JSON.stringify({
      product_id: input.productId,
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      phone: {
        number: input.phone,
        country_code: input.countryCode,
      },
      redirect_url: input.redirectUrl,
      payment_currency: input.currency,
      custom_metadata: {
        order_ref: input.orderReference,
        item_type: input.itemType,
        item_slug: input.itemSlug,
      },
      ...(input.customerIp && input.customerIp !== "anonymous"
        ? { customer_ip: input.customerIp }
        : {}),
    }),
  });

  const data = asObject(asObject(payload)?.data);
  const step = stringValue(data?.step);
  const purchase = asObject(data?.purchase);
  const payment = asObject(data?.payment);
  const saleId = stringValue(purchase?.id);
  const checkoutUrl = stringValue(payment?.checkout_url);

  if (step === "already_purchased") {
    return {
      step: "already_purchased",
      saleId: null,
      checkoutUrl: null,
      transactionId: null,
    };
  }

  if (step === "completed") {
    if (!saleId) {
      throw new PaymentProviderError(
        PROVIDER,
        "Chariow returned a completed checkout without a sale ID.",
        "invalid_response",
      );
    }
    return {
      step: "completed",
      saleId,
      checkoutUrl: null,
      transactionId: null,
    };
  }

  if (step !== "payment" || !saleId || !checkoutUrl) {
    throw new PaymentProviderError(
      PROVIDER,
      "Chariow returned an unexpected checkout response.",
      "invalid_response",
    );
  }

  return {
    step: "payment",
    saleId,
    checkoutUrl: assertHttpsCheckoutUrl(checkoutUrl),
    transactionId: stringValue(payment?.transaction_id) || null,
  };
}

export type ChariowSale = {
  id: string;
  status: string;
  currency: string;
  /** Chariow reports amounts in major units (for example 50000 XAF). */
  amountMajor: number | null;
  paymentStatus: string | null;
  customMetadata: Record<string, string> | null;
  raw: JsonObject;
};

export async function getChariowSale(saleId: string): Promise<ChariowSale> {
  if (!saleId) {
    throw new PaymentProviderError(
      PROVIDER,
      "A Chariow sale ID is required.",
      "invalid_request",
    );
  }
  const payload = await chariowFetch(`/sales/${encodeURIComponent(saleId)}`, {
    method: "GET",
  });
  const data = asObject(asObject(payload)?.data);
  if (!data || stringValue(data.id) !== saleId) {
    throw new PaymentProviderError(
      PROVIDER,
      "Chariow returned an invalid sale.",
      "invalid_response",
    );
  }

  const amount = asObject(data.amount);
  const payment = asObject(data.payment);
  const metadata = asObject(data.custom_metadata);
  const rawAmount = numberValue(amount?.value);

  return {
    id: saleId,
    status: stringValue(data.status).toLowerCase(),
    currency: stringValue(amount?.currency).toUpperCase(),
    amountMajor: rawAmount === null ? null : rawAmount,
    paymentStatus: payment ? stringValue(payment.status).toLowerCase() || null : null,
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
