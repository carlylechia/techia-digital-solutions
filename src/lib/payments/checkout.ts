import "server-only";

import { randomBytes } from "node:crypto";
import type { AcademyPaymentProvider } from "@prisma/client";
import type { Locale } from "@/content/site";
import { getPrisma } from "@/lib/prisma";
import { getPublicAppPath } from "@/lib/site-routes";
import {
  effectiveCoursePriceMinor,
  effectivePackPriceMinor,
} from "@/lib/courses/pricing";
import { createChariowCheckout } from "./chariow";
import { createMonerooCheckout } from "./moneroo";
import { formatMoney } from "./money";
import {
  getCheckoutReturnUrl,
  internalCheckoutEnabled,
  isProviderConfigured,
  PaymentProviderError,
  type PaymentProviderId,
} from "./providers";

export type CheckoutItem = {
  type: "course" | "pack";
  databaseId: string;
  slug: string;
  title: string;
  summary: string;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  currency: string;
  chariowProductId: string | null;
  financialDisclaimerRequired: boolean;
  path: string;
  lessonCount: number;
  courseCount: number;
};

export type CheckoutInput = {
  itemType: "course" | "pack";
  itemSlug: string;
  provider: PaymentProviderId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  locale: Locale;
  idempotencyKey: string;
  customerIp?: string;
};

export type StartCheckoutResult =
  | {
      status: "redirect";
      reference: string;
      checkoutUrl: string;
      provider: PaymentProviderId;
    }
  | {
      status: "verify";
      reference: string;
      returnUrl: string;
      provider: PaymentProviderId;
    }
  | {
      status: "already_purchased";
      reference: string;
      message: string;
    };

export class CheckoutError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "CheckoutError";
    this.code = code;
    this.status = status;
  }
}

function fromLocale(locale: Locale, en: string, fr?: string | null) {
  if (locale === "fr") return fr?.trim() || en;
  return en;
}

function validPrice(value: number | null) {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : null;
}

export async function resolveCheckoutItem(
  locale: Locale,
  itemType: "course" | "pack",
  slug: string,
): Promise<CheckoutItem | null> {
  const prisma = getPrisma();
  if (!prisma) return null;

  if (itemType === "course") {
    const course = await prisma.academyCourse.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: { _count: { select: { lessons: true } } },
    });
    if (!course) return null;
    // Business default: a course without a manually set price sells at 2,000 FCFA
    // (applies to XAF items; non-XAF currencies require an explicit price).
    const priceMinor = effectiveCoursePriceMinor(course.priceMinor, course.currency);
    if (!priceMinor) return null;
    return {
      type: "course",
      databaseId: course.id,
      slug: course.slug,
      title: fromLocale(locale, course.titleEn, course.titleFr),
      summary: fromLocale(
        locale,
        course.shortDescriptionEn,
        course.shortDescriptionFr,
      ),
      priceMinor,
      compareAtPriceMinor: validPrice(course.compareAtPriceMinor),
      currency: course.currency.toUpperCase(),
      chariowProductId: course.chariowProductId,
      financialDisclaimerRequired: course.financialDisclaimerRequired,
      path: getPublicAppPath(`/courses/${course.slug}`),
      lessonCount: course._count.lessons,
      courseCount: 0,
    };
  }

  const pack = await prisma.academyCoursePack.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { _count: { select: { items: true } } },
  });
  if (!pack) return null;
  // Business default: a pack without a manually set price sells at 5,000 FCFA
  // (applies to XAF items; non-XAF currencies require an explicit price).
  const priceMinor = effectivePackPriceMinor(pack.priceMinor, pack.currency);
  if (!priceMinor) return null;
  return {
    type: "pack",
    databaseId: pack.id,
    slug: pack.slug,
    title: fromLocale(locale, pack.titleEn, pack.titleFr),
    summary: fromLocale(locale, pack.summaryEn, pack.summaryFr),
    priceMinor,
    compareAtPriceMinor: validPrice(pack.compareAtPriceMinor),
    currency: pack.currency.toUpperCase(),
    chariowProductId: pack.chariowProductId,
    financialDisclaimerRequired: false,
    path: getPublicAppPath(`/courses/${pack.slug}`),
    lessonCount: 0,
    courseCount: pack._count.items,
  };
}

function generateReference() {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = randomBytes(4).toString("hex").toUpperCase();
  return `TECH-${stamp}-${suffix}`;
}

function providerEnum(provider: PaymentProviderId): AcademyPaymentProvider {
  return provider;
}

function phoneDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

function providerProductMissing() {
  return new CheckoutError(
    "provider_product_missing",
    "This item is not connected to the selected payment provider yet.",
    409,
  );
}

export async function startAcademyCheckout(
  input: CheckoutInput,
): Promise<StartCheckoutResult> {
  if (!internalCheckoutEnabled()) {
    throw new CheckoutError(
      "checkout_disabled",
      "The academy checkout is not enabled yet.",
      503,
    );
  }
  if (!isProviderConfigured(input.provider)) {
    throw new CheckoutError(
      "provider_unavailable",
      "The selected payment provider is not available.",
      503,
    );
  }

  const item = await resolveCheckoutItem(
    input.locale,
    input.itemType,
    input.itemSlug,
  );
  if (!item) {
    throw new CheckoutError(
      "item_unavailable",
      "This item is not available for checkout.",
      404,
    );
  }
  // Chariow can only charge an item linked to a Chariow product. Reject before
  // creating any order row so a misconfigured item never leaves PENDING rows.
  if (input.provider === "CHARIOW" && !item.chariowProductId) {
    throw providerProductMissing();
  }

  const prisma = getPrisma();
  if (!prisma) {
    throw new CheckoutError(
      "storage_unavailable",
      "Checkout is temporarily unavailable.",
      503,
    );
  }

  const existing = await prisma.academyOrder.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { items: true },
  });
  if (existing) {
    const sameItem =
      existing.items.length === 1 &&
      existing.items[0]?.slugSnapshot === item.slug &&
      existing.items[0]?.type ===
        (item.type === "pack" ? "PACK" : "COURSE");
    if (
      !sameItem ||
      existing.provider !== providerEnum(input.provider) ||
      existing.totalMinor !== item.priceMinor
    ) {
      throw new CheckoutError(
        "idempotency_conflict",
        "This checkout attempt no longer matches the selected item.",
        409,
      );
    }
    if (existing.status === "PAID") {
      return {
        status: "already_purchased",
        reference: existing.reference,
        message: "This order is already paid.",
      };
    }
    if (existing.status === "PENDING" && existing.checkoutUrl) {
      return {
        status: "redirect",
        reference: existing.reference,
        checkoutUrl: existing.checkoutUrl,
        provider: input.provider,
      };
    }
    throw new CheckoutError(
      "checkout_retry",
      "This checkout attempt is no longer active. Please start again.",
      409,
    );
  }

  const reference = generateReference();
  const customerName = `${input.firstName} ${input.lastName}`.trim();
  const returnUrl = getCheckoutReturnUrl(reference, input.provider);

  let orderId: string;
  try {
    const createdOrder = await prisma.academyOrder.create({
      data: {
        reference,
        idempotencyKey: input.idempotencyKey,
        status: "PENDING",
        customerName,
        customerEmail: input.email,
        customerPhone: input.phone,
        customerCountry: input.countryCode,
        locale: input.locale,
        currency: item.currency,
        subtotalMinor: item.priceMinor,
        discountMinor: 0,
        totalMinor: item.priceMinor,
        provider: providerEnum(input.provider),
        metadata: {
          itemType: item.type,
          itemSlug: item.slug,
          source: "academy_checkout",
        },
        items: {
          create: {
            type: item.type === "pack" ? "PACK" : "COURSE",
            courseId: item.type === "course" ? item.databaseId : null,
            packId: item.type === "pack" ? item.databaseId : null,
            titleSnapshot: item.title,
            slugSnapshot: item.slug,
            quantity: 1,
            unitPriceMinor: item.priceMinor,
            totalMinor: item.priceMinor,
            metadata: {
              currency: item.currency,
              financialDisclaimerRequired: item.financialDisclaimerRequired,
            },
          },
        },
        payments: {
          create: {
            provider: providerEnum(input.provider),
            status: "PENDING",
            amountMinor: item.priceMinor,
            currency: item.currency,
            idempotencyKey: `${reference}:${input.provider}`,
          },
        },
      },
    });
    orderId = createdOrder.id;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      const raced = await prisma.academyOrder.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (raced?.checkoutUrl) {
        return {
          status: "redirect",
          reference: raced.reference,
          checkoutUrl: raced.checkoutUrl,
          provider: input.provider,
        };
      }
    }
    throw new CheckoutError(
      "storage_error",
      "Checkout could not be prepared. Please try again.",
      500,
    );
  }

  try {
    if (input.provider === "CHARIOW") {
      if (!item.chariowProductId) throw providerProductMissing();
      const checkout = await createChariowCheckout({
        productId: item.chariowProductId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: phoneDigits(input.phone),
        countryCode: input.countryCode,
        redirectUrl: returnUrl,
        orderReference: reference,
        itemType: item.type,
        itemSlug: item.slug,
        currency: item.currency,
        customerIp: input.customerIp,
      });

      if (checkout.step === "already_purchased") {
        await prisma.$transaction([
          prisma.academyOrder.update({
            where: { reference },
            data: {
              status: "REQUIRES_REVIEW",
              notes:
                "Chariow reported that this customer already owns the product.",
            },
          }),
          prisma.academyPayment.updateMany({
            where: { orderId },
            data: {
              status: "REQUIRES_REVIEW",
              failureReason:
                "Chariow reported an existing product entitlement. Verify access manually before charging again.",
            },
          }),
        ]);
        return {
          status: "already_purchased",
          reference,
          message:
            "Chariow reports that this customer already owns this product. Contact support if access is missing.",
        };
      }

      if (checkout.step === "completed") {
        await prisma.academyOrder.update({
          where: { reference },
          data: {
            providerPaymentId: checkout.saleId,
            status: "PENDING",
          },
        });
        await prisma.academyPayment.updateMany({
          where: { orderId },
          data: {
            status: "PROCESSING",
            providerPaymentId: checkout.saleId,
          },
        });
        return {
          status: "verify",
          reference,
          returnUrl,
          provider: input.provider,
        };
      }

      await prisma.academyOrder.update({
        where: { reference },
        data: {
          providerPaymentId: checkout.saleId,
          checkoutUrl: checkout.checkoutUrl,
        },
      });
      await prisma.academyPayment.updateMany({
        where: { orderId },
        data: {
          status: "PROCESSING",
          providerPaymentId: checkout.saleId,
          providerReference: checkout.transactionId,
          checkoutUrl: checkout.checkoutUrl,
        },
      });
      return {
        status: "redirect",
        reference,
        checkoutUrl: checkout.checkoutUrl,
        provider: input.provider,
      };
    }

    const checkout = await createMonerooCheckout({
      amountMinor: item.priceMinor,
      currency: item.currency,
      description: `${item.title} — ${reference}`,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      returnUrl,
      orderReference: reference,
      itemType: item.type,
      itemSlug: item.slug,
    });

    await prisma.academyOrder.update({
      where: { reference },
      data: {
        providerPaymentId: checkout.paymentId,
        checkoutUrl: checkout.checkoutUrl,
      },
    });
    await prisma.academyPayment.updateMany({
      where: { orderId },
      data: {
        status: "PROCESSING",
        providerPaymentId: checkout.paymentId,
        checkoutUrl: checkout.checkoutUrl,
      },
    });
    return {
      status: "redirect",
      reference,
      checkoutUrl: checkout.checkoutUrl,
      provider: input.provider,
    };
  } catch (error) {
    const safeMessage =
      error instanceof PaymentProviderError
        ? error.message
        : error instanceof CheckoutError
          ? error.message
          : "The payment provider could not start the checkout.";
    await prisma.academyOrder
      .update({
        where: { reference },
        data: { status: "FAILED", failedAt: new Date(), notes: safeMessage },
      })
      .catch(() => undefined);
    await prisma.academyPayment
      .updateMany({
        where: { order: { reference } },
        data: { status: "FAILED", failureReason: safeMessage },
      })
      .catch(() => undefined);

    if (error instanceof CheckoutError) throw error;
    throw new CheckoutError(
      "provider_error",
      "The payment provider could not start the checkout. Please try again.",
      502,
    );
  }
}

export function checkoutPriceLabel(item: CheckoutItem, locale: Locale) {
  return formatMoney(item.priceMinor, item.currency, locale);
}
