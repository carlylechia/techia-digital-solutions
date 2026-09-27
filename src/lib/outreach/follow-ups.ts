import "server-only";

import { getPrisma } from "@/lib/prisma";
import { recordEvent } from "./events";
import { enqueueJob } from "./jobs";
import { planFollowUp, clampMaxFollowUps } from "./limits";

/**
 * Follow-up scheduling.
 *
 * The state machine lives in the pure `planFollowUp` function. This module only
 * gathers the facts it needs and enqueues the resulting job, so the sequence can
 * be stopped from any direction: a reply, an unsubscribe, a bounce, a booked
 * meeting or a manual pause.
 */

export type FollowUpScanResult = {
  scanned: number;
  scheduled: number;
  stopped: number;
};

export async function scheduleDueFollowUps(now = new Date()): Promise<FollowUpScanResult> {
  const prisma = getPrisma();
  const result: FollowUpScanResult = { scanned: 0, scheduled: 0, stopped: 0 };
  if (!prisma) return result;

  // Only prospects with a delivered message can be due a follow-up.
  const candidates = await prisma.outreachProspect.findMany({
    where: {
      status: { in: ["OUTREACH_ACTIVE", "APPROVED"] },
      nextActionAt: { lte: now },
      emailsSentCount: { gt: 0 },
    },
    include: {
      campaign: true,
      messages: {
        where: { status: { in: ["SENT", "DELIVERED", "OPENED", "CLICKED"] } },
        orderBy: { sentAt: "desc" },
        take: 3,
        select: { type: true, sentAt: true },
      },
    },
    take: 100,
    orderBy: { nextActionAt: "asc" },
  });

  for (const prospect of candidates) {
    result.scanned += 1;
    const lastMessage = prospect.messages.find((message) => message.type === "INITIAL" || message.type === "FOLLOW_UP_1" || message.type === "FOLLOW_UP_2") ?? null;
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
      now
    );

    if (plan.action === "STOP") {
      result.stopped += 1;
      if (!prospect.automationStoppedReason) {
        await prisma.outreachProspect
          .update({ where: { id: prospect.id }, data: { nextActionAt: null, automationStoppedReason: plan.reason.slice(0, 200) } })
          .catch(() => undefined);
      }
      continue;
    }

    if (plan.action === "NONE") {
      // Re-arm for the plan's own due date, or clear the timer if it is done.
      await prisma.outreachProspect
        .update({ where: { id: prospect.id }, data: { nextActionAt: plan.dueAt } })
        .catch(() => undefined);
      continue;
    }

    const messageType = plan.action === "SCHEDULE_FOLLOW_UP_1" ? "FOLLOW_UP_1" : "FOLLOW_UP_2";
    const cap = clampMaxFollowUps(prospect.campaign.maxFollowUps);
    if (followUpsSent >= cap) {
      result.stopped += 1;
      continue;
    }

    await enqueueJob({
      type: "GENERATE_EMAIL",
      campaignId: prospect.campaignId,
      prospectId: prospect.id,
      dedupeKey: `GENERATE_EMAIL:${prospect.id}:${messageType}`,
      payload: { messageType },
    });

    await prisma.outreachProspect.update({ where: { id: prospect.id }, data: { nextActionAt: null } }).catch(() => undefined);
    await recordEvent({
      type: "FOLLOW_UP_SCHEDULED",
      campaignId: prospect.campaignId,
      prospectId: prospect.id,
      summary: `${messageType} queued`,
      metadata: { messageType, followUpsSent, cap, reason: plan.reason },
    });
    result.scheduled += 1;
  }

  return result;
}

/**
 * After a message is delivered the prospect must become scannable again. The
 * exact follow-up date is decided by the state machine on the next scan, so the
 * clock is armed shortly ahead rather than at a hard-coded offset.
 */
export async function armFollowUpClock(prospectId: string, campaignFollowUpEnabled: boolean) {
  const prisma = getPrisma();
  if (!prisma || !campaignFollowUpEnabled) return;
  await prisma.outreachProspect
    .update({ where: { id: prospectId }, data: { nextActionAt: new Date(Date.now() + 60 * 60 * 1000) } })
    .catch(() => undefined);
}
