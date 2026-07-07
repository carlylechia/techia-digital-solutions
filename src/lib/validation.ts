import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(180);
const shortText = z.string().trim().min(2).max(180);
const optionalText = z.string().trim().max(500).optional().or(z.literal(""));
const locale = z.enum(["en", "fr"]).optional();
const honeypot = z.string().max(5000).optional().or(z.literal(""));
const optionalPhone = z.string().trim().max(30).optional().or(z.literal(""));

export const contactSchema = z.object({
  name: shortText,
  email,
  phone: optionalPhone,
  whatsapp: optionalPhone,
  company: optionalText,
  message: z.string().trim().min(10).max(3000),
  locale,
  honeypot
});

export const projectInquirySchema = z.object({
  name: shortText,
  email,
  phone: shortText,
  whatsapp: optionalPhone,
  company: optionalText,
  country: shortText,
  preferredLanguage: z.enum(["English", "French", "Français", "Anglais", "en", "fr"]),
  businessType: shortText,
  need: shortText,
  budgetRange: shortText,
  timeline: shortText,
  details: z.string().trim().min(20).max(5000),
  consent: z.boolean().refine(Boolean, "Consent is required"),
  locale,
  honeypot
});

export const newsletterSchema = z.object({
  email,
  locale,
  honeypot
});

export const demoRequestSchema = z.object({
  name: shortText,
  email,
  phone: optionalPhone,
  whatsapp: optionalPhone,
  company: optionalText,
  demo: shortText,
  message: optionalText,
  locale,
  honeypot
});

export const customerFeedbackSchema = z.object({
  name: shortText,
  email,
  role: optionalText,
  company: optionalText,
  projectSlug: z.string().trim().max(180).optional().or(z.literal("")),
  rating: z
    .preprocess((value) => {
      if (value === "" || value === null || value === undefined) return undefined;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }, z.number().int().min(1).max(5).optional()),
  quote: z.string().trim().min(20).max(2000),
  consent: z.boolean().refine(Boolean, "Consent is required"),
  locale,
  honeypot
});

export const demoLabRequestSchema = z.object({
  name: shortText,
  email,
  phone: optionalPhone,
  whatsapp: optionalPhone,
  companyName: optionalText,
  country: optionalText,
  preferredLanguage: z.enum(["en", "fr"]).default("en"),
  businessType: optionalText,
  demoSlug: z.string().trim().min(1).max(120),
  demoTitle: shortText,
  projectNeed: z.string().trim().min(5).max(2000),
  budgetRange: optionalText,
  timeline: optionalText,
  source: z.string().trim().max(80).optional().default("demo_lab"),
  consent: z.boolean().refine(Boolean, "Consent is required to submit this form."),
  honeypot
});

export const courseBonusClaimSchema = z
  .object({
    name: shortText,
    email,
    whatsapp: optionalPhone,
    coursePackId: z.string().trim().min(1).max(120),
    orderReference: z.string().trim().min(3).max(240),
    purchaseDate: z
      .string()
      .trim()
      .max(40)
      .optional()
      .or(z.literal("")),
    proofNotes: z.string().trim().max(3000).optional().or(z.literal("")),
    preferredDelivery: z.enum(["EMAIL", "WHATSAPP", "BOTH"]).default("EMAIL"),
    requestedBonusIds: z.array(z.string().trim().min(1).max(120)).default([]),
    sourcePage: z.string().trim().max(120).optional().or(z.literal("")),
    locale,
    honeypot,
  })
  .superRefine((data, ctx) => {
    if ((data.preferredDelivery === "WHATSAPP" || data.preferredDelivery === "BOTH") && !data.whatsapp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["whatsapp"],
        message: "WhatsApp is required for WhatsApp delivery.",
      });
    }
  });
