import type { NewsletterLanguage } from "@/lib/newsletter/types";
import {
  getNewsletterResend,
  getNewsletterTemplateIds,
  newsletterFromAddress,
  newsletterReplyToAddress,
  resendErrorMessage,
  withNewsletterRetry,
  type NewsletterResendResult,
} from "./core";

export async function sendTestNewsletter({
  to,
  language = "en",
  firstName,
}: {
  to: string;
  language?: NewsletterLanguage;
  firstName?: string;
}): Promise<NewsletterResendResult> {
  const templateIds = getNewsletterTemplateIds(language);
  if (!templateIds.welcome) {
    throw new Error(
      `Missing welcome template ID for ${language.toUpperCase()} newsletter test send.`,
    );
  }

  const resend = getNewsletterResend();
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[newsletter]", {
        event: "resend_test_send_skipped",
        reason: "missing_api_key",
        to,
      });
    }
    return { skipped: true };
  }

  return withNewsletterRetry(async () => {
    const { data, error } = await resend.emails.send({
      from: newsletterFromAddress(),
      replyTo: newsletterReplyToAddress(),
      to,
      subject: "teChia Growth Brief test",
      template: {
        id: templateIds.welcome,
        variables: {
          first_name: firstName || "",
          language,
        },
      },
    });

    if (error) throw new Error(resendErrorMessage(error));
    return { id: data?.id };
  }, { operation: "resend_send_test_newsletter", to, language });
}
