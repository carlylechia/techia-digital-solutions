/** Shared outreach vocabulary. Pure data, safe to import from client components. */

export const OUTREACH_CAMPAIGN_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
] as const;
export type OutreachCampaignStatusValue = (typeof OUTREACH_CAMPAIGN_STATUSES)[number];

export const OUTREACH_CAMPAIGN_MODES = ["MANUAL", "SEMI_AUTOMATIC", "AUTOMATIC"] as const;
export type OutreachCampaignModeValue = (typeof OUTREACH_CAMPAIGN_MODES)[number];

/**
 * Discovery provider selection.
 *
 * AUTO tries Google Places first and falls back to OpenStreetMap only when
 * Google is unusable. The other two pin a single provider and never switch
 * silently. These values live here so the client form and the server-side Zod
 * schema validate against exactly the same list.
 */
export const OUTREACH_DISCOVERY_PROVIDERS = ["GOOGLE_PLACES", "OPENSTREETMAP"] as const;
export type OutreachDiscoveryProviderValue = (typeof OUTREACH_DISCOVERY_PROVIDERS)[number];

export const DISCOVERY_PROVIDER_MODES = ["AUTO", "GOOGLE_PLACES", "OPENSTREETMAP"] as const;
export type DiscoveryProviderModeValue = (typeof DISCOVERY_PROVIDER_MODES)[number];

export const OUTREACH_DISCOVERY_PROVIDER_LABELS: Record<string, string> = {
  GOOGLE_PLACES: "Google Places",
  OPENSTREETMAP: "OpenStreetMap",
};

export const OUTREACH_PROSPECT_STATUSES = [
  "DISCOVERED",
  "ENRICHING",
  "QUALIFIED",
  "DISQUALIFIED",
  "READY_FOR_REVIEW",
  "APPROVED",
  "OUTREACH_ACTIVE",
  "REPLIED",
  "INTERESTED",
  "MEETING_BOOKED",
  "PROPOSAL",
  "WON",
  "LOST",
  "UNSUBSCRIBED",
  "BOUNCED",
  "PAUSED",
] as const;
export type OutreachProspectStatusValue = (typeof OUTREACH_PROSPECT_STATUSES)[number];

export const OUTREACH_MESSAGE_TYPES = ["INITIAL", "FOLLOW_UP_1", "FOLLOW_UP_2", "MANUAL", "REPLY"] as const;
export type OutreachMessageTypeValue = (typeof OUTREACH_MESSAGE_TYPES)[number];

export const OUTREACH_MESSAGE_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "QUEUED",
  "SENDING",
  "SENT",
  "DELIVERED",
  "OPENED",
  "CLICKED",
  "REPLIED",
  "BOUNCED",
  "FAILED",
  "CANCELLED",
] as const;
export type OutreachMessageStatusValue = (typeof OUTREACH_MESSAGE_STATUSES)[number];

export const OUTREACH_JOB_TYPES = [
  "DISCOVER",
  "ENRICH",
  "ASSESS",
  "GENERATE_EMAIL",
  "SEND_EMAIL",
  "SCHEDULE_FOLLOWUP",
  "PROCESS_REPLY",
  "REFRESH_PLACE",
] as const;
export type OutreachJobTypeValue = (typeof OUTREACH_JOB_TYPES)[number];

export const OUTREACH_JOB_STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"] as const;
export type OutreachJobStatusValue = (typeof OUTREACH_JOB_STATUSES)[number];

export const OUTREACH_SUPPRESSION_REASONS = [
  "UNSUBSCRIBED",
  "BOUNCED",
  "SPAM_COMPLAINT",
  "MANUAL",
  "DO_NOT_CONTACT",
] as const;
export type OutreachSuppressionReasonValue = (typeof OUTREACH_SUPPRESSION_REASONS)[number];

export const OUTREACH_MEETING_STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;
export type OutreachMeetingStatusValue = (typeof OUTREACH_MEETING_STATUSES)[number];

export const OUTREACH_EVENT_TYPES = [
  "DISCOVERED",
  "ENRICHED",
  "QUALIFIED",
  "DISQUALIFIED",
  "EMAIL_GENERATED",
  "EMAIL_APPROVED",
  "EMAIL_SENT",
  "EMAIL_DELIVERED",
  "EMAIL_OPENED",
  "EMAIL_CLICKED",
  "EMAIL_REPLIED",
  "FOLLOW_UP_SCHEDULED",
  "FOLLOW_UP_SENT",
  "MEETING_BOOKED",
  "UNSUBSCRIBED",
  "BOUNCED",
  "MANUAL_NOTE",
  "STATUS_CHANGED",
] as const;
export type OutreachEventTypeValue = (typeof OUTREACH_EVENT_TYPES)[number];

export const OUTREACH_TARGET_SERVICES = [
  { value: "WEBSITE", label: "Professional website" },
  { value: "LEAD_CAPTURE", label: "Lead capture and enquiry flow" },
  { value: "SEO_AND_GOOGLE_VISIBILITY", label: "SEO and Google visibility" },
  { value: "BOOKING_AND_QUOTES", label: "Booking and quote system" },
  { value: "ECOMMERCE", label: "E-commerce or online ordering" },
  { value: "CATALOGUE", label: "Online catalogue" },
  { value: "SOCIAL_MEDIA", label: "Social media support" },
  { value: "BRANDING", label: "Branding and digital identity" },
  { value: "WORKFLOW_AUTOMATION", label: "Workflow automation" },
  { value: "AI_ASSISTANT", label: "AI assistant" },
  { value: "BUSINESS_DASHBOARD", label: "Business dashboard" },
  { value: "ANALYTICS", label: "Analytics and reporting" },
] as const;
export type TargetService = (typeof OUTREACH_TARGET_SERVICES)[number]["value"];

export const OUTREACH_SERVICE_LABELS: Record<string, string> = Object.fromEntries(
  OUTREACH_TARGET_SERVICES.map((entry) => [entry.value, entry.label])
);

export const OUTREACH_REPLY_CATEGORIES = [
  "INTERESTED",
  "QUESTION",
  "MEETING_REQUEST",
  "PRICE_REQUEST",
  "NOT_INTERESTED",
  "ALREADY_HAS_PROVIDER",
  "LATER",
  "WRONG_CONTACT",
  "UNSUBSCRIBE",
  "BOUNCE",
  "OTHER",
] as const;
export type ReplyCategory = (typeof OUTREACH_REPLY_CATEGORIES)[number];

/**
 * Reply categories that always require a human. The AI never negotiates, never
 * promises and never decides pricing.
 */
export const OUTREACH_ESCALATION_CATEGORIES: readonly ReplyCategory[] = [
  "INTERESTED",
  "MEETING_REQUEST",
  "PRICE_REQUEST",
  "QUESTION",
];

export const OUTREACH_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
  DISCOVERED: "Discovered",
  ENRICHING: "Enriching",
  QUALIFIED: "Qualified",
  DISQUALIFIED: "Disqualified",
  READY_FOR_REVIEW: "Ready for review",
  APPROVED: "Approved",
  OUTREACH_ACTIVE: "Outreach active",
  REPLIED: "Replied",
  INTERESTED: "Interested",
  MEETING_BOOKED: "Meeting booked",
  PROPOSAL: "Proposal",
  WON: "Won",
  LOST: "Lost",
  UNSUBSCRIBED: "Unsubscribed",
  BOUNCED: "Bounced",
  PENDING_APPROVAL: "Pending approval",
  QUEUED: "Queued",
  SENDING: "Sending",
  SENT: "Sent",
  DELIVERED: "Delivered",
  OPENED: "Opened",
  CLICKED: "Clicked",
  REPLIED_MESSAGE: "Replied",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No show",
  INITIAL: "Initial",
  FOLLOW_UP_1: "Follow-up 1",
  FOLLOW_UP_2: "Follow-up 2",
  MANUAL: "Manual",
  REPLY: "Reply",
  PENDING: "Pending",
  PROCESSING: "Processing",
};

export type Tone = "default" | "good" | "warn" | "danger" | "quiet";

export function prospectStatusTone(status: string): Tone {
  if (["WON", "INTERESTED", "MEETING_BOOKED", "PROPOSAL", "QUALIFIED", "APPROVED"].includes(status)) return "good";
  if (["LOST", "DISQUALIFIED", "UNSUBSCRIBED", "BOUNCED"].includes(status)) return "danger";
  if (["PAUSED", "REPLIED", "OUTREACH_ACTIVE", "READY_FOR_REVIEW"].includes(status)) return "warn";
  if (["DISCOVERED", "ENRICHING"].includes(status)) return "quiet";
  return "default";
}

export function messageStatusTone(status: string): Tone {
  if (["SENT", "DELIVERED", "OPENED", "CLICKED", "REPLIED"].includes(status)) return "good";
  if (["BOUNCED", "FAILED"].includes(status)) return "danger";
  if (["PENDING_APPROVAL", "QUEUED", "SENDING", "APPROVED"].includes(status)) return "warn";
  if (["DRAFT", "CANCELLED"].includes(status)) return "quiet";
  return "default";
}

export function jobStatusTone(status: string): Tone {
  if (status === "COMPLETED") return "good";
  if (status === "FAILED") return "danger";
  if (status === "PROCESSING") return "warn";
  return "quiet";
}

/**
 * Run outcome tone. PARTIAL is distinct from FAILED: some work completed and some
 * did not, which an operator needs to see differently from a run that never
 * started or died outright.
 */
export function runStatusTone(status: string): Tone {
  if (status === "COMPLETED") return "good";
  if (status === "FAILED") return "danger";
  if (status === "PARTIAL" || status === "RUNNING") return "warn";
  return "quiet";
}
