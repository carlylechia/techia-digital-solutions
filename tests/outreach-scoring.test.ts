import { describe, expect, it } from "vitest";
import { SCORE_TOTAL, SCORE_WEIGHTS, scoreOpportunity, type ScoringEvidence } from "../src/lib/outreach/scoring";

const evidence = (overrides: Partial<ScoringEvidence> = {}): ScoringEvidence => ({
  hasWebsite: false,
  https: false,
  titlePresent: false,
  metaDescriptionPresent: false,
  h1Present: false,
  viewportPresent: false,
  canonicalPresent: false,
  mobileIndicators: false,
  contactMethods: 0,
  hasBooking: false,
  hasQuoteOrForm: false,
  hasEcommerce: false,
  hasCatalogue: false,
  clearCallToAction: false,
  socialLinks: 0,
  trustSignals: 0,
  testimonials: 0,
  leadCaptureForm: false,
  hasGoogleListing: false,
  googleReviewCount: null,
  googleRating: null,
  reviewResponseRate: null,
  industryKeywordsInContent: false,
  localAreaSignals: 0,
  serviceKeywordsInContent: 0,
  hoursOrLocationInfo: false,
  repetitiveContentBlocks: 0,
  existingChatOrAutomation: false,
  enterpriseSignals: 0,
  hasPropertyListings: false,
  hasPropertyEnquiry: false,
  hasPhoneCta: false,
  hasWhatsAppCta: false,
  hasViewingRequest: false,
  hasLocationInfo: false,
  hasServicesListed: false,
  hasAgentProfiles: false,
  hasPropertyReviews: false,
  ...overrides,
});

const STRONG = evidence({
  hasWebsite: true,
  https: true,
  titlePresent: true,
  metaDescriptionPresent: true,
  h1Present: true,
  viewportPresent: true,
  canonicalPresent: true,
  mobileIndicators: true,
  contactMethods: 3,
  hasBooking: true,
  hasQuoteOrForm: true,
  hasEcommerce: true,
  hasCatalogue: true,
  clearCallToAction: true,
  socialLinks: 4,
  trustSignals: 3,
  testimonials: 4,
  leadCaptureForm: true,
  hasGoogleListing: true,
  googleRating: 4.6,
  googleReviewCount: 120,
  reviewResponseRate: 0.8,
  industryKeywordsInContent: true,
  localAreaSignals: 2,
  serviceKeywordsInContent: 5,
  hoursOrLocationInfo: true,
});

describe("deterministic scoring", () => {
  it("weights sum to exactly 100", () => {
    expect(SCORE_TOTAL).toBe(100);
    expect(SCORE_WEIGHTS).toEqual({
      websiteQuality: 20,
      seo: 15,
      leadCapture: 15,
      commerceOrBooking: 15,
      googleVisibility: 10,
      socialPresence: 10,
      automationOpportunity: 10,
      aiOpportunity: 5,
    });
  });

  it("scores quality dimensions at zero but still awards latent opportunity", () => {
    // The score measures opportunity, not quality. A business with no web presence
    // scores zero on website/SEO/lead capture/commerce, but a lack of any chat
    // assistant or workflow automation is itself a real automation opportunity.
    const result = scoreOpportunity(evidence());
    const quality = result.dimensions.filter((dimension) =>
      ["websiteQuality", "seo", "leadCapture", "commerceOrBooking", "googleVisibility", "socialPresence"].includes(dimension.key)
    );
    for (const dimension of quality) {
      expect(dimension.earned, dimension.key).toBe(0);
      expect(dimension.reasons).toHaveLength(0);
    }
    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeLessThan(10);
  });

  it("is deterministic: identical evidence always yields an identical score", () => {
    const a = scoreOpportunity(STRONG);
    const b = scoreOpportunity(STRONG);
    expect(a.total).toBe(b.total);
    expect(a.recommendedServices).toEqual(b.recommendedServices);
  });

  it("never exceeds 100 even when every signal is present", () => {
    const result = scoreOpportunity(STRONG);
    expect(result.total).toBeLessThanOrEqual(100);
    for (const dimension of result.dimensions) {
      expect(dimension.earned).toBeLessThanOrEqual(dimension.possible);
    }
  });

  it("rewards a strong digital footprint above a weak one", () => {
    const weak = scoreOpportunity(
      evidence({ hasWebsite: true, https: true, titlePresent: true, viewportPresent: true, hasGoogleListing: true, googleRating: 4.2 })
    );
    const strong = scoreOpportunity(STRONG);
    expect(strong.total).toBeGreaterThan(weak.total);
  });

  it("stores the underlying reasons for every awarded point", () => {
    const result = scoreOpportunity(STRONG);
    const website = result.dimensions.find((dimension) => dimension.key === "websiteQuality");
    expect(website?.reasons).toContain("Business publishes a website");
    expect(website?.reasons).toContain("Website serves over HTTPS");
  });

  it("records no reason for a dimension that scored zero", () => {
    const result = scoreOpportunity(evidence({ existingChatOrAutomation: true, contactMethods: 4 }));
    const zeroed = result.dimensions.filter((dimension) => dimension.earned === 0);
    expect(zeroed.length).toBeGreaterThan(0);
    for (const dimension of zeroed) {
      expect(dimension.reasons, dimension.key).toHaveLength(0);
    }
  });

  it("recommends SEO and a website for a business with no web presence", () => {
    const result = scoreOpportunity(evidence({ hasGoogleListing: true, googleRating: 4.5, contactMethods: 1 }));
    expect(result.recommendedServices).toContain("WEBSITE");
    expect(result.recommendedServices).toContain("SEO_AND_GOOGLE_VISIBILITY");
  });

  it("omits commerce once a catalogue and checkout already exist", () => {
    const withCommerce = scoreOpportunity(
      evidence({ hasWebsite: true, https: true, titlePresent: true, hasEcommerce: true, hasCatalogue: true, hasBooking: true })
    );
    expect(withCommerce.recommendedServices).not.toContain("ECOMMERCE");
  });

  it("surfaces e-commerce when it is the single largest gap", () => {
    const almostComplete = scoreOpportunity(STRONG);
    expect(almostComplete.recommendedServices).not.toContain("ECOMMERCE");

    // With every other dimension at full marks but commerce absent, the
    // commerce gap is what remains and must be recommended.
    const commerceOnlyGap = scoreOpportunity({ ...STRONG, hasEcommerce: false, hasCatalogue: false, hasBooking: false });
    expect(commerceOnlyGap.recommendedServices).toContain("ECOMMERCE");
  });

  it("never recommends more than four services", () => {
    const result = scoreOpportunity(evidence());
    expect(result.recommendedServices.length).toBeLessThanOrEqual(4);
  });

  it("disqualifies a business with no website and no contact channel", () => {
    const result = scoreOpportunity(evidence());
    expect(result.disqualifiers).toContain("No website and no published contact channel.");
  });

  it("disqualifies an obvious enterprise", () => {
    const result = scoreOpportunity(evidence({ enterpriseSignals: 3 }));
    expect(result.disqualifiers.some((reason) => reason.includes("enterprise"))).toBe(true);
  });

  it("does not disqualify a normal small business with only a phone number", () => {
    const result = scoreOpportunity(evidence({ contactMethods: 1 }));
    expect(result.disqualifiers).toHaveLength(0);
  });
});
