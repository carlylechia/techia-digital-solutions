import "server-only";

import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { OUTREACH_SAFETY } from "./config";
import type { ReplyCategory } from "./constants";
import { recordEvent, recordStatusChange } from "./events";
import { cancelJobsForProspect, OutreachJobError } from "./jobs";
import { decideReply } from "./reply-rules";
import { runReplyClassification } from "./ai-services";
import { incrementDailyStat } from "./stats";
import { unsubscribeContact } from "./suppression";
import { notifyAdminOfOutreachReply } from "./notifications";

/**
 * Inbound reply processing.
 *
 * The classifier only labels. `decideReply` decides what happens, and the
 * resulting state change is written to the immutable event log alongside the
 * prospect update. A reply at any point in the sequence stops automation.
 */

export type InboundReply = {
  prospectId: string;
  subject: string | null;
  body: string;
  providerMessageId?: string | null;
};

export async function processInboundReply(reply: InboundReply) {
  const prisma = getPrisma();
  if (!prisma) throw new OutreachJobError("Database unavailable", { retryable: false });

  const prospect = await prisma.outreachProspect.findUnique({
    where: { id: reply.prospectId },
    include: {
      campaign: true,
      messages: {
        where: { status: { in: ["SENT", "DELIVERED", "OPENED", "CLICKED", "REPLIED"] } },
        orderBy: { sentAt: "desc" },
        take: 1,
      },
    },
  });
  if (!prospect) throw new OutreachJobError("Prospect not found", { retryable: false });

  const last = prospect.messages[0] ?? null;

  let modelCategory: ReplyCategory = "OTHER";
  let modelConfidence = 0.5;
  try {
    const classified = await runReplyClassification({
      business: prospect.businessName,
      ourLastSubject: last?.subject ?? null,
      ourLastBodyExcerpt: last?.bodyText ?? "",
      inboundSubject: reply.subject,
      inboundBody: reply.body.slice(0, OUTREACH_SAFETY.maxReplyChars),
    });
    modelCategory = classified.data.category;
    modelConfidence = classified.data.confidence;
  } catch (error) {
    // A classifier outage must not silently swallow the reply or auto-mark it as
    // uninterested. It falls through to the deterministic rules with a neutral
    // model guess, and the reply is still escalated to a human.
    console.error("[outreach-reply] classification_failed", {
      prospectId: prospect.id,
      error: getErrorMessage(error),
    });
  }

  const decision = decideReply({
    modelCategory,
    modelConfidence,
    inboundSubject: reply.subject,
    inboundBody: reply.body,
  });

  const now = new Date();
  const replyMessage = await prisma.outreachMessage.upsert({
    where: { prospectId_type: { prospectId: prospect.id, type: "REPLY" } },
    update: { status: "REPLIED", subject: reply.subject ?? "(no subject)", bodyText: reply.body.slice(0, OUTREACH_SAFETY.maxReplyChars) },
    create: {
      prospectId: prospect.id,
      campaignId: prospect.campaignId,
      type: "REPLY",
      status: "REPLIED",
      subject: reply.subject ?? "(no subject)",
      bodyText: reply.body.slice(0, OUTREACH_SAFETY.maxReplyChars),
      threadId: reply.providerMessageId ?? null,
      sentAt: now,
    },
  });

  const nextStatus = decision.category === "UNSUBSCRIBE" ? "UNSUBSCRIBED" : decision.category === "INTERESTED" ? "INTERESTED" : "REPLIED";

  await prisma.outreachProspect.update({
    where: { id: prospect.id },
    data: {
      status: nextStatus,
      automationStoppedReason: decision.stopAutomation ? `replied:${decision.category.toLowerCase()}` : null,
      nextActionAt: null,
      aiSummary: prospect.aiSummary,
    },
  });

  await cancelJobsForProspect(prospect.id, ["GENERATE_EMAIL", "SEND_EMAIL", "SCHEDULE_FOLLOWUP"]);

  await recordEvent({
    type: "EMAIL_REPLIED",
    campaignId: prospect.campaignId,
    prospectId: prospect.id,
    messageId: replyMessage.id,
    summary: reply.subject?.slice(0, 160) ?? "(no subject)",
    metadata: {
      category: decision.category,
      confidence: decision.confidence,
      ruleApplied: decision.ruleApplied,
      modelCategory,
      modelConfidence,
      suggestedAction: decision.suggestedAction,
    },
  });
  await recordStatusChange({
    prospectId: prospect.id,
    campaignId: prospect.campaignId,
    from: prospect.status,
    to: nextStatus,
    reason: decision.suggestedAction,
  });

  await incrementDailyStat(prospect.campaignId, "replies", 1, now);
  if (decision.markInterested) {
    await incrementDailyStat(prospect.campaignId, "interested", 1, now);
  }

  if (decision.suppress && prospect.publicEmail) {
    await unsubscribeContact(prospect.publicEmail, prospect.id);
  }

  // Only meaningful replies notify. Routine declines and "later" replies stay in
  // the conversations inbox without an email.
  if (decision.requiresHumanReply) {
    await notifyAdminOfOutreachReply({
      prospectId: prospect.id,
      businessName: prospect.businessName,
      category: decision.category,
      excerpt: reply.body.slice(0, 400),
      suggestedAction: decision.suggestedAction,
    });
  }

  return {
    category: decision.category,
    requiresHumanReply: decision.requiresHumanReply,
    stopAutomation: decision.stopAutomation,
    suppressed: decision.suppress,
  };
}
