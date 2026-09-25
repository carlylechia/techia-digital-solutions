export const BLOG_LOCALES = ["en", "fr"] as const;
export type BlogLocale = (typeof BLOG_LOCALES)[number];

export const BLOG_POST_STATUSES = [
  "DRAFT",
  "IN_REVIEW",
  "CHANGES_REQUESTED",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
] as const;

export type BlogPostStatusValue = (typeof BLOG_POST_STATUSES)[number];
export type BlogWorkflowAction =
  | "SUBMIT"
  | "REQUEST_CHANGES"
  | "RETURN_TO_DRAFT"
  | "APPROVE"
  | "PUBLISH"
  | "SCHEDULE"
  | "ARCHIVE"
  | "RESTORE";

export const BLOG_PAGE_SIZE = 9;
export const BLOG_ADMIN_PAGE_SIZE = 20;
export const BLOG_HOMEPAGE_PICKS_LIMIT = 3;
export const BLOG_MAX_HTML_BYTES = 350_000;
export const BLOG_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const BLOG_ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const BLOG_STATUS_LABELS: Record<BlogLocale, Record<BlogPostStatusValue, string>> = {
  en: {
    DRAFT: "Draft",
    IN_REVIEW: "In review",
    CHANGES_REQUESTED: "Changes requested",
    SCHEDULED: "Scheduled",
    PUBLISHED: "Published",
    ARCHIVED: "Archived",
  },
  fr: {
    DRAFT: "Brouillon",
    IN_REVIEW: "En revue",
    CHANGES_REQUESTED: "Modifications demandées",
    SCHEDULED: "Programmé",
    PUBLISHED: "Publié",
    ARCHIVED: "Archivé",
  },
};
