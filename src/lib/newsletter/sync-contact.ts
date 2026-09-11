import "server-only";

import {
  addNewsletterContactToSegment,
  captureNewsletterException,
  cleanEnv,
  createNewsletterContact,
  triggerNewsletterAutomation,
  updateNewsletterContact,
} from "@/lib/resend";
import {
  NEWSLETTER_AUTOMATION_EVENTS,
  NEWSLETTER_SEGMENT_ENV_KEYS,
} from "./constants";
import type {
  NewsletterLanguage,
  NewsletterSubscribeInput,
  NewsletterSyncResult,
} from "./types";

function logNewsletter(
  level: "info" | "warn" | "error",
  event: string,
  context: Record<string, unknown>,
) {
  console[level]("[newsletter]", { event, ...context });
}

export function getNewsletterSegmentId(language: NewsletterLanguage) {
  return cleanEnv(process.env[NEWSLETTER_SEGMENT_ENV_KEYS[language]]) || null;
}

export function getNewsletterTestingSegmentId() {
  return cleanEnv(process.env[NEWSLETTER_SEGMENT_ENV_KEYS.test]) || null;
}

export function newsletterContactProperties(input: NewsletterSubscribeInput) {
  const consentDate = input.consentDate ?? new Date();

  return {
    first_name: input.firstName || null,
    language: input.language,
    interest: input.interest,
    source: input.source,
    consent_date: consentDate.toISOString(),
    business_name: input.businessName || null,
  };
}

async function createOrRepairContact(
  input: NewsletterSubscribeInput,
  properties: Record<string, string | number | null>,
  segmentId: string | null,
  hadExistingSubscriber: boolean,
) {
  if (hadExistingSubscriber) {
    try {
      return await updateNewsletterContact({
        email: input.email,
        firstName: input.firstName,
        properties,
        unsubscribed: false,
      });
    } catch (error) {
      logNewsletter("warn", "resend_update_contact_failed_create_fallback", {
        email: input.email,
        message: error instanceof Error ? error.message : error,
      });
      captureNewsletterException(error, {
        operation: "resend_update_contact_fallback",
        email: input.email,
      });
    }
  }

  try {
    return await createNewsletterContact({
      email: input.email,
      firstName: input.firstName,
      properties,
      segmentId,
      unsubscribed: false,
    });
  } catch (error) {
    logNewsletter("warn", "resend_create_contact_failed_update_fallback", {
      email: input.email,
      message: error instanceof Error ? error.message : error,
    });
    captureNewsletterException(error, {
      operation: "resend_create_contact_fallback",
      email: input.email,
    });
    return updateNewsletterContact({
      email: input.email,
      firstName: input.firstName,
      properties,
      unsubscribed: false,
    });
  }
}

export async function syncNewsletterContact(
  input: NewsletterSubscribeInput,
  options?: {
    existingContactId?: string | null;
    hadExistingSubscriber?: boolean;
  },
): Promise<NewsletterSyncResult> {
  const warnings: string[] = [];
  const segmentId = getNewsletterSegmentId(input.language);
  const automationEvent = NEWSLETTER_AUTOMATION_EVENTS[input.language];
  const properties = newsletterContactProperties(input);

  if (!segmentId) {
    warnings.push(`Missing ${NEWSLETTER_SEGMENT_ENV_KEYS[input.language]}`);
    logNewsletter("warn", "newsletter_segment_missing", {
      email: input.email,
      language: input.language,
    });
  }

  const contact = await createOrRepairContact(
    input,
    properties,
    segmentId,
    Boolean(options?.hadExistingSubscriber),
  );

  if (contact.skipped) {
    warnings.push("Resend sync skipped because the newsletter API key is not configured.");
    return {
      skipped: true,
      segmentId: segmentId || undefined,
      automationEvent,
      warnings,
    };
  }

  const contactId = contact.id || options?.existingContactId || undefined;

  if (segmentId) {
    try {
      await addNewsletterContactToSegment({
        contactId,
        email: input.email,
        segmentId,
      });
    } catch (error) {
      logNewsletter("error", "newsletter_segment_assignment_failed", {
        email: input.email,
        language: input.language,
        segmentId,
        message: error instanceof Error ? error.message : error,
      });
      captureNewsletterException(error, {
        operation: "newsletter_segment_assignment",
        email: input.email,
        segmentId,
      });
      throw error;
    }
  }

  try {
    await triggerNewsletterAutomation({
      contactId,
      email: input.email,
      event: automationEvent,
      payload: {
        language: input.language,
        interest: input.interest,
        source: input.source,
        first_name: input.firstName || "",
        business_name: input.businessName || "",
      },
    });
  } catch (error) {
    logNewsletter("error", "newsletter_automation_failed", {
      email: input.email,
      automationEvent,
      message: error instanceof Error ? error.message : error,
    });
    captureNewsletterException(error, {
      operation: "newsletter_automation",
      email: input.email,
      automationEvent,
    });
    throw error;
  }

  logNewsletter("info", "newsletter_resend_sync_success", {
    email: input.email,
    language: input.language,
    segmentId,
    automationEvent,
  });

  return {
    resendContactId: contactId,
    segmentId: segmentId || undefined,
    automationEvent,
    warnings,
  };
}
