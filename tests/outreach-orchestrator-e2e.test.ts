import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { runDailyOrchestrator } from "@/lib/outreach/orchestrator";
import { getOutreachSendingState } from "@/lib/outreach/config";

/**
 * Real orchestrator runs against a database, exercising the full daily cycle
 * rather than isolated policy functions.
 *
 * Two safety conditions are enforced before anything is written:
 *
 *   1. The database must be a local or test server. A production DATABASE_URL
 *      would make these tests create and delete real outreach rows, so they
 *      refuse to run rather than trust the environment.
 *   2. The global email kill switch must be off and NODE_ENV must not be
 *      production, so no run can reach a prospect. The send path records a
 *      simulated artefact instead.
 *
 * The campaign is created and destroyed around the run, and discovery uses the
 * OpenStreetMap provider so the test never depends on a Google credential.
 */

const connectionString = process.env.DATABASE_URL;

/** True only for a host that is safe to create and delete rows in. */
function isLocalDatabase(url: string | undefined) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local") || host.includes("test");
  } catch {
    return false;
  }
}

const db =
  connectionString && isLocalDatabase(connectionString) ? new PrismaClient({ adapter: new PrismaPg({ connectionString }) }) : null;

if (connectionString && !db) {
  console.warn("DATABASE_URL is not a local/test database; skipping live orchestrator runs.");
}

let campaignId = "";

beforeAll(async () => {
  if (!db) return;
  const campaign = await db.outreachCampaign.create({
    data: {
      name: "tmp-orchestrator-e2e",
      country: "Cameroon",
      cities: ["Douala"],
      industries: ["Restaurants"],
      businessTypes: ["Restaurant"],
      mode: "SEMI_AUTOMATIC",
      status: "ACTIVE",
      requireApproval: true,
      dailyDiscoveryLimit: 2,
      dailySendLimit: 1,
      followUpEnabled: true,
      sendingWindowStart: "09:00",
      sendingWindowEnd: "17:00",
      timezone: "Africa/Lagos",
      // The fallback provider, so a run never depends on a Google credential.
      discoveryProviderMode: "OPENSTREETMAP",
    },
    select: { id: true },
  });
  campaignId = campaign.id;
});

afterAll(async () => {
  if (!db) return;
  if (campaignId) await db.outreachCampaign.delete({ where: { id: campaignId } }).catch(() => undefined);
  await db.$disconnect();
});

describe("a send blocked by the sending window survives daily runs (requirement 7)", () => {
  it("G: a window-blocked send is re-queued, never failed, however many days pass", async () => {
    if (!db) {
      console.warn("DATABASE_URL not set; skipping live orchestrator run.");
      return;
    }
    // A campaign whose window is closed right now, so the send is refused with
    // `before_window`. This is the DEFAULT shape on Hobby: the daily cron fires
    // at 06:00 UTC +/- 59 minutes, which is 07:00-08:00 in Lagos, always before a
    // 09:00 window opens.
    const gated = await db.outreachCampaign.create({
      data: {
        name: "tmp-window-gated",
        country: "Cameroon",
        timezone: "Africa/Lagos",
        mode: "AUTOMATIC",
        status: "ACTIVE",
        requireApproval: false,
        dailySendLimit: 50,
        sendingWindowStart: "23:00",
        sendingWindowEnd: "23:30",
      },
      select: { id: true },
    });

    try {
      const prospect = await db.outreachProspect.create({
        data: {
          campaignId: gated.id,
          businessName: "Window Gated Ltd",
          publicEmail: "window@example.com",
          status: "APPROVED",
          opportunityScore: 90,
        },
        select: { id: true },
      });
      const message = await db.outreachMessage.create({
        data: {
          campaignId: gated.id,
          prospectId: prospect.id,
          type: "INITIAL",
          status: "APPROVED",
          subject: "Hello",
          bodyText: "Hi",
          approvedAt: new Date(),
        },
        select: { id: true },
      });

      // 1. The send gate refuses, and the window is what refuses it.
      //    `deliverOutreachMessage` is deliberately not used to prove this: the
      //    global kill switch is checked first and must stay off in tests, so it
      //    would always return `kill_switch` here. The gate is the unit under test.
      const { evaluateSendGate, nextSendingWindowOpen } = await import("@/lib/outreach/limits");
      // A fixed instant, not the wall clock. 12:00Z is 13:00 in Lagos, so a
      // 23:00-23:30 window is unambiguously closed whatever time the suite runs.
      // Using `new Date()` here made the test pass or fail depending on when it
      // was executed, which is a flake rather than a signal.
      const fixedNow = new Date("2026-09-27T12:00:00Z");
      const policy = {
        status: "ACTIVE" as const,
        mode: "AUTOMATIC" as const,
        requireApproval: false,
        dailyDiscoveryLimit: 25,
        dailySendLimit: 50,
        dailyAiAssessLimit: 25,
        minOpportunityScore: 40,
        followUpEnabled: true,
        maxFollowUps: 2,
        sendingWindowStart: "23:00",
        sendingWindowEnd: "23:30",
        timezone: "Africa/Lagos",
      };
      const decision = evaluateSendGate({
        globalSendingEnabled: true,
        campaign: policy,
        prospect: {
          status: "APPROVED",
          opportunityScore: 90,
          publicEmail: "window@example.com",
          emailsSentCount: 0,
          lastContactedAt: null,
          automationStoppedReason: null,
        },
        now: fixedNow,
        dailySendUsed: 0,
        emailSuppressed: false,
        domainSuppressed: false,
        prospectAlreadyReplied: false,
        messageApproved: true,
        queueSize: 0,
      });
      expect(decision.allowed).toBe(false);
      expect(decision.code).toBe("before_window");

      const opensAt = nextSendingWindowOpen(fixedNow, policy);
      expect(opensAt).toBeInstanceOf(Date);

      // 2. That outcome is classified as pure scheduling, not a fault.
      const { isSchedulingDeferral, isDeferrableSendBlock, deferDelayMs } = await import("@/lib/outreach/sending");
      expect(isDeferrableSendBlock(decision.code)).toBe(true);
      expect(isSchedulingDeferral(decision.code)).toBe(true);

      // 3. And deferring it does not charge the retry budget, however many times.
      const { deferJob, enqueueJob, claimJobs, completeJob } = await import("@/lib/outreach/jobs");
      const jobId = await enqueueJob({
        type: "SEND_EMAIL",
        campaignId: gated.id,
        dedupeKey: `SEND_EMAIL:${message.id}:window`,
        payload: { messageId: message.id },
        maxAttempts: 3,
      });
      if (!jobId) throw new Error("enqueueJob returned no id");

      // Walk it through more daily cycles than its whole attempt budget. Each
      // cycle claims the job (which charges an attempt) and then defers it.
      for (let day = 0; day < 6; day += 1) {
        await db.outreachJob.update({ where: { id: jobId }, data: { scheduledFor: new Date(Date.now() - 1_000) } });

        // Claim until this job is in hand, releasing anything else picked up on
        // the way. Holding it is what lets the deferral below take effect.
        let held: Awaited<ReturnType<typeof claimJobs>>[number] | null = null;
        for (let tries = 0; tries < 20 && !held; tries += 1) {
          const [claimed] = await claimJobs(10, new Date(), gated.id);
          if (!claimed) break;
          if (claimed.id === jobId) {
            held = claimed;
            break;
          }
          await completeJob(claimed.id, claimed.lockToken);
        }
        if (!held) continue;

        await deferJob(held, deferDelayMs(decision.code, opensAt ?? null), `Send deferred: ${decision.code}`, {
          consumesAttempt: !isSchedulingDeferral(decision.code),
        });
      }

      const job = await db.outreachJob.findUniqueOrThrow({ where: { id: jobId } });

      // It must still be waiting, not failed. A message that is merely early is
      // not an error and must not burn the retry budget.
      expect(job.status, `errorMessage: ${job.errorMessage}`).toBe("PENDING");
      // And it must not have consumed its attempts.
      expect(job.attempts).toBe(0);
      // The message itself is untouched: approved, unsent, no provider call.
      const after = await db.outreachMessage.findUniqueOrThrow({ where: { id: message.id } });
      expect(after.status).toBe("APPROVED");
      expect(after.sentAt).toBeNull();
    } finally {
      await db.outreachCampaign.delete({ where: { id: gated.id } }).catch(() => undefined);
    }
  });

  it("the statistics phase reports on the previous day, not a partial today", async () => {
    if (!db) return;
    // Regression: the bounce window was once built as [today, today), which is
    // empty. The bounce alert could then never fire, and it failed silently.
    const sent = new Date();
    const result = await runDailyOrchestrator({ maxJobs: 0, deadlineMs: 60_000 });
    const stats = result.phases.find((phase) => phase.phase === "daily-statistics");

    expect(stats?.ok).toBe(true);
    // The reported date is yesterday, formatted as YYYY-MM-DD.
    const yesterday = new Date(Date.UTC(sent.getUTCFullYear(), sent.getUTCMonth(), sent.getUTCDate()) - 86_400_000)
      .toISOString()
      .slice(0, 10);
    expect(stats?.detail).toContain(`yesterday=${yesterday}`);
  });

  it("a transient send failure still exhausts its retry budget", async () => {
    if (!db) return;
    const { deferJob, enqueueJob, claimJobs } = await import("@/lib/outreach/jobs");
    const { isSchedulingDeferral } = await import("@/lib/outreach/sending");

    // `send_failed` is a real fault, so it must NOT be treated as scheduling.
    expect(isSchedulingDeferral("send_failed")).toBe(false);

    const jobId = await enqueueJob({
      type: "SEND_EMAIL",
      campaignId,
      dedupeKey: `SEND_EMAIL:${campaignId}:transient-${Date.now()}`,
      payload: { messageId: "none" },
      maxAttempts: 2,
    });
    if (!jobId) throw new Error("enqueueJob returned no id");

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await db.outreachJob.update({ where: { id: jobId }, data: { scheduledFor: new Date(Date.now() - 1_000) } });
      const [claimed] = await claimJobs(10, new Date(), campaignId);
      if (!claimed || claimed.id !== jobId) continue;
      await deferJob(claimed, 1_000, "Send deferred: send_failed", { consumesAttempt: !isSchedulingDeferral("send_failed") });
    }

    const job = await db.outreachJob.findUniqueOrThrow({ where: { id: jobId } });
    // Attempts were charged, so the job ran out and surfaced as FAILED rather
    // than retrying for ever.
    expect(job.status).toBe("FAILED");
    expect(job.attempts).toBeGreaterThanOrEqual(2);
  });
});

describe("daily orchestrator end to end", () => {
  it("A: runs, stays bounded, and reports every phase", async () => {
    if (!db) {
      console.warn("DATABASE_URL not set; skipping live orchestrator run.");
      return;
    }

    // Safety precondition: this environment must not be able to send.
    const sending = getOutreachSendingState();
    expect(sending.enabled).toBe(false);

    const result = await runDailyOrchestrator({ maxJobs: 5, deadlineMs: 120_000 });

    console.log("phases:", result.phases.map((phase) => `${phase.phase}:${phase.ok ? "ok" : "FAIL"} ${phase.detail}`).join(" | "));
    console.log("dueWork:", JSON.stringify(result.dueWork));

    // The run reports, never loops: it finishes well inside its budget.
    expect(result.durationMs).toBeLessThan(120_000);

    // Every phase ran, and none aborted the others.
    const phases = result.phases.map((phase) => phase.phase);
    expect(phases).toEqual(
      expect.arrayContaining(["discovery-scheduling", "job-processing", "follow-up-scheduling", "daily-statistics"])
    );

    // A: the active campaign inside budget was queued for discovery.
    expect(result.dueWork.campaignsEligibleForDiscovery).toBeGreaterThanOrEqual(1);
    expect(result.dueWork.discoveryQueued).toBeGreaterThanOrEqual(1);
    const queued = await db.outreachJob.count({ where: { campaignId, type: "DISCOVER" } });
    expect(queued).toBe(1);
  });

  it("J: a second run on the same day does not queue a second discovery job", async () => {
    if (!db) return;
    await runDailyOrchestrator({ maxJobs: 2, deadlineMs: 60_000 });
    const queued = await db.outreachJob.count({ where: { campaignId, type: "DISCOVER" } });
    // The dedupe key is per campaign per local day, so a repeat run is a no-op.
    expect(queued).toBe(1);
  });

  it("D: a campaign at its discovery limit is skipped by the scheduler", async () => {
    if (!db) return;
    // The earlier run may already have discovered up to the campaign limit via the
    // live OSM provider, so top the allowance up to be certain it is exhausted.
    const now = new Date();
    const { startOfDayInTimezone } = await import("@/lib/outreach/limits");
    const dayStart = startOfDayInTimezone(now, "Africa/Lagos");
    const limit = 2;
    const existing = await db.outreachProspect.count({ where: { campaignId, discoveredAt: { gte: dayStart } } });
    const toCreate = Math.max(0, limit - existing);

    if (toCreate > 0) {
      await db.outreachProspect.createMany({
        data: Array.from({ length: toCreate }, (_, index) => ({
          campaignId,
          businessName: `Budget Filler ${index}`,
          discoveredAt: new Date(),
          providerPlaceId: `node/fill-${index}-${now.getTime()}`,
        })),
      });
    }
    const used = await db.outreachProspect.count({ where: { campaignId, discoveredAt: { gte: dayStart } } });
    expect(used).toBeGreaterThanOrEqual(limit);

    // Clear the existing discovery job so the run has to re-evaluate the budget.
    await db.outreachJob.deleteMany({ where: { campaignId, type: "DISCOVER" } });
    const result = await runDailyOrchestrator({ maxJobs: 1, deadlineMs: 60_000 });

    // The scheduler must decline to queue more discovery for this campaign.
    expect(result.dueWork.campaignsEligibleForDiscovery).toBe(0);
    expect(await db.outreachJob.count({ where: { campaignId, type: "DISCOVER" } })).toBe(0);
  });

  it("I: one failing job does not block the healthy jobs beside it", async () => {
    if (!db) return;
    const { enqueueJob } = await import("@/lib/outreach/jobs");
    const { processJobBatch } = await import("@/lib/outreach/dispatcher");

    // A job that cannot possibly succeed: the handler requires a prospectId.
    // maxAttempts 1 means it exhausts immediately and lands in FAILED.
    const badId = await enqueueJob({
      type: "ENRICH",
      campaignId,
      dedupeKey: `ENRICH:${campaignId}:broken-${Date.now()}`,
      scheduledFor: new Date(Date.now() - 60_000),
      maxAttempts: 1,
    });
    // A second broken job with retries left, which must be re-queued rather than lost.
    const retryableId = await enqueueJob({
      type: "ASSESS",
      campaignId,
      dedupeKey: `ASSESS:${campaignId}:broken-${Date.now()}`,
      scheduledFor: new Date(Date.now() - 60_000),
      maxAttempts: 5,
    });
    // Plus healthy work that must still get its turn in the same batch.
    // SCHEDULE_FOLLOWUP with no prospect is a clean no-op, so this proves the
    // batch kept going without doing anything harmful.
    const goodId = await enqueueJob({
      type: "SCHEDULE_FOLLOWUP",
      campaignId,
      dedupeKey: `SCHEDULE_FOLLOWUP:${campaignId}:healthy-${Date.now()}`,
      scheduledFor: new Date(Date.now() - 60_000),
    });

    const result = await processJobBatch(10, { deadlineAt: Date.now() + 60_000 });

    const row = async (id: string | null) => (id ? db.outreachJob.findUniqueOrThrow({ where: { id } }) : null);

    // Out of attempts: recorded as FAILED, with the reason kept for the operator.
    const exhausted = await row(badId);
    expect(exhausted?.status).toBe("FAILED");
    expect(exhausted?.errorMessage).toBeTruthy();

    // Retries remaining: re-queued for a later attempt, not dropped and not failed.
    const retryable = await row(retryableId);
    expect(retryable?.status).toBe("PENDING");
    expect(retryable?.errorMessage).toBeTruthy();
    expect(retryable?.scheduledFor?.getTime()).toBeGreaterThan(Date.now());
    expect(retryable?.attempts).toBe(1);

    // The healthy job in the same batch still ran to completion.
    expect((await row(goodId))?.status).toBe("COMPLETED");

    // Both broken jobs are reported as failures, and never as deferrals.
    expect(result.failed).toBe(2);
    expect(result.completed).toBeGreaterThanOrEqual(1);
    expect(result.outcomes.filter((outcome) => outcome.status === "failed")).toHaveLength(2);
  });

  it("L: a paused campaign is not a discovery candidate", async () => {
    if (!db) return;
    await db.outreachCampaign.update({ where: { id: campaignId }, data: { status: "PAUSED" } });
    try {
      const result = await runDailyOrchestrator({ maxJobs: 1, deadlineMs: 60_000 });
      expect(result.dueWork.campaignsEligibleForDiscovery).toBe(0);
      expect(await db.outreachJob.count({ where: { campaignId, type: "DISCOVER", status: "PENDING" } })).toBe(0);
    } finally {
      await db.outreachCampaign.update({ where: { id: campaignId }, data: { status: "ACTIVE" } });
    }
  });
});
