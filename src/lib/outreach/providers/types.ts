import type { OutreachDiscoveryProvider, OutreachDiscoveryProviderMode } from "@prisma/client";
import { DISCOVERY_PROVIDER_MODES } from "../constants";

/**
 * Business discovery provider abstraction.
 *
 * Google Places (New) is the primary provider. OpenStreetMap/Overpass is a
 * fallback that requires no credential. Everything downstream — enrichment,
 * scoring, AI qualification, email generation, approval, sending — consumes
 * `DiscoveredBusiness` and never sees a provider-specific structure.
 *
 * The contract is deliberately small so a third provider (a directory, another
 * maps provider, licensed business data) can be added without touching the
 * outreach engine.
 */

/**
 * A single discovered business, normalised across providers.
 *
 * A field the provider does not supply stays `null`. Nothing here is ever
 * invented: an OpenStreetMap result has no Google Maps URL, and that stays null
 * rather than being fabricated.
 */
export type DiscoveredBusiness = {
  provider: OutreachDiscoveryProvider;
  /** The provider's own stable identifier for this business. */
  providerPlaceId: string;
  name: string;
  formattedAddress: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Provider taxonomy term, e.g. Google's `primaryType`. */
  primaryType: string | null;
  types: string[];
  websiteUrl: string | null;
  phone: string | null;
  /**
   * Operational state where the provider exposes it. OSM has no equivalent, so
   * OSM results legitimately carry null here.
   */
  businessStatus: string | null;
  /** Provider-hosted page for this business, when one exists. */
  sourceUrl: string | null;
  /** Google Maps URI. Only ever set by the Google provider. */
  googleMapsUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  discoveredAt: Date;
};

export type DiscoveryCriteria = {
  campaignId: string;
  country: string;
  regions: string[];
  cities: string[];
  industries: string[];
  businessTypes: string[];
  keywords: string[];
  language: string;
  maxResults: number;
};

/**
 * Why a provider call failed. The four categories drive whether AUTO mode is
 * allowed to fall back:
 *
 * - `configuration` missing/invalid credential, API not enabled, auth rejected
 * - `quota`        rate or usage limit reached, billing restriction
 * - `temporary`    timeout, upstream 5xx, transient network failure
 * - `programming`  our own malformed request or a code defect
 */
export type DiscoveryFailureCategory = "configuration" | "quota" | "temporary" | "programming";

/**
 * Brand used by `isDiscoveryProviderError`.
 *
 * Whether a provider failure triggers a fallback or fails loudly must not depend
 * on `instanceof`: a duplicated or separately-loaded copy of this module would
 * make a genuine quota error look like an unknown error and silently break
 * automatic failover. A structural brand survives that.
 */
const DISCOVERY_PROVIDER_ERROR = "teChiaDiscoveryProviderError";

export class DiscoveryProviderError extends Error {
  readonly provider: OutreachDiscoveryProvider;
  readonly category: DiscoveryFailureCategory;
  readonly retryable: boolean;
  readonly status: number | null;
  readonly [DISCOVERY_PROVIDER_ERROR] = true as const;

  constructor(input: {
    provider: OutreachDiscoveryProvider;
    category: DiscoveryFailureCategory;
    message: string;
    status?: number | null;
    retryable?: boolean;
  }) {
    super(input.message);
    this.name = "DiscoveryProviderError";
    this.provider = input.provider;
    this.category = input.category;
    this.status = input.status ?? null;
    // A programming error is never retried: repeating a bad request cannot help
    // and would hide our own defect behind a fallback.
    this.retryable = input.retryable ?? input.category === "temporary";
  }
}

/** Structural check, so classification survives a duplicated module instance. */
export function isDiscoveryProviderError(value: unknown): value is DiscoveryProviderError {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>)[DISCOVERY_PROVIDER_ERROR] === true
  );
}

export type BusinessDiscoveryProvider = {
  readonly id: OutreachDiscoveryProvider;
  readonly label: string;
  /** True when the provider can be attempted right now (credential present). */
  isConfigured(): boolean;
  /** Human-readable reason when `isConfigured()` is false. Never contains a key. */
  unavailableReason(): string | null;
  discover(criteria: DiscoveryCriteria): Promise<DiscoveredBusiness[]>;
};

export const DISCOVERY_PROVIDER_MODE_VALUES = DISCOVERY_PROVIDER_MODES satisfies readonly OutreachDiscoveryProviderMode[];

/**
 * Fallback is only ever permitted for a provider's own fault, never for a defect
 * in this application.
 */
export function isFallbackEligible(category: DiscoveryFailureCategory) {
  return category === "configuration" || category === "quota" || category === "temporary";
}
