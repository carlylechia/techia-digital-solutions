import "server-only";

import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import type { OutreachEventType } from "@prisma/client";

/**
 * Append-only event log.
 *
 * Events are never updated or deleted. Nothing in the pipeline reads this table
 * to decide state — it exists purely as an audit trail, which is why every
 * status change writes one even when the row it describes has already changed.
 */

export type RecordEventInput = {
  type: OutreachEventType;
  campaignId?: string | null;
  prospectId?: string | null;
  messageId?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown> | null;
  actorId?: string | null;
};

export async function recordEvent(input: RecordEventInput) {
  const prisma = getPrisma();
  if (!prisma) return null;
  try {
    return await prisma.outreachEvent.create({
      data: {
        type: input.type,
        campaignId: input.campaignId ?? null,
        prospectId: input.prospectId ?? null,
        messageId: input.messageId ?? null,
        summary: input.summary ? input.summary.slice(0, 500) : null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        actorId: input.actorId ?? null,
      },
    });
  } catch (error) {
    // Audit logging must never break the operation it is describing.
    console.error("[outreach-events] record_failed", {
      type: input.type,
      prospectId: input.prospectId ?? null,
      error: getErrorMessage(error),
    });
    return null;
  }
}

export async function recordStatusChange(input: {
  prospectId: string;
  campaignId: string;
  from: string;
  to: string;
  reason?: string;
  actorId?: string | null;
}) {
  await recordEvent({
    type: "STATUS_CHANGED",
    campaignId: input.campaignId,
    prospectId: input.prospectId,
    actorId: input.actorId ?? null,
    summary: `${input.from} → ${input.to}`,
    metadata: { from: input.from, to: input.to, reason: input.reason ?? null },
  });
}
