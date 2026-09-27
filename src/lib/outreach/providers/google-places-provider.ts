import "server-only";

import type { OutreachDiscoveryProvider } from "@prisma/client";
import { getGooglePlacesApiKey, isGooglePlacesConfigured } from "@/lib/outreach/config";
import { GooglePlacesError, searchPlaces, type NormalizedPlace } from "@/lib/outreach/google-places";
import {
  DiscoveryProviderError,
  type BusinessDiscoveryProvider,
  type DiscoveredBusiness,
  type DiscoveryCriteria,
  type DiscoveryFailureCategory,
} from "./types";

/**
 * Google Places API (New) — the primary discovery provider.
 *
 * This is a thin adapter. `searchPlaces` and its explicit field masks in
 * `google-places.ts` are unchanged, so the existing Google behaviour, quota
 * handling and key handling are all preserved exactly. The only new work here is
 * translating Google's vocabulary into the provider-neutral contract and
 * classifying failures so AUTO mode knows whether falling back is appropriate.
 */

const PROVIDER: OutreachDiscoveryProvider = "GOOGLE_PLACES";

/**
 * Map a Google failure onto a provider-neutral category.
 *
 * `http_error` carries the upstream status, so 5xx is separated from the 4xx
 * cases that indicate a credential problem. Google's own error body is never
 * propagated: it can echo the key.
 */
export function classifyGoogleFailure(error: unknown): DiscoveryFailureCategory {
  if (!(error instanceof GooglePlacesError)) return "programming";

  switch (error.category) {
    case "not_configured":
      return "configuration";
    case "permission":
      // 403 covers an invalid key, an API that is not enabled, and a key that is
      // not authorised for the Places API. All are configuration faults.
      return "configuration";
    case "quota":
      return "quota";
    case "timeout":
      return "temporary";
    case "malformed_response":
      // Google answered with something we cannot parse. Treated as temporary
      // because a single bad response is usually transient.
      return "temporary";
    case "http_error":
      if (error.status !== null && error.status >= 500) return "temporary";
      if (error.status === 429) return "quota";
      if (error.status !== null && error.status >= 400) return "configuration";
      return "temporary";
    default:
      return "programming";
  }
}

function toDiscoveredBusiness(place: NormalizedPlace): DiscoveredBusiness {
  return {
    provider: PROVIDER,
    providerPlaceId: place.placeId,
    name: place.displayName,
    formattedAddress: place.formattedAddress,
    city: place.city,
    region: place.region,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude,
    primaryType: place.primaryType,
    types: place.types,
    websiteUrl: place.websiteUri,
    phone: place.phone,
    businessStatus: place.businessStatus,
    sourceUrl: place.googleMapsUri,
    googleMapsUrl: place.googleMapsUri,
    rating: place.rating,
    reviewCount: place.userRatingCount,
    discoveredAt: new Date(),
  };
}

function buildTextQuery(criteria: DiscoveryCriteria) {
  const industry = criteria.industries[0] ?? "";
  const businessType = criteria.businessTypes[0] ?? "";
  const area = criteria.cities[0] ?? criteria.regions[0] ?? criteria.country;
  const subject = [industry, businessType].filter(Boolean).join(" ") || "small business";
  return (area ? `${subject} in ${area}, ${criteria.country}` : `${subject} in ${criteria.country}`).slice(0, 500);
}

export const googlePlacesDiscoveryProvider: BusinessDiscoveryProvider = {
  id: PROVIDER,
  label: "Google Places",

  isConfigured: isGooglePlacesConfigured,

  unavailableReason() {
    if (isGooglePlacesConfigured()) return null;
    const key = getGooglePlacesApiKey();
    if (!key) return "GOOGLE_MAPS_PLATFORM_API_KEY is not set.";
    return "GOOGLE_MAPS_PLATFORM_API_KEY does not look like a valid Google API key.";
  },

  async discover(criteria: DiscoveryCriteria): Promise<DiscoveredBusiness[]> {
    const result = await searchPlaces({
      text: buildTextQuery(criteria),
      regionCode: null,
      languageCode: criteria.language || "en",
    }).catch((error: unknown) => {
      throw new DiscoveryProviderError({
        provider: PROVIDER,
        category: classifyGoogleFailure(error),
        message: error instanceof Error ? error.message : "Google Places request failed.",
        status: error instanceof GooglePlacesError ? error.status : null,
      });
    });

    return result.places
      .map((place) => toDiscoveredBusiness(place))
      .filter((business) => business.name.length > 0);
  },
};
