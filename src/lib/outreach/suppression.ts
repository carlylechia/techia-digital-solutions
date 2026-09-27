import "server-only";

import type { OutreachSuppressionReason } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { emailDomain, normalizeEmail } from "./limits";
import { recordEvent } from "./events";

/**
 * Suppression is the highest-priority safety gate. Both checks — exact address
 * and whole domain — run before every single send attempt, independently of
 * campaign or prospect state.
 */

export type SuppressionMatch = {
  suppressed: boolean;
  reason: OutreachSuppressionReason | null;
  scope: "email" | "domain" | null;
  notes: string | null;
};

export async function checkSuppression(email: string): Promise<SuppressionMatch> {
  const prisma = getPrisma();
  const normalized = normalizeEmail(email);
  if (!prisma || !normalized) return { suppressed: false, reason: null, scope: null, notes: null };

  const domain = emailDomain(normalized);

  const exact = await prisma.outreachSuppression.findUnique({
    where: { email: normalized },
    select: { reason: true, notes: true },
  });
  if (exact) return { suppressed: true, reason: exact.reason, scope: "email", notes: exact.notes };

  if (domain) {
    const byDomain = await prisma.outreachSuppression.findUnique({
      where: { domain },
      select: { reason: true, notes: true },
    });
    if (byDomain) return { suppressed: true, reason: byDomain.reason, scope: "domain", notes: byDomain.notes };
  }

  return { suppressed: false, reason: null, scope: null, notes: null };
}

export async function suppressContact(input: {
  email?: string | null;
  domain?: string | null;
  reason: OutreachSuppressionReason;
  source?: string;
  notes?: string | null;
  prospectId?: string | null;
  campaignId?: string | null;
}) {
  const prisma = getPrisma();
  if (!prisma) return null;

  const email = normalizeEmail(input.email);
  const domain = input.domain?.trim().toLowerCase().replace(/^@/, "") || (email ? emailDomain(email) : null);
  if (!email && !domain) return null;

  try {
    const row = email
      ? await prisma.outreachSuppression.upsert({
          where: { email },
          update: { reason: input.reason, notes: input.notes?.slice(0, 500) ?? null },
          create: { email, reason: input.reason, source: input.source ?? "system", notes: input.notes?.slice(0, 500) ?? null },
          select: { id: true, email: true, domain: true },
        })
      : await prisma.outreachSuppression.upsert({
          where: { domain: domain as string },
          update: { reason: input.reason, notes: input.notes?.slice(0, 500) ?? null },
          create: { domain, reason: input.reason, source: input.source ?? "system", notes: input.notes?.slice(0, 500) ?? null },
          select: { id: true, email: true, domain: true },
        });

    await recordEvent({
      type: input.reason === "UNSUBSCRIBED" ? "UNSUBSCRIBED" : "BOUNCED",
      campaignId: input.campaignId ?? null,
      prospectId: input.prospectId ?? null,
      summary: `Suppressed ${email ?? domain} (${input.reason})`,
      metadata: { reason: input.reason, scope: email ? "email" : "domain", source: input.source ?? "system" },
    });

    return row;
  } catch (error) {
    console.error("[outreach-suppression] upsert_failed", { reason: input.reason, error: getErrorMessage(error) });
    return null;
  }
}

/** Opt-out handler shared by the unsubscribe endpoint and reply classification. */
export async function unsubscribeContact(email: string, prospectId?: string | null) {
  const prisma = getPrisma();
  if (!prisma) return;
  await suppressContact({
    email,
    reason: "UNSUBSCRIBED",
    source: "unsubscribe",
    notes: "Recipient requested removal.",
    prospectId,
  });

  if (prospectId) {
    await prisma.outreachProspect
      .update({
        where: { id: prospectId },
        data: {
          status: "UNSUBSCRIBED",
          automationStoppedReason: "unsubscribed",
          nextActionAt: null,
        },
      })
      .catch((error) => {
        console.error("[outreach-suppression] prospect_update_failed", getErrorMessage(error));
      });
  }
}

export async function markBounced(email: string, prospectId: string | null, campaignId: string | null, detail?: string) {
  const prisma = getPrisma();
  if (!prisma) return;
  await suppressContact({
    email,
    reason: "BOUNCED",
    source: "provider_webhook",
    notes: detail?.slice(0, 400) ?? "Hard bounce reported by the email provider.",
    prospectId,
    campaignId,
  });
  if (!prospectId) return;
  await prisma.outreachProspect
    .update({
      where: { id: prospectId },
      data: { status: "BOUNCED", automationStoppedReason: "bounced", nextActionAt: null },
    })
    .catch((error) => {
      console.error("[outreach-suppression] bounce_prospect_update_failed", getErrorMessage(error));
    });
}
