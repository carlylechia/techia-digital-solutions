export const NEWSLETTER_LANGUAGES = ["en", "fr"] as const;

export const NEWSLETTER_INTERESTS = [
  "general",
  "social-media",
  "digital-marketing",
  "branding",
  "websites",
  "seo",
  "automation",
  "ai",
  "courses",
] as const;

export const NEWSLETTER_SOURCES = [
  "footer",
  "homepage",
  "blog",
  "courses",
  "services",
] as const;

export const NEWSLETTER_MESSAGES = {
  success:
    "Thank you for subscribing to the teChia Growth Brief. Please check your inbox.",
  error: "Something went wrong. Please try again.",
  duplicate: "You're already subscribed to the teChia Growth Brief.",
} as const;

export const NEWSLETTER_AUTOMATION_EVENTS = {
  en: "newsletter.subscribed.en",
  fr: "newsletter.subscribed.fr",
} as const;

export const NEWSLETTER_DEFAULTS = {
  from: "teChia Growth Brief <growth@mail.techiadigital.com>",
  replyTo: "contact@techiadigital.com",
  interest: "general",
  source: "footer",
  language: "en",
  unsubscribePlaceholder: "{{{RESEND_UNSUBSCRIBE_URL}}}",
} as const;

export const NEWSLETTER_SEGMENT_ENV_KEYS = {
  en: "RESEND_SEGMENT_EN",
  fr: "RESEND_SEGMENT_FR",
  test: "RESEND_SEGMENT_TEST",
} as const;

export const NEWSLETTER_TEMPLATE_ENV_KEYS = {
  welcome: {
    en: "RESEND_TEMPLATE_WELCOME_EN",
    fr: "RESEND_TEMPLATE_WELCOME_FR",
  },
  checkup: {
    en: "RESEND_TEMPLATE_CHECKUP_EN",
    fr: "RESEND_TEMPLATE_CHECKUP_FR",
  },
} as const;
