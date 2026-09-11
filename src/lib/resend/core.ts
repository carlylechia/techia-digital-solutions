import "server-only";

import { Resend } from "resend";
import {
  NEWSLETTER_DEFAULTS,
  NEWSLETTER_LANGUAGES,
  NEWSLETTER_TEMPLATE_ENV_KEYS,
} from "@/lib/newsletter/constants";

type NewsletterLanguage = (typeof NEWSLETTER_LANGUAGES)[number];

export type NewsletterContactPayload = {
  email: string;
  firstName?: string | null;
  properties: Record<string, string | number | null>;
  segmentId?: string | null;
  unsubscribed?: boolean;
};

export type NewsletterResendResult = {
  id?: string;
  skipped?: boolean;
};

type CaptureContext = Record<string, unknown>;

type SentryLike = {
  captureException?: (
    error: unknown,
    context?: { extra?: CaptureContext },
  ) => void;
};

export function cleanEnv(value: string | undefined): string | undefined {
  if (!value) return value;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function getNewsletterResend() {
  const apiKey =
    cleanEnv(process.env.RESEND_NEWSLETTER_API_KEY) ||
    cleanEnv(process.env.RESEND_API_KEY);
  if (!apiKey || apiKey.startsWith("re_placeholder")) return null;
  return new Resend(apiKey);
}

export function newsletterFromAddress() {
  return cleanEnv(process.env.RESEND_FROM) || NEWSLETTER_DEFAULTS.from;
}

export function newsletterReplyToAddress() {
  return cleanEnv(process.env.RESEND_REPLY_TO) || NEWSLETTER_DEFAULTS.replyTo;
}

export function getNewsletterTemplateIds(language: NewsletterLanguage) {
  return {
    welcome: cleanEnv(process.env[NEWSLETTER_TEMPLATE_ENV_KEYS.welcome[language]]),
    checkup: cleanEnv(process.env[NEWSLETTER_TEMPLATE_ENV_KEYS.checkup[language]]),
  };
}

export function captureNewsletterException(
  error: unknown,
  context: CaptureContext,
) {
  const sentry = (globalThis as typeof globalThis & { Sentry?: SentryLike })
    .Sentry;
  sentry?.captureException?.(error, { extra: context });
}

export async function withNewsletterRetry<T>(
  operation: () => Promise<T>,
  context: CaptureContext,
  attempts = 3,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts) break;
      await new Promise((resolve) => setTimeout(resolve, 175 * attempt));
    }
  }

  captureNewsletterException(lastError, context);
  throw lastError;
}

export function resendErrorMessage(error: {
  name?: string;
  message?: string;
  statusCode?: number;
}) {
  return `Resend error${error.statusCode ? ` ${error.statusCode}` : ""}${
    error.name ? ` (${error.name})` : ""
  }: ${error.message || "Unknown error"}`;
}
