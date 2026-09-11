import {
  getNewsletterResend,
  resendErrorMessage,
  withNewsletterRetry,
  type NewsletterResendResult,
} from "./core";

export async function addNewsletterContactToSegment({
  contactId,
  email,
  segmentId,
}: {
  contactId?: string | null;
  email: string;
  segmentId: string;
}): Promise<NewsletterResendResult> {
  const resend = getNewsletterResend();
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[newsletter]", {
        event: "resend_segment_skipped",
        reason: "missing_api_key",
        email,
        segmentId,
      });
    }
    return { skipped: true };
  }

  return withNewsletterRetry(async () => {
    const { data, error } = await resend.contacts.segments.add(
      contactId ? { contactId, segmentId } : { email, segmentId },
    );

    if (error) throw new Error(resendErrorMessage(error));
    return { id: data?.id };
  }, { operation: "resend_add_to_segment", email, segmentId });
}
