import { z } from "zod";
import {
  DISCOVERY_PROVIDER_MODES,
  OUTREACH_CAMPAIGN_MODES,
  OUTREACH_CAMPAIGN_STATUSES,
  OUTREACH_MEETING_STATUSES,
  OUTREACH_PROSPECT_STATUSES,
  OUTREACH_REPLY_CATEGORIES,
  OUTREACH_SUPPRESSION_REASONS,
} from "./constants";
import {
  clampDailyAiAssess,
  clampDailyDiscovery,
  clampDailySend,
  clampMaxFollowUps,
  clampOpportunityThreshold,
  isValidTimezone,
  parseClockTime,
} from "./limits";
import { sanitizeText } from "@/lib/sanitize";

/**
 * Request validation for every outreach mutation. Zod is the project convention,
 * and the same schemas are shared by the server actions and the API routes so a
 * payload can never be accepted by one entry point and rejected by the other.
 */

const listField = (max = 20) =>
  z.preprocess(
    (value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === "string") {
        return value
          .split(",")
          .map((item) => sanitizeText(item))
          .filter(Boolean);
      }
      return [];
    },
    z.array(z.string().trim().min(1).max(80)).max(max)
  );

const clockField = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use 24h HH:MM.")
  .refine((value) => Number.isFinite(parseClockTime(value, "00:00")), "Invalid time.");

const timezoneField = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .refine((value) => isValidTimezone(value), "Must be a valid IANA timezone.");

export const outreachCampaignSchema = z
  .object({
    name: z.string().trim().min(3).max(160),
    description: z.string().trim().max(4_000).optional().or(z.literal("")),
    status: z.enum(OUTREACH_CAMPAIGN_STATUSES).default("DRAFT"),
    mode: z.enum(OUTREACH_CAMPAIGN_MODES).default("SEMI_AUTOMATIC"),
    country: z.string().trim().min(2).max(80),
    regions: listField(),
    cities: listField(),
    industries: listField(),
    businessTypes: listField(),
    targetServices: listField(),
    excludedIndustries: listField(),
    excludedKeywords: listField(40),
    dailyDiscoveryLimit: z.coerce.number().int().min(1).max(200).default(25),
    dailySendLimit: z.coerce.number().int().min(1).max(50).default(10),
    minOpportunityScore: z.coerce.number().int().min(0).max(100).default(40),
    dailyAiAssessLimit: z.coerce.number().int().min(0).max(100).default(25),
    requireApproval: z.coerce.boolean().default(true),
    followUpEnabled: z.coerce.boolean().default(true),
    maxFollowUps: z.coerce.number().int().min(0).max(3).default(2),
    sendingWindowStart: clockField.default("09:00"),
    sendingWindowEnd: clockField.default("17:00"),
    timezone: timezoneField.default("Africa/Douala"),
    minReadinessScore: z.coerce.number().int().min(0).max(100).default(70),
    maxApprovedProspects: z.coerce.number().int().min(1).max(500).optional().or(z.literal("").transform(() => null)),
    // Provider selection is validated here on the server, so a client cannot
    // pin an arbitrary provider to bypass campaign or job controls.
    discoveryProviderMode: z.enum(DISCOVERY_PROVIDER_MODES).default("AUTO"),
    complianceBasis: z.string().trim().max(1_000).optional().or(z.literal("")),
    complianceNote: z.string().trim().max(1_000).optional().or(z.literal("")),
    unsubscribeNote: z.string().trim().max(1_000).optional().or(z.literal("")),
    senderNameOverride: z.string().trim().max(120).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.sendingWindowEnd <= data.sendingWindowStart) {
      ctx.addIssue({ code: "custom", path: ["sendingWindowEnd"], message: "Sending window must end after it starts." });
    }
    if (data.mode === "AUTOMATIC" && data.requireApproval) {
      // Not an error, but the UI must surface that approval still blocks sends.
      return;
    }
  })
  .transform((data) => ({
    ...data,
    description: data.description || null,
    complianceBasis: data.complianceBasis || null,
    complianceNote: data.complianceNote || null,
    unsubscribeNote: data.unsubscribeNote || null,
    senderNameOverride: data.senderNameOverride || null,
    dailyDiscoveryLimit: clampDailyDiscovery(data.dailyDiscoveryLimit),
    dailySendLimit: clampDailySend(data.dailySendLimit),
    dailyAiAssessLimit: clampDailyAiAssess(data.dailyAiAssessLimit),
    minOpportunityScore: clampOpportunityThreshold(data.minOpportunityScore),
    maxFollowUps: clampMaxFollowUps(data.maxFollowUps),
    minReadinessScore: clampOpportunityThreshold(data.minReadinessScore),
    maxApprovedProspects: data.maxApprovedProspects ? Math.min(500, Math.max(1, data.maxApprovedProspects)) : null,
  }));

export type OutreachCampaignInput = z.infer<typeof outreachCampaignSchema>;

export const outreachProspectPatchSchema = z.object({
  id: z.string().trim().min(1).max(64),
  businessName: z.string().trim().min(1).max(200).optional(),
  websiteUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  publicEmail: z.string().trim().toLowerCase().max(180).optional().or(z.literal("")),
  publicPhone: z.string().trim().max(40).optional().or(z.literal("")),
  contactName: z.string().trim().max(160).optional().or(z.literal("")),
  contactRole: z.string().trim().max(160).optional().or(z.literal("")),
  industry: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.enum(OUTREACH_PROSPECT_STATUSES).optional(),
  note: z.string().trim().max(2_000).optional().or(z.literal("")),
});

export const outreachMessageReviewSchema = z.object({
  messageId: z.string().trim().min(1).max(64),
  action: z.enum(["APPROVE", "REJECT", "EDIT", "PAUSE_PROSPECT"]),
  subject: z.string().trim().min(3).max(180).optional(),
  bodyText: z.string().trim().min(20).max(4_000).optional(),
});

export const outreachSuppressionSchema = z
  .object({
    email: z.string().trim().toLowerCase().max(180).optional().or(z.literal("")),
    domain: z.string().trim().toLowerCase().max(120).optional().or(z.literal("")),
    reason: z.enum(OUTREACH_SUPPRESSION_REASONS),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine((data) => Boolean(data.email || data.domain), {
    message: "Provide an email address or a domain.",
  });

export const outreachMeetingSchema = z.object({
  prospectId: z.string().trim().min(1).max(64),
  status: z.enum(OUTREACH_MEETING_STATUSES).default("SCHEDULED"),
  scheduledAt: z.coerce.date(),
  duration: z.coerce.number().int().min(5).max(480).default(30),
  bookingUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  meetingUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(2_000).optional().or(z.literal("")),
});

export const outreachReplyIngestSchema = z.object({
  prospectId: z.string().trim().min(1).max(64),
  subject: z.string().trim().max(300).optional().or(z.literal("")),
  body: z.string().trim().min(1).max(20_000),
  providerMessageId: z.string().trim().max(200).optional().or(z.literal("")),
});

export const outreachReplyCategorySchema = z.enum(OUTREACH_REPLY_CATEGORIES);

export const outreachUnsubscribeSchema = z.object({
  prospectId: z.string().trim().min(1).max(64),
  messageId: z.string().trim().max(64).optional().or(z.literal("")),
});
