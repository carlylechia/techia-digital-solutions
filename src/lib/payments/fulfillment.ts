import "server-only";

import type { AcademyPaymentProvider, AcademyOrderStatus, AcademyPaymentStatus } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { majorToMinor } from "./money";
import { toSafeJsonValue, type PaymentProviderId } from "./providers";
import { getChariowSale } from "./chariow";
import { verifyMonerooPayment } from "./moneroo";
import { verifyChariowSignature, verifyMonerooSignature } from "./signatures";

type WebhookHeaders = Headers | Record<string, string | string[] | undefined>;

function headerValue(headers: WebhookHeaders, name: string) {
  if (headers instanceof Headers) return headers.get(name) || "";
  const key = name.toLowerCase();
  const value =
    headers[name] ??
    headers[key] ??
    Object.entries(headers).find(([k]) => k.toLowerCase() === key)?.[1];
  if (Array.isArray(value)) return value[0] || "";
  return typeof value === "string" ? value : "";
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

const FULL_PACK_BONUS_KEYS = [
  "digital-skills-learning-roadmap",
  "skill-monetization-starter-guide",
  "course-learning-tracker",
  "business-digital-checkup-template",
  "thirty-day-digital-skills-action-plan",
  "priority-buyer-support",
  "future-resource-updates",
] as const;

const STANDARD_BONUS_KEYS = [
  "digital-skills-learning-roadmap",
  "skill-monetization-starter-guide",
  "course-learning-tracker",
] as const;

function bonusKeysForOrder(order: {
  items: Array<{ slugSnapshot: string; type: string }>;
}) {
  const hasFullPack = order.items.some(
    (item) =>
      item.type === "PACK" && item.slugSnapshot === "complete-digital-skills-pack",
  );
  return hasFullPack ? [...FULL_PACK_BONUS_KEYS] : [...STANDARD_BONUS_KEYS];
}

async function grantOrderBonuses(orderId: string) {
  const prisma = getPrisma();
  if (!prisma) return;
  const order = await prisma.academyOrder.findUnique({
    where: { id: orderId },
    include: { items: { select: { slugSnapshot: true, type: true } } },
  });
  if (!order) return;
  const keys = bonusKeysForOrder(order);
  for (const bonusKey of keys) {
    await prisma.academyOrderBonusGrant.upsert({
      where: { orderId_bonusKey: { orderId, bonusKey } },
      create: { orderId, bonusKey, status: "ELIGIBLE" },
      update: {},
    });
  }
}

export type WebhookProcessResult = {
  ok: boolean;
  ignored?: boolean;
  duplicate?: boolean;
  status?: number;
  message: string;
  orderReference?: string | null;
};

export async function recordWebhookEvent(input: {
  provider: AcademyPaymentProvider;
  eventType: string;
  deliveryId: string | null;
  signatureValid: boolean;
  payload: unknown;
}) {
  const prisma = getPrisma();
  if (!prisma) {
    return { stored: false as const, duplicate: false as const, id: null };
  }
  if (input.deliveryId) {
    const existing = await prisma.academyWebhookEvent.findUnique({
      where: {
        provider_deliveryId: {
          provider: input.provider,
          deliveryId: input.deliveryId,
        },
      },
      select: { id: true, status: true },
    });
    if (existing) {
      return {
        stored: true as const,
        duplicate: existing.status === "PROCESSED" || existing.status === "IGNORED",
        id: existing.id,
      };
    }
  }
  const created = await prisma.academyWebhookEvent.create({
    data: {
      provider: input.provider,
      eventType: input.eventType,
      deliveryId: input.deliveryId,
      signatureValid: input.signatureValid,
      payload: toSafeJsonValue(input.payload),
    },
    select: { id: true },
  });
  return { stored: true as const, duplicate: false as const, id: created.id };
}

async function markWebhook(
  id: string | null,
  status: "PROCESSED" | "IGNORED" | "FAILED",
  error?: string,
) {
  if (!id) return;
  const prisma = getPrisma();
  if (!prisma) return;
  await prisma.academyWebhookEvent.update({
    where: { id },
    data: {
      status,
      error: error?.slice(0, 2000) || null,
      processedAt: status === "FAILED" ? null : new Date(),
    },
  });
}

async function findOrderForProvider(input: {
  provider: AcademyPaymentProvider;
  orderReference?: string | null;
  providerPaymentId?: string | null;
}) {
  const prisma = getPrisma();
  if (!prisma) return null;
  if (input.orderReference) {
    const byRef = await prisma.academyOrder.findUnique({
      where: { reference: input.orderReference },
      include: { payments: true, items: true },
    });
    if (byRef && byRef.provider === input.provider) return byRef;
  }
  if (input.providerPaymentId) {
    return prisma.academyOrder.findFirst({
      where: {
        provider: input.provider,
        OR: [
          { providerPaymentId: input.providerPaymentId },
          { payments: { some: { providerPaymentId: input.providerPaymentId } } },
        ],
      },
      include: { payments: true, items: true },
      orderBy: { createdAt: "desc" },
    });
  }
  return null;
}

async function applyOrderOutcome(input: {
  orderId: string;
  provider: AcademyPaymentProvider;
  providerPaymentId: string | null;
  orderStatus: AcademyOrderStatus;
  paymentStatus: AcademyPaymentStatus;
  amountMinor: number | null;
  currency: string | null;
  failureReason?: string | null;
  rawPayload: unknown;
  verified?: boolean;
}) {
  const prisma = getPrisma();
  if (!prisma) return;
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const current = await tx.academyOrder.findUnique({
      where: { id: input.orderId },
      select: { status: true },
    });
    if (!current) return;
    // Never downgrade a paid order.
    if (current.status === "PAID" && input.orderStatus !== "PAID") return;

    await tx.academyOrder.update({
      where: { id: input.orderId },
      data: {
        status: input.orderStatus,
        providerPaymentId: input.providerPaymentId || undefined,
        paidAt: input.orderStatus === "PAID" ? now : undefined,
        failedAt:
          input.orderStatus === "FAILED" || input.orderStatus === "CANCELLED"
            ? now
            : undefined,
        notes: input.failureReason || undefined,
      },
    });

    await tx.academyPayment.updateMany({
      where: {
        orderId: input.orderId,
        provider: input.provider,
      },
      data: {
        status: input.paymentStatus,
        providerPaymentId: input.providerPaymentId || undefined,
        failureReason: input.failureReason || null,
        providerPayload: toSafeJsonValue(input.rawPayload),
        verifiedAt: input.verified ? now : undefined,
        currency: input.currency || undefined,
        amountMinor: input.amountMinor ?? undefined,
      },
    });
  });

  if (input.orderStatus === "PAID") {
    await grantOrderBonuses(input.orderId);
  }
}

function orderRefFromMetadata(metadata: Record<string, string> | null | undefined) {
  if (!metadata) return null;
  return metadata.order_ref || metadata.order_reference || null;
}

export async function processChariowWebhook(input: {
  rawBody: string;
  headers: WebhookHeaders;
}): Promise<WebhookProcessResult> {
  const signature = headerValue(input.headers, "x-pulse-signature");
  const deliveryId = headerValue(input.headers, "x-pulse-delivery-id") || null;
  const secret = process.env.CHARIOW_WEBHOOK_SECRET?.trim() || "";
  const signatureValid = Boolean(
    secret && verifyChariowSignature(input.rawBody, signature, secret),
  );

  let payload: unknown;
  try {
    payload = JSON.parse(input.rawBody) as unknown;
  } catch {
    return { ok: false, status: 400, message: "Invalid JSON payload." };
  }

  const eventType = stringValue(asObject(payload)?.event) || "chariow.webhook";
  const record = await recordWebhookEvent({
    provider: "CHARIOW",
    eventType,
    deliveryId,
    signatureValid,
    payload,
  });
  if (record.duplicate) {
    return { ok: true, duplicate: true, message: "Duplicate webhook ignored." };
  }
  if (!signatureValid) {
    await markWebhook(record.id, "FAILED", "Invalid signature.");
    return { ok: false, status: 401, message: "Invalid webhook signature." };
  }

  const sale = asObject(asObject(payload)?.sale);
  const saleId = stringValue(sale?.id) || null;
  const metadata = asObject(sale?.custom_metadata);
  const metadataStrings = metadata
    ? Object.fromEntries(
        Object.entries(metadata)
          .filter(([, v]) => typeof v === "string")
          .map(([k, v]) => [k, v as string]),
      )
    : null;
  const orderReference = orderRefFromMetadata(metadataStrings);

  if (!saleId) {
    await markWebhook(record.id, "IGNORED", "No sale ID.");
    return { ok: true, ignored: true, message: "Webhook missing sale ID." };
  }

  try {
    const verifiedSale = await getChariowSale(saleId);
    const order = await findOrderForProvider({
      provider: "CHARIOW",
      orderReference: orderReference || orderRefFromMetadata(verifiedSale.customMetadata),
      providerPaymentId: verifiedSale.id,
    });
    if (!order) {
      await markWebhook(record.id, "IGNORED", "Order not found.");
      return { ok: true, ignored: true, message: "No matching order." };
    }

    const amountMinor =
      verifiedSale.amountMajor === null
        ? null
        : majorToMinor(verifiedSale.amountMajor, verifiedSale.currency || order.currency);
    const currencyMatch =
      !verifiedSale.currency || verifiedSale.currency === order.currency;
    const amountMatch = amountMinor !== null && amountMinor === order.totalMinor;
    const paid =
      (verifiedSale.status === "completed" || verifiedSale.status === "settled") &&
      verifiedSale.paymentStatus === "success";

    if (paid && currencyMatch && amountMatch) {
      await applyOrderOutcome({
        orderId: order.id,
        provider: "CHARIOW",
        providerPaymentId: verifiedSale.id,
        orderStatus: "PAID",
        paymentStatus: "SUCCEEDED",
        amountMinor,
        currency: verifiedSale.currency || order.currency,
        rawPayload: verifiedSale.raw,
        verified: true,
      });
      await markWebhook(record.id, "PROCESSED");
      return { ok: true, message: "Order marked paid.", orderReference: order.reference };
    }

    if (paid && (!currencyMatch || !amountMatch)) {
      await applyOrderOutcome({
        orderId: order.id,
        provider: "CHARIOW",
        providerPaymentId: verifiedSale.id,
        orderStatus: "REQUIRES_REVIEW",
        paymentStatus: "REQUIRES_REVIEW",
        amountMinor,
        currency: verifiedSale.currency || order.currency,
        failureReason: "Verified payment amount or currency did not match the order.",
        rawPayload: verifiedSale.raw,
        verified: true,
      });
      await markWebhook(record.id, "PROCESSED", "Amount/currency mismatch.");
      return {
        ok: true,
        message: "Payment requires review.",
        orderReference: order.reference,
      };
    }

    if (verifiedSale.status === "failed" || verifiedSale.status === "cancelled") {
      await applyOrderOutcome({
        orderId: order.id,
        provider: "CHARIOW",
        providerPaymentId: verifiedSale.id,
        orderStatus: verifiedSale.status === "cancelled" ? "CANCELLED" : "FAILED",
        paymentStatus: verifiedSale.status === "cancelled" ? "CANCELLED" : "FAILED",
        amountMinor,
        currency: verifiedSale.currency || order.currency,
        failureReason: `Chariow reported ${verifiedSale.status}.`,
        rawPayload: verifiedSale.raw,
        verified: true,
      });
    }

    await markWebhook(record.id, "PROCESSED");
    return { ok: true, message: "Webhook processed.", orderReference: order.reference };
  } catch (error) {
    await markWebhook(
      record.id,
      "FAILED",
      error instanceof Error ? error.message : "Processing failed.",
    );
    return { ok: false, status: 500, message: "Webhook processing failed." };
  }
}

export async function processMonerooWebhook(input: {
  rawBody: string;
  headers: WebhookHeaders;
}): Promise<WebhookProcessResult> {
  const signature = headerValue(input.headers, "x-moneroo-signature");
  const secret = process.env.MONEROO_WEBHOOK_SECRET?.trim() || "";
  const signatureValid = Boolean(
    secret && verifyMonerooSignature(input.rawBody, signature, secret),
  );

  let payload: unknown;
  try {
    payload = JSON.parse(input.rawBody) as unknown;
  } catch {
    return { ok: false, status: 400, message: "Invalid JSON payload." };
  }

  const eventType = stringValue(asObject(payload)?.event) || "moneroo.webhook";
  const data = asObject(asObject(payload)?.data);
  const paymentId = stringValue(data?.id) || null;
  const deliveryId = paymentId ? `${eventType}:${paymentId}` : null;

  const record = await recordWebhookEvent({
    provider: "MONEROO",
    eventType,
    deliveryId,
    signatureValid,
    payload,
  });
  if (record.duplicate) {
    return { ok: true, duplicate: true, message: "Duplicate webhook ignored." };
  }
  if (!signatureValid) {
    await markWebhook(record.id, "FAILED", "Invalid signature.");
    return { ok: false, status: 401, message: "Invalid webhook signature." };
  }
  if (!paymentId) {
    await markWebhook(record.id, "IGNORED", "No payment ID.");
    return { ok: true, ignored: true, message: "Webhook missing payment ID." };
  }

  try {
    const verified = await verifyMonerooPayment(paymentId);
    const metadataStrings = verified.customMetadata;
    const order = await findOrderForProvider({
      provider: "MONEROO",
      orderReference: orderRefFromMetadata(metadataStrings),
      providerPaymentId: verified.id,
    });
    if (!order) {
      await markWebhook(record.id, "IGNORED", "Order not found.");
      return { ok: true, ignored: true, message: "No matching order." };
    }

    const currencyMatch = !verified.currency || verified.currency === order.currency;
    const amountOk =
      verified.amountMinor !== null && verified.amountMinor >= order.totalMinor;
    const paid = verified.status === "success";

    if (paid && currencyMatch && amountOk) {
      await applyOrderOutcome({
        orderId: order.id,
        provider: "MONEROO",
        providerPaymentId: verified.id,
        orderStatus: "PAID",
        paymentStatus: "SUCCEEDED",
        amountMinor: verified.amountMinor,
        currency: verified.currency || order.currency,
        rawPayload: verified.raw,
        verified: true,
      });
      await markWebhook(record.id, "PROCESSED");
      return { ok: true, message: "Order marked paid.", orderReference: order.reference };
    }

    if (paid && (!currencyMatch || !amountOk)) {
      await applyOrderOutcome({
        orderId: order.id,
        provider: "MONEROO",
        providerPaymentId: verified.id,
        orderStatus: "REQUIRES_REVIEW",
        paymentStatus: "REQUIRES_REVIEW",
        amountMinor: verified.amountMinor,
        currency: verified.currency || order.currency,
        failureReason: "Verified payment amount or currency did not match the order.",
        rawPayload: verified.raw,
        verified: true,
      });
      await markWebhook(record.id, "PROCESSED", "Amount/currency mismatch.");
      return {
        ok: true,
        message: "Payment requires review.",
        orderReference: order.reference,
      };
    }

    if (verified.status === "failed" || verified.status === "cancelled") {
      await applyOrderOutcome({
        orderId: order.id,
        provider: "MONEROO",
        providerPaymentId: verified.id,
        orderStatus: verified.status === "cancelled" ? "CANCELLED" : "FAILED",
        paymentStatus: verified.status === "cancelled" ? "CANCELLED" : "FAILED",
        amountMinor: verified.amountMinor,
        currency: verified.currency || order.currency,
        failureReason: `Moneroo reported ${verified.status}.`,
        rawPayload: verified.raw,
        verified: true,
      });
    }

    await markWebhook(record.id, "PROCESSED");
    return { ok: true, message: "Webhook processed.", orderReference: order.reference };
  } catch (error) {
    await markWebhook(
      record.id,
      "FAILED",
      error instanceof Error ? error.message : "Processing failed.",
    );
    return { ok: false, status: 500, message: "Webhook processing failed." };
  }
}

export async function verifyOrderReturn(input: {
  reference: string;
  provider: PaymentProviderId;
}) {
  const prisma = getPrisma();
  if (!prisma) return { status: "unavailable" as const, order: null };
  const order = await prisma.academyOrder.findUnique({
    where: { reference: input.reference },
    include: { payments: true, items: true },
  });
  if (!order) return { status: "not_found" as const, order: null };
  if (order.provider !== input.provider) {
    return { status: "mismatch" as const, order };
  }
  if (order.status === "PAID") return { status: "paid" as const, order };

  const providerPaymentId = order.providerPaymentId || order.payments[0]?.providerPaymentId;
  if (!providerPaymentId) {
    return { status: order.status.toLowerCase() as "pending" | "failed", order };
  }

  try {
    if (input.provider === "CHARIOW") {
      const sale = await getChariowSale(providerPaymentId);
      const amountMinor =
        sale.amountMajor === null
          ? null
          : majorToMinor(sale.amountMajor, sale.currency || order.currency);
      const paid =
        (sale.status === "completed" || sale.status === "settled") &&
        sale.paymentStatus === "success" &&
        amountMinor === order.totalMinor &&
        (!sale.currency || sale.currency === order.currency);
      if (paid) {
        await applyOrderOutcome({
          orderId: order.id,
          provider: "CHARIOW",
          providerPaymentId: sale.id,
          orderStatus: "PAID",
          paymentStatus: "SUCCEEDED",
          amountMinor,
          currency: sale.currency || order.currency,
          rawPayload: sale.raw,
          verified: true,
        });
      } else if (sale.status === "failed" || sale.status === "cancelled") {
        await applyOrderOutcome({
          orderId: order.id,
          provider: "CHARIOW",
          providerPaymentId: sale.id,
          orderStatus: sale.status === "cancelled" ? "CANCELLED" : "FAILED",
          paymentStatus: sale.status === "cancelled" ? "CANCELLED" : "FAILED",
          amountMinor,
          currency: sale.currency || order.currency,
          failureReason: `Chariow reported ${sale.status}.`,
          rawPayload: sale.raw,
          verified: true,
        });
      }
    } else {
      const payment = await verifyMonerooPayment(providerPaymentId);
      const paid =
        payment.status === "success" &&
        payment.amountMinor !== null &&
        payment.amountMinor >= order.totalMinor &&
        (!payment.currency || payment.currency === order.currency);
      if (paid) {
        await applyOrderOutcome({
          orderId: order.id,
          provider: "MONEROO",
          providerPaymentId: payment.id,
          orderStatus: "PAID",
          paymentStatus: "SUCCEEDED",
          amountMinor: payment.amountMinor,
          currency: payment.currency || order.currency,
          rawPayload: payment.raw,
          verified: true,
        });
      } else if (payment.status === "failed" || payment.status === "cancelled") {
        await applyOrderOutcome({
          orderId: order.id,
          provider: "MONEROO",
          providerPaymentId: payment.id,
          orderStatus: payment.status === "cancelled" ? "CANCELLED" : "FAILED",
          paymentStatus: payment.status === "cancelled" ? "CANCELLED" : "FAILED",
          amountMinor: payment.amountMinor,
          currency: payment.currency || order.currency,
          failureReason: `Moneroo reported ${payment.status}.`,
          rawPayload: payment.raw,
          verified: true,
        });
      }
    }
  } catch {
    // Return page must remain safe and informative even if verification is
    // temporarily unavailable. Webhooks remain the source of truth.
  }

  const refreshed = await prisma.academyOrder.findUnique({
    where: { id: order.id },
    include: { payments: true, items: true, bonusGrants: true },
  });
  if (!refreshed) return { status: "not_found" as const, order: null };
  const status =
    refreshed.status === "PAID"
      ? ("paid" as const)
      : refreshed.status === "FAILED"
        ? ("failed" as const)
        : refreshed.status === "CANCELLED"
          ? ("cancelled" as const)
          : refreshed.status === "REQUIRES_REVIEW"
            ? ("review" as const)
            : ("pending" as const);
  return { status, order: refreshed };
}
