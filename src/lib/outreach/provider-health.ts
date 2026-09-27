import "server-only";

import type { OutreachDiscoveryProvider } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { OUTREACH_PROVIDERS } from "./config";
import { recordEvent } from "./events";
import type { DiscoveryFailureCategory } from "./providers/types";

/**
 * Database-backed circuit breaker.
 *
 * Purpose: stop repeatedly calling a provider that is already known to be
 * failing, while leaving it permanently disabled. One row per provider, so this
 * adds no infrastructure — no Redis, no queue, no external service.
 *
 * A provider is skipped only while `cooldownUntil` is in the future. After the
 * cooldown expires the provider is attempted again, so Google returns to service
 * by itself the moment the quota or outage clears.
 */

export type ProviderHealth = {
  provider: OutreachDiscoveryProvider;
  available: boolean;
  inCooldown: boolean;
  cooldownUntil: Date | null;
  consecutiveFailures: number;
  lastFailureCategory: DiscoveryFailureCategory | null;
  lastFailureMessage: string | null;
  lastSuccessAt: Date | null;
  lastAttemptAt: Date | null;
  /** Why AUTO mode would skip this provider right now, if it would. */
  skipReason: string | null;
};

export async function getProviderHealth(
  provider: OutreachDiscoveryProvider,
  now = new Date()
): Promise<ProviderHealth> {
  const prisma = getPrisma();
  const base: ProviderHealth = {
    provider,
    available: true,
    inCooldown: false,
    cooldownUntil: null,
    consecutiveFailures: 0,
    lastFailureCategory: null,
    lastFailureMessage: null,
    lastSuccessAt: null,
    lastAttemptAt: null,
    skipReason: null,
  };
  if (!prisma) return base;

  const row = await prisma.outreachProviderHealth
    .findUnique({ where: { provider } })
    .catch(() => null);
  if (!row) return base;

  const cooling = Boolean(row.cooldownUntil && row.cooldownUntil.getTime() > now.getTime());

  return {
    provider,
    available: true,
    inCooldown: cooling,
    cooldownUntil: row.cooldownUntil,
    consecutiveFailures: row.consecutiveFailures,
    lastFailureCategory: (row.lastFailureCategory as DiscoveryFailureCategory | null) ?? null,
    lastFailureMessage: row.lastFailureMessage,
    lastSuccessAt: row.lastSuccessAt,
    lastAttemptAt: row.lastAttemptAt,
    skipReason: cooling ? `In cooldown until ${row.cooldownUntil?.toISOString()}.` : null,
  };
}

/**
 * Cooldown grows with consecutive failures but stays short and bounded, so a
 * provider recovers quickly and is never permanently written off.
 */
function cooldownFor(consecutiveFailures: number) {
  const minutes = Math.min(
    OUTREACH_PROVIDERS.maxCooldownMinutes,
    OUTREACH_PROVIDERS.baseCooldownMinutes * 2 ** Math.max(0, consecutiveFailures - 1)
  );
  return minutes * 60_000;
}

/** Record a failure and open the cooldown once the threshold is crossed. */
export async function recordProviderFailure(input: {
  provider: OutreachDiscoveryProvider;
  category: DiscoveryFailureCategory;
  message: string;
  campaignId?: string | null;
  jobId?: string | null;
  now?: Date;
}) {
  const prisma = getPrisma();
  if (!prisma) return { inCooldown: false, cooldownUntil: null as Date | null };
  const now = input.now ?? new Date();

  const existing = await prisma.outreachProviderHealth
    .findUnique({ where: { provider: input.provider }, select: { consecutiveFailures: true } })
    .catch(() => null);

  const consecutiveFailures = (existing?.consecutiveFailures ?? 0) + 1;
  // A configuration fault will not fix itself in minutes, so it cools down for
  // the full base window rather than hammering the API every run.
  const opensCooldown = consecutiveFailures >= OUTREACH_PROVIDERS.failureThreshold;
  const cooldownUntil = opensCooldown ? new Date(now.getTime() + cooldownFor(consecutiveFailures)) : null;

  await prisma.outreachProviderHealth
    .upsert({
      where: { provider: input.provider },
      update: {
        consecutiveFailures,
        cooldownUntil,
        lastFailureCategory: input.category,
        // Provider error text is stored, but credentials are never part of it:
        // the Google client discards the raw provider body before throwing.
        lastFailureMessage: input.message.slice(0, 300),
        lastAttemptAt: now,
      },
      create: {
        provider: input.provider,
        consecutiveFailures,
        cooldownUntil,
        lastFailureCategory: input.category,
        lastFailureMessage: input.message.slice(0, 300),
        lastAttemptAt: now,
      },
    })
    .catch((error) => {
      console.error("[outreach-provider-health] failure_record_failed", getErrorMessage(error));
    });

  if (cooldownUntil) {
    await recordEvent({
      type: "DISCOVERY_PROVIDER_COOLDOWN",
      campaignId: input.campaignId ?? null,
      summary: `${input.provider} entered a cooldown after ${consecutiveFailures} consecutive failures`,
      metadata: {
        provider: input.provider,
        category: input.category,
        consecutiveFailures,
        cooldownUntil: cooldownUntil.toISOString(),
        jobId: input.jobId ?? null,
      },
    });
  }

  return { inCooldown: Boolean(cooldownUntil), cooldownUntil };
}

/** Clear the failure state after a successful call. */
export async function recordProviderSuccess(provider: OutreachDiscoveryProvider, now = new Date()) {
  const prisma = getPrisma();
  if (!prisma) return;
  await prisma.outreachProviderHealth
    .upsert({
      where: { provider },
      update: { consecutiveFailures: 0, cooldownUntil: null, lastSuccessAt: now, lastAttemptAt: now, lastFailureCategory: null, lastFailureMessage: null },
      create: { provider, consecutiveFailures: 0, cooldownUntil: null, lastSuccessAt: now, lastAttemptAt: now },
    })
    .catch((error) => {
      console.error("[outreach-provider-health] success_record_failed", getErrorMessage(error));
    });
}
