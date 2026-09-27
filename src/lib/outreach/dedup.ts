import type { PrismaClient } from "@prisma/client";
import { normalizeEmail } from "./limits";
import type { DiscoveredBusiness } from "./providers/types";

/**
 * Cross-provider duplicate prevention.
 *
 * The same business can surface from Google Places and again from OpenStreetMap.
 * Matching therefore uses several independent signals, and the rules are
 * deliberately conservative: a wrong merge is far more damaging than a missed
 * merge, because it sends one business the wrong messages and loses another.
 *
 * Confident match  -> skip creation entirely.
 * Uncertain match  -> create it, but flag it for human review.
 */

/** Roughly a city block. Only used when both records have coordinates. */
const PROXIMITY_METERS = 120;

export type DedupVerdict =
  | { status: "new" }
  | { status: "duplicate"; matchedId: string; signal: string; confidence: "high" }
  | { status: "possible_duplicate"; matchedId: string; signal: string };

function normalizeName(value: string | null | undefined) {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    // Drop legal/decorative suffixes so "Chez Jean SARL" and "Chez Jean" match.
    .replace(/\b(sarl|sarl au|sa|sasu|spa|ltd|limited|llc|inc|gmbh|plc|co|company|entreprise)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function domainOf(value: string | null | undefined) {
  if (!value) return null;
  const email = normalizeEmail(value);
  if (email) return email.split("@")[1] ?? null;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return host || null;
  } catch {
    return null;
  }
}

function digitsOf(value: string | null | undefined) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 ? digits.slice(-9) : null;
}

function haversineMeters(aLat: number, aLon: number, bLat: number, bLon: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Cheap prefilter so we never load the whole campaign into memory. */
function candidateWhere(db: PrismaClient, business: DiscoveredBusiness) {
  const clauses: Record<string, unknown>[] = [{ providerPlaceId: business.providerPlaceId }];
  const domain = domainOf(business.websiteUrl);
  if (domain) clauses.push({ websiteUrl: { contains: domain } });
  const digits = digitsOf(business.phone);
  if (digits) clauses.push({ publicPhone: { contains: digits.slice(-7) } });
  if (business.city) clauses.push({ city: { equals: business.city, mode: "insensitive" } });
  if (business.latitude !== null && business.longitude !== null) {
    clauses.push({ latitude: { gte: business.latitude - 0.01, lte: business.latitude + 0.01 } });
  }
  return { OR: clauses };
}

export async function findDuplicate(
  db: PrismaClient,
  campaignId: string,
  business: DiscoveredBusiness
): Promise<DedupVerdict> {
  const candidates = await db.outreachProspect.findMany({
    where: { campaignId, ...candidateWhere(db, business) },
    select: {
      id: true,
      businessName: true,
      websiteUrl: true,
      publicPhone: true,
      googlePlaceId: true,
      providerPlaceId: true,
      discoveryProvider: true,
      latitude: true,
      longitude: true,
      city: true,
    },
    take: 40,
  });

  const name = normalizeName(business.name);
  const domain = domainOf(business.websiteUrl);
  const digits = digitsOf(business.phone);

  let possible: DedupVerdict = { status: "new" };

  for (const candidate of candidates) {
    // 1. Identical provider identity. Also covers the same provider re-reporting
    //    the same place, which the unique index would catch anyway.
    if (candidate.providerPlaceId && candidate.providerPlaceId === business.providerPlaceId) {
      return { status: "duplicate", matchedId: candidate.id, signal: "provider_id", confidence: "high" };
    }
    if (business.provider === "GOOGLE_PLACES" && candidate.googlePlaceId && candidate.googlePlaceId === business.providerPlaceId) {
      return { status: "duplicate", matchedId: candidate.id, signal: "google_place_id", confidence: "high" };
    }

    // 2. Same business cross-referenced through Google's own ID: an OSM result
    //    that lands on an already-imported Google place is the same business.
    if (business.provider === "OPENSTREETMAP" && candidate.googlePlaceId && candidate.googlePlaceId === business.providerPlaceId) {
      return { status: "duplicate", matchedId: candidate.id, signal: "google_place_id", confidence: "high" };
    }

    const candidateDomain = domainOf(candidate.websiteUrl);
    const candidateDigits = digitsOf(candidate.publicPhone);

    // 3. Identical website domain is a strong identity signal on its own.
    if (domain && candidateDomain && domain === candidateDomain) {
      return { status: "duplicate", matchedId: candidate.id, signal: "website_domain", confidence: "high" };
    }

    const sameName = name.length > 2 && normalizeName(candidate.businessName) === name;
    const near =
      business.latitude !== null &&
      business.longitude !== null &&
      candidate.latitude !== null &&
      candidate.longitude !== null &&
      haversineMeters(business.latitude, business.longitude, candidate.latitude, candidate.longitude) <= PROXIMITY_METERS;

    // 4. Same phone plus a name match: confident.
    if (sameName && digits && candidateDigits && digits === candidateDigits) {
      return { status: "duplicate", matchedId: candidate.id, signal: "name_and_phone", confidence: "high" };
    }
    // 5. Same name plus geographic proximity: confident for a single-site SME.
    if (sameName && near) {
      return { status: "duplicate", matchedId: candidate.id, signal: "name_and_proximity", confidence: "high" };
    }

    // 6. Same name only is genuinely ambiguous. A city can hold several
    //    "Chez Marie" businesses, so this is flagged rather than merged.
    if (sameName) {
      possible = { status: "possible_duplicate", matchedId: candidate.id, signal: "name_only" };
    }
  }

  return possible;
}
