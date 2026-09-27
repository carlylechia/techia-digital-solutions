import "server-only";

import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { OUTREACH_SAFETY, OUTREACH_SENDER, isOutreachSendingEnabled } from "./config";
import { sendOutreachEmail } from "./email-service";
import { recordEvent, recordStatusChange } from "./events";
import { armFollowUpClock } from "./follow-ups";
import { incrementDailyStat, startOfUtcDay } from "./stats";
import { checkSuppression, markBounced } from "./suppression";
import {
  campaignCanSendWithoutApproval,
  clampDailySend,
  evaluateSendGate,
  normalizeEmail,
  type CampaignPolicyInput,
} from "./limits";

/**
 * The send path.
 *
 * `deliverOutreachMessage` is the only function in the codebase allowed to hand a
 * message to the email provider, and it re-evaluates the entire gate at the
 * moment of sending rather than trusting an earlier decision. If any condition
 * fails, the message stays unsent and the reason is recorded.
 */

export function buildIdempotencyKey(prospectId: string, messageId: string) {
  return `outreach:${prospectId}:${messageId}`;
}

export function buildUnsubscribeUrl(prospectId: string, messageId: string) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://techiadigital.com").replace(/\/+$/, "");
  return `${site}/api/outreach/unsubscribe?p=${encodeURIComponent(prospectId)}&m=${encodeURIComponent(messageId)}`;
}

export type SendOutcome = {
  sent: boolean;
  blocked: string | null;
  reason: string | null;
  messageId: string | null;
  providerMessageId: string | null;
};

export async function deliverOutreachMessage(messageId: string): Promise<SendOutcome> {
  const prisma = getPrisma();
  const blocked: SendOutcome = { sent: false, blocked: "unavailable", reason: "Database unavailable.", messageId, providerMessageId: null };
  if (!prisma) return blocked;

  const message = await prisma.outreachMessage.findUnique({
    where: { id: messageId },
    include: {
      campaign: true,
      prospect: true,
    },
  });
  if (!message) {
    return { ...blocked, blocked: "message_not_found", reason: "Message no longer exists." };
  }

  // Replayed job: the message already has a provider id, so it was delivered.
  if (message.providerMessageId) {
    return { sent: true, blocked: null, reason: "Already delivered by an earlier attempt.", messageId, providerMessageId: message.providerMessageId };
  }

  const campaign = message.campaign;
  const prospect = message.prospect;
  const now = new Date();

  const recipient = normalizeEmail(prospect.publicEmail);
  const [suppression, repliedMessages] = await Promise.all([
    recipient ? checkSuppression(recipient) : Promise.resolve({ suppressed: false, reason: null, scope: null, notes: null }),
    prisma.outreachMessage.count({ where: { prospectId: prospect.id, status: "REPLIED" } }),
  ]);

  const sentToday = await prisma.outreachMessage.count({
    where: { campaignId: campaign.id, sentAt: { gte: startOfUtcDay(now) } },
  });

  const campaignPolicy: CampaignPolicyInput = {
    status: campaign.status,
    mode: campaign.mode,
    requireApproval: campaign.requireApproval,
    dailyDiscoveryLimit: campaign.dailyDiscoveryLimit,
    dailySendLimit: campaign.dailySendLimit,
    dailyAiAssessLimit: campaign.dailyAiAssessLimit,
    minOpportunityScore: campaign.minOpportunityScore,
    followUpEnabled: campaign.followUpEnabled,
    maxFollowUps: campaign.maxFollowUps,
    sendingWindowStart: campaign.sendingWindowStart,
    sendingWindowEnd: campaign.sendingWindowEnd,
    timezone: campaign.timezone,
  };

  const gate = evaluateSendGate({
    globalSendingEnabled: isOutreachSendingEnabled(),
    campaign: campaignPolicy,
    prospect: {
      status: prospect.status,
      opportunityScore: prospect.opportunityScore,
      publicEmail: recipient,
      emailsSentCount: prospect.emailsSentCount,
      lastContactedAt: prospect.lastContactedAt,
      automationStoppedReason: prospect.automationStoppedReason,
    },
    now,
    dailySendUsed: sentToday,
    emailSuppressed: suppression.suppressed && suppression.scope === "email",
    domainSuppressed: suppression.suppressed && suppression.scope === "domain",
    prospectAlreadyReplied: repliedMessages > 0,
    messageApproved: Boolean(message.approvedAt),
    queueSize: 0,
  });

  if (!gate.allowed) {
    await recordEvent({
      type: "STATUS_CHANGED",
      campaignId: campaign.id,
      prospectId: prospect.id,
      messageId: message.id,
      summary: `Send blocked: ${gate.code}`,
      metadata: { code: gate.code, reason: gate.reason },
    });
    return { sent: false, blocked: gate.code, reason: gate.reason, messageId, providerMessageId: null };
  }

  // Status is moved to SENDING with a conditional update so a retried job that
  // runs concurrently cannot double-claim the row.
  const claimed = await prisma.outreachMessage.updateMany({
    where: { id: message.id, status: { in: ["APPROVED", "QUEUED"] }, providerMessageId: null },
    data: { status: "SENDING" },
  });
  if (claimed.count !== 1) {
    return {
      sent: false,
      blocked: "already_claimed",
      reason: "Another worker is handling this message.",
      messageId,
      providerMessageId: null,
    };
  }

  // The pre-claim limit check races with any other worker in the same window, so
  // the count is re-read now that this message is exclusively ours. If the
  // budget is gone the claim is released and the message waits for the next run.
  const confirmedSentToday = await prisma.outreachMessage.count({
    where: { campaignId: campaign.id, sentAt: { gte: startOfUtcDay(now) } },
  });
  if (confirmedSentToday >= clampDailySend(campaign.dailySendLimit)) {
    await prisma.outreachMessage.updateMany({
      where: { id: message.id, status: "SENDING", providerMessageId: null },
      data: { status: "QUEUED" },
    });
    await recordEvent({
      type: "STATUS_CHANGED",
      campaignId: campaign.id,
      prospectId: prospect.id,
      messageId: message.id,
      summary: "Send deferred: daily limit confirmed reached.",
      metadata: { code: "daily_limit", sentToday: confirmedSentToday, limit: clampDailySend(campaign.dailySendLimit) },
    });
    return {
      sent: false,
      blocked: "daily_limit",
      reason: "Daily send limit reached by a concurrent send.",
      messageId,
      providerMessageId: null,
    };
  }

  const idempotencyKey = message.idempotencyKey ?? buildIdempotencyKey(prospect.id, message.id);
  const unsubscribeUrl = buildUnsubscribeUrl(prospect.id, message.id);

  const result = await sendOutreachEmail({
    to: recipient as string,
    subject: message.subject,
    bodyText: message.bodyText,
    idempotencyKey,
    unsubscribeUrl,
    complianceNote: campaign.complianceNote,
    fromName: campaign.senderNameOverride ?? OUTREACH_SENDER.name,
  });

  if (!result.sent) {
    const terminal = result.skipped !== null;
    await prisma.outreachMessage.update({
      where: { id: message.id },
      data: {
        status: terminal ? "FAILED" : "QUEUED",
        failureReason: (result.error ?? "Send failed.").slice(0, 500),
      },
    });
    await recordEvent({
      type: "STATUS_CHANGED",
      campaignId: campaign.id,
      prospectId: prospect.id,
      messageId: message.id,
      summary: `Send failed: ${result.error ?? "unknown"}`,
      metadata: { category: result.skipped ?? "provider_error" },
    });
    return { sent: false, blocked: result.skipped ?? "send_failed", reason: result.error, messageId, providerMessageId: null };
  }

  const sentAt = new Date();
  await prisma.outreachMessage.update({
    where: { id: message.id },
    data: {
      status: "SENT",
      sentAt,
      idempotencyKey,
      providerMessageId: result.providerMessageId,
      failureReason: null,
    },
  });

  const previousStatus = prospect.status;
  await prisma.outreachProspect.update({
    where: { id: prospect.id },
    data: {
      status: previousStatus === "APPROVED" || previousStatus === "QUALIFIED" ? "OUTREACH_ACTIVE" : previousStatus,
      lastContactedAt: sentAt,
      emailsSentCount: { increment: 1 },
    },
  });

  await recordEvent({
    type: "EMAIL_SENT",
    campaignId: campaign.id,
    prospectId: prospect.id,
    messageId: message.id,
    summary: message.subject.slice(0, 160),
    metadata: { type: message.type, providerMessageId: result.providerMessageId },
  });
  if (previousStatus === "APPROVED" || previousStatus === "QUALIFIED") {
    await recordStatusChange({
      prospectId: prospect.id,
      campaignId: campaign.id,
      from: previousStatus,
      to: "OUTREACH_ACTIVE",
      reason: "First message delivered.",
    });
  }

  // Arm the follow-up scanner. The exact schedule is decided by the state
  // machine, so this only makes the prospect scannable again.
  if (campaign.followUpEnabled && message.type === "INITIAL") {
    await armFollowUpClock(prospect.id, campaign.followUpEnabled);
  }

  await incrementDailyStat(campaign.id, "emailsSent", 1, sentAt);
  if (sentToday + 1 > clampDailySend(campaign.dailySendLimit)) {
    console.warn("[outreach-send] daily_limit_reached", { campaignId: campaign.id, sentToday: sentToday + 1 });
  }

  return { sent: true, blocked: null, reason: null, messageId, providerMessageId: result.providerMessageId };
}

/**
 * Reclaim messages stranded in SENDING.
 *
 * A worker that dies between the provider accepting a message and the database
 * write would otherwise leave the row in SENDING forever, because the claim only
 * accepts APPROVED and QUEUED. Re-queuing is safe: the provider call is keyed by
 * a stable idempotency key, so a repeat call cannot produce a second delivery.
 */
export async function reapStaleSendingMessages(now = new Date()) {
  const prisma = getPrisma();
  if (!prisma) return 0;
  const cutoff = new Date(now.getTime() - OUTREACH_SAFETY.jobLockTimeoutMinutes * 60_000);
  const result = await prisma.outreachMessage.updateMany({
    where: { status: "SENDING", providerMessageId: null, updatedAt: { lt: cutoff } },
    data: { status: "QUEUED" },
  });
  if (result.count > 0) {
    console.warn("[outreach-send] reclaimed_stale_sending", { count: result.count, cutoff: cutoff.toISOString() });
  }
  return result.count;
}

/**
 * Developer safety net. In any non-production environment the engine records what
 * it *would* have sent instead of contacting a real prospect.
 */
export async function simulateSend(messageId: string) {
  const prisma = getPrisma();
  if (!prisma) return { simulated: false as const, reason: "database_unavailable" };
  const message = await prisma.outreachMessage.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      campaignId: true,
      prospectId: true,
      subject: true,
      bodyText: true,
      prospect: { select: { publicEmail: true } },
    },
  });
  if (!message) return { simulated: false as const, reason: "message_not_found" };

  await prisma.outreachMessage.update({
    where: { id: messageId },
    data: { status: "SENT", sentAt: new Date(), failureReason: "simulated: development mode" },
  });
  await prisma.outreachProspect.update({
    where: { id: message.prospectId },
    data: { lastContactedAt: new Date() },
  }).catch(() => undefined);
  await recordEvent({
    type: "EMAIL_SENT",
    campaignId: message.campaignId,
    prospectId: message.prospectId,
    summary: message.subject.slice(0, 160),
    metadata: { simulated: true, recipientDomain: message.prospect.publicEmail?.split("@")[1] ?? null },
  });
  console.info("[outreach-send] simulated", { messageId, subject: message.subject.slice(0, 80) });
  return { simulated: true as const, messageId };
}

export async function handleBounce(input: {
  providerMessageId: string;
  category: "hard" | "soft";
  detail?: string;
}) {
  const prisma = getPrisma();
  if (!prisma) return { updated: false };
  const message = await prisma.outreachMessage.findUnique({
    where: { providerMessageId: input.providerMessageId },
    include: { prospect: { select: { publicEmail: true } } },
  });
  if (!message) return { updated: false };

  if (input.category !== "hard") {
    await prisma.outreachMessage.update({ where: { id: message.id }, data: { failureReason: (input.detail ?? "soft bounce").slice(0, 400) } });
    return { updated: true, hard: false };
  }

  await prisma.outreachMessage.update({ where: { id: message.id }, data: { status: "BOUNCED" } });
  await recordEvent({
    type: "BOUNCED",
    campaignId: message.campaignId,
    prospectId: message.prospectId,
    messageId: message.id,
    summary: "Hard bounce reported by the provider.",
    metadata: { detail: input.detail?.slice(0, 300) ?? null },
  });
  await markBounced(
    message.prospect.publicEmail ?? "",
    message.prospectId,
    message.campaignId,
    input.detail
  );
  return { updated: true, hard: true };
}

export function canCampaignSendAutomatically(mode: CampaignPolicyInput["mode"], requireApproval: boolean) {
  return campaignCanSendWithoutApproval(mode, requireApproval);
}

export { getErrorMessage };
