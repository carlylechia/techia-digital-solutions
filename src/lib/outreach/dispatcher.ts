import "server-only";

import { getPrisma } from "@/lib/prisma";
import { OUTREACH_SAFETY, getOutreachSendingState } from "./config";
import { recordEvent } from "./events";
import { fetchPlaceDetails } from "./google-places";
import { claimJobs, completeJob, enqueueJob, failJob, reapStaleJobs, type ClaimedJob } from "./jobs";
import { runDiscovery } from "./discovery";
import { runAssessmentStage, runEmailGenerationStage, runEnrichment } from "./pipeline";
import { deliverOutreachMessage, reapStaleSendingMessages, simulateSend } from "./sending";
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
      return { skipped: "kill_switch" as const, reason: sendingState.reason };
    }
    return deliverOutreachMessage(payload.messageId);
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
  outcomes: Array<{ id: string; type: string; status: "completed" | "failed"; detail: string }>;
};

export async function processJobBatch(limit = 5): Promise<ProcessBatchResult> {
  const result: ProcessBatchResult = { claimed: 0, completed: 0, failed: 0, outcomes: [] };
  await reapStaleJobs();
  await reapStaleSendingMessages();
  const jobs = await claimJobs(Math.max(1, Math.min(10, limit)));
  result.claimed = jobs.length;

  for (const job of jobs) {
    const handler = HANDLERS[job.type];
    const started = Date.now();
    try {
      if (!handler) throw new Error(`No handler registered for job type ${job.type}`);
      const detail = await handler(job);
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
      await recordEvent({
        type: "STATUS_CHANGED",
        campaignId: job.campaignId,
        prospectId: job.prospectId,
        summary: `Job ${job.type} failed`,
        metadata: { jobId: job.id, attempt: job.attempts, error: message },
      });
    }
  }
  return result;
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
