"use server";

import { subscribeToNewsletter } from "@/lib/newsletter/subscribe";
import type { NewsletterSubscribeResult } from "@/lib/newsletter/types";

export async function subscribeToNewsletterAction(
  formData: FormData,
): Promise<NewsletterSubscribeResult> {
  return subscribeToNewsletter(Object.fromEntries(formData.entries()));
}
