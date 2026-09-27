import "server-only";

import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { OUTREACH_LIMITS } from "./config";
import { findDuplicate } from "./dedup";
import { recordEvent } from "./events";
import { enqueueJob, OutreachJobError } from "./jobs";
import { clampDailyDiscovery, evaluateDiscoveryAllowance, startOfDayInTimezone } from "./limits";
import { incrementDailyStat, providerStatField } from "./stats";
import { runDiscoveryProviders, type SelectionReason } from "./providers/registry";
import { isDiscoveryProviderError, type DiscoveredBusiness } from "./providers/types";

/**
 * Discovery.
 *
 * Orchestration only. The provider decides where businesses come from, the
 * campaign decides what is allowed, and this function turns normalised results
 * into prospects plus enrichment jobs.
 *
 * Everything downstream of here is provider-agnostic: a business discovered on
 * OpenStreetMap enters exactly the same enrichment, scoring, AI qualification,
 * email generation, approval and sending path as a Google-sourced one.
 *
 * The daily discovery limit stays global across providers. The allowance is
 * computed from prospects already created today, so a fallback run can only ever
 * use the remaining budget and can never double the campaign's allowance.
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

export function isExcludedPlace(
  business: Pick<DiscoveredBusiness, "name" | "formattedAddress" | "primaryType" | "types" | "businessStatus">,
  campaign: CampaignDiscoveryConfig
) {
  const haystack = normalize(
    [business.name, business.formattedAddress, business.primaryType, business.types.join(" ")].filter(Boolean).join(" ")
  );

  for (const term of campaign.excludedIndustries) {
    const needle = normalize(term);
    if (needle && haystack.includes(needle)) return { excluded: true, reason: `Excluded industry term "${term}"` };
  }
  for (const keyword of campaign.excludedKeywords) {
    const needle = normalize(keyword);
    if (needle && haystack.includes(needle)) return { excluded: true, reason: `Excluded keyword "${keyword}"` };
  }
  // A provider that does not publish an operational state leaves this null, and
  // a null is never treated as closed.
  if (business.businessStatus && !OPERATIONAL_STATUSES.has(business.businessStatus)) {
    return { excluded: true, reason: `Business status is ${business.businessStatus}` };
  }
  return { excluded: false, reason: null as string | null };
}

export type DiscoveryOutcome = {
  campaignId: string;
  query: string | null;
  provider: string | null;
  providerMode: string;
  selectionReason: SelectionReason | null;
  fallbackFrom: string | null;
  fallbackReason: string | null;
  fetched: number;
  created: number;
  duplicates: number;
  possibleDuplicates: number;
  excluded: number;
  enrichmentQueued: number;
  skipped: string | null;
  error: string | null;
};

export async function runDiscovery(campaignId: string, now = new Date()): Promise<DiscoveryOutcome> {
  const prisma = getPrisma();
  const empty: DiscoveryOutcome = {
    campaignId,
    query: null,
    provider: null,
    providerMode: "AUTO",
    selectionReason: null,
    fallbackFrom: null,
    fallbackReason: null,
    fetched: 0,
    created: 0,
    duplicates: 0,
    possibleDuplicates: 0,
    excluded: 0,
    enrichmentQueued: 0,
    skipped: "database_unavailable",
    error: null,
  };
  if (!prisma) return empty;

  const campaign = await prisma.outreachCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return { ...empty, skipped: "campaign_not_found" };

  // The daily allowance is measured against the campaign's own calendar day, not
  // UTC, so a campaign's budget lines up with its own local day.
  const dayStart = startOfDayInTimezone(now, campaign.timezone);

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
    return { ...empty, providerMode: campaign.discoveryProviderMode, skipped: allowance.code };
  }

  const cap = clampDailyDiscovery(campaign.dailyDiscoveryLimit);
  // Remaining budget is recomputed from what has already been stored, so it is
  // shared by every provider for the day rather than granted per provider.
  const remaining = Math.max(0, cap - discoveredToday);
  const query = buildDiscoveryQuery(campaign);

  const outcome: DiscoveryOutcome = {
    ...empty,
    query: query.text,
    providerMode: campaign.discoveryProviderMode,
    skipped: null,
  };

  let businesses: DiscoveredBusiness[];
  let selectedProvider: string | null = null;
  let selectionReason: SelectionReason | null = null;
  let fallbackFrom: string | null = null;
  let fallbackReason: string | null = null;

  try {
    const result = await runDiscoveryProviders({
      mode: campaign.discoveryProviderMode,
      campaignId,
      now,
      criteria: {
        campaignId,
        country: campaign.country,
        regions: campaign.regions,
        cities: campaign.cities,
        industries: campaign.industries,
        businessTypes: campaign.businessTypes,
        keywords: campaign.excludedKeywords,
        language: "en",
        // Ask for the remaining budget so the provider never returns far more
        // candidates than the campaign is allowed to accept.
        maxResults: Math.max(1, remaining),
      },
    });

    businesses = result.businesses;
    selectedProvider = result.provider;
    selectionReason = result.reason;
    if (result.fallback) {
      fallbackFrom = result.fallback.from;
      fallbackReason = `${result.fallback.category}: ${result.fallback.message}`;
    }

    if (result.skipped) {
      // Recorded for the admin, and explicitly marked as an informational skip
      // rather than a job failure.
      console.info("[outreach-discovery] provider_skipped", {
        campaignId,
        provider: result.skipped.provider,
        reason: result.skipped.reason,
      });
    }

    if (result.fallback) {
      await incrementDailyStat(campaignId, "discoveryFallbacks", 1, now);
      await recordEvent({
        type: "DISCOVERY_PROVIDER_FALLBACK",
        campaignId,
        summary: `${result.fallback.from} unavailable, using ${result.fallback.to}`,
        metadata: {
          primaryProvider: result.fallback.from,
          fallbackProvider: result.fallback.to,
          reasonCategory: result.fallback.category,
          // The message is our own classification text, never a provider body,
          // so no key or request header can appear here.
          reason: result.fallback.message.slice(0, 200),
          timestamp: now.toISOString(),
        },
      });
    }
  } catch (error) {
    // A programming error is intentionally not swallowed: the job fails so it is
    // visible instead of being hidden behind a fallback.
    const message = getErrorMessage(error);
    console.error("[outreach-discovery] provider_error", {
      campaignId,
      providerMode: campaign.discoveryProviderMode,
      error: message,
    });
    if (isDiscoveryProviderError(error)) {
      throw new OutreachJobError(`${error.provider} discovery failed: ${message}`, {
        category: `provider_${error.category}`,
        retryable: false,
      });
    }
    throw new OutreachJobError(`Discovery failed: ${message}`, { category: "discovery" });
  }

  // A pinned provider that could not run leaves nothing to process.
  if (!selectedProvider) {
    return {
      ...outcome,
      selectionReason,
      fetched: 0,
      skipped: "provider_unavailable",
      error: "The selected discovery provider is unavailable.",
    };
  }

  outcome.provider = selectedProvider;
  outcome.selectionReason = selectionReason;
  outcome.fallbackFrom = fallbackFrom;
  outcome.fallbackReason = fallbackReason;
  outcome.fetched = businesses.length;

  let createdThisRun = 0;

  for (const business of businesses) {
    // The global daily budget is enforced again here, and counted from the same
    // pool the provider was given, so no retry or fallback can exceed it.
    if (createdThisRun >= remaining) break;

    const exclusion = isExcludedPlace(business, campaign);
    if (exclusion.excluded) {
      outcome.excluded += 1;
      continue;
    }

    const verdict = await findDuplicate(prisma, campaignId, business);
    if (verdict.status === "duplicate") {
      outcome.duplicates += 1;
      continue;
    }

    const prospect = await prisma.outreachProspect
      .create({
        data: {
          campaignId,
          status: "DISCOVERED",
          businessName: business.name.slice(0, 200),
          country: business.country ?? campaign.country,
          region: business.region,
          city: business.city,
          industry: business.primaryType ?? campaign.industries[0] ?? null,
          websiteUrl: business.websiteUrl,
          // Provider-agnostic provenance.
          discoveryProvider: business.provider,
          providerPlaceId: business.providerPlaceId,
          sourceUrl: business.sourceUrl,
          latitude: business.latitude,
          longitude: business.longitude,
          possibleDuplicateOfId: verdict.status === "possible_duplicate" ? verdict.matchedId : null,
          // Google keeps its own identifiers so the existing Google enrichment
          // path continues to work exactly as before.
          googlePlaceId: business.provider === "GOOGLE_PLACES" ? business.providerPlaceId : null,
          googleMapsUri: business.googleMapsUrl,
          publicPhone: business.phone,
          source: business.provider === "GOOGLE_PLACES" ? "google_places" : "openstreetmap",
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

    createdThisRun += 1;
    outcome.created += 1;
    if (verdict.status === "possible_duplicate") outcome.possibleDuplicates += 1;

    // Volume is attributed to the provider that actually produced the prospect.
    await incrementDailyStat(campaignId, providerStatField(business.provider), 1, now);

    await recordEvent({
      type: "DISCOVERED",
      campaignId,
      prospectId: prospect.id,
      summary: business.name.slice(0, 160),
      metadata: {
        provider: business.provider,
        providerPlaceId: business.providerPlaceId,
        primaryType: business.primaryType,
        selectionReason,
        duplicateSignal: verdict.status === "possible_duplicate" ? verdict.signal : null,
      },
    });

    await enqueueJob({
      type: "ENRICH",
      campaignId,
      prospectId: prospect.id,
      dedupeKey: `ENRICH:${campaignId}:${prospect.id}:${Math.floor(now.getTime() / 86_400_000)}`,
      payload: { reason: "discovery", provider: business.provider },
    });
    outcome.enrichmentQueued += 1;
  }

  console.info("[outreach-discovery] run_complete", {
    campaignId,
    provider: selectedProvider,
    providerMode: campaign.discoveryProviderMode,
    selectionReason,
    fallbackFrom,
    fetched: outcome.fetched,
    created: outcome.created,
    duplicates: outcome.duplicates,
    possibleDuplicates: outcome.possibleDuplicates,
    excluded: outcome.excluded,
    budget: { cap: Math.min(OUTREACH_LIMITS.maxDailyDiscovery, cap), used: discoveredToday + createdThisRun },
  });

  return outcome;
}
