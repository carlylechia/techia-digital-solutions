import "server-only";

import { newsletterSchema } from "@/lib/validation";
import { getPrisma } from "@/lib/prisma";
import { captureNewsletterException } from "@/lib/resend";
import { NEWSLETTER_MESSAGES } from "./constants";
import { syncNewsletterContact } from "./sync-contact";
import type {
  NewsletterContactSync,
  NewsletterDbClient,
  NewsletterSubscribeInput,
  NewsletterSubscribeResult,
} from "./types";

type SubscribeOptions = {
  prisma?: NewsletterDbClient | null;
  sync?: NewsletterContactSync;
};

function logNewsletter(
  level: "info" | "warn" | "error",
  event: string,
  context: Record<string, unknown>,
) {
  console[level]("[newsletter]", { event, ...context });
}

function emptyToNull(value: string | undefined) {
  return value?.trim() ? value.trim() : null;
}

export function normalizeNewsletterInput(raw: unknown):
  | { ok: true; input: NewsletterSubscribeInput; honeypot?: string }
  | { ok: false } {
  const parsed = newsletterSchema.safeParse(raw);
  if (!parsed.success) return { ok: false };

  return {
    ok: true,
    honeypot: parsed.data.honeypot || undefined,
    input: {
      email: parsed.data.email,
      firstName: parsed.data.firstName,
      language: parsed.data.language,
      interest: parsed.data.interest,
      source: parsed.data.source,
      businessName: parsed.data.businessName,
      consentDate: new Date(),
    },
  };
}

export async function subscribeToNewsletter(
  raw: unknown,
  options: SubscribeOptions = {},
): Promise<NewsletterSubscribeResult> {
  const normalized = normalizeNewsletterInput(raw);
  if (!normalized.ok) {
    logNewsletter("warn", "newsletter_invalid_payload", {});
    return {
      ok: false,
      status: "invalid",
      message: NEWSLETTER_MESSAGES.error,
    };
  }

  if (normalized.honeypot) {
    logNewsletter("info", "newsletter_honeypot_dropped", {
      email: normalized.input.email,
    });
    return {
      ok: true,
      status: "success",
      message: NEWSLETTER_MESSAGES.success,
      email: normalized.input.email,
      warnings: ["honeypot"],
    };
  }

  const prisma =
    options.prisma ?? (getPrisma() as NewsletterDbClient | null);
  if (!prisma) {
    const error = new Error("DATABASE_URL is not configured.");
    logNewsletter("error", "newsletter_database_unavailable", {
      email: normalized.input.email,
    });
    captureNewsletterException(error, {
      operation: "newsletter_database_unavailable",
      email: normalized.input.email,
    });
    return {
      ok: false,
      status: "error",
      message: NEWSLETTER_MESSAGES.error,
      email: normalized.input.email,
    };
  }

  const sync = options.sync ?? syncNewsletterContact;
  const input = normalized.input;

  try {
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: input.email },
    });

    if (existing?.subscribed && existing.resendContactId) {
      logNewsletter("info", "newsletter_duplicate_subscription", {
        email: input.email,
        subscriberId: existing.id,
      });
      return {
        ok: false,
        status: "duplicate",
        message: NEWSLETTER_MESSAGES.duplicate,
        email: input.email,
        subscriberId: existing.id,
        resendContactId: existing.resendContactId,
      };
    }

    const data = {
      email: input.email,
      firstName: emptyToNull(input.firstName),
      language: input.language,
      interest: input.interest,
      source: input.source,
      businessName: emptyToNull(input.businessName),
      consentDate: input.consentDate,
      subscribed: true,
    };

    const subscriber = existing
      ? await prisma.newsletterSubscriber.update({
          where: { email: input.email },
          data,
        })
      : await prisma.newsletterSubscriber.create({
          data,
        });

    const syncResult = await sync(input, {
      existingContactId: existing?.resendContactId,
      hadExistingSubscriber: Boolean(existing),
    });

    let finalSubscriber = subscriber;
    if (syncResult.resendContactId && syncResult.resendContactId !== subscriber.resendContactId) {
      finalSubscriber = await prisma.newsletterSubscriber.update({
        where: { email: input.email },
        data: { resendContactId: syncResult.resendContactId },
      });
    }

    logNewsletter("info", "newsletter_subscription_success", {
      email: input.email,
      subscriberId: finalSubscriber.id,
      language: input.language,
      source: input.source,
      resendContactId: syncResult.resendContactId || null,
      warnings: syncResult.warnings,
    });

    return {
      ok: true,
      status: "success",
      message: NEWSLETTER_MESSAGES.success,
      email: input.email,
      subscriberId: finalSubscriber.id,
      resendContactId: syncResult.resendContactId,
      warnings: syncResult.warnings,
    };
  } catch (error) {
    logNewsletter("error", "newsletter_subscription_failed", {
      email: input.email,
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    captureNewsletterException(error, {
      operation: "newsletter_subscription",
      email: input.email,
    });
    return {
      ok: false,
      status: "error",
      message: NEWSLETTER_MESSAGES.error,
      email: input.email,
    };
  }
}
