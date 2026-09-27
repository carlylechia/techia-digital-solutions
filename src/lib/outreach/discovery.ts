import "server-only";

import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { OUTREACH_LIMITS } from "./config";
import { recordEvent } from "./events";
import { searchPlaces, type NormalizedPlace } from "./google-places";
import { enqueueJob, OutreachJobError } from "./jobs";
import { clampDailyDiscovery, evaluateDiscoveryAllowance } from "./limits";
import { startOfUtcDay } from "./stats";

/**
 * Discovery.
 *
 * Builds one targeted query from the campaign configuration, calls the official
 * Places Text Search endpoint with a narrow field mask, and turns the result into
 * prospects. Deduplication is on the Google place ID, so a business is never
 * rediscovered while it remains in the campaign.
 */

type CampaignDiscoveryConfig = {
  id: string;
  country: string;
  regions: string[];
  cities: string[];
  industries: string[];
  businessTypes: string[];
  excludedIndustries: string[];
  excludedKeywords: string[];
  dailyDiscoveryLimit: number;
  mode: "MANUAL" | "SEMI_AUTOMATIC" | "AUTOMATIC";
  status: string;
  timezone: string;
};

const OPERATIONAL_STATUSES = new Set(["OPERATIONAL"]);

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function buildDiscoveryQuery(campaign: CampaignDiscoveryConfig) {
  const industry = campaign.industries[0] ?? "";
  const businessType = campaign.businessTypes[0] ?? "";
  const area = campaign.cities[0] ?? campaign.regions[0] ?? campaign.country;

  const subject = [industry, businessType].filter(Boolean).join(" ") || "small business";
  const query = area ? `${subject} in ${area}, ${campaign.country}` : `${subject} in ${campaign.country}`;

  return {
    text: query.slice(0, 500),
    area: area ?? campaign.country,
    industry: industry || null,
  };
}

export function isExcludedPlace(place: NormalizedPlace, campaign: CampaignDiscoveryConfig) {
  const haystack = normalize(
    [place.displayName, place.formattedAddress, place.primaryType, place.types.join(" ")].filter(Boolean).join(" ")
  );

  for (const term of campaign.excludedIndustries) {
    const needle = normalize(term);
    if (needle && haystack.includes(needle)) return { excluded: true, reason: `Excluded industry term "${term}"` };
  }
  for (const keyword of campaign.excludedKeywords) {
    const needle = normalize(keyword);
    if (needle && haystack.includes(needle)) return { excluded: true, reason: `Excluded keyword "${keyword}"` };
  }
  if (place.businessStatus && !OPERATIONAL_STATUSES.has(place.businessStatus)) {
    return { excluded: true, reason: `Business status is ${place.businessStatus}` };
  }
  return { excluded: false, reason: null as string | null };
}

export type DiscoveryOutcome = {
  campaignId: string;
  query: string | null;
  fetched: number;
  created: number;
  duplicates: number;
  excluded: number;
  enrichmentQueued: number;
  skipped: string | null;
};

export async function runDiscovery(campaignId: string, now = new Date()): Promise<DiscoveryOutcome> {
  const prisma = getPrisma();
  const empty: DiscoveryOutcome = {
    campaignId,
    query: null,
    fetched: 0,
    created: 0,
    duplicates: 0,
    excluded: 0,
    enrichmentQueued: 0,
    skipped: "database_unavailable",
  };
  if (!prisma) return empty;

  const campaign = await prisma.outreachCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return { ...empty, skipped: "campaign_not_found" };

  const dayStart = startOfUtcDay(now);

  const [discoveredToday, runsToday] = await Promise.all([
    prisma.outreachProspect.count({ where: { campaignId, discoveredAt: { gte: dayStart } } }),
    prisma.outreachJob.count({
      where: { campaignId, type: "DISCOVER", status: "COMPLETED", createdAt: { gte: dayStart } },
    }),
  ]);

  const allowance = evaluateDiscoveryAllowance(
    {
      status: campaign.status,
      mode: campaign.mode,
      requireApproval: campaign.requireApproval,
      dailyDiscoveryLimit: campaign.dailyDiscoveryLimit,
      dailySendLimit: campaign.dailySendLimit,
      dailyAiAssessLimit: campaign.dailyAiAssessLimit,
      minOpportunityScore: campaign.minOpportunityScore,
      followUpEnabled: campaign.followUpEnabled,
      maxFollowUps: campaign.maxFollowUps,
      sendingWindowStart: campaign.sendingWindowStart,
      sendingWindowEnd: campaign.sendingWindowEnd,
      timezone: campaign.timezone,
    },
    { discoveredToday, qualifiedToday: 0, sentToday: 0 },
    runsToday
  );
  if (!allowance.allowed) {
    return { ...empty, skipped: allowance.code };
  }

  const cap = clampDailyDiscovery(campaign.dailyDiscoveryLimit);
  const remaining = Math.max(0, cap - discoveredToday);
  const query = buildDiscoveryQuery(campaign);

  let places: NormalizedPlace[];
  try {
    const result = await searchPlaces({
      text: query.text,
      regionCode: null,
      languageCode: "en",
    });
    places = result.places;
  } catch (error) {
    const category = error instanceof Error && "category" in error ? String((error as { category: unknown }).category) : "unknown";
    console.error("[outreach-discovery] places_failed", { campaignId, category, error: getErrorMessage(error) });
    throw new OutreachJobError(`Google Places discovery failed: ${getErrorMessage(error)}`, { category: "google_places" });
  }

  const outcome: DiscoveryOutcome = { campaignId, query: query.text, fetched: places.length, created: 0, duplicates: 0, excluded: 0, enrichmentQueued: 0, skipped: null };

  for (const place of places) {
    if (outcome.created >= remaining) break;

    const exclusion = isExcludedPlace(place, campaign);
    if (exclusion.excluded) {
      outcome.excluded += 1;
      continue;
    }

    const existing = await prisma.outreachProspect.findFirst({
      where: { campaignId, googlePlaceId: place.placeId },
      select: { id: true },
    });
    if (existing) {
      outcome.duplicates += 1;
      continue;
    }

    // The place ID is the deduplication key, so a concurrent discovery run
    // cannot create a second copy of the same business.
    const prospect = await prisma.outreachProspect
      .create({
        data: {
          campaignId,
          status: "DISCOVERED",
          businessName: place.displayName.slice(0, 200),
          country: place.country ?? campaign.country,
          region: place.region,
          city: place.city,
          industry: place.primaryType ?? campaign.industries[0] ?? null,
          websiteUrl: place.websiteUri,
          googlePlaceId: place.placeId,
          googleMapsUri: place.googleMapsUri,
          source: "google_places",
          discoveredAt: now,
        },
        select: { id: true },
      })
      .catch(async (error) => {
        const message = getErrorMessage(error).toLowerCase();
        if (message.includes("unique") || message.includes("duplicate")) {
          outcome.duplicates += 1;
          return null;
        }
        console.error("[outreach-discovery] prospect_create_failed", { campaignId, error: getErrorMessage(error) });
        return null;
      });

    if (!prospect) continue;

    outcome.created += 1;
    await recordEvent({
      type: "DISCOVERED",
      campaignId,
      prospectId: prospect.id,
      summary: place.displayName.slice(0, 160),
      metadata: { source: "google_places", placeId: place.placeId, primaryType: place.primaryType },
    });

    await enqueueJob({
      type: "ENRICH",
      campaignId,
      prospectId: prospect.id,
      dedupeKey: `ENRICH:${campaignId}:${prospect.id}:${Math.floor(now.getTime() / 86_400_000)}`,
      payload: { reason: "discovery" },
    });
    outcome.enrichmentQueued += 1;
  }

  console.info("[outreach-discovery] run_complete", {
    campaignId,
    fetched: outcome.fetched,
    created: outcome.created,
    duplicates: outcome.duplicates,
    excluded: outcome.excluded,
    cap: Math.min(OUTREACH_LIMITS.maxDailyDiscovery, cap),
  });

  return outcome;
}
