import "server-only";

import type { OutreachDiscoveryProvider, OutreachDiscoveryProviderMode } from "@prisma/client";
import { OUTREACH_PROVIDERS } from "../config";
import { getProviderHealth, recordProviderFailure, recordProviderSuccess } from "../provider-health";
import { googlePlacesDiscoveryProvider } from "./google-places-provider";
import { openStreetMapDiscoveryProvider } from "./openstreetmap-provider";
import {
  DiscoveryProviderError,
  isDiscoveryProviderError,
  isFallbackEligible,
  type BusinessDiscoveryProvider,
  type DiscoveredBusiness,
  type DiscoveryCriteria,
  type DiscoveryFailureCategory,
} from "./types";

/**
 * Provider registry and selection.
 *
 * Google Places stays the primary provider. AUTO mode falls back to OpenStreetMap
 * only when Google's failure is the provider's own fault (configuration, quota or
 * a temporary outage) and only after a bounded retry. A programming error is never
 * hidden behind a fallback, because that would conceal a defect in this codebase.
 */

export const DISCOVERY_PROVIDERS: Record<OutreachDiscoveryProvider, BusinessDiscoveryProvider> = {
  GOOGLE_PLACES: googlePlacesDiscoveryProvider,
  OPENSTREETMAP: openStreetMapDiscoveryProvider,
};

export type ProviderTable = Record<OutreachDiscoveryProvider, BusinessDiscoveryProvider>;

/**
 * Resolve the provider table. A caller may pass an override, which is how tests
 * exercise the selection rules without touching the network, and how a future
 * provider would be substituted in exactly one place.
 */
export function resolveProviders(override?: Partial<ProviderTable>): ProviderTable {
  if (!override) return DISCOVERY_PROVIDERS;
  return { ...DISCOVERY_PROVIDERS, ...override } as ProviderTable;
}

export const PRIMARY_PROVIDER: OutreachDiscoveryProvider = "GOOGLE_PLACES";
export const FALLBACK_PROVIDER: OutreachDiscoveryProvider = "OPENSTREETMAP";

export type SelectionReason =
  | "google_selected"
  | "google_not_configured"
  | "google_in_cooldown"
  | "fallback_after_failure"
  | "google_pinned"
  | "openstreetmap_pinned";

export type ProviderAttempt = {
  provider: OutreachDiscoveryProvider;
  ok: boolean;
  failureCategory: DiscoveryFailureCategory | null;
  error: string | null;
  attempts: number;
};

export type ProviderRunResult = {
  businesses: DiscoveredBusiness[];
  provider: OutreachDiscoveryProvider | null;
  /** Every provider tried, in order, with the reason each ended. */
  attempts: ProviderAttempt[];
  /** Why the selected provider was chosen, for the admin and the event log. */
  reason: SelectionReason;
  /** Present when a primary failure was eligible for fallback. */
  fallback: { from: OutreachDiscoveryProvider; to: OutreachDiscoveryProvider; category: DiscoveryFailureCategory; message: string } | null;
  skipped: null | { provider: OutreachDiscoveryProvider; reason: string };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run one provider with a short bounded retry for transient failures only.
 * Quota and configuration failures are not retried: repeating them cannot help.
 */
async function runProvider(
  provider: BusinessDiscoveryProvider,
  criteria: DiscoveryCriteria
): Promise<{ businesses: DiscoveredBusiness[]; attempt: ProviderAttempt }> {
  const maxAttempts = 1 + (OUTREACH_PROVIDERS.transientRetries > 0 ? OUTREACH_PROVIDERS.transientRetries : 0);
  let lastError: unknown = null;
  let attemptCount = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    attemptCount += 1;
    try {
      const businesses = await provider.discover(criteria);
      return {
        businesses,
        attempt: { provider: provider.id, ok: true, failureCategory: null, error: null, attempts: attemptCount },
      };
    } catch (error) {
      lastError = error;
      const retryable = isDiscoveryProviderError(error) ? error.retryable : false;

      if (!retryable || attempt === maxAttempts - 1) break;
      // Exponential backoff, kept short so the cron request stays responsive.
      await sleep(OUTREACH_PROVIDERS.transientRetries > 0 ? OUTREACH_PROVIDERS.transientRetryDelayMs * 2 ** attempt : 0);
    }
  }

  const message = lastError instanceof Error ? lastError.message : "Provider call failed.";
  const category = isDiscoveryProviderError(lastError) ? lastError.category : ("programming" as DiscoveryFailureCategory);

  return {
    businesses: [],
    attempt: { provider: provider.id, ok: false, failureCategory: category, error: message, attempts: attemptCount },
  };
}

/**
 * Choose and run a discovery provider.
 *
 * `jobId` is only used to correlate the fallback event; it never changes which
 * provider runs.
 */
export async function runDiscoveryProviders(input: {
  mode: OutreachDiscoveryProviderMode;
  criteria: DiscoveryCriteria;
  campaignId: string;
  jobId?: string | null;
  now?: Date;
  /** Test seam and future-provider seam. Never sourced from a request. */
  providers?: Partial<ProviderTable>;
}): Promise<ProviderRunResult> {
  const now = input.now ?? new Date();
  const attempts: ProviderAttempt[] = [];
  const table = resolveProviders(input.providers);

  const attemptFallback = async (
    fallbackReason: ProviderRunResult["fallback"],
    reason: SelectionReason,
    skipped: ProviderRunResult["skipped"]
  ): Promise<ProviderRunResult> => {
    const fallbackProvider = table[FALLBACK_PROVIDER];
    const { businesses, attempt } = await runProvider(fallbackProvider, input.criteria);
    attempts.push(attempt);
    if (attempt.ok) await recordProviderSuccess(FALLBACK_PROVIDER, now);
    else {
      await recordProviderFailure({
        provider: FALLBACK_PROVIDER,
        category: attempt.failureCategory ?? "programming",
        message: attempt.error ?? "OpenStreetMap discovery failed.",
        campaignId: input.campaignId,
        jobId: input.jobId ?? null,
        now,
      });
    }
    return { businesses, provider: FALLBACK_PROVIDER, attempts, reason, fallback: fallbackReason, skipped };
  };

  // ── OPENSTREETMAP only ────────────────────────────────────────────────────
  if (input.mode === "OPENSTREETMAP") {
    return attemptFallback(null, "openstreetmap_pinned", null);
  }

  const google = table[PRIMARY_PROVIDER];

  // ── GOOGLE_PLACES only ─────────────────────────────────────────────────────
  // No silent switching: a failure here is surfaced so the admin can see it.
  if (input.mode === "GOOGLE_PLACES") {
    if (!google.isConfigured()) {
      return {
        businesses: [],
        provider: null,
        attempts: [],
        reason: "google_pinned",
        fallback: null,
        skipped: { provider: PRIMARY_PROVIDER, reason: google.unavailableReason() ?? "Google Places is not configured." },
      };
    }
    const { businesses, attempt } = await runProvider(google, input.criteria);
    attempts.push(attempt);
    if (attempt.ok) {
      await recordProviderSuccess(PRIMARY_PROVIDER, now);
      return { businesses, provider: PRIMARY_PROVIDER, attempts, reason: "google_pinned", fallback: null, skipped: null };
    }
    await recordProviderFailure({
      provider: PRIMARY_PROVIDER,
      category: attempt.failureCategory ?? "programming",
      message: attempt.error ?? "Google Places discovery failed.",
      campaignId: input.campaignId,
      jobId: input.jobId ?? null,
      now,
    });
    return { businesses: [], provider: null, attempts, reason: "google_pinned", fallback: null, skipped: null };
  }

  // ── AUTO ──────────────────────────────────────────────────────────────────
  if (!google.isConfigured()) {    return attemptFallback(
      null,
      "google_not_configured",
      { provider: PRIMARY_PROVIDER, reason: google.unavailableReason() ?? "Google Places is not configured." }
    );
  }

  const health = await getProviderHealth(PRIMARY_PROVIDER, now);
  if (health.inCooldown) {
    return attemptFallback(
      null,
      "google_in_cooldown",
      { provider: PRIMARY_PROVIDER, reason: health.skipReason ?? "Google Places is in a cooldown window." }
    );
  }

  const { businesses, attempt } = await runProvider(google, input.criteria);
  attempts.push(attempt);

  if (attempt.ok) {
    await recordProviderSuccess(PRIMARY_PROVIDER, now);
    return { businesses, provider: PRIMARY_PROVIDER, attempts, reason: "google_selected", fallback: null, skipped: null };
  }

  const category = attempt.failureCategory ?? "programming";

  if (!isFallbackEligible(category)) {
    // A programming error is our bug, not the provider's. Falling back would
    // hide it, so the failure is recorded and rethrown for the job to surface.
    await recordProviderFailure({
      provider: PRIMARY_PROVIDER,
      category,
      message: attempt.error ?? "Google Places discovery failed.",
      campaignId: input.campaignId,
      jobId: input.jobId ?? null,
      now,
    });
    throw new DiscoveryProviderError({
      provider: PRIMARY_PROVIDER,
      category,
      message: attempt.error ?? "Google Places discovery failed.",
      retryable: false,
    });
  }

  await recordProviderFailure({
    provider: PRIMARY_PROVIDER,
    category,
    message: attempt.error ?? "Google Places discovery failed.",
    campaignId: input.campaignId,
    jobId: input.jobId ?? null,
    now,
  });

  return attemptFallback(
    { from: PRIMARY_PROVIDER, to: FALLBACK_PROVIDER, category, message: attempt.error ?? "unknown" },
    "fallback_after_failure",
    { provider: PRIMARY_PROVIDER, reason: attempt.error ?? "Google Places is unavailable." }
  );
}

/** Current provider readiness for the admin health panel. Never exposes a key. */
export async function getProviderStatus(now = new Date()) {
  const google = DISCOVERY_PROVIDERS[PRIMARY_PROVIDER];
  const osm = DISCOVERY_PROVIDERS[FALLBACK_PROVIDER];
  const health = await getProviderHealth(PRIMARY_PROVIDER, now);

  return {
    primary: {
      id: PRIMARY_PROVIDER,
      label: google.label,
      configured: google.isConfigured(),
      inCooldown: health.inCooldown,
      cooldownUntil: health.cooldownUntil,
      consecutiveFailures: health.consecutiveFailures,
      lastFailureCategory: health.lastFailureCategory,
      // The stored message originates from our own error mapping, never from a
      // raw provider body, so it cannot contain a key.
      lastFailureMessage: health.lastFailureMessage,
      lastSuccessAt: health.lastSuccessAt,
      reason: health.inCooldown ? health.skipReason : google.unavailableReason(),
    },
    fallback: {
      id: FALLBACK_PROVIDER,
      label: osm.label,
      configured: osm.isConfigured(),
      reason: osm.unavailableReason(),
    },
  };
}
