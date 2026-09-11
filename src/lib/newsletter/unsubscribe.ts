import "server-only";

import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import {
  captureNewsletterException,
  updateNewsletterContact,
} from "@/lib/resend";
import { NEWSLETTER_MESSAGES } from "./constants";
import type { NewsletterDbClient, NewsletterSubscribeResult } from "./types";

const unsubscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(180),
});

type UnsubscribeOptions = {
  prisma?: NewsletterDbClient | null;
  updateResend?: typeof updateNewsletterContact;
};

function logNewsletter(
  level: "info" | "warn" | "error",
  event: string,
  context: Record<string, unknown>,
) {
  console[level]("[newsletter]", { event, ...context });
}

export async function unsubscribeFromNewsletter(
  raw: unknown,
  options: UnsubscribeOptions = {},
): Promise<NewsletterSubscribeResult> {
  const parsed = unsubscribeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      status: "invalid",
      message: NEWSLETTER_MESSAGES.error,
    };
  }

  const prisma =
    options.prisma ?? (getPrisma() as NewsletterDbClient | null);
  if (!prisma) {
    const error = new Error("DATABASE_URL is not configured.");
    captureNewsletterException(error, {
      operation: "newsletter_unsubscribe_database_unavailable",
      email: parsed.data.email,
    });
    return {
      ok: false,
      status: "error",
      message: NEWSLETTER_MESSAGES.error,
      email: parsed.data.email,
    };
  }

  const updateResend = options.updateResend ?? updateNewsletterContact;

  try {
    const subscriber = await prisma.newsletterSubscriber.update({
      where: { email: parsed.data.email },
      data: { subscribed: false },
    });

    await updateResend({
      email: parsed.data.email,
      firstName: subscriber.firstName,
      unsubscribed: true,
      properties: {
        first_name: subscriber.firstName || null,
        language: subscriber.language || "en",
        interest: subscriber.interest || "general",
        source: subscriber.source || "footer",
        consent_date:
          subscriber.consentDate?.toISOString() || new Date().toISOString(),
        business_name: subscriber.businessName || null,
      },
    }).catch((error) => {
      logNewsletter("warn", "newsletter_resend_unsubscribe_failed", {
        email: parsed.data.email,
        message: error instanceof Error ? error.message : error,
      });
      captureNewsletterException(error, {
        operation: "newsletter_resend_unsubscribe",
        email: parsed.data.email,
      });
    });

    logNewsletter("info", "newsletter_unsubscribe_success", {
      email: parsed.data.email,
      subscriberId: subscriber.id,
    });

    return {
      ok: true,
      status: "success",
      message: "You have successfully unsubscribed from the teChia Growth Brief.",
      email: parsed.data.email,
      subscriberId: subscriber.id,
      resendContactId: subscriber.resendContactId || undefined,
    };
  } catch (error) {
    logNewsletter("warn", "newsletter_unsubscribe_no_local_row", {
      email: parsed.data.email,
      message: error instanceof Error ? error.message : error,
    });
    captureNewsletterException(error, {
      operation: "newsletter_unsubscribe",
      email: parsed.data.email,
    });

    return {
      ok: true,
      status: "success",
      message: "You have successfully unsubscribed from the teChia Growth Brief.",
      email: parsed.data.email,
    };
  }
}
