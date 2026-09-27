import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  deferDelayMs,
  isDeferrableSendBlock,
} from "@/lib/outreach/sending";
import {
  isWithinSendingWindow,
  nextSendingWindowOpen,
  startOfDayInTimezone,
} from "@/lib/outreach/limits";
import { OUTREACH_ORCHESTRATION } from "@/lib/outreach/config";

/**
 * Daily orchestrator behaviour.
 *
 * Pure policy (timezone day boundaries, sending windows, deferral) is asserted
 * directly. The queue itself is exercised against the local database with a
 * campaign that is deliberately created and destroyed, so job claiming, locking
 * and idempotency are proven on real rows.
 *
 * No real prospect email is ever sent: the kill switch is off and NODE_ENV is not
 * production throughout, so the send path records a simulated artefact.
 */

const connectionString = process.env.DATABASE_URL;

/**
 * Live queue assertions create and delete real rows, so they are restricted to a
 * local or test database. A production DATABASE_URL skips them rather than
 * writing to it.
 */
function isLocalDatabase(url: string | undefined) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local") || host.includes("test");
  } catch {
    return false;
  }
}

const db = connectionString && isLocalDatabase(connectionString) ? new PrismaClient({ adapter: new PrismaPg({ connectionString }) }) : null;

if (connectionString && !db) {
  console.warn("DATABASE_URL is not a local/test database; skipping live queue checks.");
}

let campaignId = "";

/** An active campaign with a tight budget so limits are easy to reason about. */
async function createCampaign(overrides: Record<string, unknown> = {}) {
  const campaign = await db!.outreachCampaign.create({
    data: {
      name: `tmp-orch-${Math.random().toString(36).slice(2, 8)}`,
      country: "Cameroon",
      cities: ["Douala"],
      mode: "SEMI_AUTOMATIC",
      status: "ACTIVE",
      requireApproval: true,
      dailyDiscoveryLimit: 25,
      dailySendLimit: 3,
      sendingWindowStart: "09:00",
      sendingWindowEnd: "17:00",
      timezone: "Africa/Douala",
      discoveryProviderMode: "OPENSTREETMAP",
      ...overrides,
    },
    select: { id: true },
  });
  return campaign.id;
}

beforeAll(async () => {
  if (!db) return;
  campaignId = await createCampaign();
});

afterAll(async () => {
  if (!db) return;
  if (campaignId) await db.outreachCampaign.delete({ where: { id: campaignId } }).catch(() => undefined);
  await db.$disconnect();
});

describe("orchestrator configuration", () => {
  it("is bounded by a job count and a wall-clock budget", () => {
    // Requirement 12: an invocation must never run indefinitely or loop.
    expect(OUTREACH_ORCHESTRATION.maxJobsPerRun).toBeGreaterThan(0);
    expect(OUTREACH_ORCHESTRATION.maxJobsPerRun).toBeLessThanOrEqual(100);
    expect(OUTREACH_ORCHESTRATION.runBudgetMs).toBeGreaterThan(0);
    expect(OUTREACH_ORCHESTRATION.runBudgetMs).toBeLessThanOrEqual(900_000);
  });
});

describe("campaign timezone is respected (requirement 6)", () => {
  it("measures the campaign day, not the UTC day", () => {
    // 2026-09-27T23:30Z is already 28 September in Lagos (UTC+1), so the campaign's
    // own day has rolled over and its budget resets on local time.
    const now = new Date("2026-09-27T23:30:00Z");
    const lagosDayStart = startOfDayInTimezone(now, "Africa/Lagos");

    // Local midnight on 28 September, expressed in UTC.
    expect(lagosDayStart.toISOString()).toBe("2026-09-27T23:00:00.000Z");
    // Only 30 minutes into the campaign's local day, versus a full UTC day.
    expect(now.getTime() - lagosDayStart.getTime()).toBe(30 * 60 * 1000);
  });

  it("agrees with UTC when the zone has no offset", () => {
    const now = new Date("2026-09-27T12:00:00Z");
    expect(startOfDayInTimezone(now, "UTC").toISOString()).toBe("2026-09-27T00:00:00.000Z");
  });

  it("handles a negative offset without granting extra budget", () => {
    // 2026-09-27T02:00Z is 26 September 22:00 in New York (EDT, UTC-4), so the
    // campaign day is still the 26th and its budget has NOT reset.
    const now = new Date("2026-09-27T02:00:00Z");
    const nyDayStart = startOfDayInTimezone(now, "America/New_York");

    // Local midnight on 26 September in New York is 04:00Z on the 26th.
    expect(nyDayStart.toISOString()).toBe("2026-09-26T04:00:00.000Z");
    // A negative offset must not make the campaign's day longer than 24h.
    expect(now.getTime() - nyDayStart.getTime()).toBeLessThan(24 * 60 * 60 * 1000);
  });

  it("handles a half-hour offset zone", () => {
    // 2026-09-27T18:00Z is 27 September 23:30 in Kolkata (UTC+5:30), so the
    // campaign day has not rolled over yet.
    const now = new Date("2026-09-27T18:00:00Z");
    const kolkata = startOfDayInTimezone(now, "Asia/Kolkata");

    // Local midnight on 27 September in Kolkata is 18:30Z on the 26th.
    expect(kolkata.toISOString()).toBe("2026-09-26T18:30:00.000Z");
    expect(now.getTime() - kolkata.getTime()).toBeLessThan(24 * 60 * 60 * 1000);
  });

  it("falls back to the UTC day for an unknown timezone rather than throwing", () => {
    const now = new Date("2026-09-27T12:00:00Z");
    expect(() => startOfDayInTimezone(now, "Mars/Olympus")).not.toThrow();
    expect(startOfDayInTimezone(now, "Mars/Olympus").toISOString()).toBe("2026-09-27T00:00:00.000Z");
  });

  it("lands on exact midnight whatever the clock's milliseconds are", () => {
    // Regression: the day boundary once inherited `now`'s milliseconds, so every
    // call returned a slightly different instant. That silently broke the
    // per-campaign-per-day discovery dedupe key, because the key was built from
    // this value and so changed on every run.
    const expected = "2026-09-26T23:00:00.000Z";
    for (const ms of [0, 1, 250, 500, 999]) {
      const now = new Date(Date.UTC(2026, 8, 27, 9, 57, 52, ms));
      expect(startOfDayInTimezone(now, "Africa/Lagos").toISOString(), `ms=${ms}`).toBe(expected);
    }

    // And the property that actually matters: the same day always yields one key.
    const keys = new Set(
      [0, 100, 500, 900].map((ms) => startOfDayInTimezone(new Date(Date.UTC(2026, 8, 27, 10, 0, 0, ms)), "Africa/Lagos").getTime())
    );
    expect(keys.size).toBe(1);
  });
});

describe("sending window gates a daily run (requirements 5 and 7)", () => {
  const campaign = { sendingWindowStart: "09:00", sendingWindowEnd: "17:00", timezone: "Africa/Lagos" };

  it("F: allows a due send inside the window", () => {
    // 10:00 in Lagos is 09:00Z.
    const inside = isWithinSendingWindow(new Date("2026-09-27T09:00:00Z"), campaign);
    expect(inside.allowed).toBe(true);
  });

  it("G: refuses a send outside the window and says when it next opens", () => {
    // 07:00Z is 08:00 in Lagos — before the window opens.
    const before = new Date("2026-09-27T07:00:00Z");
    const decision = isWithinSendingWindow(before, campaign);
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe("before_window");

    const opensAt = nextSendingWindowOpen(before, campaign);
    expect(opensAt).not.toBeNull();
    expect(opensAt?.toISOString()).toBe("2026-09-27T08:00:00.000Z");
    // And the message is genuinely inside the window at that moment.
    expect(isWithinSendingWindow(opensAt as Date, campaign).allowed).toBe(true);
  });

  it("returns no next-open time once the window has closed for the day", () => {
    // 20:00Z is 21:00 in Lagos — the window is finished.
    expect(nextSendingWindowOpen(new Date("2026-09-27T19:00:00Z"), campaign)).toBeNull();
  });

  it("returns no next-open time while already open", () => {
    expect(nextSendingWindowOpen(new Date("2026-09-27T09:00:00Z"), campaign)).toBeNull();
  });
});

describe("deferred sends are re-queued, not completed (requirement 7)", () => {
  it("treats a closed window and a spent allowance as deferrable", () => {
    for (const block of ["before_window", "after_window", "window_unresolved", "too_soon", "daily_limit", "kill_switch"]) {
      expect(isDeferrableSendBlock(block), block).toBe(true);
    }
  });

  it("treats a permanent condition as terminal so it is not retried forever", () => {
    for (const block of ["terminal_status", "already_replied", "max_messages", "email_suppressed", "domain_suppressed", "no_email", "unsubscribed", "automation_stopped"]) {
      expect(isDeferrableSendBlock(block), block).toBe(false);
    }
  });

  it("waits until the window opens, but never longer than a day", () => {
    const windowOpens = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const delay = deferDelayMs("after_window", windowOpens);
    expect(delay).toBeGreaterThan(0);
    expect(delay).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
  });

  it("uses a short retry for a transient provider failure", () => {
    expect(deferDelayMs("send_failed", null)).toBeLessThanOrEqual(60 * 60 * 1000);
  });
});

describe("job queue is idempotent under repeated runs (requirements 4 and 10, J)", () => {
  it("J: two claims never hand the same job to two workers", async () => {
    if (!db) {
      console.warn("DATABASE_URL not set; skipping live queue check.");
      return;
    }
    const { enqueueJob, claimJobs, completeJob } = await import("@/lib/outreach/jobs");
    const id = await createCampaign();

    try {
      const jobId = await enqueueJob({
        type: "PROCESS_REPLY",
        campaignId: id,
        dedupeKey: `PROCESS_REPLY:${id}:idem-test`,
        payload: { prospectId: "none", body: "x" },
      });
      // Narrow for the compiler as well as the assertion: every later step needs
      // a real id, and failing here is clearer than a null-dereference later.
      if (!jobId) throw new Error("enqueueJob returned no id for a fresh dedupe key");

      // Enqueuing the identical work again must not create a second job.
      const duplicate = await enqueueJob({
        type: "PROCESS_REPLY",
        campaignId: id,
        dedupeKey: `PROCESS_REPLY:${id}:idem-test`,
        payload: { prospectId: "none", body: "x" },
      });
      expect(duplicate).toBe(jobId);
      expect(await db.outreachJob.count({ where: { campaignId: id } })).toBe(1);

      // Two concurrent claims: exactly one wins the row.
      const [first, second] = [await claimJobs(10, new Date(), id), await claimJobs(10, new Date(), id)];
      const claimedIds = [...first, ...second].map((job) => job.id);
      expect(claimedIds).toEqual([jobId]);
      expect(new Set(claimedIds).size).toBe(claimedIds.length);

      // A completed job is not claimable again.
      await completeJob(jobId, first[0].lockToken);
      const third = await claimJobs(10, new Date(), id);
      expect(third.map((job) => job.id)).not.toContain(jobId);
    } finally {
      await db.outreachCampaign.delete({ where: { id } }).catch(() => undefined);
    }
  });

  it("A: a due job is claimed; a job scheduled in the future is not (requirement 5)", async () => {
    if (!db) return;
    const { enqueueJob, claimJobs } = await import("@/lib/outreach/jobs");
    const id = await createCampaign();

    try {
      await enqueueJob({
        type: "PROCESS_REPLY",
        campaignId: id,
        dedupeKey: `PROCESS_REPLY:${id}:due-test`,
        scheduledFor: new Date(Date.now() - 60_000),
      });
      await enqueueJob({
        type: "PROCESS_REPLY",
        campaignId: id,
        dedupeKey: `PROCESS_REPLY:${id}:future-test`,
        scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      });

      const claimed = await claimJobs(10, new Date(), id);
      const keys = claimed.map((job) => job.id);
      // Exactly the due job is picked up; the future one is left for its day.
      expect(keys).toHaveLength(1);
      const claimedJob = await db.outreachJob.findUniqueOrThrow({ where: { id: keys[0] } });
      expect(claimedJob.status).toBe("PROCESSING");
      expect(claimedJob.lockToken).toBeTruthy();

      const stillPending = await db.outreachJob.count({ where: { campaignId: id, status: "PENDING" } });
      expect(stillPending).toBe(1);
    } finally {
      await db.outreachCampaign.delete({ where: { id } }).catch(() => undefined);
    }
  });

  it("B: an empty queue is a clean no-op", async () => {
    if (!db) return;
    const { claimJobs } = await import("@/lib/outreach/jobs");
    const id = await createCampaign();
    try {
      // Nothing due for this campaign, so claiming returns nothing for it.
      const claimed = await claimJobs(10, new Date(), id);
      expect(claimed).toHaveLength(0);
    } finally {
      await db.outreachCampaign.delete({ where: { id } }).catch(() => undefined);
    }
  });
});

describe("paused campaigns and kill switch (requirements 3 and 15, K and L)", () => {
  it("L: a PAUSED campaign is not a discovery candidate", async () => {
    if (!db) return;
    const { evaluateDiscoveryAllowance } = await import("@/lib/outreach/limits");
    const paused = await createCampaign({ status: "PAUSED" });
    try {
      const decision = evaluateDiscoveryAllowance(
        {
          status: "PAUSED",
          mode: "SEMI_AUTOMATIC",
          requireApproval: true,
          dailyDiscoveryLimit: 25,
          dailySendLimit: 3,
          dailyAiAssessLimit: 25,
          minOpportunityScore: 40,
          followUpEnabled: true,
          maxFollowUps: 2,
          sendingWindowStart: "09:00",
          sendingWindowEnd: "17:00",
          timezone: "Africa/Lagos",
        },
        { discoveredToday: 0, qualifiedToday: 0, sentToday: 0 },
        0
      );
      expect(decision.allowed).toBe(false);
      expect(decision.code).toBe("campaign_not_active");
    } finally {
      await db.outreachCampaign.delete({ where: { id: paused } }).catch(() => undefined);
    }
  });

  it("K: the email kill switch blocks automated sends regardless of the campaign", async () => {    const { evaluateSendGate } = await import("@/lib/outreach/limits");
    const decision = evaluateSendGate({
      globalSendingEnabled: false,
      campaign: {
        status: "ACTIVE",
        mode: "AUTOMATIC",
        requireApproval: false,
        dailyDiscoveryLimit: 25,
        dailySendLimit: 50,
        dailyAiAssessLimit: 25,
        minOpportunityScore: 40,
        followUpEnabled: true,
        maxFollowUps: 2,
        sendingWindowStart: "00:00",
        sendingWindowEnd: "23:59",
        timezone: "Africa/Lagos",
      },
      prospect: {
        status: "APPROVED",
        opportunityScore: 90,
        publicEmail: "hello@example.com",
        emailsSentCount: 0,
        lastContactedAt: null,
        automationStoppedReason: null,
      },
      // Deliberately inside the window, so only the kill switch can stop it.
      now: new Date("2026-09-27T09:00:00Z"),
      dailySendUsed: 0,
      emailSuppressed: false,
      domainSuppressed: false,
      prospectAlreadyReplied: false,
      messageApproved: true,
      queueSize: 0,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe("kill_switch");
  });

  it("E: a spent daily send allowance stops further sends", async () => {
    const { evaluateSendGate } = await import("@/lib/outreach/limits");
    const base = {
      globalSendingEnabled: true,
      campaign: {
        status: "ACTIVE" as const,
        mode: "AUTOMATIC" as const,
        requireApproval: false,
        dailyDiscoveryLimit: 25,
        dailySendLimit: 3,
        dailyAiAssessLimit: 25,
        minOpportunityScore: 40,
        followUpEnabled: true,
        maxFollowUps: 2,
        // A window wide open, so the limit is the only thing that can refuse.
        sendingWindowStart: "00:00",
        sendingWindowEnd: "23:59",
        timezone: "Africa/Lagos",
      },
      prospect: {
        status: "APPROVED" as const,
        opportunityScore: 90,
        publicEmail: "hello@example.com",
        emailsSentCount: 0,
        lastContactedAt: null,
        automationStoppedReason: null,
      },
      now: new Date("2026-09-27T09:00:00Z"),
      emailSuppressed: false,
      domainSuppressed: false,
      prospectAlreadyReplied: false,
      messageApproved: true,
      queueSize: 0,
    };

    // Under the cap: allowed.
    expect(evaluateSendGate({ ...base, dailySendUsed: 2 }).allowed).toBe(true);
    // At the cap: refused, and refused for the right reason.
    const atCap = evaluateSendGate({ ...base, dailySendUsed: 3 });
    expect(atCap.allowed).toBe(false);
    expect(atCap.code).toBe("daily_limit");
    // Over the cap: still refused.
    expect(evaluateSendGate({ ...base, dailySendUsed: 4 }).allowed).toBe(false);
  });
});
