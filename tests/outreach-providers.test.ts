import { afterEach, describe, expect, it, vi } from "vitest";
import { DiscoveryProviderError, isFallbackEligible, type DiscoveredBusiness, type DiscoveryCriteria } from "@/lib/outreach/providers/types";
import { classifyGoogleFailure } from "@/lib/outreach/providers/google-places-provider";
import { GooglePlacesError } from "@/lib/outreach/google-places";

/**
 * Provider selection, failure classification and the fallback contract.
 *
 * Nothing here touches the network or the database: providers are injected as
 * stubs, so the tests assert the orchestration rules rather than a live API.
 */

const CRITERIA: DiscoveryCriteria = {
  campaignId: "campaign-1",
  country: "Cameroon",
  regions: ["Littoral"],
  cities: ["Douala"],
  industries: ["Restaurants"],
  businessTypes: ["Restaurant"],
  keywords: [],
  language: "en",
  maxResults: 25,
};

function business(overrides: Partial<DiscoveredBusiness> = {}): DiscoveredBusiness {
  return {
    provider: "OPENSTREETMAP",
    providerPlaceId: "node/1",
    name: "Chez Marie",
    formattedAddress: "Rue Joss, Douala",
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

/** Minimal in-memory stand-in for the database-backed pieces the registry uses. */
function createHarness(options: {
  google?: { configured: boolean; behaviour: "ok" | "fail" };
  osm?: { behaviour: "ok" | "fail" };
  cooldown?: boolean;
}) {
  const calls: Array<{ provider: string }> = [];
  const health = { cooldownUntil: null as Date | null, consecutiveFailures: 0 };

  const googleConfigured = options.google?.configured ?? true;
  const googleBehaviour = options.google?.behaviour ?? "ok";
  const osmBehaviour = options.osm?.behaviour ?? "ok";

  const google = {
    id: "GOOGLE_PLACES" as const,
    label: "Google Places",
    isConfigured: () => googleConfigured,
    unavailableReason: () => (googleConfigured ? null : "GOOGLE_MAPS_PLATFORM_API_KEY is not set."),
    discover: async () => {
      calls.push({ provider: "GOOGLE_PLACES" });
      if (googleBehaviour === "ok") return [business({ provider: "GOOGLE_PLACES", providerPlaceId: "gplace-1", googleMapsUrl: "https://maps.google.com/?cid=1" })];
      throw new DiscoveryProviderError({ provider: "GOOGLE_PLACES", category: "quota", message: "quota exceeded", retryable: false });
    },
  };

  const osm = {
    id: "OPENSTREETMAP" as const,
    label: "OpenStreetMap",
    isConfigured: () => true,
    unavailableReason: () => null,
    discover: async () => {
      calls.push({ provider: "OPENSTREETMAP" });
      if (osmBehaviour === "fail") {
        throw new DiscoveryProviderError({ provider: "OPENSTREETMAP", category: "temporary", message: "overpass unavailable" });
      }
      return [business()];
    },
  };

  return { calls, health, google, osm };
}

// The registry reads its provider table and health helpers through module state,
// so each test builds a registry over a stub set and drives it directly.
async function runWith(
  harness: ReturnType<typeof createHarness>,
  mode: "AUTO" | "GOOGLE_PLACES" | "OPENSTREETMAP",
  opts: { now?: Date } = {}
) {
  const { runDiscoveryProviders } = await import("@/lib/outreach/providers/registry");
  return runDiscoveryProviders({
    mode,
    criteria: CRITERIA,
    campaignId: "campaign-1",
    now: opts.now ?? new Date(),
    providers: { GOOGLE_PLACES: harness.google, OPENSTREETMAP: harness.osm } as never,
  });
}

describe("fallback eligibility", () => {
  it("permits fallback for the provider's own faults", () => {
    expect(isFallbackEligible("configuration")).toBe(true);
    expect(isFallbackEligible("quota")).toBe(true);
    expect(isFallbackEligible("temporary")).toBe(true);
  });

  it("never hides a programming error behind a fallback", () => {
    expect(isFallbackEligible("programming")).toBe(false);
  });
});

describe("Google failure classification", () => {
  it("treats a missing key, rejected key and disabled API as configuration", () => {
    expect(classifyGoogleFailure(new GooglePlacesError("not_configured", "x"))).toBe("configuration");
    expect(classifyGoogleFailure(new GooglePlacesError("permission", "x", 403))).toBe("configuration");
    expect(classifyGoogleFailure(new GooglePlacesError("http_error", "x", 400))).toBe("configuration");
  });

  it("treats quota and billing rejections as quota", () => {
    expect(classifyGoogleFailure(new GooglePlacesError("quota", "x", 429))).toBe("quota");
    expect(classifyGoogleFailure(new GooglePlacesError("http_error", "x", 429))).toBe("quota");
  });

  it("treats 5xx, timeouts and unreadable responses as temporary", () => {
    expect(classifyGoogleFailure(new GooglePlacesError("http_error", "x", 503))).toBe("temporary");
    expect(classifyGoogleFailure(new GooglePlacesError("timeout", "x"))).toBe("temporary");
    expect(classifyGoogleFailure(new GooglePlacesError("malformed_response", "x"))).toBe("temporary");
  });

  it("treats an unknown error as a programming error", () => {
    expect(classifyGoogleFailure(new Error("bug in our own adapter"))).toBe("programming");
  });
});

describe("provider mode behaviour", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("TEST 1: uses Google when configured and healthy", async () => {
    const harness = createHarness({ google: { configured: true, behaviour: "ok" } });
    const result = await runWith(harness, "AUTO");
    expect(result.provider).toBe("GOOGLE_PLACES");
    expect(result.reason).toBe("google_selected");
    expect(result.businesses[0].googleMapsUrl).toContain("maps.google.com");
    expect(harness.calls.map((c) => c.provider)).toEqual(["GOOGLE_PLACES"]);
  });

  it("TEST 2: falls back to OpenStreetMap in AUTO when the Google key is missing", async () => {
    const harness = createHarness({ google: { configured: false, behaviour: "ok" } });
    const result = await runWith(harness, "AUTO");
    expect(result.provider).toBe("OPENSTREETMAP");
    expect(result.reason).toBe("google_not_configured");
    expect(result.skipped?.provider).toBe("GOOGLE_PLACES");
    // Google must not be called at all when it has no credential.
    expect(harness.calls.map((c) => c.provider)).toEqual(["OPENSTREETMAP"]);
  });

  it("TEST 3: fails clearly in GOOGLE_PLACES mode when the key is missing", async () => {
    const harness = createHarness({ google: { configured: false, behaviour: "ok" } });
    const result = await runWith(harness, "GOOGLE_PLACES");
    expect(result.provider).toBeNull();
    expect(result.businesses).toHaveLength(0);
    expect(result.skipped?.provider).toBe("GOOGLE_PLACES");
    // Critically: no silent switch to the fallback.
    expect(harness.calls).toHaveLength(0);
  });

  it("uses OpenStreetMap directly in OPENSTREETMAP mode", async () => {
    const harness = createHarness({ google: { configured: true, behaviour: "ok" } });
    const result = await runWith(harness, "OPENSTREETMAP");
    expect(result.provider).toBe("OPENSTREETMAP");
    expect(result.reason).toBe("openstreetmap_pinned");
    expect(harness.calls.map((c) => c.provider)).toEqual(["OPENSTREETMAP"]);
  });

  it("TEST 4: falls back to OpenStreetMap in AUTO when Google reports a quota limit", async () => {
    const harness = createHarness({ google: { configured: true, behaviour: "fail" }, osm: { behaviour: "ok" } });
    const result = await runWith(harness, "AUTO");
    expect(result.provider).toBe("OPENSTREETMAP");
    expect(result.reason).toBe("fallback_after_failure");
    expect(result.fallback).toMatchObject({ from: "GOOGLE_PLACES", to: "OPENSTREETMAP", category: "quota" });
    // A quota failure is never retried, and Google is still attempted first.
    expect(harness.calls.filter((c) => c.provider === "GOOGLE_PLACES")).toHaveLength(1);
    expect(harness.calls.filter((c) => c.provider === "OPENSTREETMAP")).toHaveLength(1);
  });

  it("does not fall back in GOOGLE_PLACES mode when Google reports a quota limit", async () => {
    const harness = createHarness({ google: { configured: true, behaviour: "fail" }, osm: { behaviour: "ok" } });
    const result = await runWith(harness, "GOOGLE_PLACES");
    expect(result.provider).toBeNull();
    expect(result.fallback).toBeNull();
    expect(harness.calls.map((c) => c.provider)).not.toContain("OPENSTREETMAP");
  });

  it("TEST 6: refuses to hide a programming error behind a fallback", async () => {
    const harness = createHarness({ google: { configured: true, behaviour: "ok" }, osm: { behaviour: "ok" } });
    harness.google.discover = async () => {
      harness.calls.push({ provider: "GOOGLE_PLACES" });
      throw new DiscoveryProviderError({
        provider: "GOOGLE_PLACES",
        category: "programming",
        message: "malformed request built by our adapter",
        retryable: false,
      });
    };

    await expect(runWith(harness, "AUTO")).rejects.toMatchObject({ category: "programming" });
    // The fallback must never run, or our own bug would disappear behind it.
    expect(harness.calls.map((c) => c.provider)).not.toContain("OPENSTREETMAP");
  });

  it("does not retry a programming error", async () => {
    const harness = createHarness({ google: { configured: true, behaviour: "ok" }, osm: { behaviour: "ok" } });
    harness.google.discover = async () => {
      harness.calls.push({ provider: "GOOGLE_PLACES" });
      throw new DiscoveryProviderError({ provider: "GOOGLE_PLACES", category: "programming", message: "bug", retryable: false });
    };
    await expect(runWith(harness, "AUTO")).rejects.toBeTruthy();
    expect(harness.calls.filter((c) => c.provider === "GOOGLE_PLACES")).toHaveLength(1);
  });

  it("TEST 7: surfaces an OpenStreetMap failure instead of returning nothing silently", async () => {
    const harness = createHarness({ google: { configured: false, behaviour: "ok" }, osm: { behaviour: "fail" } });
    const result = await runWith(harness, "AUTO");
    expect(result.provider).toBe("OPENSTREETMAP");
    expect(result.businesses).toHaveLength(0);
    const osmAttempt = result.attempts.find((a) => a.provider === "OPENSTREETMAP");
    expect(osmAttempt?.ok).toBe(false);
    expect(osmAttempt?.failureCategory).toBe("temporary");
    expect(osmAttempt?.error).toContain("overpass unavailable");
  });
});

describe("Google key is optional (STEP 25 / 26)", () => {
  const env = process.env as unknown as Record<string, string | undefined>;
  const original = env.GOOGLE_MAPS_PLATFORM_API_KEY;

  afterEach(() => {
    if (original === undefined) delete env.GOOGLE_MAPS_PLATFORM_API_KEY;
    else env.GOOGLE_MAPS_PLATFORM_API_KEY = original;
  });

  it("reports unavailable without throwing when the key is absent", async () => {
    delete env.GOOGLE_MAPS_PLATFORM_API_KEY;
    const { isGooglePlacesConfigured, getGooglePlacesApiKey } = await import("@/lib/outreach/config");
    // Reading configuration must never throw, or the application could not start.
    expect(() => isGooglePlacesConfigured()).not.toThrow();
    expect(getGooglePlacesApiKey()).toBeNull();
    expect(isGooglePlacesConfigured()).toBe(false);
  });

  it("treats an obvious placeholder as absent", async () => {
    for (const placeholder of ["your-key-here", "AIza_your_key", "changeme", "REPLACE_ME"]) {
      env.GOOGLE_MAPS_PLATFORM_API_KEY = placeholder;
      const { isGooglePlacesConfigured } = await import("@/lib/outreach/config");
      expect(isGooglePlacesConfigured(), placeholder).toBe(false);
    }
  });

  it("recognises a real key again with no code change (STEP 26)", async () => {
    env.GOOGLE_MAPS_PLATFORM_API_KEY = "AIzaSyDk3fQ1pLzX7bT9mNvR4wYhJ6cE0uA2sG8iO";
    const { isGooglePlacesConfigured } = await import("@/lib/outreach/config");
    expect(isGooglePlacesConfigured()).toBe(true);
  });

  it("configures the OpenStreetMap fallback with no credential", async () => {
    const { OUTREACH_OSM } = await import("@/lib/outreach/config");
    expect(OUTREACH_OSM.overpassUrl).toMatch(/^https:\/\//);
    expect(OUTREACH_OSM.userAgent).toContain("teChia");
  });
});

describe("transient retry before fallback", () => {
  it("TEST 5: retries a temporary failure a bounded number of times, then falls back", async () => {
    const harness = createHarness({ google: { configured: true, behaviour: "ok" }, osm: { behaviour: "ok" } });
    let googleCalls = 0;
    harness.google.discover = async () => {
      googleCalls += 1;
      harness.calls.push({ provider: "GOOGLE_PLACES" });
      // Fails transiently every time, exhausting the bounded retry budget.
      throw new DiscoveryProviderError({ provider: "GOOGLE_PLACES", category: "temporary", message: "upstream 503" });
    };

    const { runDiscoveryProviders } = await import("@/lib/outreach/providers/registry");
    const { OUTREACH_PROVIDERS } = await import("@/lib/outreach/config");
    // A temporary failure is retryable, so it is attempted 1 + transientRetries
    // times before the fallback runs.
    const expectedGoogleCalls = 1 + OUTREACH_PROVIDERS.transientRetries;

    const result = await runDiscoveryProviders({
      mode: "AUTO",
      criteria: CRITERIA,
      campaignId: "campaign-1",
      now: new Date(),
      providers: { GOOGLE_PLACES: harness.google, OPENSTREETMAP: harness.osm } as never,
    });

    expect(googleCalls).toBe(expectedGoogleCalls);
    expect(result.provider).toBe("OPENSTREETMAP");
    expect(result.fallback).toMatchObject({ category: "temporary" });
  });
});
