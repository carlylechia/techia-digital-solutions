/**
 * Outreach engine configuration.
 *
 * Every limit here is a configuration value with a safe upper bound. Business
 * logic reads these bounds instead of hard-coded numbers so an operator can
 * tighten or relax the engine through the environment without a redeploy of
 * compiled constants.
 *
 * The global kill switch lives here as well. `isOutreachSendingEnabled()` is the
 * single authority consulted immediately before any provider call.
 */

function readInt(name: string, fallback: number, min: number, max: number) {
  const raw = process.env[name];
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function readFloat(name: string, fallback: number, min: number, max: number) {
  const raw = process.env[name];
  const parsed = raw ? Number.parseFloat(raw) : Number.NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export const OUTREACH_LIMITS = {
  /** Hard ceiling for a single campaign's daily discovery intake. */
  maxDailyDiscovery: readInt("OUTREACH_MAX_DAILY_DISCOVERY", 200, 1, 1000),
  /** Hard ceiling for a single campaign's daily sends. */
  maxDailySend: readInt("OUTREACH_MAX_DAILY_SEND", 50, 1, 500),
  /** Hard ceiling for automatic follow-ups per prospect. */
  maxFollowUps: readInt("OUTREACH_MAX_FOLLOW_UPS", 2, 0, 3),
  /** Hard ceiling for AI assessments per campaign per day (cost control). */
  maxDailyAiAssess: readInt("OUTREACH_MAX_DAILY_AI_ASSESS", 100, 0, 1000),
  /** Google Places text-search page size. Places caps this at 20 per request. */
  placesPageSize: readInt("OUTREACH_PLACES_PAGE_SIZE", 20, 1, 20),
  /** Maximum automatic discovery runs per campaign per day. */
  maxDiscoveryRunsPerDay: readInt("OUTREACH_MAX_DISCOVERY_RUNS_PER_DAY", 4, 1, 48),
} as const;

export const OUTREACH_SAFETY = {
  /** Maximum outbound messages of any type to a single prospect. */
  hardMaxMessagesPerProspect: OUTREACH_LIMITS.maxFollowUps + 1,
  /** Minimum gap in hours between two automatic sends to the same prospect. */
  minHoursBetweenSends: readInt("OUTREACH_MIN_HOURS_BETWEEN_SENDS", 48, 1, 720),
  /** Maximum HTML bytes accepted from a prospect website. */
  maxWebsiteBytes: readInt("OUTREACH_MAX_WEBSITE_BYTES", 512_000, 16_000, 2_000_000),
  /** Maximum characters of extracted text ever handed to the model. */
  maxAiEvidenceChars: readInt("OUTREACH_MAX_AI_EVIDENCE_CHARS", 6_000, 500, 40_000),
  /** Maximum characters accepted in a stored reply body. */
  maxReplyChars: readInt("OUTREACH_MAX_REPLY_CHARS", 8_000, 200, 100_000),
  /** Hours after which a PROCESSING job lock is considered abandoned. */
  jobLockTimeoutMinutes: readInt("OUTREACH_JOB_LOCK_TIMEOUT_MINUTES", 15, 1, 240),
  /** Bounce rate (0-1) above which the campaign is flagged for review. */
  bounceRateAlertThreshold: readFloat("OUTREACH_BOUNCE_RATE_ALERT", 0.1, 0.01, 1),
  /** Minimum sends before the bounce rate is statistically meaningful. */
  bounceRateAlertMinSends: readInt("OUTREACH_BOUNCE_RATE_ALERT_MIN_SENDS", 20, 1, 1000),
} as const;

export const OUTREACH_TIMEBOX = {
  googlePlacesMs: readInt("OUTREACH_HTTP_TIMEOUT_MS", 12_000, 1_000, 60_000),
  websiteMs: readInt("OUTREACH_WEBSITE_TIMEOUT_MS", 12_000, 1_000, 60_000),
  openAiMs: readInt("OUTREACH_AI_TIMEOUT_MS", 45_000, 1_000, 120_000),
} as const;

export const OUTREACH_AI = {
  model: process.env.OUTREACH_AI_MODEL || "gpt-4o-mini",
  maxOutputTokens: readInt("OUTREACH_AI_MAX_OUTPUT_TOKENS", 900, 120, 4_000),
  temperature: 0.2,
  /** Model calls allowed per job run. Each handler makes exactly one. */
  maxCallsPerJob: 1,
} as const;

export const OUTREACH_SENDER = {
  /** Sender name used in the outreach From header. */
  name: "Chia Carlyle",
  brand: "teChia Digital Solutions",
  siteUrl: "https://techiadigital.com",
  /** Physical address used by the compliance footer. */
  address:
    process.env.OUTREACH_SENDER_ADDRESS ||
    "teChia Digital Solutions, Cameroon",
} as const;

/**
 * Global kill switch. The admin UI reads the same helper, so the dashboard
 * banner and the send path can never disagree.
 *
 * Sending is refused unless the deployment is production AND the operator has
 * explicitly set OUTREACH_EMAIL_SEND_ENABLED=true.
 */
export function isOutreachSendingEnabled() {
  if (process.env.NODE_ENV !== "production") return false;
  return process.env.OUTREACH_EMAIL_SEND_ENABLED === "true";
}

export type OutreachSendingState = {
  enabled: boolean;
  environment: string;
  flag: string;
  reason: string;
};

export function getOutreachSendingState(): OutreachSendingState {
  const environment = process.env.NODE_ENV || "development";
  const flag = process.env.OUTREACH_EMAIL_SEND_ENABLED || "unset";
  if (environment !== "production") {
    return {
      enabled: false,
      environment,
      flag,
      reason: "Outreach sending is hard-disabled outside production.",
    };
  }
  if (flag !== "true") {
    return {
      enabled: false,
      environment,
      flag,
      reason: "OUTREACH_EMAIL_SEND_ENABLED is not set to \"true\".",
    };
  }
  return {
    enabled: true,
    environment,
    flag,
    reason: "Outreach sending is armed. Every send still passes all safety checks.",
  };
}

export const OUTREACH_PROMPTS = {
  assessment: "OUTREACH_ASSESS_V1",
  email: "OUTREACH_EMAIL_V1",
  reply: "OUTREACH_REPLY_CLASSIFIER_V1",
} as const;

export const OUTREACH_AI_USAGE_REQUEST_TYPE = {
  assessment: "OUTREACH_ASSESSMENT",
  email: "OUTREACH_EMAIL",
  reply: "OUTREACH_REPLY_CLASSIFIER",
} as const;

/** Google Places API (New) — server-side only, never exposed to the browser. */
export function getGooglePlacesApiKey() {
  const key = process.env.GOOGLE_MAPS_PLATFORM_API_KEY?.trim();
  if (!key) return null;
  if (key.startsWith("AIza") === false && /placeholder|your[-_]?key/i.test(key)) return null;
  return key;
}

export function isGooglePlacesConfigured() {
  return getGooglePlacesApiKey() !== null;
}

export const OUTREACH_PAGINATION = {
  defaultPageSize: 25,
  maxPageSize: 100,
} as const;
