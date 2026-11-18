import { z } from "zod";

export const socialPlatformOptions = ["FACEBOOK", "INSTAGRAM", "WHATSAPP"] as const;
export type SocialPlatform = (typeof socialPlatformOptions)[number];

export const socialGraphicFormatOptions = ["SQUARE", "VERTICAL"] as const;
export type SocialGraphicFormat = (typeof socialGraphicFormatOptions)[number];

export const socialPublishStatusOptions = ["NOT_STARTED", "READY", "PUBLISHED"] as const;
export type SocialPublishStatus = (typeof socialPublishStatusOptions)[number];

export const socialShareArticleSourceSchema = z.object({
  postId: z.string().min(1),
  locale: z.enum(["en", "fr"]).optional(),
});

export type SocialShareArticleSource = z.infer<typeof socialShareArticleSourceSchema>;

export const socialCaptionGenerateInputSchema = z.object({
  postId: z.string().min(1),
  platform: z.enum(socialPlatformOptions),
  refinement: z.string().trim().max(1000).optional().or(z.literal("")),
  customInstruction: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type SocialCaptionGenerateInput = z.infer<typeof socialCaptionGenerateInputSchema>;

export const facebookCaptionSchema = z.object({
  caption: z.string().trim().min(1).max(4000),
});

export const instagramCaptionSchema = z.object({
  caption: z.string().trim().min(1).max(4000),
  shortCaption: z.string().trim().min(1).max(500),
});

export const whatsappCaptionSchema = z.object({
  statusCaption: z.string().trim().min(1).max(1500),
  directCaption: z.string().trim().min(1).max(4000),
});

export type FacebookCaption = z.infer<typeof facebookCaptionSchema>;
export type InstagramCaption = z.infer<typeof instagramCaptionSchema>;
export type WhatsAppCaption = z.infer<typeof whatsappCaptionSchema>;

export const socialRefinementInputSchema = z.object({
  postId: z.string().min(1),
  platform: z.enum(socialPlatformOptions),
  instruction: z.string().trim().min(1).max(1000),
});

export const socialGraphicGenerateInputSchema = z.object({
  postId: z.string().min(1),
  format: z.enum(socialGraphicFormatOptions),
  prompt: z.string().trim().max(2000).optional().or(z.literal("")),
  logo: z.string().trim().max(80).optional().or(z.literal("")),
});

export const socialCaptionEditInputSchema = z.object({
  postId: z.string().min(1),
  platform: z.enum(socialPlatformOptions),
  editedCaption: z.string().trim().min(1).max(6000),
  shortCaption: z.string().trim().max(1000).optional().or(z.literal("")),
  statusCaption: z.string().trim().max(2000).optional().or(z.literal("")),
  directCaption: z.string().trim().max(6000).optional().or(z.literal("")),
});

export const socialPublishStatusInputSchema = z.object({
  postId: z.string().min(1),
  platform: z.enum(socialPlatformOptions),
  status: z.enum(socialPublishStatusOptions),
});
