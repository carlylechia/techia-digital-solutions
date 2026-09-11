import {
  getNewsletterResend,
  resendErrorMessage,
  withNewsletterRetry,
  type NewsletterResendResult,
} from "./core";

export async function triggerNewsletterAutomation({
  contactId,
  email,
  event,
  payload,
}: {
  contactId?: string | null;
  email: string;
  event: string;
  payload?: Record<string, unknown>;
}): Promise<NewsletterResendResult> {
  const resend = getNewsletterResend();
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[newsletter]", {
        event: "resend_automation_skipped",
        reason: "missing_api_key",
        email,
        automationEvent: event,
      });
    }
    return { skipped: true };
  }

  return withNewsletterRetry(async () => {
    const { error } = await resend.events.send(
      contactId
        ? { event, contactId, payload }
        : { event, email, payload },
    );

    if (error) throw new Error(resendErrorMessage(error));
    return { id: event };
  }, { operation: "resend_trigger_automation", email, automationEvent: event });
}
