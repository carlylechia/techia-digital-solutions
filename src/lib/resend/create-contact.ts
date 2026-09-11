import {
  getNewsletterResend,
  resendErrorMessage,
  withNewsletterRetry,
  type NewsletterContactPayload,
  type NewsletterResendResult,
} from "./core";

export async function createNewsletterContact(
  payload: NewsletterContactPayload,
): Promise<NewsletterResendResult> {
  const resend = getNewsletterResend();
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[newsletter]", {
        event: "resend_create_contact_skipped",
        reason: "missing_api_key",
        email: payload.email,
      });
    }
    return { skipped: true };
  }

  return withNewsletterRetry(async () => {
    const { data, error } = await resend.contacts.create({
      email: payload.email,
      firstName: payload.firstName || undefined,
      unsubscribed: payload.unsubscribed ?? false,
      properties: payload.properties,
      segments: payload.segmentId ? [{ id: payload.segmentId }] : undefined,
    });

    if (error) throw new Error(resendErrorMessage(error));
    return { id: data?.id };
  }, { operation: "resend_create_contact", email: payload.email });
}
