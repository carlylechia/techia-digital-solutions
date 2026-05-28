import { CustomerFeedbackForm } from "@/components/forms/customer-feedback-form";
import type { Locale } from "@/content/site";

type FounderFeedbackFormProps = {
  locale: Locale;
  projectOptions: Array<{ slug: string; name: string }>;
};

export function FounderFeedbackForm({ locale, projectOptions }: FounderFeedbackFormProps) {
  return <CustomerFeedbackForm locale={locale} projectOptions={projectOptions} className="mt-8" />;
}
