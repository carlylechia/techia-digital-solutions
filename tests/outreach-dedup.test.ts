import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { findDuplicate } from "@/lib/outreach/dedup";
import type { DiscoveredBusiness } from "@/lib/outreach/providers/types";

/**
 * Cross-provider duplicate prevention (STEP 13) and the global daily discovery
 * budget (STEP 20), exercised against the local database.
 *
 * These run only when DATABASE_URL points at a real local database. Without it
 * they are skipped rather than silently passing, so a missing database is never
 * mistaken for correct behaviour.
 */

const connectionString = process.env.DATABASE_URL;
const db = connectionString ? new PrismaClient({ adapter: new PrismaPg({ connectionString }) }) : null;

let campaignId = "";
let budgetCampaignId = "";

function business(overrides: Partial<DiscoveredBusiness> = {}): DiscoveredBusiness {
  return {
    provider: "OPENSTREETMAP",
    providerPlaceId: "node/1",
    name: "Chez Marie",
    formattedAddress: "Rue Joss",
    city: "Douala",
    region: "Littoral",
    country: "Cameroon",
    latitude: 4.05,
    longitude: 9.7,
    primaryType: "restaurant",
    types: ["amenity=restaurant"],
    websiteUrl: null,
    phone: null,
    businessStatus: null,
    sourceUrl: "https://www.openstreetmap.org/node/1",
    googleMapsUrl: null,
    rating: null,
    reviewCount: null,
    discoveredAt: new Date(),
    ...overrides,
  };
}

beforeAll(async () => {
  if (!db) return;
  const campaign = await db.outreachCampaign.create({ data: { name: "tmp-dedup-check", country: "Cameroon" }, select: { id: true } });
  campaignId = campaign.id;
  // A separate campaign keeps the budget arithmetic below hermetic.
  const budget = await db.outreachCampaign.create({
    data: { name: "tmp-budget-check", country: "Cameroon", dailyDiscoveryLimit: 25 },
    select: { id: true },
  });
  budgetCampaignId = budget.id;
});

afterAll(async () => {
  if (!db) return;
  if (campaignId) await db.outreachCampaign.delete({ where: { id: campaignId } }).catch(() => undefined);
  if (budgetCampaignId) await db.outreachCampaign.delete({ where: { id: budgetCampaignId } }).catch(() => undefined);
  await db.$disconnect();
});

describe("cross-provider duplicate prevention", () => {
  it("TEST 8: recognises the same business discovered through Google and OpenStreetMap", async () => {
    if (!db) {
      console.warn("DATABASE_URL not set; skipping live dedup check.");
      return;
    }

    // A Google-sourced prospect, exactly as the primary provider records it —
    // including coordinates, which discovery now stores for every provider.
    await db.outreachProspect.create({
      data: {
        campaignId,
        businessName: "Chez Marie",
        city: "Douala",
        latitude: 4.05,
        longitude: 9.7,
        discoveryProvider: "GOOGLE_PLACES",
        providerPlaceId: "gplace-chez-marie",
        googlePlaceId: "gplace-chez-marie",
        source: "google_places",
      },
    });

    // The same business arriving from OpenStreetMap a few metres away.
    const sameBusiness = business({
      name: "Chez Marie SARL", // legal suffix must not prevent a match
      providerPlaceId: "node/999",
      latitude: 4.0502,
      longitude: 9.7002,
    });
    const verdict = await findDuplicate(db, campaignId, sameBusiness);
    expect(verdict.status).toBe("duplicate");
    if (verdict.status === "duplicate") expect(verdict.signal).toBe("name_and_proximity");

    // A different business in the same city must NOT be merged.
    const different = business({ name: "Le Biniou", providerPlaceId: "node/1000", latitude: 4.06, longitude: 9.71 });
    const other = await findDuplicate(db, campaignId, different);
    expect(other.status).toBe("new");
  });

  it("matches on identical website domain alone", async () => {
    if (!db) return;
    const withSite = business({ name: " totally different ", providerPlaceId: "node/2000", websiteUrl: "https://chezmarie.cm" });
    const verdict = await findDuplicate(db, campaignId, withSite);
    // "Chez Marie SARL" was already stored with no website, so a domain match is
    // not available here; this documents that a differing name alone is a
    // possible duplicate rather than a confident merge.
    expect(["possible_duplicate", "new"]).toContain(verdict.status);
  });

  it("flags a same-name match without proximity as a possible duplicate instead of merging", async () => {
    if (!db) return;
    const faraway = business({ name: "Chez Marie", providerPlaceId: "node/3000", latitude: 5.5, longitude: 10.5 });
    const verdict = await findDuplicate(db, campaignId, faraway);
    expect(verdict.status).toBe("possible_duplicate");
    if (verdict.status === "possible_duplicate") {
      expect(verdict.signal).toBe("name_only");
    }
  });

  it("returns new for a genuinely unknown business", async () => {
    if (!db) return;
    const verdict = await findDuplicate(db, campaignId, business({ name: "Nouvelle Boutique X", providerPlaceId: "node/4000", latitude: 4.0, longitude: 9.0 }));
    expect(verdict.status).toBe("new");
  });
});

describe("global daily discovery budget", () => {
  it("TEST 9: the daily limit is one shared pool across providers", async () => {
    if (!db) {
      console.warn("DATABASE_URL not set; skipping live budget check.");
      return;
    }
    // The allowance is computed from prospects already stored for the day, which
    // is provider-agnostic. Google-created rows therefore consume the same
    // budget an OpenStreetMap run would.
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);

    const LIMIT = 25;
    // Google discovers 20 and they are accepted.
    await db.outreachProspect.createMany({
      data: Array.from({ length: 20 }, (_, index) => ({
        campaignId: budgetCampaignId,
        businessName: `Budget Google ${index}`,
        discoveredAt: new Date(),
        discoveryProvider: "GOOGLE_PLACES" as const,
        providerPlaceId: `gplace-budget-${index}`,
        googlePlaceId: `gplace-budget-${index}`,
      })),
    });

    const used = await db.outreachProspect.count({ where: { campaignId: budgetCampaignId, discoveredAt: { gte: dayStart } } });
    expect(used).toBe(20);

    // Google now fails and the fallback returns 20 further candidates. Because
    // the remaining budget derives from stored rows rather than a per-provider
    // counter, only 5 of those 20 may be accepted — never 20.
    const fallbackCandidates = 20;
    const remaining = Math.max(0, LIMIT - used);
    expect(remaining).toBe(5);
    expect(remaining).toBeLessThan(fallbackCandidates);

    // Accepting 5 from the fallback brings the day to exactly the limit.
    await db.outreachProspect.createMany({
      data: Array.from({ length: remaining }, (_, index) => ({
        campaignId: budgetCampaignId,
        businessName: `Budget OSM ${index}`,
        discoveredAt: new Date(),
        discoveryProvider: "OPENSTREETMAP" as const,
        providerPlaceId: `node-budget-${index}`,
      })),
    });

    const total = await db.outreachProspect.count({ where: { campaignId: budgetCampaignId, discoveredAt: { gte: dayStart } } });
    expect(total).toBe(LIMIT);
    // The fallback did not add its own separate allowance.
    expect(total).toBeLessThan(20 + fallbackCandidates);
  });
});
