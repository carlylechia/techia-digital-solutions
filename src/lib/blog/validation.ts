import { z } from "zod";
import { BLOG_MAX_HTML_BYTES } from "./constants";
import { htmlToPlainText, sanitizeArticleHtml } from "./sanitize";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const optionalUrl = z.string().trim().max(1000).optional().or(z.literal(""));
const optionalImageUrl = z.string().trim().max(1000).refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["res.cloudinary.com", "techiadigital.com", "www.techiadigital.com"].includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}, "Use an approved HTTPS image URL.").optional().or(z.literal(""));

const optionalPublicUrl = z.string().trim().max(1000).refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}, "Use a secure HTTPS URL.").optional().or(z.literal(""));

export const blogPostPayloadSchema = z.object({
  title: z.string().trim().min(5, "Use a descriptive title of at least 5 characters.").max(180),
  slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase, URL-safe slug."),
  excerpt: z.string().trim().min(30, "Add a useful summary of at least 30 characters.").max(320),
  content: z.string().min(20).max(BLOG_MAX_HTML_BYTES * 2),
  locale: z.enum(["en", "fr"]),
  categoryId: z.string().trim().max(64).optional().or(z.literal("")),
  authorId: z.string().trim().max(64).optional().or(z.literal("")),
  translationGroupId: z.string().trim().max(64).optional().or(z.literal("")),
  tagIds: z.array(z.string().trim().min(1).max(64)).max(12).default([]),
  relatedPostIds: z.array(z.string().trim().min(1).max(64)).max(6).default([]),
  seoTitle: optionalText(70),
  seoDescription: optionalText(180),
  focusKeyword: optionalText(120),
  canonicalUrl: optionalUrl,
  featuredImageUrl: optionalUrl,
  featuredImagePublicId: optionalText(255),
  featuredImageAlt: optionalText(300),
  ogImageUrl: optionalUrl,
  ogImagePublicId: optionalText(255),
  ctaTitle: optionalText(140),
  ctaDescription: optionalText(400),
  ctaHref: optionalText(1000),
  ctaLabel: optionalText(80),
  featured: z.boolean().default(false),
  allowIndex: z.boolean().default(true),
  nofollow: z.boolean().default(false),
  version: z.number().int().positive(),
});

export type BlogPostPayload = z.infer<typeof blogPostPayloadSchema>;

export const blogPostIdSchema = z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, "Invalid article identifier.");

export const blogTransitionSchema = z.object({
  postId: blogPostIdSchema,
  action: z.enum(["SUBMIT", "REQUEST_CHANGES", "RETURN_TO_DRAFT", "APPROVE", "PUBLISH", "SCHEDULE", "ARCHIVE", "RESTORE"]),
  version: z.coerce.number().int().positive(),
  scheduledAt: z.string().datetime({ offset: true }).optional().or(z.literal("")),
  reviewNote: z.string().trim().max(3000).optional().or(z.literal("")),
});

export const blogCategorySchema = z.object({
  id: blogPostIdSchema.optional(),
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: optionalText(600),
  locale: z.enum(["en", "fr"]),
  seoTitle: optionalText(70),
  seoDescription: optionalText(180),
  isActive: z.boolean().default(true),
});

export const blogTagSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  locale: z.enum(["en", "fr"]),
});

export const blogAuthorProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  bio: z.string().trim().min(40).max(3000),
  jobTitle: optionalText(140),
  imageUrl: optionalImageUrl,
  imagePublicId: optionalText(255),
  websiteUrl: optionalPublicUrl,
  linkedinUrl: optionalPublicUrl,
  xUrl: optionalPublicUrl,
});

export const writerInviteSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(180),
  authorDisplayName: z.string().trim().min(2).max(120),
  authorSlug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  jobTitle: optionalText(140),
  bio: z.string().trim().min(40).max(3000),
});

export const writerPasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(12).max(200),
});

export const blogMediaMetadataSchema = z.object({
  id: blogPostIdSchema,
  altText: z.string().trim().max(300),
});

export type SeoIssue = {
  field: string;
  message: string;
  severity: "error" | "warning";
};

export function getSeoIssues(input: {
  title: string;
  excerpt: string;
  content: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
  hasCategory: boolean;
  hasAuthor: boolean;
  internalLinkCount: number;
}) {
  const issues: SeoIssue[] = [];
  const title = input.seoTitle?.trim() || input.title;
  const description = input.seoDescription?.trim() || input.excerpt;
  const plainText = htmlToPlainText(input.content);
  const words = plainText.split(/\s+/).filter(Boolean).length;

  if (title.length > 60) issues.push({ field: "seoTitle", message: "Keep the SEO title at 60 characters or fewer.", severity: "warning" });
  if (title.length < 25) issues.push({ field: "seoTitle", message: "Use a more descriptive SEO title.", severity: "warning" });
  if (description.length > 160) issues.push({ field: "seoDescription", message: "Keep the meta description at 160 characters or fewer.", severity: "warning" });
  if (description.length < 110) issues.push({ field: "seoDescription", message: "Aim for a focused meta description between 110 and 160 characters.", severity: "warning" });
  if (!input.hasAuthor) issues.push({ field: "authorId", message: "Assign an active author before publishing.", severity: "error" });
  if (!input.hasCategory) issues.push({ field: "categoryId", message: "Choose a category before publishing.", severity: "error" });
  if (!input.featuredImageUrl) issues.push({ field: "featuredImageUrl", message: "Add a featured image before publishing.", severity: "error" });
  if (input.featuredImageUrl && !input.featuredImageAlt?.trim()) issues.push({ field: "featuredImageAlt", message: "Describe the featured image for accessibility and image search.", severity: "error" });
  if (words < 250) issues.push({ field: "content", message: "Aim for at least 250 useful words before publishing.", severity: "error" });
  if (input.internalLinkCount < 1) issues.push({ field: "content", message: "Add at least one relevant link to a teChia service or resource.", severity: "error" });
  if (input.internalLinkCount > 0 && input.internalLinkCount > 12) issues.push({ field: "content", message: "Review the number of internal links; over-linking can reduce readability.", severity: "warning" });

  return issues;
}

export function prepareBlogPostPayload(input: unknown) {
  const parsed = blogPostPayloadSchema.parse(input);
  const content = sanitizeArticleHtml(parsed.content);
  return {
    ...parsed,
    content,
    contentText: htmlToPlainText(content),
    readingTime: Math.max(1, Math.ceil(htmlToPlainText(content).split(/\s+/).filter(Boolean).length / 220)),
  };
}
