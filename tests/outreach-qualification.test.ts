import { describe, expect, it } from "vitest";
import { evaluateQualification, type QualificationInput } from "../src/lib/outreach/qualification";
import { scoreReadiness } from "../src/lib/outreach/readiness";
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

const baseInput = (overrides: Partial<QualificationInput> = {}): QualificationInput => {
  const ev = evidence({ hasWebsite: true, https: true, titlePresent: true, contactMethods: 2, hasGoogleListing: true });
  const readiness = scoreReadiness(ev);
  return {
    readinessScore: readiness.total,
    readiness,
    evidence: ev,
    hasConcreteOpportunity: true,
    hasContactMethod: true,
    appearsActive: true,
    hasServiceFit: true,
    isSuppressed: false,
    isDuplicate: false,
    alreadyContacted: false,
    hasEnoughEvidence: true,
    minReadinessScore: 70,
    ...overrides,
  };
};

describe("outreach qualification", () => {
  it("qualifies a valid real-estate prospect with all conditions met", () => {
    const result = evaluateQualification(baseInput());
    expect(result.status).toBe("QUALIFIED");
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("does NOT qualify when score >= 70 but missing contact", () => {
    const result = evaluateQualification(baseInput({ hasContactMethod: false }));
    expect(result.status).not.toBe("QUALIFIED");
    expect(result.failedConditions).toContain("No legitimate business contact method");
  });

  it("does NOT qualify when score >= 70 but no concrete opportunity", () => {
    const result = evaluateQualification(baseInput({ hasConcreteOpportunity: false }));
    expect(result.status).not.toBe("QUALIFIED");
    expect(result.failedConditions).toContain("No concrete evidence-backed opportunity");
  });

  it("qualifies a strong website with a legitimate opportunity", () => {
    const ev = evidence({
      hasWebsite: true,
      https: true,
      titlePresent: true,
      metaDescriptionPresent: true,
      h1Present: true,
      viewportPresent: true,
      contactMethods: 3,
      hasGoogleListing: true,
      leadCaptureForm: false,
      hasBooking: false,
    });
    const readiness = scoreReadiness(ev);
    const result = evaluateQualification(
      baseInput({
        readinessScore: readiness.total,
        readiness,
        evidence: ev,
        hasConcreteOpportunity: true,
        hasContactMethod: true,
        hasServiceFit: true,
      })
    );
    expect(result.status).toBe("QUALIFIED");
  });

  it("does NOT qualify a weak website with no evidence", () => {
    const ev = evidence({ hasWebsite: false, contactMethods: 0 });
    const readiness = scoreReadiness(ev);
    const result = evaluateQualification(
      baseInput({
        readinessScore: readiness.total,
        readiness,
        evidence: ev,
        hasConcreteOpportunity: false,
        hasContactMethod: false,
        appearsActive: false,
        hasServiceFit: false,
        hasEnoughEvidence: false,
      })
    );
    expect(result.status).toBe("DISQUALIFIED");
  });

  it("does NOT qualify a duplicate", () => {
    const result = evaluateQualification(baseInput({ isDuplicate: true }));
    expect(result.status).not.toBe("QUALIFIED");
    expect(result.failedConditions).toContain("Prospect is a duplicate");
  });

  it("does NOT qualify a suppressed prospect", () => {
    const result = evaluateQualification(baseInput({ isSuppressed: true }));
    expect(result.status).not.toBe("QUALIFIED");
    expect(result.failedConditions).toContain("Prospect is suppressed");
  });

  it("produces REVIEW when score is high but some conditions fail", () => {
    const result = evaluateQualification(baseInput({ hasContactMethod: false, isDuplicate: true }));
    expect(result.status).toBe("REVIEW");
  });

  it("produces DISQUALIFIED when score is below threshold", () => {
    const ev = evidence({ hasWebsite: false, contactMethods: 0 });
    const readiness = scoreReadiness(ev);
    const result = evaluateQualification(
      baseInput({
        readinessScore: readiness.total,
        readiness,
        evidence: ev,
        hasConcreteOpportunity: false,
        hasContactMethod: false,
        appearsActive: false,
        hasServiceFit: false,
        hasEnoughEvidence: false,
      })
    );
    expect(result.status).toBe("DISQUALIFIED");
  });

  it("includes a primary opportunity when qualified", () => {
    const result = evaluateQualification(baseInput());
    expect(result.primaryOpportunity).not.toBeNull();
  });

  it("includes a disqualification reason when not qualified", () => {
    const result = evaluateQualification(baseInput({ hasContactMethod: false }));
    expect(result.disqualificationReason).not.toBeNull();
  });

  it("includes a recommended next action", () => {
    const result = evaluateQualification(baseInput());
    expect(result.recommendedNextAction).not.toBeNull();
  });
});
