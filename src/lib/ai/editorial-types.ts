import { z } from "zod";

export const editorialToneOptions = [
  "professional",
  "conversational",
  "educational",
  "authoritative",
  "friendly",
  "persuasive",
  "technical",
  "thought_leadership",
] as const;

export const editorialContentTypeOptions = [
  "how_to_guide",
  "educational_article",
  "thought_leadership",
  "industry_insight",
  "tutorial",
  "case_study",
  "comparison",
  "listicle",
] as const;

export const editorialLanguageOptions = ["en", "fr"] as const;
export type EditorialLanguage = (typeof editorialLanguageOptions)[number];

export const editorialGenerateInputSchema = z.object({
  topic: z.string().trim().min(3).max(500),
  audience: z.string().trim().min(2).max(300),
  language: z.enum(editorialLanguageOptions),
  workingTitle: z.string().trim().max(180).optional().or(z.literal("")),
  businessObjective: z.string().trim().max(500).optional().or(z.literal("")),
  contentType: z.enum(editorialContentTypeOptions).optional(),
  tone: z.enum(editorialToneOptions).optional(),
  focusKeyword: z.string().trim().max(120).optional().or(z.literal("")),
  secondaryKeywords: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
  desiredLength: z.enum(["short", "standard", "long"]).optional(),
  service: z.string().trim().max(120).optional().or(z.literal("")),
  callToAction: z.string().trim().max(300).optional().or(z.literal("")),
  additionalInstructions: z.string().trim().max(2000).optional().or(z.literal("")),
  sourceNotes: z.string().trim().max(12000).optional().or(z.literal("")),
});

export type EditorialGenerateInput = z.infer<typeof editorialGenerateInputSchema>;

export const editorialArticleSchema = z.object({
  title: z.string().trim().min(5).max(180),
  suggestedSlug: z.string().trim().min(3).max(180),
  excerpt: z.string().trim().min(30).max(360),
  articleContent: z.string().trim().min(200).max(60000),
  seoTitle: z.string().trim().min(5).max(70),
  metaDescription: z.string().trim().min(30).max(180),
  focusKeyword: z.string().trim().min(2).max(120),
  secondaryKeywords: z.array(z.string().trim().min(1).max(80)).max(15),
  suggestedCategory: z.string().trim().min(2).max(80),
  suggestedTags: z.array(z.string().trim().min(1).max(40)).max(12),
  suggestedInternalLinks: z.array(z.string().trim().min(1).max(200)).max(12),
  suggestedCallToAction: z.string().trim().min(5).max(400),
  imagePrompt: z.string().trim().min(20).max(1200),
  imageAltText: z.string().trim().min(5).max(200),
  editorialNotes: z.array(z.string().trim().min(1).max(400)).max(12),
  claimsToVerify: z.array(z.string().trim().min(1).max(400)).max(20),
});

export type EditorialArticlePackage = z.infer<typeof editorialArticleSchema>;

export const editorialEditActionSchema = z.enum([
  "improve_clarity",
  "improve_grammar",
  "make_natural",
  "make_professional",
  "simplify",
  "expand",
  "shorten",
  "remove_repetition",
  "strengthen_introduction",
  "improve_conclusion",
  "make_cta_persuasive",
  "improve_heading_structure",
  "improve_meta_description",
  "identify_keyword_stuffing",
  "identify_missing_topics",
  "review_internal_links",
  "seo_checklist",
]);

export type EditorialEditAction = z.infer<typeof editorialEditActionSchema>;

export const editorialEditInputSchema = z.object({
  action: editorialEditActionSchema,
  language: z.enum(editorialLanguageOptions),
  content: z.string().trim().min(1).max(60000),
  context: z.string().trim().max(2000).optional().or(z.literal("")),
  focusKeyword: z.string().trim().max(120).optional().or(z.literal("")),
});

export const editorialTranslateInputSchema = z.object({
  direction: z.enum(["en_to_fr", "fr_to_en", "improve_translation"]),
  content: z.string().trim().min(1).max(60000),
  sourceLanguage: z.enum(editorialLanguageOptions).optional(),
  targetLanguage: z.enum(editorialLanguageOptions).optional(),
  context: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const editorialReviewInputSchema = z.object({
  language: z.enum(editorialLanguageOptions),
  content: z.string().trim().min(1).max(60000),
  focusKeyword: z.string().trim().max(120).optional().or(z.literal("")),
});

export const editorialImageInputSchema = z.object({
  imagePrompt: z.string().trim().min(20).max(1500),
  altText: z.string().trim().min(5).max(200).optional().or(z.literal("")),
  articleTitle: z.string().trim().max(180).optional().or(z.literal("")),
});

export const editorialEditResultSchema = z.object({
  result: z.string().trim().min(1).max(70000),
  notes: z.array(z.string().trim().min(1).max(300)).max(12).default([]),
});

export const editorialTranslateResultSchema = z.object({
  translatedContent: z.string().trim().min(1).max(70000),
  notes: z.array(z.string().trim().min(1).max(300)).max(12).default([]),
});

export const editorialReviewResultSchema = z.object({
  summary: z.string().trim().min(1).max(1000),
  issues: z.array(z.object({
    category: z.string().trim().min(1).max(80),
    severity: z.enum(["info", "warning", "error"]),
    message: z.string().trim().min(1).max(400),
    suggestion: z.string().trim().min(1).max(500).nullable(),
  })).max(30),
  checklist: z.array(z.string().trim().min(1).max(300)).max(20).default([]),
});