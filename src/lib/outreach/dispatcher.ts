import "server-only";

import { getPrisma } from "@/lib/prisma";
import { OUTREACH_SAFETY, getOutreachSendingState } from "./config";
import { recordEvent } from "./events";
import { fetchPlaceDetails } from "./google-places";
import { claimJobs, completeJob, deferJob, enqueueJob, failJob, reapStaleJobs, type ClaimedJob } from "./jobs";
import { runDiscovery } from "./discovery";
import { runAssessmentStage, runEmailGenerationStage, runEnrichment } from "./pipeline";
import { deliverOutreachMessage, deferDelayMs, isDeferrableSendBlock, isSchedulingDeferral, reapStaleSendingMessages, simulateSend } from "./sending";
import { processInboundReply } from "./inbound";
import { planFollowUp } from "./limits";
import { getErrorMessage } from "@/lib/prisma-errors";

/**
 * Job dispatch.
 *
 * Every cron invocation claims a bounded batch, runs each handler and records the
 * outcome. Handlers are individually guarded so one malformed job cannot abort the
 * whole batch.
 */

type Handler = (job: ClaimedJob) => Promise<unknown>;

const HANDLERS: Record<ClaimedJob["type"], Handler> = {
  DISCOVER: async (job) => {
    if (!job.campaignId) throw new Error("DISCOVER job without campaignId");
    return runDiscovery(job.campaignId);
  },
  ENRICH: async (job) => {
    if (!job.prospectId) throw new Error("ENRICH job without prospectId");
    return runEnrichment(job.prospectId);
  },
  ASSESS: async (job) => {
    if (!job.prospectId) throw new Error("ASSESS job without prospectId");
    return runAssessmentStage(job.prospectId);
  },
  GENERATE_EMAIL: async (job) => {
    if (!job.prospectId) throw new Error("GENERATE_EMAIL job without prospectId");
    const payload = (job.payload ?? {}) as { messageType?: string };
    const messageType = payload.messageType;
    if (messageType !== "INITIAL" && messageType !== "FOLLOW_UP_1" && messageType !== "FOLLOW_UP_2") {
      throw new Error(`GENERATE_EMAIL job has an invalid messageType: ${String(messageType)}`);
    }
    return runEmailGenerationStage(job.prospectId, messageType);
  },
  SEND_EMAIL: async (job) => {
    const payload = (job.payload ?? {}) as { messageId?: string };
    if (!payload.messageId) throw new Error("SEND_EMAIL job without messageId");

    // Development never contacts a real prospect. The message is recorded as a
    // test artefact instead so the whole path can still be exercised.
    const sendingState = getOutreachSendingState();
    if (!sendingState.enabled) {
      if (sendingState.environment !== "production") {
        return simulateSend(payload.messageId);
      }
      // Production with the kill switch off: defer, never "complete". Otherwise
      // the message would be stranded in APPROVED with nothing left to send it.
      // Waiting for an operator to flip a switch is not a failed attempt.
      return { deferred: true, deferMs: 12 * 60 * 60 * 1000, consumesAttempt: false, reason: sendingState.reason };
    }

    const outcome = await deliverOutreachMessage(payload.messageId);

    // A send that is merely not due yet is re-queued rather than completed, so a
    // daily orchestrator cannot strand a message behind a closed sending window.
    if (!outcome.sent && isDeferrableSendBlock(outcome.blocked)) {
      return {
        deferred: true,
        deferMs: deferDelayMs(outcome.blocked, outcome.windowOpensAt ?? null),
        // A closed window or a spent allowance must not burn the retry budget, or
        // an approved email that merely missed today's window would be failed
        // after a few days without ever being sent.
        consumesAttempt: !isSchedulingDeferral(outcome.blocked),
        reason: `Send deferred: ${outcome.blocked}${outcome.reason ? ` (${outcome.reason})` : ""}`,
      };
    }

    return outcome;
  },
  SCHEDULE_FOLLOWUP: async (job) => {
    // Scoped to a single prospect. The global sweep is the dedicated
    // follow-ups cron, so this handler only services an explicit request.
    if (!job.prospectId) return { skipped: "no_prospect" as const };
    const prisma = getPrisma();
    if (!prisma) throw new Error("Database unavailable");

    const prospect = await prisma.outreachProspect.findUnique({
      where: { id: job.prospectId },
      include: { campaign: true, messages: { where: { status: { in: ["SENT", "DELIVERED", "OPENED", "CLICKED"] } }, orderBy: { sentAt: "desc" }, take: 3 } },
    });
    if (!prospect) return { skipped: "not_found" as const };

    const lastMessage = prospect.messages.find((message) => message.type === "INITIAL" || message.type === "FOLLOW_UP_1") ?? null;
    const initialMessage = prospect.messages.find((message) => message.type === "INITIAL") ?? null;
    const followUpsSent = await prisma.outreachMessage.count({
      where: { prospectId: prospect.id, type: { in: ["FOLLOW_UP_1", "FOLLOW_UP_2"] }, status: { in: ["SENT", "DELIVERED", "OPENED", "CLICKED"] } },
    });

    const plan = planFollowUp(
      {
        followUpEnabled: prospect.campaign.followUpEnabled,
        maxFollowUps: prospect.campaign.maxFollowUps,
        followUpsSent,
        prospectStatus: prospect.status,
        automationStoppedReason: prospect.automationStoppedReason,
        lastMessageType: lastMessage?.type ?? null,
        lastSentAt: lastMessage?.sentAt ?? null,
        initialSentAt: initialMessage?.sentAt ?? null,
        nextActionAt: prospect.nextActionAt,
        emailsSentCount: prospect.emailsSentCount,
      },
      new Date()
    );

    if (plan.action === "NONE" || plan.action === "STOP") {
      await prisma.outreachProspect.update({ where: { id: prospect.id }, data: { nextActionAt: plan.dueAt } }).catch(() => undefined);
      return { action: plan.action, reason: plan.reason };
    }

    const messageType = plan.action === "SCHEDULE_FOLLOW_UP_1" ? "FOLLOW_UP_1" : "FOLLOW_UP_2";
    await enqueueJob({
      type: "GENERATE_EMAIL",
      campaignId: prospect.campaignId,
      prospectId: prospect.id,
      dedupeKey: `GENERATE_EMAIL:${prospect.id}:${messageType}`,
      payload: { messageType },
    });
    await recordEvent({
      type: "FOLLOW_UP_SCHEDULED",
      campaignId: prospect.campaignId,
      prospectId: prospect.id,
      summary: `${messageType} queued`,
      metadata: { messageType, followUpsSent, reason: plan.reason },
    });
    return { action: plan.action, messageType };
  },
  PROCESS_REPLY: async (job) => {
    const payload = (job.payload ?? {}) as { prospectId?: string; subject?: string | null; body?: string };
    if (!payload.prospectId || typeof payload.body !== "string") {
      throw new Error("PROCESS_REPLY job is missing prospectId or body");
    }
    return processInboundReply({
      prospectId: payload.prospectId,
      subject: typeof payload.subject === "string" ? payload.subject : null,
      body: payload.body.slice(0, OUTREACH_SAFETY.maxReplyChars),
    });
  },
  REFRESH_PLACE: async (job) => {
    if (!job.prospectId) throw new Error("REFRESH_PLACE job without prospectId");
    const prisma = getPrisma();
    if (!prisma) throw new Error("Database unavailable");
    const prospect = await prisma.outreachProspect.findUnique({ where: { id: job.prospectId }, select: { googlePlaceId: true } });
    if (!prospect?.googlePlaceId) return { skipped: "no_place_id" as const };
    const place = await fetchPlaceDetails(prospect.googlePlaceId);
    if (!place) return { skipped: "not_found" as const };
    await prisma.outreachProspect.update({
      where: { id: job.prospectId },
      data: {
        businessName: place.displayName || undefined,
        publicPhone: place.phone,
        websiteUrl: place.websiteUri,
        city: place.city ?? undefined,
        region: place.region ?? undefined,
        country: place.country ?? undefined,
        googleMapsUri: place.googleMapsUri ?? undefined,
      },
    });
    return { refreshed: true as const };
  },
};

export type ProcessBatchResult = {
  claimed: number;
  completed: number;
  failed: number;
  deferred: number;
  /** True when the deadline stopped the batch with work still due. */
  budgetExhausted: boolean;
  outcomes: Array<{ id: string; type: string; status: "completed" | "failed" | "deferred"; detail: string }>;
};

/**
 * Process a bounded batch of due jobs.
 *
 * Three outcomes are possible per job:
 *   completed  the work is done
 *   deferred   the work is not due yet (closed sending window, spent allowance,
 *              brief provider outage) and goes back on the queue with a due time
 *   failed     the work errored and follows the existing retry policy
 *
 * A job that defers is not an error and must not consume the failure budget, but
 * a job that has exhausted its attempts still fails so the condition surfaces.
 */
export async function processJobBatch(
  limit = 5,
  options: { deadlineAt?: number } = {}
): Promise<ProcessBatchResult> {
  const deadlineAt = options.deadlineAt ?? Number.POSITIVE_INFINITY;
  const result: ProcessBatchResult = {
    claimed: 0,
    completed: 0,
    failed: 0,
    deferred: 0,
    budgetExhausted: false,
    outcomes: [],
  };

  await reapStaleJobs();
  await reapStaleSendingMessages();

  const jobs = await claimJobs(Math.max(1, Math.min(10, limit)));
  result.claimed = jobs.length;

  for (const job of jobs) {
    // Stop claiming new work once the budget is spent. Anything already due and
    // still unclaimed simply stays PENDING for the next run.
    if (Date.now() >= deadlineAt) {
      result.budgetExhausted = true;
      await releaseUnprocessedJob(job);
      result.outcomes.push({
        id: job.id,
        type: job.type,
        status: "deferred",
        detail: "run budget exhausted; left for the next orchestrator run",
      });
      continue;
    }

    const handler = HANDLERS[job.type];
    const started = Date.now();
    try {
      if (!handler) throw new Error(`No handler registered for job type ${job.type}`);
      const detail = await handler(job);

      if (isDeferredResult(detail)) {
        await deferJob(job, detail.deferMs, detail.reason, { consumesAttempt: detail.consumesAttempt });
        result.deferred += 1;
        result.outcomes.push({
          id: job.id,
          type: job.type,
          status: "deferred",
          detail: detail.reason.slice(0, 200),
        });
        continue;
      }

      await completeJob(job.id, job.lockToken);
      result.completed += 1;
      result.outcomes.push({
        id: job.id,
        type: job.type,
        status: "completed",
        detail: `${Date.now() - started}ms ${summarize(detail)}`,
      });
    } catch (error) {
      await failJob(job, error);
      result.failed += 1;
      const message = getErrorMessage(error).slice(0, 300);
      result.outcomes.push({ id: job.id, type: job.type, status: "failed", detail: message });
      console.error("[outreach-jobs] job_failed", {
        jobId: job.id,
        type: job.type,
        campaignId: job.campaignId,
        prospectId: job.prospectId,
        attempt: job.attempts,
        error: message,
      });
    }
  }
  return result;
}

type DeferredResult = { deferred: true; deferMs: number; reason: string; consumesAttempt?: boolean };

function isDeferredResult(value: unknown): value is DeferredResult {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>).deferred === true
  );
}

/** Put a claimed-but-unrun job straight back on the queue without consuming an attempt. */
async function releaseUnprocessedJob(job: ClaimedJob) {
  const prisma = getPrisma();
  if (!prisma) return;
  await prisma.outreachJob
    .updateMany({
      where: { id: job.id, status: "PROCESSING", lockToken: job.lockToken },
      data: { status: "PENDING", lockedAt: null, lockToken: null, attempts: { decrement: 1 }, scheduledFor: new Date() },
    })
    .catch(() => undefined);
}

function summarize(detail: unknown) {
  if (detail === null || detail === undefined) return "";
  if (typeof detail !== "object") return String(detail).slice(0, 160);
  const record = detail as Record<string, unknown>;
  const parts: string[] = [];
  for (const [key, value] of Object.entries(record).slice(0, 4)) {
    if (value === null || value === undefined) continue;
    parts.push(`${key}=${typeof value === "object" ? "…" : String(value).slice(0, 40)}`);
  }
  return parts.join(" ");
}
