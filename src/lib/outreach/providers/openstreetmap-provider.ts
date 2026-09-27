import "server-only";

import type { OutreachDiscoveryProvider } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { OUTREACH_OSM } from "@/lib/outreach/config";
import { DiscoveryProviderError, isDiscoveryProviderError, type BusinessDiscoveryProvider, type DiscoveredBusiness, type DiscoveryCriteria } from "./types";

/**
 * OpenStreetMap / Overpass — the credential-free fallback discovery provider.
 *
 * Uses the documented Overpass QL API. It does not scrape openstreetmap.org and
 * holds no scraping logic of any kind.
 *
 * OSM coverage is uneven, especially for small businesses in some markets. This
 * provider is therefore treated as an additional source of candidates, never as
 * a promise that a search returned "all" businesses in an area.
 */

const PROVIDER: OutreachDiscoveryProvider = "OPENSTREETMAP";

/**
 * Campaign industry terms mapped onto the OpenStreetMap tag namespaces that
 * actually carry business features. Only tags that exist are used; an industry
 * with no mapping simply contributes no OSM query, which is preferable to
 * guessing at a tag that does not exist.
 */
const INDUSTRY_TAGS: Record<string, string[]> = {
  restaurant: ["amenity=restaurant", "amenity=fast_food", "amenity=cafe", "amenity=bar"],
  restaurants: ["amenity=restaurant", "amenity=fast_food", "amenity=cafe", "amenity=bar"],
  cafe: ["amenity=cafe"],
  bakery: ["shop=bakery"],
  bar: ["amenity=bar"],
  hotel: ["tourism=hotel", "tourism=guest_house"],
  lodging: ["tourism=hotel", "tourism=guest_house"],
  beauty: ["shop=hairdresser", "shop=beauty", "shop=cosmetics"],
  hairdresser: ["shop=hairdresser"],
  salon: ["shop=hairdresser", "shop=beauty"],
  clinic: ["amenity=clinic", "amenity=doctors", "healthcare=clinic"],
  doctor: ["amenity=doctors", "healthcare=doctor"],
  dentist: ["amenity=dentist", "healthcare=dentist"],
  pharmacy: ["amenity=pharmacy"],
  gym: ["leisure=fitness_centre", "leisure=sports_centre"],
  fitness: ["leisure=fitness_centre"],
  school: ["amenity=school", "amenity=kindergarten"],
  education: ["amenity=school", "amenity=college", "amenity=university"],
  training: ["amenity=school", "amenity=college"],
  real_estate: ["office=estate_agent"],
  "real estate": ["office=estate_agent"],
  lawyer: ["office=lawyer"],
  accountant: ["office=accountant"],
  consulting: ["office=consultancy"],
  it: ["office=it"],
  "it services": ["office=it"],
  agency: ["office=agency"],
  design: ["office=design"],
  accounting: ["office=accountant"],
  retail: ["shop"],
  shop: ["shop"],
  store: ["shop"],
  boutique: ["shop=clothes", "shop=boutique"],
  clothes: ["shop=clothes"],
  supermarket: ["shop=supermarket", "shop=grocery"],
  grocery: ["shop=supermarket", "shop=grocery", "shop=convenience"],
  hardware: ["shop=hardware", "shop=doityourself"],
  furniture: ["shop=furniture"],
  electronics: ["shop=electronics"],
  mobile_phone: ["shop=mobile_phone"],
  car_repair: ["shop=car_repair"],
  automotive: ["shop=car_repair", "shop=car"],
  transport: ["amenity=taxi", "shop=car_repair"],
  logistics: ["office=logistics"],
  manufacturing: ["craft=*", "industrial=*"],
  construction: ["craft=*", "office=construction"],
  printing: ["craft=printer", "shop=print_shop"],
  photography: ["craft=photographer", "shop=photo"],
  florist: ["shop=florist"],
  laundry: ["shop=laundry", "shop=dry_cleaning"],
  coworking: ["office=coworking"],
};

/** Broad catch-all tags used only when the campaign names no recognised industry. */
const GENERIC_TAGS = ["amenity", "shop", "office", "craft", "tourism", "healthcare", "leisure"];

function tagsFor(criteria: DiscoveryCriteria) {
  const terms = [...criteria.industries, ...criteria.businessTypes]
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);

  const tags = new Set<string>();
  for (const term of terms) {
    const mapped = INDUSTRY_TAGS[term];
    if (mapped) for (const tag of mapped) tags.add(tag);
  }

  // A "shop" style mapping with no value means the whole namespace.
  if (tags.size === 0) for (const tag of GENERIC_TAGS) tags.add(tag);
  return [...tags].slice(0, 6);
}

/**
 * Rough bounding box for a named place. Overpass needs a geometry, and geocoding a
 * city name is exactly what we must not do by scraping. Nominatim is used through
 * its documented API, with a bounded budget, purely to convert a campaign city
 * into a box.
 */
async function boundingBoxFor(criteria: DiscoveryCriteria): Promise<{ south: number; west: number; north: number; east: number } | null> {
  const place = criteria.cities[0] ?? criteria.regions[0];
  if (!place) return null;

  const url = new URL(OUTREACH_OSM.geocodingUrl);
  url.searchParams.set("q", `${place}, ${criteria.country}`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: { "User-Agent": OUTREACH_OSM.userAgent, Accept: "application/json" },
    signal: AbortSignal.timeout(OUTREACH_OSM.timeoutMs),
    cache: "no-store",
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as Array<{ boundingbox?: [string, string, string, string] }>;
  const box = payload?.[0]?.boundingbox;
  if (!Array.isArray(box) || box.length !== 4) return null;

  const south = Number(box[0]);
  const north = Number(box[1]);
  const west = Number(box[2]);
  const east = Number(box[3]);
  if (![south, north, west, east].every((value) => Number.isFinite(value))) return null;
  return { south, west, north, east };
}

function buildQuery(tags: string[], box: { south: number; west: number; north: number; east: number }, limit: number) {
  const selector = tags.map((tag) => `nwr[${tag}](${box.south},${box.west},${box.north},${box.east});`).join("\n  ");
  return `[out:json][timeout:${Math.ceil(OUTREACH_OSM.timeoutMs / 1000)}];\n(\n  ${selector}\n);\nout center ${limit};`;
}

function normalizeTagValue(value: string | undefined) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 200) : null;
}

function osmLink(type: string, id: number) {
  return `https://www.openstreetmap.org/${type}/${id}`;
}

function toDiscoveredBusiness(element: Record<string, unknown>, tags: Record<string, string>): DiscoveredBusiness | null {
  const id = element.id;
  if (typeof id !== "number") return null;

  const name = normalizeTagValue(tags.name) ?? normalizeTagValue(tags["name:en"]) ?? normalizeTagValue(tags.brand);
  if (!name) return null;

  const centre =
    element.center && typeof element.center === "object"
      ? (element.center as Record<string, unknown>)
      : element;
  const latitude = typeof centre.lat === "number" ? centre.lat : typeof element.lat === "number" ? element.lat : null;
  const longitude = typeof centre.lon === "number" ? centre.lon : typeof element.lon === "number" ? element.lon : null;

  const type = typeof element.type === "string" ? element.type : "node";
  const primaryType = normalizeTagValue(tags.amenity) ?? normalizeTagValue(tags.shop) ?? normalizeTagValue(tags.office) ?? normalizeTagValue(tags.craft) ?? normalizeTagValue(tags.tourism) ?? normalizeTagValue(tags.healthcare) ?? normalizeTagValue(tags.leisure);

  const allTypes = Object.entries(tags)
    .filter(([key]) => ["amenity", "shop", "office", "craft", "tourism", "healthcare", "leisure", "industrial"].includes(key))
    .map(([key, value]) => `${key}=${value}`);

  return {
    provider: PROVIDER,
    providerPlaceId: `${type}/${id}`,
    name,
    formattedAddress: normalizeTagValue(tags["addr:full"]) ?? normalizeTagValue(tags["addr:street"]) ?? null,
    city: normalizeTagValue(tags["addr:city"]) ?? normalizeTagValue(tags["addr:town"]) ?? normalizeTagValue(tags["addr:suburb"]),
    region: normalizeTagValue(tags["addr:state"]) ?? normalizeTagValue(tags["addr:province"]),
    country: normalizeTagValue(tags["addr:country"]) ?? null,
    latitude,
    longitude,
    primaryType,
    types: allTypes.slice(0, 20),
    websiteUrl: normalizeTagValue(tags.website) ?? normalizeTagValue(tags["contact:website"]),
    phone: normalizeTagValue(tags.phone) ?? normalizeTagValue(tags["contact:phone"]),
    // OSM has no equivalent of Google's businessStatus. It stays unknown rather
    // than being asserted, and the scoring layer already treats null as "no data".
    businessStatus: null,
    sourceUrl: osmLink(type, id),
    // Never fabricate a Google Maps URL for an OSM result.
    googleMapsUrl: null,
    rating: null,
    reviewCount: null,
    discoveredAt: new Date(),
  };
}

export const openStreetMapDiscoveryProvider: BusinessDiscoveryProvider = {
  id: PROVIDER,
  label: "OpenStreetMap",

  isConfigured: () => true,

  unavailableReason: () => null,

  async discover(criteria: DiscoveryCriteria): Promise<DiscoveredBusiness[]> {
    const limit = Math.max(1, Math.min(OUTREACH_OSM.maxResultsPerQuery, criteria.maxResults));
    const box = await boundingBoxFor(criteria);
    if (!box) {
      // No usable geometry means no query, not a failure: the campaign simply
      // names no area Overpass can search.
      return [];
    }

    const body = buildQuery(tagsFor(criteria), box, limit);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OUTREACH_OSM.timeoutMs);

    try {
      const response = await fetch(OUTREACH_OSM.overpassUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": OUTREACH_OSM.userAgent, Accept: "application/json" },
        body: `data=${encodeURIComponent(body)}`,
        signal: controller.signal,
        cache: "no-store",
      });

      if (response.status === 429 || response.status === 504) {
        throw new DiscoveryProviderError({
          provider: PROVIDER,
          category: "quota",
          message: "The OpenStreetMap fallback is rate limited. Try again later.",
          status: response.status,
          retryable: false,
        });
      }
      if (response.status >= 500) {
        throw new DiscoveryProviderError({
          provider: PROVIDER,
          category: "temporary",
          message: "The OpenStreetMap fallback is temporarily unavailable.",
          status: response.status,
        });
      }
      if (!response.ok) {
        throw new DiscoveryProviderError({
          provider: PROVIDER,
          category: "configuration",
          message: `The OpenStreetMap fallback rejected the request (HTTP ${response.status}).`,
          status: response.status,
          retryable: false,
        });
      }

      // The response is bounded before parsing so a hostile or oversized body
      // cannot exhaust memory.
      const text = (await response.text()).slice(0, OUTREACH_OSM.maxResponseBytes);
      const payload = JSON.parse(text) as { elements?: Array<Record<string, unknown>> };
      const elements = Array.isArray(payload.elements) ? payload.elements : [];

      const seen = new Set<string>();
      const businesses: DiscoveredBusiness[] = [];
      for (const element of elements) {
        const business = toDiscoveredBusiness(element, (element.tags ?? {}) as Record<string, string>);
        if (!business) continue;
        if (seen.has(business.providerPlaceId)) continue;
        seen.add(business.providerPlaceId);
        businesses.push(business);
        if (businesses.length >= limit) break;
      }
      return businesses;
    } catch (error) {
      if (isDiscoveryProviderError(error)) throw error;
      if (error instanceof SyntaxError) {
        throw new DiscoveryProviderError({
          provider: PROVIDER,
          category: "temporary",
          message: "The OpenStreetMap fallback returned an unreadable response.",
          retryable: true,
        });
      }
      const message = getErrorMessage(error);
      const timedOut = /abort|timeout/i.test(message);
      throw new DiscoveryProviderError({
        provider: PROVIDER,
        category: timedOut ? "temporary" : "programming",
        message: timedOut ? "The OpenStreetMap fallback timed out." : `OpenStreetMap fallback failed: ${message}`,
        retryable: timedOut,
      });
    } finally {
      clearTimeout(timer);
    }
  },
};

/** Exposed for the admin health panel and for tests. */
export async function isOverpassReachable() {
  const prisma = getPrisma();
  void prisma;
  try {
    const response = await fetch(OUTREACH_OSM.overpassUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": OUTREACH_OSM.userAgent },
      body: "data=%5Bout%3Ajson%5D%3Bout%20count%3B",
      signal: AbortSignal.timeout(OUTREACH_OSM.healthTimeoutMs),
      cache: "no-store",
    });
    return { reachable: response.ok, status: response.status };
  } catch (error) {
    return { reachable: false, status: null, error: getErrorMessage(error) };
  }
}
