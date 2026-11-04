import { describe, expect, it } from "vitest";
import {
  buildFallbackEmail,
  buildOpportunityBrief,
  deriveEvidenceGaps,
  finalizeEmailDraft,
  reviewGeneratedEmail,
  type OpportunityBrief,
} from "../src/lib/outreach/opportunity-brief";
import type { ScoringEvidence } from "../src/lib/outreach/scoring";

const evidence = (overrides: Partial<ScoringEvidence> = {}): ScoringEvidence => ({
  hasWebsite: true,
  https: true,
  titlePresent: true,
  metaDescriptionPresent: true,
  h1Present: true,
  viewportPresent: true,
  canonicalPresent: true,
  mobileIndicators: true,
  contactMethods: 2,
  hasBooking: true,
  hasQuoteOrForm: true,
  hasEcommerce: false,
  hasCatalogue: true,
  clearCallToAction: true,
  socialLinks: 2,
  trustSignals: 1,
  testimonials: 1,
  leadCaptureForm: true,
  hasGoogleListing: true,
  googleReviewCount: 18,
  googleRating: 4.6,
  reviewResponseRate: 0.5,
  industryKeywordsInContent: true,
  localAreaSignals: 2,
  serviceKeywordsInContent: 3,
  hoursOrLocationInfo: true,
  repetitiveContentBlocks: 0,
  existingChatOrAutomation: false,
  enterpriseSignals: 0,
  hasPropertyListings: false,
  hasPropertyEnquiry: false,
  hasPhoneCta: true,
  hasWhatsAppCta: false,
  hasViewingRequest: false,
  hasLocationInfo: true,
  hasServicesListed: true,
  hasAgentProfiles: false,
  hasPropertyReviews: false,
  ...overrides,
});

const briefFor = (overrides: Partial<ScoringEvidence> = {}, preferredService?: string): OpportunityBrief =>
  buildOpportunityBrief({
    businessName: "Ada Bakery",
    city: "Douala",
    industry: "bakery",
    evidence: evidence(overrides),
    preferredService,
  });

const senderName = "Carlyle Chia";

describe("deriveEvidenceGaps", () => {
  it("returns only the no-website gap when no site exists", () => {
    const gaps = deriveEvidenceGaps({
      businessName: "Ada Bakery",
      evidence: evidence({
        hasWebsite: false,
        https: false,
        titlePresent: false,
        metaDescriptionPresent: false,
        h1Present: false,
        viewportPresent: false,
        contactMethods: 0,
        hasBooking: false,
        hasQuoteOrForm: false,
        hasCatalogue: false,
        clearCallToAction: false,
        socialLinks: 0,
        leadCaptureForm: false,
        hoursOrLocationInfo: false,
        serviceKeywordsInContent: 0,
      }),
      websiteAvailable: false,
    });

    expect(gaps.map((gap) => gap.id)).toEqual(["no_website"]);
    expect(gaps[0].service).toBe("WEBSITE");
    expect(gaps[0].observation).toContain("Ada Bakery");
  });

  it("does not invent a gap when the evidence is healthy", () => {
    expect(deriveEvidenceGaps({ businessName: "Ada Bakery", evidence: evidence(), websiteAvailable: true })).toEqual([]);
  });

  it("ranks gaps by strength and reports only proven signals", () => {
    const gaps = deriveEvidenceGaps({
      businessName: "Ada Bakery",
      evidence: evidence({
        leadCaptureForm: false,
        hasBooking: false,
        metaDescriptionPresent: false,
      }),
      websiteAvailable: true,
    });

    const ids = gaps.map((gap) => gap.id);
    expect(ids[0]).toBe("no_lead_capture");
    expect(ids).toContain("no_booking");
    expect(ids).toContain("no_meta_description");
    expect(ids).not.toContain("no_website");

    const strengths = gaps.map((gap) => gap.strength);
    expect([...strengths].sort((left, right) => right - left)).toEqual(strengths);
  });

  it("never derives a gap from unknown Google review data", () => {
    const gaps = deriveEvidenceGaps({
      businessName: "Ada Bakery",
      evidence: evidence({ googleRating: null, googleReviewCount: null }),
      websiteAvailable: true,
    });

    expect(gaps.map((gap) => gap.id)).not.toContain("no_google_reviews");
    expect(JSON.stringify(gaps)).not.toContain("review count");
  });
});

describe("buildOpportunityBrief", () => {
  it("selects the service that matches the strongest proven gap", () => {
    const brief = briefFor({ leadCaptureForm: false, hasBooking: false });

    expect(brief.primaryGap?.id).toBe("no_lead_capture");
    expect(brief.service).toBe("LEAD_CAPTURE");
    expect(brief.serviceLabel).toBe("Lead capture and enquiry flow");
    expect(brief.playbook.deliverables.length).toBeGreaterThan(0);
    expect(brief.supportingGaps.map((gap) => gap.id)).toContain("no_booking");
  });

  it("honours a preferred service only when a matching gap exists", () => {
    const matched = briefFor({ metaDescriptionPresent: false, leadCaptureForm: false }, "SEO_AND_GOOGLE_VISIBILITY");
    expect(matched.service).toBe("SEO_AND_GOOGLE_VISIBILITY");
    expect(matched.primaryGap?.id).toBe("no_meta_description");

    const unmatched = briefFor({ metaDescriptionPresent: false, leadCaptureForm: false }, "ECOMMERCE");
    expect(unmatched.service).toBe("LEAD_CAPTURE");
  });

  it("falls back to a general website brief when nothing is provably wrong", () => {
    const brief = briefFor();

    expect(brief.primaryGap).toBeNull();
    expect(brief.service).toBe("WEBSITE");
    expect(brief.gaps).toEqual([]);
    expect(brief.forbiddenClaims.join(" ")).toContain("guarantee");
  });

  it("does not invent website gaps when the site exists but could not be read", () => {
    const brief = buildOpportunityBrief({
      businessName: "Ada Bakery",
      city: "Douala",
      industry: "bakery",
      evidence: evidence({ hasWebsite: false, https: false, leadCaptureForm: false, hasBooking: false }),
      websiteUrl: "https://adabakery.example.com",
      websiteInspectionFailed: true,
    });

    expect(brief.gaps).toEqual([]);
    expect(brief.primaryGap).toBeNull();
    expect(brief.websiteAvailable).toBe(true);
    expect(brief.websiteInspectable).toBe(false);
  });

  it("records verified facts and forbidden claims from the evidence", () => {
    const brief = briefFor({ googleRating: null, googleReviewCount: null, socialLinks: 0, testimonials: 0 });

    expect(brief.evidenceFacts.join(" ")).toContain("The website is served over HTTPS.");
    expect(brief.forbiddenClaims.join(" ")).toContain("Google ratings or review counts");
    expect(brief.forbiddenClaims.join(" ")).toContain("customer testimonials or review quotes");
    expect(brief.forbiddenClaims.join(" ")).toContain("social media activity or followers");
  });
});

describe("buildFallbackEmail", () => {
  it("writes a specific initial email for a business without a website", () => {
    const brief = briefFor({
      hasWebsite: false,
      https: false,
      contactMethods: 0,
      leadCaptureForm: false,
      hasBooking: false,
      clearCallToAction: false,
      socialLinks: 0,
    });
    const draft = buildFallbackEmail({ brief, messageType: "INITIAL", senderName });

    expect(draft.subject).toContain("Ada Bakery");
    expect(draft.body).toContain("could not find a website");
    expect(draft.body).toContain("teChia Digital Solutions");
    expect(draft.body).toContain(senderName);
    expect(draft.body).toContain("https://techiadigital.com");
    expect(draft.body).not.toMatch(/\[[^\]]+\]/);
    expect(reviewGeneratedEmail({ ...draft, brief, messageType: "INITIAL", senderName })).toEqual([]);
  });

  it("explains the relevant service for the primary gap", () => {
    const brief = briefFor({ hasBooking: false, hasQuoteOrForm: false });
    const draft = buildFallbackEmail({ brief, messageType: "INITIAL", senderName });

    expect(brief.service).toBe("BOOKING_AND_QUOTES");
    expect(draft.body.toLowerCase()).toContain("booking");
    expect(reviewGeneratedEmail({ ...draft, brief, messageType: "INITIAL", senderName })).toEqual([]);
  });

  it("passes the quality gate for every message type", () => {
    for (const messageType of ["INITIAL", "FOLLOW_UP_1", "FOLLOW_UP_2"] as const) {
      const brief = briefFor({ leadCaptureForm: false });
      const draft = buildFallbackEmail({ brief, messageType, senderName });
      expect(
        reviewGeneratedEmail({ ...draft, brief, messageType, senderName }),
        `${messageType} should pass`
      ).toEqual([]);
    }
  });

  it("does not claim to have reviewed a site that could not be read", () => {
    const brief = buildOpportunityBrief({
      businessName: "Ada Bakery",
      city: "Douala",
      industry: "bakery",
      evidence: evidence({ hasWebsite: false, https: false, leadCaptureForm: false, hasBooking: false }),
      websiteUrl: "https://adabakery.example.com",
      websiteInspectionFailed: true,
    });
    const draft = buildFallbackEmail({ brief, messageType: "INITIAL", senderName });

    expect(draft.body).not.toContain("could not find a website");
    expect(draft.body).not.toContain("reviewing the website");
    expect(draft.body).toContain("wanted to get in touch");
    expect(reviewGeneratedEmail({ ...draft, brief, messageType: "INITIAL", senderName })).toEqual([]);
  });

  it("stays honest when the site has no proven gap", () => {
    const brief = briefFor();
    const draft = buildFallbackEmail({ brief, messageType: "INITIAL", senderName });

    expect(draft.body).toContain("Ada Bakery");
    expect(draft.body).not.toMatch(/\b(?:increase|boost|double)\b/i);
    expect(reviewGeneratedEmail({ ...draft, brief, messageType: "INITIAL", senderName })).toEqual([]);
  });
});

describe("reviewGeneratedEmail", () => {
  const brief = briefFor({ leadCaptureForm: false });
  const base = buildFallbackEmail({ brief, messageType: "INITIAL", senderName });

  it("accepts a grounded model draft", () => {
    expect(reviewGeneratedEmail({ ...base, brief, messageType: "INITIAL", senderName })).toEqual([]);
  });

  it("rejects placeholders and generic openings", () => {
    const issues = reviewGeneratedEmail({
      subject: base.subject,
      body: `I hope this email finds you well, [Business Name]. ${base.body}`,
      brief,
      messageType: "INITIAL",
      senderName,
    });

    expect(issues).toContain("placeholder");
    expect(issues).toContain("generic_opening");
  });

  it("rejects outcome claims, guarantees, urgency and invented statistics", () => {
    const issues = reviewGeneratedEmail({
      subject: base.subject,
      body: `${base.body}\n\nWe guarantee a 45% increase in leads within 7 days. This is a limited time offer.`,
      brief,
      messageType: "INITIAL",
      senderName,
    });

    expect(issues).toContain("unsupported_result_claim");
    expect(issues).toContain("guarantee_language");
    expect(issues).toContain("invented_statistic");
    expect(issues).toContain("fake_urgency");
  });

  it("rejects fake familiarity and AI disclosure", () => {
    const issues = reviewGeneratedEmail({
      subject: base.subject,
      body: `I have been following your work for years. As an AI, I can help. ${base.body}`,
      brief,
      messageType: "INITIAL",
      senderName,
    });

    expect(issues).toContain("fake_familiarity");
    expect(issues).toContain("ai_disclosure");
  });

  it("rejects drafts that skip the proven gap and the signature", () => {
    const issues = reviewGeneratedEmail({
      subject: base.subject,
      body: "Hello, we build websites and digital products for growing companies. Let us know if you would like to talk.",
      brief,
      messageType: "INITIAL",
      senderName,
    });

    expect(issues).toContain("missing_gap_reference");
    expect(issues).toContain("missing_signature");
    expect(issues).toContain("too_short");
  });

  it("rejects links that do not belong to teChia", () => {
    const issues = reviewGeneratedEmail({
      subject: base.subject,
      body: `${base.body}\n\nSee https://example.com/portfolio and https://techiadigital.com.`,
      brief,
      messageType: "INITIAL",
      senderName,
    });

    expect(issues).toContain("unsafe_link");
  });

  it("rejects shouty or exclamatory subjects", () => {
    const issues = reviewGeneratedEmail({
      ...base,
      subject: "HUGE SAVINGS!!!",
      brief,
      messageType: "INITIAL",
      senderName,
    });

    expect(issues).toContain("subject_shouty");
    expect(issues).toContain("subject_exclamation");
  });
});

describe("finalizeEmailDraft", () => {
  it("keeps a model draft that passes the gate", () => {
    const brief = briefFor({ leadCaptureForm: false });
    const draft = buildFallbackEmail({ brief, messageType: "INITIAL", senderName });
    const result = finalizeEmailDraft({ ...draft, brief, messageType: "INITIAL", senderName });

    expect(result.usedFallback).toBe(false);
    expect(result.issues).toEqual([]);
    expect(result.subject).toBe(draft.subject);
  });

  it("swaps an unsafe model draft for the grounded fallback", () => {
    const brief = briefFor({ leadCaptureForm: false });
    const result = finalizeEmailDraft({
      subject: "GUARANTEED GROWTH!!!",
      body: "We guarantee 100% more leads. Act now. https://example.com",
      brief,
      messageType: "INITIAL",
      senderName,
    });

    expect(result.usedFallback).toBe(true);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.body).not.toContain("guarantee");
    expect(result.body).toContain("teChia Digital Solutions");
    expect(reviewGeneratedEmail({ ...result, brief, messageType: "INITIAL", senderName })).toEqual([]);
  });
});
