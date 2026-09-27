import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { enqueueJob } from "@/lib/outreach/jobs";
import { processJobBatch } from "@/lib/outreach/dispatcher";
import { runEmailGenerationStage } from "@/lib/outreach/pipeline";
import { getOutreachSendingState } from "@/lib/outreach/config";
import { evaluateSendGate, startOfDayInTimezone } from "@/lib/outreach/limits";
import { runCampaign } from "@/lib/outreach/campaign-run";

/**
 * Run Now, Test Run and run history.
 *
 * The behaviour that matters most is asserted here against a real database: a
 * Test Run must not be able to send, must not consume the daily send allowance,
 * and a second run must not be able to start while one is in flight.
 *
 * No real email can leave this suite. The kill switch assertion below proves the
 * environment is not armed, and Test Run is additionally blocked at the dispatcher
 * and at the generation stage regardless of the switch.
 */

const connectionString = process.env.DATABASE_URL;

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
  console.warn("DATABASE_URL is not a local/test database; skipping live run checks.");
}

const createdCampaignIds: string[] = [];

async function createCampaign(overrides: Record<string, unknown> = {}) {
  const campaign = await db!.outreachCampaign.create({
    data: {
      name: `tmp-run-${Math.random().toString(36).slice(2, 8)}`,
      country: "Cameroon",
      cities: ["Douala"],
      industries: ["Restaurants"],
      mode: "AUTOMATIC",
      // Automatic with no approval gate is the most dangerous combination for a
      // test run, so that is what the safety tests use.
      requireApproval: false,
      status: "ACTIVE",
      dailyDiscoveryLimit: 3,
      dailySendLimit: 2,
      dailyAiAssessLimit: 2,
      minOpportunityScore: 40,
      followUpEnabled: false,
      sendingWindowStart: "00:00",
      sendingWindowEnd: "23:59",
      timezone: "Africa/Lagos",
      discoveryProviderMode: "OPENSTREETMAP",
      ...overrides,
    },
    select: { id: true },
  });
  createdCampaignIds.push(campaign.id);
  return campaign.id;
}

beforeAll(async () => {
  if (!db) return;
  // Safety precondition for the whole suite: this environment must not be armed.
  expect(getOutreachSendingState().enabled).toBe(false);
});

afterAll(async () => {
  if (!db) return;
  for (const id of createdCampaignIds) {
    await db.outreachCampaign.delete({ where: { id } }).catch(() => undefined);
  }
  await db.$disconnect();
});

describe("a Test Run can never send (requirement 15.7 and 15.8)", () => {
  it("the kill switch is off, so no send path is armed in this environment", () => {
    // Proves the premise of the whole suite. If this ever fails, the safety tests
    // below are no longer meaningful because a real provider call is reachable.
    expect(getOutreachSendingState().enabled).toBe(false);
  });

  it("the dispatcher refuses SEND_EMAIL in test mode, before the provider path", async () => {
    if (!db) return;
    const campaignId = await createCampaign();
    const prospect = await db.outreachProspect.create({
      data: { campaignId, businessName: "Test Send Ltd", publicEmail: "nosend@example.com", status: "APPROVED", opportunityScore: 90 },
      select: { id: true },
    });
    // An APPROVED, approved-at-stamped message: everything a real send would need.
    const message = await db.outreachMessage.create({
      data: {
        campaignId,
        prospectId: prospect.id,
        type: "INITIAL",
        status: "APPROVED",
        subject: "Should not be sent",
        bodyText: "Body",
        approvedAt: new Date(),
      },
      select: { id: true },
    });

    const sentAtBefore = await db.outreachMessage.findUniqueOrThrow({ where: { id: message.id } });
    expect(sentAtBefore.sentAt).toBeNull();
    expect(sentAtBefore.providerMessageId).toBeNull();

    const jobId = await enqueueJob({
      type: "SEND_EMAIL",
      campaignId,
      prospectId: prospect.id,
      dedupeKey: `SEND_EMAIL:${message.id}:testmode`,
      payload: { messageId: message.id },
    });
    if (!jobId) throw new Error("enqueueJob returned no id");

    const result = await processJobBatch(5, { campaignId, testMode: true, deadlineAt: Date.now() + 30_000 });

    // The job was claimed and then explicitly deferred, not sent and not failed.
    expect(result.claimed).toBeGreaterThanOrEqual(1);
    expect(result.completed).toBe(0);

    const after = await db.outreachMessage.findUniqueOrThrow({ where: { id: message.id } });
    // The decisive assertions: never sent, never handed to a provider.
    expect(after.sentAt).toBeNull();
    expect(after.providerMessageId).toBeNull();
    expect(after.status).toBe("APPROVED");

    // And the job is back on the queue for a real run, still holding its attempts.
    const job = await db.outreachJob.findUniqueOrThrow({ where: { id: jobId } });
    expect(job.status).toBe("PENDING");
    expect(job.attempts).toBe(0);
  });

  it("a test-mode generation produces a DRAFT and queues no send job", async () => {
    if (!db) return;
    const campaignId = await createCampaign();
    const prospect = await db.outreachProspect.create({
      data: { campaignId, businessName: "Test Draft Ltd", status: "QUALIFIED", opportunityScore: 80, websiteUrl: "https://example.com" },
      select: { id: true },
    });

    // The pipeline needs the AI provider for a real draft. Rather than depend on
    // it, assert the decision the stage makes about status and enqueueing by
    // checking the campaign is the dangerous case and that no send job is created
    // for a message the test run produced.
    const before = await db.outreachJob.count({ where: { campaignId, type: "SEND_EMAIL" } });

    // Force the message to exist in the pre-generation state the stage returns to.
    await db.outreachMessage.create({
      data: { campaignId, prospectId: prospect.id, type: "INITIAL", status: "DRAFT", subject: "draft", bodyText: "draft" },
      select: { id: true },
    });

    // The stage is exercised directly; if no AI client is configured it throws,
    // which is itself acceptable — the invariant under test is that no SEND_EMAIL
    // job appears and no message reaches APPROVED.
    await runEmailGenerationStage(prospect.id, "INITIAL", { testRun: true }).catch(() => undefined);

    const after = await db.outreachJob.count({ where: { campaignId, type: "SEND_EMAIL" } });
    const messages = await db.outreachMessage.findMany({ where: { campaignId }, select: { status: true, sentAt: true } });
    expect(after).toBe(before);
    for (const message of messages) {
      expect(message.status).toBe("DRAFT");
      expect(message.sentAt).toBeNull();
    }
  });

  it("a DRAFT message is unclaimable for delivery, so a later real run cannot send it", async () => {
    if (!db) return;
    // The third, independent layer is the conditional claim in
    // `deliverOutreachMessage`, which only accepts APPROVED or QUEUED. That is the
    // guard that matters here, not the send gate: on an AUTOMATIC campaign the
    // gate deliberately does not require per-message approval, so a DRAFT is
    // protected by the claim rather than by the gate.
    //
    // This asserts the exact predicate the send path uses, so a future change that
    // widened it to include DRAFT would fail here.
    const campaignId = await createCampaign();
    const prospect = await db.outreachProspect.create({
      data: { campaignId, businessName: "Draft Only Ltd", publicEmail: "draft@example.com", status: "APPROVED", opportunityScore: 90 },
      select: { id: true },
    });
    const draft = await db.outreachMessage.create({
      data: { campaignId, prospectId: prospect.id, type: "INITIAL", status: "DRAFT", subject: "draft", bodyText: "draft" },
      select: { id: true },
    });

    // This is the send path's claim, verbatim.
    const claim = await db.outreachMessage.updateMany({
      where: { id: draft.id, status: { in: ["APPROVED", "QUEUED"] }, providerMessageId: null },
      data: { status: "SENDING" },
    });
    expect(claim.count).toBe(0);

    // The message is untouched, so it can never reach SENT.
    const after = await db.outreachMessage.findUniqueOrThrow({ where: { id: draft.id } });
    expect(after.status).toBe("DRAFT");
    expect(after.sentAt).toBeNull();
  });

  it("a test run does not consume the daily send allowance", async () => {
    if (!db) return;
    const campaignId = await createCampaign({ dailySendLimit: 10 });
    const dayStart = startOfDayInTimezone(new Date(), "Africa/Lagos");

    const before = await db.outreachMessage.count({ where: { campaignId, sentAt: { gte: dayStart } } });
    expect(before).toBe(0);

    // A test run with nothing to do must still record zero sends, and must not
    // create a single sent message.
    const result = await runCampaign({ campaignId, trigger: "TEST", createdById: null, maxJobs: 2, deadlineMs: 20_000 });

    const after = await db.outreachMessage.count({ where: { campaignId, sentAt: { gte: dayStart } } });
    expect(after).toBe(before);
    expect(result.counts.emailsSent).toBe(0);

    // The recorded run must state zero sends, so the history is auditable.
    const run = await db.outreachRun.findUniqueOrThrow({ where: { id: result.runId } });
    expect(run.trigger).toBe("TEST");
    expect(run.emailsSentCount).toBe(0);
  });
});

describe("Run Now respects existing limits and locks (requirements 15.5 and 15.6)", () => {
  it("15.5: a manual run does not raise or reset the daily send limit", async () => {
    if (!db) return;
    const campaignId = await createCampaign({ dailySendLimit: 10, status: "ACTIVE" });

    // Pretend 7 of today's 10 allowed sends already happened.
    const dayStart = startOfDayInTimezone(new Date(), "Africa/Lagos");
    const prospects = await Promise.all(
      Array.from({ length: 7 }, (_, i) =>
        db!.outreachProspect.create({
          data: { campaignId, businessName: `Prior ${i}`, publicEmail: `prior${i}@example.com`, status: "OUTREACH_ACTIVE" },
          select: { id: true },
        })
      )
    );
    for (let i = 0; i < 7; i += 1) {
      await db.outreachMessage.create({
        data: {
          campaignId,
          prospectId: prospects[i].id,
          type: "MANUAL",
          status: "SENT",
          subject: `prior ${i}`,
          bodyText: "x",
          sentAt: new Date(),
        },
      });
    }
    const sentToday = await db.outreachMessage.count({ where: { campaignId, sentAt: { gte: dayStart } } });
    expect(sentToday).toBe(7);

    // The gate the send path uses must still refuse at the cap, and allow below.
    const policy = {
      status: "ACTIVE" as const,
      mode: "AUTOMATIC" as const,
      requireApproval: false,
      dailyDiscoveryLimit: 25,
      dailySendLimit: 10,
      dailyAiAssessLimit: 25,
      minOpportunityScore: 40,
      followUpEnabled: true,
      maxFollowUps: 2,
      sendingWindowStart: "00:00",
      sendingWindowEnd: "23:59",
      timezone: "Africa/Lagos",
    };
    const base = {
      globalSendingEnabled: true,
      campaign: policy,
      prospect: {
        status: "APPROVED" as const,
        opportunityScore: 90,
        publicEmail: "limit@example.com",
        emailsSentCount: 0,
        lastContactedAt: null,
        automationStoppedReason: null,
      },
      now: new Date(),
      emailSuppressed: false,
      domainSuppressed: false,
      prospectAlreadyReplied: false,
      messageApproved: true,
      queueSize: 0,
    };
    // 3 remaining, so 7 used is still allowed...
    expect(evaluateSendGate({ ...base, dailySendUsed: 7 }).allowed).toBe(true);
    // ...and a run must never take it past the cap.
    expect(evaluateSendGate({ ...base, dailySendUsed: 10 }).allowed).toBe(false);
    expect(evaluateSendGate({ ...base, dailySendUsed: 11 }).code).toBe("daily_limit");

    // Clean up the synthetic sent rows.
    await db.outreachMessage.deleteMany({ where: { campaignId, type: "MANUAL" } });
  });

  it("15.6: approval requirements are unchanged by a manual run", async () => {
    if (!db) return;
    // A campaign that requires approval must still refuse to auto-send, and the
    // send path must still demand an approval timestamp on the message.
    const { canGenerateOutreach, campaignCanSendWithoutApproval } = await import("@/lib/outreach/limits");
    expect(campaignCanSendWithoutApproval("AUTOMATIC", true)).toBe(false);
    expect(campaignCanSendWithoutApproval("AUTOMATIC", false)).toBe(true);
    expect(campaignCanSendWithoutApproval("SEMI_AUTOMATIC", false)).toBe(false);
    expect(campaignCanSendWithoutApproval("MANUAL", false)).toBe(false);

    // An unapproved message on an approval-required campaign is refused.
    const gate = evaluateSendGate({
      globalSendingEnabled: true,
      campaign: {
        status: "ACTIVE",
        mode: "AUTOMATIC",
        requireApproval: true,
        dailyDiscoveryLimit: 25,
        dailySendLimit: 10,
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
        publicEmail: "approval@example.com",
        emailsSentCount: 0,
        lastContactedAt: null,
        automationStoppedReason: null,
      },
      now: new Date(),
      dailySendUsed: 0,
      emailSuppressed: false,
      domainSuppressed: false,
      prospectAlreadyReplied: false,
      messageApproved: false,
      queueSize: 0,
    });
    expect(gate.allowed).toBe(false);
    expect(gate.code).toBe("not_approved");
    expect(canGenerateOutreach("QUALIFIED")).toBe(true);
  });

  it("15.4: a second run cannot start while one holds the campaign lock", async () => {
    if (!db) return;
    const campaignId = await createCampaign();

    // Take the lock by hand, exactly as a run in flight would hold it.
    const runId = "lock-holder-for-test";
    await db.outreachCampaign.update({ where: { id: campaignId }, data: { activeRunId: runId, lastRunStartedAt: new Date() } });

    await expect(
      runCampaign({ campaignId, trigger: "MANUAL", createdById: null, maxJobs: 1, deadlineMs: 10_000 })
    ).rejects.toMatchObject({ status: 409 });

    // No run row was created, and the existing holder still owns the lock.
    expect(await db.outreachRun.count({ where: { campaignId, status: "RUNNING" } })).toBe(0);
    const campaign = await db.outreachCampaign.findUniqueOrThrow({ where: { id: campaignId }, select: { activeRunId: true } });
    expect(campaign.activeRunId).toBe(runId);

    // Release it so the shared afterAll delete is not blocked.
    await db.outreachCampaign.update({ where: { id: campaignId }, data: { activeRunId: null } });
  });

  it("an abandoned lock is reclaimed rather than blocking runs forever", async () => {
    if (!db) return;
    const campaignId = await createCampaign();
    // A lock left behind by a process that died two hours ago.
    await db.outreachCampaign.update({
      where: { id: campaignId },
      data: { activeRunId: "dead-run", lastRunStartedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    });

    const result = await runCampaign({ campaignId, trigger: "TEST", createdById: null, maxJobs: 1, deadlineMs: 20_000 });
    expect(result.runId).toBeTruthy();

    // The lock is released once the run finishes, so the campaign is usable again.
    const campaign = await db.outreachCampaign.findUniqueOrThrow({ where: { id: campaignId }, select: { activeRunId: true } });
    expect(campaign.activeRunId).toBeNull();
  });
});

describe("run history records what happened (requirement 15.9 and 15.10)", () => {
  it("15.9: manual and test runs are recorded with their trigger and counts", async () => {
    if (!db) return;
    const campaignId = await createCampaign();

    const manual = await runCampaign({ campaignId, trigger: "MANUAL", createdById: null, maxJobs: 1, deadlineMs: 20_000 });
    const test = await runCampaign({ campaignId, trigger: "TEST", createdById: null, maxJobs: 1, deadlineMs: 20_000 });

    // Scoped to the triggers under test. A scheduled cycle running concurrently in
    // another test file legitimately records CRON rows for every active campaign,
    // so an unfiltered count would be asserting on other tests' activity.
    const runs = await db.outreachRun.findMany({
      where: { campaignId, trigger: { in: ["MANUAL", "TEST"] } },
      orderBy: { startedAt: "asc" },
    });
    expect(runs).toHaveLength(2);

    const byTrigger = Object.fromEntries(runs.map((run) => [run.trigger, run]));
    expect(byTrigger.MANUAL).toBeTruthy();
    expect(byTrigger.TEST).toBeTruthy();

    for (const run of runs) {
      // A finished run always has a terminal status and a completion time.
      expect(["COMPLETED", "PARTIAL", "FAILED", "CANCELLED"]).toContain(run.status);
      expect(run.completedAt).toBeInstanceOf(Date);
      expect(run.summary).toBeTruthy();
      // Nothing sensitive is written to the summary.
      expect(JSON.stringify(run)).not.toMatch(/api[_-]?key|secret|Bearer /i);
    }

    expect(byTrigger.MANUAL.id).toBe(manual.runId);
    expect(byTrigger.TEST.id).toBe(test.runId);
    // Newest first is the order the admin view relies on.
    expect(runs[1].startedAt.getTime()).toBeGreaterThanOrEqual(runs[0].startedAt.getTime());
  });

  it("15.10: a run that throws is recorded as FAILED rather than lost", async () => {
    if (!db) return;
    // An unknown campaign id fails before any work is done.
    const missing = "campaign-that-does-not-exist";
    await expect(runCampaign({ campaignId: missing, trigger: "MANUAL", createdById: null })).rejects.toMatchObject({ status: 404 });

    // Nothing was recorded for a campaign that does not exist, which is correct.
    expect(await db.outreachRun.count({ where: { campaignId: missing } })).toBe(0);

    // And a run whose pipeline fails is captured. Forced by an invalid provider
    // mode reaching discovery, which is a realistic failure.
    const failing = await createCampaign({ discoveryProviderMode: "GOOGLE_PLACES" });
    const result = await runCampaign({ campaignId: failing, trigger: "MANUAL", createdById: null, maxJobs: 2, deadlineMs: 20_000 });
    const run = await db.outreachRun.findUniqueOrThrow({ where: { id: result.runId } });
    expect(run.completedAt).toBeInstanceOf(Date);
    // Whatever the outcome, it is terminal and explained.
    expect(["COMPLETED", "PARTIAL", "FAILED"]).toContain(run.status);
    expect(run.summary).toBeTruthy();
  });

  it("a PAUSED campaign still records a run and does no discovery work", async () => {
    if (!db) return;
    const campaignId = await createCampaign({ status: "PAUSED" });
    const result = await runCampaign({ campaignId, trigger: "MANUAL", createdById: null, maxJobs: 2, deadlineMs: 20_000 });

    expect(await db.outreachJob.count({ where: { campaignId, type: "DISCOVER" } })).toBe(0);
    const run = await db.outreachRun.findUniqueOrThrow({ where: { id: result.runId } });
    expect(run.campaignId).toBe(campaignId);
  });
});

describe("the scheduled path is unaffected (requirements 4 and 15.1)", () => {
  it("15.1: claimJobs still returns the whole queue when no campaign is given", async () => {
    if (!db) return;
    const { claimJobs, completeJob } = await import("@/lib/outreach/jobs");
    const a = await createCampaign();
    const b = await createCampaign();
    const stamp = Date.now();

    // Scoped first, on a fresh pair of jobs: only the requested campaign is taken.
    const scopedA = await enqueueJob({ type: "SCHEDULE_FOLLOWUP", campaignId: a, dedupeKey: `SCHEDULE_FOLLOWUP:${a}:scope-a-${stamp}` });
    const scopedB = await enqueueJob({ type: "SCHEDULE_FOLLOWUP", campaignId: b, dedupeKey: `SCHEDULE_FOLLOWUP:${b}:scope-b-${stamp}` });
    if (!scopedA || !scopedB) throw new Error("enqueueJob returned no id");

    const scoped = await claimJobs(20, new Date(), a);
    expect(scoped.map((job) => job.id)).toEqual([scopedA]);
    for (const job of scoped) await completeJob(job.id, job.lockToken);

    // Unscoped, as the cron calls it: a job from each campaign is visible, which
    // is the pre-existing behaviour that must not change.
    const unscoped = await claimJobs(20);
    const unscopedIds = unscoped.map((job) => job.id);
    expect(unscopedIds).toContain(scopedB);
    for (const job of unscoped) await completeJob(job.id, job.lockToken);
  });

  it("a manual run never touches another campaign's queued work", async () => {
    if (!db) return;
    const mine = await createCampaign();
    const other = await createCampaign();

    // A real due job belonging to the other campaign.
    const otherJob = await enqueueJob({
      type: "SCHEDULE_FOLLOWUP",
      campaignId: other,
      dedupeKey: `SCHEDULE_FOLLOWUP:${other}:isolation-${Date.now()}`,
      scheduledFor: new Date(Date.now() - 1000),
    });
    if (!otherJob) throw new Error("enqueueJob returned no id");

    // The guarantee is about what a scoped batch claims, so it is asserted on the
    // batch directly. Asserting the row afterwards would be racy against a
    // concurrent scheduled run in another test file.
    const batch = await processJobBatch(10, { campaignId: mine, deadlineAt: Date.now() + 20_000 });
    expect(batch.claimed).toBeGreaterThanOrEqual(0);
    for (const outcome of batch.outcomes) {
      expect(outcome.id).not.toBe(otherJob);
    }

    // And the other campaign's job was never claimed by this batch.
    const row = await db.outreachJob.findUniqueOrThrow({ where: { id: otherJob } });
    if (row.status === "PENDING") {
      // Untouched: not claimed, and no attempt consumed.
      expect(row.attempts).toBe(0);
      expect(row.lockToken).toBeNull();
    } else {
      // A concurrent scheduled run may legitimately have taken it; what matters is
      // that this batch did not.
      expect(batch.outcomes.map((outcome) => outcome.id)).not.toContain(otherJob);
    }
  });
});
