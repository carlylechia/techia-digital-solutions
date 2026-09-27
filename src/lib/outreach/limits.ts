/**
 * Pure outreach policy. No database, no network, no environment reads beyond the
 * configured bounds — everything here is directly unit-testable.
 */

import { OUTREACH_LIMITS, OUTREACH_SAFETY } from "./config";
import type { OutreachCampaignModeValue, OutreachProspectStatusValue } from "./constants";

export type CampaignPolicyInput = {
  status: string;
  mode: OutreachCampaignModeValue;
  requireApproval: boolean;
  dailyDiscoveryLimit: number;
  dailySendLimit: number;
  dailyAiAssessLimit: number;
  minOpportunityScore: number;
  followUpEnabled: boolean;
  maxFollowUps: number;
  sendingWindowStart: string;
  sendingWindowEnd: string;
  timezone: string;
};

export type ProspectPolicyInput = {
  status: OutreachProspectStatusValue;
  opportunityScore: number;
  publicEmail: string | null;
  emailsSentCount: number;
  lastContactedAt: Date | null;
  automationStoppedReason: string | null;
};

export type DailyUsageInput = {
  discoveredToday: number;
  qualifiedToday: number;
  sentToday: number;
};

export type PolicyDecision = {
  allowed: boolean;
  reason: string;
  /** Short machine-readable code for event metadata and admin UI. */
  code: string;
};

const ALLOW: PolicyDecision = { allowed: true, reason: "Allowed", code: "ok" };
const deny = (code: string, reason: string): PolicyDecision => ({ allowed: false, reason, code });

export function clampDailyDiscovery(value: number) {
  return Math.min(OUTREACH_LIMITS.maxDailyDiscovery, Math.max(1, Math.round(value)));
}

export function clampDailySend(value: number) {
  return Math.min(OUTREACH_LIMITS.maxDailySend, Math.max(1, Math.round(value)));
}

export function clampMaxFollowUps(value: number) {
  return Math.min(OUTREACH_LIMITS.maxFollowUps, Math.max(0, Math.round(value)));
}

export function clampDailyAiAssess(value: number) {
  return Math.min(OUTREACH_LIMITS.maxDailyAiAssess, Math.max(0, Math.round(value)));
}

export function clampOpportunityThreshold(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** 24h "HH:MM" validated against the campaign's own configuration. */
export function parseClockTime(value: string, fallback: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value?.trim() ?? "");
  if (!match) {
    const fallbackMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(fallback);
    return fallbackMatch ? Number(fallbackMatch[1]) * 60 + Number(fallbackMatch[2]) : 0;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Minutes since local midnight in the campaign timezone, or null when unknown. */
export function minutesInCampaignTimezone(date: Date, timezone: string): number | null {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const parts = formatter.formatToParts(date);
    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    const minute = Number(parts.find((part) => part.type === "minute")?.value);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    return hour * 60 + minute;
  } catch {
    return null;
  }
}

export function isValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Sending window check. An unknown timezone or unparsable window never widens
 * the window — it closes it, because failing open would send outside business
 * hours.
 */
export function isWithinSendingWindow(
  date: Date,
  campaign: Pick<CampaignPolicyInput, "sendingWindowStart" | "sendingWindowEnd" | "timezone">
): PolicyDecision {
  if (!isValidTimezone(campaign.timezone)) {
    return deny("invalid_timezone", `Campaign timezone "${campaign.timezone}" is not a valid IANA zone.`);
  }
  const now = minutesInCampaignTimezone(date, campaign.timezone);
  if (now === null) {
    return deny("window_unresolved", "Sending window could not be resolved for this timezone.");
  }
  const start = parseClockTime(campaign.sendingWindowStart, "09:00");
  const end = parseClockTime(campaign.sendingWindowEnd, "17:00");
  if (end <= start) {
    return deny("invalid_window", "Sending window end must be later than its start.");
  }
  if (now < start) return deny("before_window", "Local time is before the campaign sending window opens.");
  if (now >= end) return deny("after_window", "Local time is after the campaign sending window closes.");
  return ALLOW;
}

/**
 * Follow-up state machine.
 *
 * INITIAL_SENT → WAITING_FOR_REPLY → NO_REPLY → FOLLOW_UP_1 → WAITING →
 * NO_REPLY → FOLLOW_UP_2 → STOPPED. Any reply, unsubscribe, bounce, booked
 * meeting or manual pause terminates the sequence.
 */
export type FollowUpStep = "INITIAL" | "FOLLOW_UP_1" | "FOLLOW_UP_2" | "STOPPED";

export type FollowUpPlanInput = {
  followUpEnabled: boolean;
  maxFollowUps: number;
  followUpsSent: number;
  prospectStatus: OutreachProspectStatusValue;
  automationStoppedReason: string | null;
  lastMessageType: "INITIAL" | "FOLLOW_UP_1" | "FOLLOW_UP_2" | "MANUAL" | "REPLY" | null;
  lastSentAt: Date | null;
  /** Timestamp of the INITIAL message. Day 3 and day 7 are both measured from it. */
  initialSentAt: Date | null;
  nextActionAt: Date | null;
  emailsSentCount: number;
};

export type FollowUpPlan = {
  action: "NONE" | "SCHEDULE_FOLLOW_UP_1" | "SCHEDULE_FOLLOW_UP_2" | "STOP";
  dueAt: Date | null;
  reason: string;
  code: string;
};

const TERMINAL_STATUSES: readonly OutreachProspectStatusValue[] = [
  "REPLIED",
  "INTERESTED",
  "MEETING_BOOKED",
  "PROPOSAL",
  "WON",
  "LOST",
  "UNSUBSCRIBED",
  "BOUNCED",
  "DISQUALIFIED",
  "PAUSED",
];

const FOLLOW_UP_DELAY_DAYS = { FOLLOW_UP_1: 3, FOLLOW_UP_2: 7 } as const;

export function planFollowUp(input: FollowUpPlanInput, now = new Date()): FollowUpPlan {
  if (input.automationStoppedReason) {
    return { action: "STOP", dueAt: null, reason: `Automation stopped: ${input.automationStoppedReason}`, code: "automation_stopped" };
  }
  if (TERMINAL_STATUSES.includes(input.prospectStatus)) {
    return { action: "STOP", dueAt: null, reason: `Prospect status ${input.prospectStatus} ends the sequence.`, code: "terminal_status" };
  }
  if (!input.followUpEnabled) {
    return { action: "NONE", dueAt: null, reason: "Follow-ups are disabled for this campaign.", code: "follow_up_disabled" };
  }
  if (input.emailsSentCount >= OUTREACH_SAFETY.hardMaxMessagesPerProspect) {
    return { action: "STOP", dueAt: null, reason: "Prospect already received the maximum number of messages.", code: "max_messages" };
  }
  if (input.lastMessageType === "MANUAL" || input.lastMessageType === "REPLY") {
    return { action: "STOP", dueAt: null, reason: "A human already replied to this prospect.", code: "human_replied" };
  }
  if (input.lastMessageType !== "INITIAL" && input.lastMessageType !== "FOLLOW_UP_1" && input.lastMessageType !== "FOLLOW_UP_2") {
    return { action: "NONE", dueAt: null, reason: "No outreach message has been sent yet.", code: "no_initial" };
  }

  const cap = clampMaxFollowUps(input.maxFollowUps);
  if (input.followUpsSent >= cap) {
    return { action: "STOP", dueAt: null, reason: "Maximum follow-ups already used for this campaign.", code: "follow_up_cap" };
  }

  const nextStep: "FOLLOW_UP_1" | "FOLLOW_UP_2" = input.followUpsSent === 0 ? "FOLLOW_UP_1" : "FOLLOW_UP_2";
  if (input.lastMessageType === nextStep) {
    return { action: "NONE", dueAt: null, reason: `${nextStep} has already been sent.`, code: "already_sent" };
  }
  if (input.lastMessageType === "FOLLOW_UP_2") {
    return { action: "STOP", dueAt: null, reason: "Final follow-up already sent; the sequence is complete.", code: "sequence_complete" };
  }

  // Day 3 and day 7 are both measured from the initial message, so follow-up 2
  // is four days after follow-up 1 rather than seven.
  const anchor =
    nextStep === "FOLLOW_UP_1" ? (input.lastSentAt ?? input.initialSentAt) : input.initialSentAt ?? input.lastSentAt;
  if (!anchor) {
    return { action: "NONE", dueAt: null, reason: "Waiting for the initial send to be timestamped.", code: "awaiting_initial" };
  }

  const earliest = new Date(anchor.getTime() + FOLLOW_UP_DELAY_DAYS[nextStep] * 24 * 60 * 60 * 1000);
  if (earliest.getTime() > now.getTime()) {
    return { action: "NONE", dueAt: earliest, reason: `${nextStep} is not due yet.`, code: "not_due" };
  }

  return {
    action: nextStep === "FOLLOW_UP_1" ? "SCHEDULE_FOLLOW_UP_1" : "SCHEDULE_FOLLOW_UP_2",
    dueAt: now,
    reason: `${nextStep} is due.`,
    code: "due",
  };
}

/** Statuses from which an outbound message may be generated. */
export function canGenerateOutreach(status: OutreachProspectStatusValue) {
  return status === "QUALIFIED" || status === "APPROVED" || status === "OUTREACH_ACTIVE";
}

export function isTerminalProspectStatus(status: OutreachProspectStatusValue) {
  return TERMINAL_STATUSES.includes(status);
}

/** True only when the campaign opted out of human review *and* is fully automatic. */
export function campaignCanSendWithoutApproval(mode: OutreachCampaignModeValue, requireApproval: boolean) {
  return mode === "AUTOMATIC" && requireApproval === false;
}

export type SendGateInput = {
  globalSendingEnabled: boolean;
  campaign: CampaignPolicyInput;
  prospect: ProspectPolicyInput;
  now: Date;
  dailySendUsed: number;
  emailSuppressed: boolean;
  domainSuppressed: boolean;
  prospectAlreadyReplied: boolean;
  messageApproved: boolean;
  queueSize: number;
};

export type SendGateResult = PolicyDecision & {
  followUp?: false;
};

/**
 * The complete pre-send gate. Every branch is a hard stop: a single failure
 * means the message is not handed to the email provider.
 */
export function evaluateSendGate(input: SendGateInput): SendGateResult {
  if (!input.globalSendingEnabled) {
    return deny("kill_switch", "Global outreach sending is disabled.");
  }
  if (input.campaign.status !== "ACTIVE") {
    return deny("campaign_not_active", "Campaign is not active.");
  }
  if (input.emailSuppressed) {
    return deny("email_suppressed", "Recipient address is on the suppression list.");
  }
  if (input.domainSuppressed) {
    return deny("domain_suppressed", "Recipient domain is on the suppression list.");
  }
  if (!input.prospect.publicEmail) {
    return deny("no_email", "No published email address is available for this prospect.");
  }
  if (!isValidEmail(input.prospect.publicEmail)) {
    return deny("invalid_email", "Recipient address failed email validation.");
  }
  if (input.prospect.automationStoppedReason) {
    return deny("automation_stopped", `Automation stopped: ${input.prospect.automationStoppedReason}`);
  }
  if (isTerminalProspectStatus(input.prospect.status)) {
    return deny("terminal_status", `Prospect status ${input.prospect.status} blocks further contact.`);
  }
  if (input.prospectAlreadyReplied) {
    return deny("already_replied", "The prospect already replied; automation stops on any reply.");
  }
  if (input.prospect.emailsSentCount >= OUTREACH_SAFETY.hardMaxMessagesPerProspect) {
    return deny("max_messages", "The prospect already received the maximum number of messages.");
  }
  if (input.prospect.lastContactedAt) {
    const gapHours = (input.now.getTime() - input.prospect.lastContactedAt.getTime()) / 3_600_000;
    if (gapHours < OUTREACH_SAFETY.minHoursBetweenSends) {
      return deny("too_soon", "Too little time has passed since the last message.");
    }
  }
  if (input.campaign.requireApproval && !input.messageApproved) {
    return deny("not_approved", "This campaign requires human approval before sending.");
  }
  if (input.campaign.mode === "MANUAL") {
    return deny("manual_mode", "Campaign is in MANUAL mode; nothing sends automatically.");
  }
  const sendCap = clampDailySend(input.campaign.dailySendLimit);
  if (input.dailySendUsed >= sendCap) {
    return deny("daily_limit", `Daily send limit of ${sendCap} reached.`);
  }
  const window = isWithinSendingWindow(input.now, input.campaign);
  if (!window.allowed) return window;
  return ALLOW;
}

export function evaluateDiscoveryAllowance(
  campaign: CampaignPolicyInput,
  usage: DailyUsageInput,
  runsToday: number
): PolicyDecision {
  if (campaign.status !== "ACTIVE") {
    return deny("campaign_not_active", "Campaign is not active.");
  }
  if (campaign.mode === "MANUAL") {
    return deny("manual_mode", "Campaign is in MANUAL mode; discovery does not run automatically.");
  }
  if (runsToday >= OUTREACH_LIMITS.maxDiscoveryRunsPerDay) {
    return deny("run_limit", "Daily discovery run limit reached for this campaign.");
  }
  const cap = clampDailyDiscovery(campaign.dailyDiscoveryLimit);
  if (usage.discoveredToday >= cap) {
    return deny("daily_limit", `Daily discovery limit of ${cap} reached.`);
  }
  return { allowed: true, reason: `${cap - usage.discoveredToday} discovery slots remain.`, code: "ok" };
}

const EMAIL_PATTERN = /^[^\s@,;:<>()[\]\\]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,24}$/i;

export function isValidEmail(value: string | null | undefined) {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length > 180) return false;
  if (trimmed.includes("..")) return false;
  // A single-letter top-level domain is almost always a typo or a guess, and
  // delivering to one is never worth the deliverability risk.
  return EMAIL_PATTERN.test(trimmed);
}

export function normalizeEmail(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  return isValidEmail(trimmed) ? trimmed : null;
}

export function emailDomain(value: string | null | undefined) {
  const email = normalizeEmail(value);
  if (!email) return null;
  return email.split("@")[1] ?? null;
}
