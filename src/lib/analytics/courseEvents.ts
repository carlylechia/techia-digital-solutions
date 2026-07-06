"use client";

import { trackEvent } from "@/components/analytics/analytics";

export type CourseEventName =
  | "courses_page_view"
  | "course_pack_view"
  | "course_pack_click"
  | "chariow_checkout_click"
  | "whatsapp_course_inquiry"
  | "faq_opened"
  | "buyer_bonus_section_view"
  | "buyer_bonus_claim_click"
  | "bonus_card_click"
  | "full_pack_bonus_upsell_click"
  | "bonus_download_click"
  | "whatsapp_bonus_claim_click"
  | (string & {});

export type CourseEventPayload = {
  pack_id?: string;
  pack_slug?: string;
  pack_title?: string;
  source_page: string;
  faq_question?: string;
  bonus_id?: string;
  eligibility?: string;
};

type GenericEventPayload = Record<
  string,
  string | number | boolean | undefined
>;

function cleanPayload(payload?: GenericEventPayload) {
  if (!payload) return undefined;
  return Object.fromEntries(
    Object.entries(payload).filter(
      (entry): entry is [string, string | number | boolean] =>
        entry[1] !== undefined &&
        !(typeof entry[1] === "string" && entry[1].length === 0),
    ),
  );
}

export function trackCourseEvent(
  name: CourseEventName,
  payload?: GenericEventPayload,
) {
  trackEvent(name, cleanPayload(payload));
}
