import { describe, expect, it } from "vitest";
import { READINESS_TOTAL, READINESS_WEIGHTS, scoreReadiness } from "../src/lib/outreach/readiness";
import type { ScoringEvidence } from "../src/lib/outreach/scoring";

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

describe("outreach readiness scoring", () => {
  it("weights sum to exactly 100", () => {
    expect(READINESS_TOTAL).toBe(100);
    expect(READINESS_WEIGHTS).toEqual({
      specificOpportunity: 25,
      contactability: 20,
      leadGeneration: 15,
      activeBusiness: 10,
      analyzability: 10,
      websiteWeakness: 10,
      serviceFit: 10,
    });
  });

  it("scores zero for a business with no web presence", () => {
    const result = scoreReadiness(evidence());
    expect(result.total).toBe(0);
    for (const dimension of result.dimensions) {
      expect(dimension.earned).toBe(0);
    }
  });

  it("is deterministic: identical evidence always yields an identical score", () => {
    const a = scoreReadiness(evidence({ hasWebsite: true, https: true, titlePresent: true }));
    const b = scoreReadiness(evidence({ hasWebsite: true, https: true, titlePresent: true }));
    expect(a.total).toBe(b.total);
  });

  it("never exceeds 100 even when every signal is present", () => {
    const result = scoreReadiness(
      evidence({
        hasWebsite: true,
        https: true,
        titlePresent: true,
        metaDescriptionPresent: true,
        h1Present: true,
        viewportPresent: true,
        canonicalPresent: true,
        mobileIndicators: true,
        contactMethods: 4,
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
      })
    );
    expect(result.total).toBeLessThanOrEqual(100);
    for (const dimension of result.dimensions) {
      expect(dimension.earned).toBeLessThanOrEqual(dimension.possible);
    }
  });

  it("rewards more opportunities over fewer opportunities", () => {
    // A business with a weak website has more opportunities for improvement.
    const weak = scoreReadiness(
      evidence({ hasWebsite: true, https: true, titlePresent: true, viewportPresent: true, hasGoogleListing: true, googleRating: 4.2 })
    );
    // A business with a strong website has fewer opportunities.
    const strong = scoreReadiness(
      evidence({
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
      })
    );
    // The weak website has more opportunities, so it scores higher on readiness.
    expect(weak.total).toBeGreaterThan(strong.total);
  });

  it("stores the underlying reasons for every awarded point", () => {
    const result = scoreReadiness(
      evidence({ hasWebsite: true, https: true, titlePresent: true, contactMethods: 2, hasGoogleListing: true })
    );
    const analyzability = result.dimensions.find((d) => d.key === "analyzability");
    expect(analyzability?.reasons).toContain("Website is accessible");
    expect(analyzability?.reasons).toContain("Website serves over HTTPS");
  });

  it("records no reason for a dimension that scored zero", () => {
    const result = scoreReadiness(evidence({ existingChatOrAutomation: true, contactMethods: 4 }));
    const zeroed = result.dimensions.filter((d) => d.earned === 0);
    expect(zeroed.length).toBeGreaterThan(0);
    for (const dimension of zeroed) {
      expect(dimension.reasons).toHaveLength(0);
    }
  });

  it("blocks a business with no website and no contact channel", () => {
    const result = scoreReadiness(evidence());
    expect(result.blockers).toContain("No website and no published contact channel.");
  });

  it("does not block a normal small business with only a phone number", () => {
    const result = scoreReadiness(evidence({ contactMethods: 1 }));
    expect(result.blockers).toHaveLength(0);
  });

  it("rewards contactability when multiple contact channels exist", () => {
    const result = scoreReadiness(evidence({ hasWebsite: true, contactMethods: 3, hasGoogleListing: true }));
    const contactability = result.dimensions.find((d) => d.key === "contactability");
    expect(contactability?.earned).toBeGreaterThanOrEqual(10);
  });

  it("rewards service fit when opportunities match teChia services", () => {
    const result = scoreReadiness(evidence({ hasWebsite: true, leadCaptureForm: false, hasBooking: false, hasCatalogue: false }));
    const serviceFit = result.dimensions.find((d) => d.key === "serviceFit");
    expect(serviceFit?.earned).toBeGreaterThan(0);
  });

  it("rewards website weakness when mobile viewport is missing", () => {
    const result = scoreReadiness(evidence({ hasWebsite: true, viewportPresent: false }));
    const weakness = result.dimensions.find((d) => d.key === "websiteWeakness");
    expect(weakness?.earned).toBeGreaterThan(0);
  });
});
