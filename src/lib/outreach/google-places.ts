import "server-only";

import { OUTREACH_LIMITS, OUTREACH_TIMEBOX, getGooglePlacesApiKey } from "./config";

/**
 * Google Places API (New) — server-side only.
 *
 * Rules enforced here:
 *   - official endpoints only (no Google Maps HTML, no undocumented endpoints)
 *   - explicit field masks on every request; the API key is never sent to a
 *     field mask wildcard
 *   - discovery fetches only the minimum identifying data
 *   - enrichment fetches website/phone only, and only for prospects that
 *     survived the initial filter
 *   - no Places content is cached permanently: the key is stored, the payload
 *     is not
 */

const PLACES_BASE = "https://places.googleapis.com/v1";

/** Minimum discovery mask. No reviews, no photos, no reviews-derived content. */
export const DISCOVERY_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.businessStatus",
  "places.primaryType",
  "places.types",
  "places.googleMapsUri",
  "places.location",
  "places.rating",
  "places.userRatingCount",
];

/** Enrichment mask. Reviews are deliberately excluded from storage. */
export const ENRICHMENT_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "addressComponents",
  "businessStatus",
  "primaryType",
  "types",
  "googleMapsUri",
  "location",
  "rating",
  "userRatingCount",
  "websiteUri",
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "regularOpeningHours",
  "currentOpeningHours",
];

export class GooglePlacesError extends Error {
  readonly category: "not_configured" | "http_error" | "quota" | "permission" | "malformed_response" | "timeout";
  readonly status: number | null;

  constructor(category: GooglePlacesError["category"], message: string, status: number | null = null) {
    super(message);
    this.name = "GooglePlacesError";
    this.category = category;
    this.status = status;
  }
}

type PlaceAddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

export type NormalizedPlace = {
  placeId: string;
  displayName: string;
  formattedAddress: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  primaryType: string | null;
  types: string[];
  googleMapsUri: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  userRatingCount: number | null;
  businessStatus: string | null;
  websiteUri: string | null;
  phone: string | null;
};

function componentValue(components: PlaceAddressComponent[], type: string) {
  const match = components.find((component) => component.types?.includes(type));
  return match?.longText ?? match?.shortText ?? null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").slice(0, 40);
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizePlace(raw: unknown): NormalizedPlace | null {
  if (!raw || typeof raw !== "object") return null;
  const place = raw as Record<string, unknown>;
  const placeId = typeof place.id === "string" ? place.id : null;
  if (!placeId) return null;

  const displayName =
    typeof place.displayName === "object" && place.displayName !== null
      ? (place.displayName as Record<string, unknown>).text
      : null;

  const components = Array.isArray(place.addressComponents) ? (place.addressComponents as PlaceAddressComponent[]) : [];
  const location = (place.location ?? null) as Record<string, unknown> | null;

  return {
    placeId,
    displayName: typeof displayName === "string" && displayName.trim() ? displayName.trim().slice(0, 200) : "",
    formattedAddress: typeof place.formattedAddress === "string" ? place.formattedAddress.slice(0, 300) : null,
    country: componentValue(components, "country"),
    region: componentValue(components, "administrative_area_level_1"),
    city: componentValue(components, "locality") ?? componentValue(components, "postal_town") ?? componentValue(components, "administrative_area_level_2"),
    primaryType: typeof place.primaryType === "string" ? place.primaryType : null,
    types: asStringArray(place.types),
    googleMapsUri: typeof place.googleMapsUri === "string" ? place.googleMapsUri.slice(0, 500) : null,
    latitude: asNumber(location?.latitude),
    longitude: asNumber(location?.longitude),
    rating: asNumber(place.rating),
    userRatingCount: asNumber(place.userRatingCount),
    businessStatus: typeof place.businessStatus === "string" ? place.businessStatus : null,
    websiteUri: typeof place.websiteUri === "string" ? place.websiteUri.slice(0, 500) : null,
    phone:
      typeof place.nationalPhoneNumber === "string"
        ? place.nationalPhoneNumber
        : typeof place.internationalPhoneNumber === "string"
          ? place.internationalPhoneNumber
          : null,
  };
}

async function placesRequest(path: string, init: RequestInit, fieldMask: readonly string[]): Promise<unknown> {
  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) {
    throw new GooglePlacesError("not_configured", "GOOGLE_MAPS_PLATFORM_API_KEY is not configured.");
  }
  // An empty mask is rejected locally rather than sent to the provider, so a
  // missing field list can never be interpreted as "return everything".
  if (fieldMask.length === 0) {
    throw new GooglePlacesError("malformed_response", "A Google Places field mask is required.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OUTREACH_TIMEBOX.googlePlacesMs);

  let response: Response;
  try {
    response = await fetch(`${PLACES_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask.join(","),
        ...(init.headers ?? {}),
      },
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new GooglePlacesError("timeout", "Google Places request timed out.");
    }
    const message = error instanceof Error ? error.message : "unknown";
    throw new GooglePlacesError("http_error", `Google Places request failed: ${message}`);
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  if (!response.ok) {
    const category = response.status === 429 ? "quota" : response.status === 403 ? "permission" : "http_error";
    // Never echo the raw provider body: it can contain the request URL and key.
    throw new GooglePlacesError(category, `Google Places returned HTTP ${response.status}.`, response.status);
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new GooglePlacesError("malformed_response", "Google Places returned a non-JSON body.");
  }
}

export type DiscoveryQuery = {
  text: string;
  regionCode: string | null;
  languageCode: string;
};

export type DiscoveryResult = {
  places: NormalizedPlace[];
  nextPageToken: string | null;
};

/**
 * Text Search. Used for discovery only, and it returns a cursor rather than a
 * full crawl so a campaign can never exhaust the API in a single run.
 */
export async function searchPlaces(query: DiscoveryQuery, pageToken?: string): Promise<DiscoveryResult> {
  if (!query.text.trim()) {
    throw new GooglePlacesError("http_error", "Discovery query text is required.");
  }

  const body: Record<string, unknown> = {
    textQuery: query.text.trim().slice(0, 500),
    languageCode: query.languageCode,
    maxResultCount: Math.min(20, OUTREACH_LIMITS.placesPageSize),
  };
  if (query.regionCode) body.regionCode = query.regionCode.slice(0, 10).toUpperCase();
  if (pageToken) body.pageToken = pageToken;

  const payload = (await placesRequest("/places:searchText", { method: "POST", body: JSON.stringify(body) }, DISCOVERY_FIELD_MASK)) as Record<string, unknown>;
  const rawPlaces = Array.isArray(payload.places) ? payload.places : [];
  const places = rawPlaces
    .map(normalizePlace)
    .filter((place): place is NormalizedPlace => place !== null && place.displayName.length > 0);

  return {
    places,
    nextPageToken: typeof payload.nextPageToken === "string" ? payload.nextPageToken : null,
  };
}

/** Place Details with a narrow field mask. Only called for qualified prospects. */
export async function fetchPlaceDetails(placeId: string): Promise<NormalizedPlace | null> {
  const safeId = placeId.trim().slice(0, 200);
  if (!safeId) return null;
  const payload = await placesRequest(`/places/${encodeURIComponent(safeId)}`, { method: "GET" }, ENRICHMENT_FIELD_MASK);
  return normalizePlace(payload);
}
