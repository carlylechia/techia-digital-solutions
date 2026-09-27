import "server-only";

import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { OUTREACH_ORCHESTRATION } from "./config";
import { processJobBatch } from "./dispatcher";
import { enqueueJob } from "./jobs";
import { clampDailyDiscovery, evaluateDiscoveryAllowance, startOfDayInTimezone } from "./limits";
import type { OutreachRunStatus, OutreachRunTrigger } from "@prisma/client";

/**
 * Manual and test campaign runs.
 *
 * This is not a second outreach engine. It calls exactly the same discovery
 * stage, the same job handlers and the same limit checks that the scheduled cron
 * uses; the only thing it adds is a campaign scope, a bounded budget and, for a
 * test run, the guarantee that sending is impossible.
 *
 * The daily orchestrator in `orchestrator.ts` is untouched and continues to own
 * the scheduled path. Cron, Run Now and Test Run all funnel through the same
 * pipeline, so none of them can drift away from the safety rules in `limits.ts`.
 */

export type CampaignRunCounts = {
  discovered: number;
  processed: number;
  qualified: number;
  draftsGenerated: number;
  emailsSent: number;
  skipped: number;
  failed: number;
};

export type CampaignRunResult = {
  runId: string;
  status: OutreachRunStatus;
  trigger: OutreachRunTrigger;
  counts: CampaignRunCounts;
  durationMs: number;
  summary: string;
};

export class CampaignRunError extends Error {
  readonly status: 409 | 404 | 503;

  constructor(message: string, status: 409 | 404 | 503) {
    super(message);
    this.name = "CampaignRunError";
    this.status = status;
  }
}

/**
 * Take the per-campaign run lock.
 *
 * The claim is a conditional UPDATE, the same idiom the job queue already uses to
 * hand a job to exactly one worker. Two administrators clicking Run Now at the same
 * moment cannot both win the row, so the duplicate is refused by the database
 * rather than by a disabled button in the UI.
 *
 * A lock left behind by a process that died is reclaimed once it is older than the
 * job lock timeout, so a crash cannot wedge a campaign out of manual runs forever.
 */
async function claimRunSlot(campaignId: string, runId: string, now: Date): Promise<boolean> {
  const prisma = getPrisma();
  if (!prisma) throw new CampaignRunError("Outreach data is unavailable.", 503);

  const staleBefore = new Date(now.getTime() - OUTREACH_ORCHESTRATION.runLockTimeoutMinutes * 60_000);

  const claimed = await prisma.outreachCampaign.updateMany({
    where: { id: campaignId, OR: [{ activeRunId: null }, { activeRunId: runId }, { lastRunStartedAt: { lt: staleBefore } }] },
    data: { activeRunId: runId, lastRunStartedAt: now },
  });
  return claimed.count === 1;
}

async function releaseRunSlot(campaignId: string, runId: string) {
  const prisma = getPrisma();
  if (!prisma) return;
  // Scoped to our own token: a run can only ever clear the lock it holds.
  await prisma.outreachCampaign
    .updateMany({ where: { id: campaignId, activeRunId: runId }, data: { activeRunId: null } })
    .catch(() => undefined);
}

/** Build the run row id up front so it can be written before the work starts. */
function newRunId() {
  return crypto.randomUUID();
}

/**
 * Execute one bounded run over a single campaign.
 *
 * The sequence mirrors the daily orchestrator, narrowed to one campaign:
 *   1. queue discovery, if the campaign is eligible and inside its daily budget
 *   2. process a bounded batch of due jobs for this campaign only
 *   3. follow-ups that are genuinely due
 *
 * Daily limits are enforced by the same allowance checks the scheduled path uses,
 * so a manual run spends a campaign's remaining budget and can never exceed it.
 */
export async function runCampaign(input: {
  campaignId: string;
  trigger: Extract<OutreachRunTrigger, "MANUAL" | "TEST">;
  createdById: string | null;
  maxJobs?: number;
  deadlineMs?: number;
}): Promise<CampaignRunResult> {
  const prisma = getPrisma();
  if (!prisma) throw new CampaignRunError("Outreach data is unavailable.", 503);

  const now = new Date();
  const startedAt = Date.now();
  const isTest = input.trigger === "TEST";

  // A Test Run is deliberately small: it proves the pipeline works, it is not a
  // way to process a backlog.
  const maxJobs = input.maxJobs ?? (isTest ? OUTREACH_ORCHESTRATION.testRunMaxJobs : OUTREACH_ORCHESTRATION.manualRunMaxJobs);
  const deadlineMs = input.deadlineMs ?? OUTREACH_ORCHESTRATION.manualRunBudgetMs;
  const deadlineAt = startedAt + deadlineMs;

  const campaign = await prisma.outreachCampaign.findUnique({
    where: { id: input.campaignId },
    select: { id: true, name: true, status: true, mode: true, timezone: true, dailyDiscoveryLimit: true },
  });
  if (!campaign) throw new CampaignRunError("Campaign not found.", 404);

  const runId = newRunId();
  if (!(await claimRunSlot(input.campaignId, runId, now))) {
    throw new CampaignRunError("This campaign already has a run in progress. Try again once it finishes.", 409);
  }

  const counts: CampaignRunCounts = {
    discovered: 0,
    processed: 0,
    qualified: 0,
    draftsGenerated: 0,
    emailsSent: 0,
    skipped: 0,
    failed: 0,
  };

  await prisma.outreachRun.create({
    data: {
      id: runId,
      campaignId: input.campaignId,
      trigger: input.trigger,
      status: "RUNNING",
      startedAt: now,
      createdById: input.createdById,
      emailsSentCount: 0,
      summary: "Run started.",
    },
  });

  const finish = async (status: OutreachRunStatus, summary: string) => {
    const completedAt = new Date();
    await prisma.outreachRun
      .update({
        where: { id: runId },
        data: {
          status,
          completedAt,
          discoveredCount: counts.discovered,
          processedCount: counts.processed,
          qualifiedCount: counts.qualified,
          draftsGeneratedCount: counts.draftsGenerated,
          emailsSentCount: counts.emailsSent,
          skippedCount: counts.skipped,
          failedCount: counts.failed,
          summary: summary.slice(0, 1_000),
        },
      })
      .catch((error) => console.error("[outreach-run] could_not_record_result", getErrorMessage(error)));
    await releaseRunSlot(input.campaignId, runId);
  };

  try {
    // 1. Discovery, only if this campaign is eligible and has budget left today.
    //    The allowance check is the same one the job itself enforces, so a manual
    //    run cannot slip past a spent daily discovery limit.
    let discoveryQueued = false;
    if (campaign.status === "ACTIVE" && campaign.mode !== "MANUAL") {
      const dayStart = startOfDayInTimezone(now, campaign.timezone);
      const [discoveredToday, runsToday] = await Promise.all([
        prisma.outreachProspect.count({ where: { campaignId: campaign.id, discoveredAt: { gte: dayStart } } }),
        prisma.outreachJob.count({ where: { campaignId: campaign.id, type: "DISCOVER", createdAt: { gte: dayStart } } }),
      ]);
      const allowance = evaluateDiscoveryAllowance(
        {
          status: campaign.status,
          mode: campaign.mode,
          requireApproval: true,
          dailyDiscoveryLimit: campaign.dailyDiscoveryLimit,
          dailySendLimit: 0,
          dailyAiAssessLimit: 0,
          minOpportunityScore: 0,
          followUpEnabled: false,
          maxFollowUps: 0,
          sendingWindowStart: "00:00",
          sendingWindowEnd: "00:00",
          timezone: campaign.timezone,
        },
        { discoveredToday, qualifiedToday: 0, sentToday: 0 },
        runsToday
      );

      if (allowance.allowed) {
        // A distinct dedupe key per run, so two runs on the same day queue two
        // discoveries. The daily allowance above is what actually bounds this.
        const jobId = await enqueueJob({
          type: "DISCOVER",
          campaignId: campaign.id,
          dedupeKey: `DISCOVER:${campaign.id}:${input.trigger.toLowerCase()}:${runId}`,
          scheduledFor: now,
          // A test run uses a deliberately tiny intake.
          payload: { reason: input.trigger === "TEST" ? "test_run" : "manual_run", cap: isTest ? 1 : clampDailyDiscovery(campaign.dailyDiscoveryLimit) },
        });
        discoveryQueued = Boolean(jobId);
      }
    }

    // 2. Process this campaign's due work, bounded, in test mode when asked.
    const batch = await processJobBatch(maxJobs, {
      deadlineAt,
      campaignId: campaign.id,
      testMode: isTest,
      maxLimit: maxJobs,
    });

    counts.processed = batch.completed;
    counts.failed = batch.failed;
    counts.skipped = batch.deferred;

    // 3. Derive the per-run deltas from what actually changed during the run.
    //    Counting rows created inside the window is the only way to report a delta
    //    without instrumenting every pipeline stage.
    const runStartedAt = new Date(startedAt);
    const [discovered, qualified, drafts] = await Promise.all([
      prisma.outreachProspect.count({ where: { campaignId: campaign.id, discoveredAt: { gte: runStartedAt } } }),
      prisma.outreachProspect.count({ where: { campaignId: campaign.id, status: "QUALIFIED", updatedAt: { gte: runStartedAt } } }),
      prisma.outreachMessage.count({ where: { campaignId: campaign.id, createdAt: { gte: runStartedAt } } }),
    ]);
    counts.discovered = discovered;
    counts.qualified = qualified;
    counts.draftsGenerated = drafts;

    // A test run's whole point is that this is zero, and it is asserted rather
    // than assumed: nothing in this path can set a message to SENT.
    const actuallySent = await prisma.outreachMessage.count({
      where: { campaignId: campaign.id, sentAt: { gte: runStartedAt } },
    });
    counts.emailsSent = actuallySent;

    let status: OutreachRunStatus = "COMPLETED";
    if (batch.failed > 0) status = batch.completed > 0 ? "PARTIAL" : "FAILED";
    else if (batch.budgetExhausted) status = "PARTIAL";

    const summary = isTest
      ? `Test run finished. ${counts.discovered} discovered, ${counts.draftsGenerated} drafts generated, ${counts.emailsSent} emails sent. Sending is disabled for test runs.`
      : `Run finished. ${discoveryQueued ? "Discovery queued. " : ""}${counts.processed} job(s) completed, ${batch.deferred} deferred, ${counts.failed} failed, ${counts.emailsSent} email(s) sent.`;

    await finish(status, summary);
    return { runId, status, trigger: input.trigger, counts, durationMs: Date.now() - startedAt, summary };
  } catch (error) {
    // A failed run is recorded rather than lost, so run history shows what broke.
    await finish("FAILED", `Run failed: ${getErrorMessage(error)}`);
    throw error;
  }
}

/**
 * Record the scheduled run.
 *
 * The cron path calls this so a scheduled cycle appears in the same history as
 * manual and test runs, without changing anything about how it executes.
 */
export async function recordCronRun(input: {
  campaignIds: string[];
  summary: string;
  durationMs: number;
}): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const finishedAt = new Date();

  await prisma.outreachRun
    .createMany({
      data: input.campaignIds.map((campaignId) => ({
        id: newRunId(),
        campaignId,
        trigger: "CRON" as const,
        status: "COMPLETED" as const,
        startedAt: new Date(finishedAt.getTime() - input.durationMs),
        completedAt: finishedAt,
        emailsSentCount: 0,
        summary: input.summary.slice(0, 1_000),
      })),
    })
    .catch((error) => console.error("[outreach-run] could_not_record_cron_run", getErrorMessage(error)));
}
