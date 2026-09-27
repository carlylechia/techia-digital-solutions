import { describe, expect, it } from "vitest";
import {
  clampDailyAiAssess,
  clampDailyDiscovery,
  clampDailySend,
  clampMaxFollowUps,
  evaluateDiscoveryAllowance,
  evaluateSendGate,
  isValidEmail,
  isValidTimezone,
  isWithinSendingWindow,
  minutesInCampaignTimezone,
  normalizeEmail,
  parseClockTime,
  planFollowUp,
  type CampaignPolicyInput,
  type ProspectPolicyInput,
} from "../src/lib/outreach/limits";

const campaign = (overrides: Partial<CampaignPolicyInput> = {}): CampaignPolicyInput => ({
  status: "ACTIVE",
  mode: "SEMI_AUTOMATIC",
  requireApproval: true,
  dailyDiscoveryLimit: 25,
  dailySendLimit: 10,
  dailyAiAssessLimit: 25,
  minOpportunityScore: 40,
  followUpEnabled: true,
  maxFollowUps: 2,
  sendingWindowStart: "09:00",
  sendingWindowEnd: "17:00",
  timezone: "Africa/Douala",
  ...overrides,
});

const prospect = (overrides: Partial<ProspectPolicyInput> = {}): ProspectPolicyInput => ({
  status: "APPROVED",
  opportunityScore: 70,
  publicEmail: "hello@example.com",
  emailsSentCount: 0,
  lastContactedAt: null,
  automationStoppedReason: null,
  ...overrides,
});

const gateInput = (overrides: Record<string, unknown> = {}) => ({
  globalSendingEnabled: true,
  campaign: campaign(),
  prospect: prospect(),
  now: new Date("2026-09-26T09:30:00Z"),
  dailySendUsed: 0,
  emailSuppressed: false,
  domainSuppressed: false,
  prospectAlreadyReplied: false,
  messageApproved: true,
  queueSize: 0,
  ...overrides,
});

describe("outreach clamping", () => {
  it("caps daily discovery at the configured ceiling", () => {
    expect(clampDailyDiscovery(5)).toBe(5);
    expect(clampDailyDiscovery(0)).toBe(1);
    expect(clampDailyDiscovery(999_999)).toBe(200);
  });

  it("caps daily sends below the global ceiling", () => {
    expect(clampDailySend(10)).toBe(10);
    expect(clampDailySend(500)).toBe(50);
  });

  it("never allows more than the configured follow-up ceiling", () => {
    expect(clampMaxFollowUps(2)).toBe(2);
    expect(clampMaxFollowUps(9)).toBe(2);
    expect(clampMaxFollowUps(-4)).toBe(0);
  });

  it("clamps AI assessment budgets to zero or more", () => {
    expect(clampDailyAiAssess(-5)).toBe(0);
    expect(clampDailyAiAssess(30)).toBe(30);
  });
});

describe("email validation", () => {
  it("accepts ordinary business addresses", () => {
    expect(isValidEmail("info@restaurant-douala.cm")).toBe(true);
    expect(normalizeEmail("  Info@Restaurant-Douala.CM ")).toBe("info@restaurant-douala.cm");
  });

  it("rejects malformed, guessed and dangerous addresses", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("a@b.c")).toBe(false);
    expect(isValidEmail("a@@b.com")).toBe(false);
    expect(isValidEmail("a..b@example.com")).toBe(false);
    expect(isValidEmail(`${"a".repeat(200)}@example.com`)).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });
});

describe("sending window", () => {
  it("parses clock times and falls back on nonsense", () => {
    expect(parseClockTime("09:30", "00:00")).toBe(570);
    expect(parseClockTime("25:99", "09:00")).toBe(540);
  });

  it("rejects an unknown timezone rather than defaulting to permissive", () => {
    expect(isValidTimezone("Africa/Douala")).toBe(true);
    expect(isValidTimezone("Mars/Olympus")).toBe(false);
    const decision = isWithinSendingWindow(new Date(), { ...campaign(), timezone: "Mars/Olympus" });
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe("invalid_timezone");
  });

  it("opens and closes on the campaign clock, not the server clock", () => {
    // 08:00 in Africa/Douala (UTC+1) is 07:00Z.
    const before = isWithinSendingWindow(new Date("2026-09-26T07:00:00Z"), campaign());
    expect(before.allowed).toBe(false);
    expect(before.code).toBe("before_window");

    const inside = isWithinSendingWindow(new Date("2026-09-26T09:30:00Z"), campaign());
    expect(inside.allowed).toBe(true);

    const after = isWithinSendingWindow(new Date("2026-09-26T16:30:00Z"), campaign());
    expect(after.allowed).toBe(false);
    expect(after.code).toBe("after_window");
  });

  it("closes the window when the range is inverted", () => {
    const decision = isWithinSendingWindow(new Date("2026-09-26T09:30:00Z"), campaign({ sendingWindowStart: "18:00", sendingWindowEnd: "09:00" }));
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe("invalid_window");
  });

  it("resolves minutes in the campaign timezone", () => {
    expect(minutesInCampaignTimezone(new Date("2026-09-26T12:00:00Z"), "Africa/Douala")).toBe(13 * 60);
    expect(minutesInCampaignTimezone(new Date("2026-09-26T12:00:00Z"), "UTC")).toBe(12 * 60);
  });
});

describe("send gate", () => {
  it("allows a fully approved, in-window, unsuppressed send", () => {
    const result = evaluateSendGate(gateInput());
    expect(result.allowed).toBe(true);
    expect(result.code).toBe("ok");
  });

  it("refuses when the global kill switch is off", () => {
    const result = evaluateSendGate(gateInput({ globalSendingEnabled: false }));
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("kill_switch");
  });

  it("refuses a suppressed address or domain", () => {
    expect(evaluateSendGate(gateInput({ emailSuppressed: true })).code).toBe("email_suppressed");
    expect(evaluateSendGate(gateInput({ domainSuppressed: true })).code).toBe("domain_suppressed");
  });

  it("refuses a prospect with no valid published email", () => {
    expect(evaluateSendGate(gateInput({ prospect: prospect({ publicEmail: null }) })).code).toBe("no_email");
    expect(evaluateSendGate(gateInput({ prospect: prospect({ publicEmail: "guess@@x" }) })).code).toBe("invalid_email");
  });

  it("refuses when the prospect already replied", () => {
    expect(evaluateSendGate(gateInput({ prospectAlreadyReplied: true })).code).toBe("already_replied");
  });

  it("refuses a terminal status", () => {
    expect(evaluateSendGate(gateInput({ prospect: prospect({ status: "UNSUBSCRIBED" }) })).code).toBe("terminal_status");
    expect(evaluateSendGate(gateInput({ prospect: prospect({ status: "LOST" }) })).code).toBe("terminal_status");
  });

  it("refuses once the per-prospect message ceiling is reached", () => {
    expect(evaluateSendGate(gateInput({ prospect: prospect({ emailsSentCount: 3 }) })).code).toBe("max_messages");
  });

  it("refuses a second message sent too soon", () => {
    const recent = new Date("2026-09-26T09:00:00Z");
    expect(evaluateSendGate(gateInput({ prospect: prospect({ lastContactedAt: recent }) })).code).toBe("too_soon");
  });

  it("refuses an unapproved message while approval is required", () => {
    const result = evaluateSendGate(gateInput({ messageApproved: false }));
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("not_approved");
  });

  it("refuses everything in MANUAL mode", () => {
    const result = evaluateSendGate(gateInput({ campaign: campaign({ mode: "MANUAL" }) }));
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("manual_mode");
  });

  it("refuses once the campaign daily limit is used up", () => {
    expect(evaluateSendGate(gateInput({ dailySendUsed: 10 })).code).toBe("daily_limit");
  });

  it("refuses an inactive campaign", () => {
    expect(evaluateSendGate(gateInput({ campaign: campaign({ status: "PAUSED" }) })).code).toBe("campaign_not_active");
  });

  it("still enforces the window when approval is not required", () => {
    const result = evaluateSendGate(
      gateInput({
        campaign: campaign({ mode: "AUTOMATIC", requireApproval: false }),
        messageApproved: false,
        now: new Date("2026-09-26T18:30:00Z"),
      })
    );
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("after_window");
  });
});

describe("discovery allowance", () => {
  it("allows an active semi-automatic campaign with budget left", () => {
    const result = evaluateDiscoveryAllowance(campaign(), { discoveredToday: 3, qualifiedToday: 0, sentToday: 0 }, 0);
    expect(result.allowed).toBe(true);
  });

  it("refuses MANUAL mode", () => {
    const result = evaluateDiscoveryAllowance(campaign({ mode: "MANUAL" }), { discoveredToday: 0, qualifiedToday: 0, sentToday: 0 }, 0);
    expect(result.code).toBe("manual_mode");
  });

  it("refuses when the daily discovery budget is spent", () => {
    const result = evaluateDiscoveryAllowance(campaign(), { discoveredToday: 25, qualifiedToday: 0, sentToday: 0 }, 0);
    expect(result.code).toBe("daily_limit");
  });

  it("refuses after too many runs in one day", () => {
    const result = evaluateDiscoveryAllowance(campaign(), { discoveredToday: 0, qualifiedToday: 0, sentToday: 0 }, 99);
    expect(result.code).toBe("run_limit");
  });
});

describe("follow-up state machine", () => {
  const base = {
    followUpEnabled: true,
    maxFollowUps: 2,
    followUpsSent: 0,
    prospectStatus: "OUTREACH_ACTIVE" as const,
    automationStoppedReason: null as string | null,
    lastMessageType: "INITIAL" as const,
    lastSentAt: new Date("2026-09-20T09:00:00Z"),
    initialSentAt: new Date("2026-09-20T09:00:00Z"),
    nextActionAt: new Date("2026-09-20T09:00:00Z"),
    emailsSentCount: 1,
  };

  const now = new Date("2026-09-23T09:00:00Z");

  it("schedules follow-up 1 on day 3", () => {
    const plan = planFollowUp(base, now);
    expect(plan.action).toBe("SCHEDULE_FOLLOW_UP_1");
  });

  it("does not schedule before day 3", () => {
    const plan = planFollowUp({ ...base, lastSentAt: new Date("2026-09-22T09:00:00Z") }, now);
    expect(plan.action).toBe("NONE");
    expect(plan.code).toBe("not_due");
  });

  it("schedules follow-up 2 on day 7 measured from the initial message", () => {
    // Day 7 from the initial send is 2026-09-27, so it is not due on day 3.
    const tooEarly = planFollowUp(
      { ...base, lastMessageType: "FOLLOW_UP_1", followUpsSent: 1, lastSentAt: new Date("2026-09-23T09:00:00Z") },
      now
    );
    expect(tooEarly.action).toBe("NONE");

    const due = planFollowUp(
      { ...base, lastMessageType: "FOLLOW_UP_1", followUpsSent: 1, lastSentAt: new Date("2026-09-23T09:00:00Z") },
      new Date("2026-09-27T09:00:00Z")
    );
    expect(due.action).toBe("SCHEDULE_FOLLOW_UP_2");
  });

  it("stops permanently after the final follow-up", () => {
    const plan = planFollowUp(
      { ...base, lastMessageType: "FOLLOW_UP_2", followUpsSent: 2, emailsSentCount: 3, lastSentAt: new Date("2026-09-01T09:00:00Z") },
      now
    );
    expect(plan.action).toBe("STOP");
  });

  it("stops on a reply at any point", () => {
    for (const status of ["REPLIED", "INTERESTED", "MEETING_BOOKED", "WON", "LOST"] as const) {
      const plan = planFollowUp({ ...base, prospectStatus: status, lastSentAt: new Date("2026-01-01T09:00:00Z") }, now);
      expect(plan.action).toBe("STOP");
    }
  });

  it("stops on unsubscribe and bounce", () => {
    expect(planFollowUp({ ...base, prospectStatus: "UNSUBSCRIBED", lastSentAt: new Date("2026-01-01T09:00:00Z") }, now).action).toBe("STOP");
    expect(planFollowUp({ ...base, prospectStatus: "BOUNCED", lastSentAt: new Date("2026-01-01T09:00:00Z") }, now).action).toBe("STOP");
  });

  it("stops when automation was already halted for a recorded reason", () => {
    const plan = planFollowUp({ ...base, automationStoppedReason: "replied:unsubscribe", lastSentAt: new Date("2026-01-01T09:00:00Z") }, now);
    expect(plan.action).toBe("STOP");
    expect(plan.code).toBe("automation_stopped");
  });

  it("stops once the campaign follow-up cap is used", () => {
    const plan = planFollowUp({ ...base, followUpsSent: 2, maxFollowUps: 1, lastSentAt: new Date("2026-01-01T09:00:00Z") }, now);
    expect(plan.action).toBe("STOP");
    expect(plan.code).toBe("follow_up_cap");
  });

  it("never schedules anything before the initial message", () => {
    const plan = planFollowUp({ ...base, lastMessageType: null, emailsSentCount: 0 }, now);
    expect(plan.action).toBe("NONE");
    expect(plan.code).toBe("no_initial");
  });

  it("stops when a human already replied manually", () => {
    const plan = planFollowUp({ ...base, lastMessageType: "MANUAL", lastSentAt: new Date("2026-01-01T09:00:00Z") }, now);
    expect(plan.action).toBe("STOP");
    expect(plan.code).toBe("human_replied");
  });
});
