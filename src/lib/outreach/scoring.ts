/**
 * Deterministic opportunity scoring.
 *
 * The model interprets evidence; it never decides the number. Every dimension
 * below is computed from concrete, previously stored findings with fixed
 * weights that sum to 100, so the same evidence always produces the same score
 * and two reviewers can audit it by hand.
 */

import { OUTREACH_TARGET_SERVICES, type TargetService } from "./constants";

export type ScoreDimensionKey =
  | "websiteQuality"
  | "seo"
  | "leadCapture"
  | "commerceOrBooking"
  | "googleVisibility"
  | "socialPresence"
  | "automationOpportunity"
  | "aiOpportunity";

export const SCORE_WEIGHTS: Record<ScoreDimensionKey, number> = {
  websiteQuality: 20,
  seo: 15,
  leadCapture: 15,
  commerceOrBooking: 15,
  googleVisibility: 10,
  socialPresence: 10,
  automationOpportunity: 10,
  aiOpportunity: 5,
};

export const SCORE_TOTAL = Object.values(SCORE_WEIGHTS).reduce((total, weight) => total + weight, 0);

/** Evidence gathered during enrichment. Every field is a fact, never a guess. */
export type ScoringEvidence = {
  hasWebsite: boolean;
  https: boolean;
  titlePresent: boolean;
  metaDescriptionPresent: boolean;
  h1Present: boolean;
  viewportPresent: boolean;
  canonicalPresent: boolean;
  mobileIndicators: boolean;
  contactMethods: number;
  hasBooking: boolean;
  hasQuoteOrForm: boolean;
  hasEcommerce: boolean;
  hasCatalogue: boolean;
  clearCallToAction: boolean;
  socialLinks: number;
  trustSignals: number;
  testimonials: number;
  leadCaptureForm: boolean;
  hasGoogleListing: boolean;
  googleReviewCount: number | null;
  googleRating: number | null;
  reviewResponseRate: number | null;
  industryKeywordsInContent: boolean;
  localAreaSignals: number;
  serviceKeywordsInContent: number;
  hoursOrLocationInfo: boolean;
  /** Count of repetitive service/keyword blocks suggesting a static page. */
  repetitiveContentBlocks: number;
  /** Signals that the business already runs automation or an assistant. */
  existingChatOrAutomation: boolean;
  /** Set when the business is clearly not an SME we can help. */
  enterpriseSignals: number;
};

export type ScoreDimension = {
  key: ScoreDimensionKey;
  label: string;
  earned: number;
  possible: number;
  reasons: string[];
};

export type ScoreResult = {
  total: number;
  dimensions: ScoreDimension[];
  recommendedServices: TargetService[];
  /** Machine readable list of the underlying facts that drove the score. */
  findings: string[];
  /** Hard disqualifiers detected before any model is consulted. */
  disqualifiers: string[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function dimension(
  key: ScoreDimensionKey,
  label: string,
  possible: number,
  checks: Array<{ earned: number; reason: string }>
): ScoreDimension {
  const reasons = checks.filter((check) => check.earned > 0).map((check) => check.reason);
  const earned = clamp(
    checks.reduce((total, check) => total + check.earned, 0),
    0,
    possible
  );
  return { key, label, earned, possible, reasons };
}

function scoreWebsiteQuality(evidence: ScoringEvidence) {
  const possible = SCORE_WEIGHTS.websiteQuality;
  return dimension("websiteQuality", "Website quality", possible, [
    { earned: evidence.hasWebsite ? 6 : 0, reason: "Business publishes a website" },
    { earned: evidence.https ? 4 : 0, reason: "Website serves over HTTPS" },
    { earned: evidence.titlePresent ? 3 : 0, reason: "Page has a descriptive title" },
    { earned: evidence.metaDescriptionPresent ? 3 : 0, reason: "Page has a meta description" },
    { earned: evidence.h1Present ? 2 : 0, reason: "Page has a clear H1" },
    {
      earned: evidence.viewportPresent && evidence.mobileIndicators ? 2 : evidence.viewportPresent ? 1 : 0,
      reason: "Page declares a mobile viewport and responsive layout",
    },
  ]);
}

function scoreSeo(evidence: ScoringEvidence) {
  const possible = SCORE_WEIGHTS.seo;
  return dimension("seo", "SEO and local visibility", possible, [
    { earned: evidence.canonicalPresent ? 3 : 0, reason: "Canonical URL declared" },
    { earned: evidence.industryKeywordsInContent ? 4 : 0, reason: "Industry language present in page content" },
    {
      earned: clamp(evidence.serviceKeywordsInContent, 0, 3),
      reason: "Concrete service keywords present in page content",
    },
    {
      earned: evidence.hoursOrLocationInfo ? 3 : 0,
      reason: "Address or opening hours published for local search",
    },
    {
      earned: clamp(evidence.localAreaSignals, 0, 2),
      reason: "Local area or neighbourhood references found",
    },
  ]);
}

function scoreLeadCapture(evidence: ScoringEvidence) {
  const possible = SCORE_WEIGHTS.leadCapture;
  return dimension("leadCapture", "Lead capture", possible, [
    { earned: evidence.leadCaptureForm ? 7 : 0, reason: "Website captures leads through a form" },
    { earned: evidence.hasQuoteOrForm ? 4 : 0, reason: "Request-a-quote or enquiry path exists" },
    { earned: evidence.clearCallToAction ? 4 : 0, reason: "Clear call to action present" },
  ]);
}

function scoreCommerceOrBooking(evidence: ScoringEvidence) {
  const possible = SCORE_WEIGHTS.commerceOrBooking;
  return dimension("commerceOrBooking", "Booking, quoting and commerce", possible, [
    { earned: evidence.hasBooking ? 6 : 0, reason: "Online booking or appointment flow" },
    { earned: evidence.hasEcommerce ? 5 : 0, reason: "E-commerce or online checkout" },
    { earned: evidence.hasCatalogue ? 4 : 0, reason: "Product or service catalogue" },
  ]);
}

function scoreGoogleVisibility(evidence: ScoringEvidence) {
  const possible = SCORE_WEIGHTS.googleVisibility;
  return dimension("googleVisibility", "Google visibility", possible, [
    { earned: evidence.hasGoogleListing ? 3 : 0, reason: "Complete Google Business Profile" },
    {
      earned: evidence.googleRating !== null && evidence.googleRating >= 4 ? 3 : evidence.googleRating !== null ? 1 : 0,
      reason: "Google rating indicates an established customer base",
    },
    {
      earned: evidence.reviewResponseRate !== null && evidence.reviewResponseRate >= 0.5 ? 2 : 0,
      reason: "Owner responds to Google reviews",
    },
    {
      earned: evidence.googleReviewCount !== null && evidence.googleReviewCount >= 20 ? 2 : 0,
      reason: "Meaningful volume of Google reviews",
    },
  ]);
}

function scoreSocialPresence(evidence: ScoringEvidence) {
  const possible = SCORE_WEIGHTS.socialPresence;
  return dimension("socialPresence", "Social presence", possible, [
    { earned: evidence.socialLinks > 0 ? 4 : 0, reason: "Social profiles linked from the website" },
    {
      earned: evidence.socialLinks >= 3 ? 3 : evidence.socialLinks >= 1 ? 1 : 0,
      reason: "Multiple social channels in active use",
    },
    { earned: evidence.testimonials >= 2 ? 3 : evidence.testimonials >= 1 ? 1 : 0, reason: "Published customer testimonials" },
  ]);
}

function scoreAutomationOpportunity(evidence: ScoringEvidence) {
  const possible = SCORE_WEIGHTS.automationOpportunity;
  return dimension("automationOpportunity", "Workflow automation opportunity", possible, [
    { earned: evidence.contactMethods >= 2 ? 3 : evidence.contactMethods === 1 ? 1 : 0, reason: "Several manual contact channels to route" },
    { earned: evidence.hasQuoteOrForm && !evidence.hasBooking ? 3 : 0, reason: "Enquiries handled manually without self-service" },
    { earned: evidence.repetitiveContentBlocks >= 3 ? 2 : 0, reason: "Repetitive content suggests manual upkeep" },
    {
      earned: !evidence.existingChatOrAutomation ? 2 : 0,
      reason: "No chat assistant or automated response in place",
    },
  ]);
}

function scoreAiOpportunity(evidence: ScoringEvidence) {
  const possible = SCORE_WEIGHTS.aiOpportunity;
  return dimension("aiOpportunity", "AI assistant opportunity", possible, [
    { earned: evidence.contactMethods > 0 ? 2 : 0, reason: "Recurring customer questions over manual channels" },
    { earned: evidence.hasCatalogue || evidence.hasQuoteOrForm ? 2 : 0, reason: "Catalogue or enquiry volume an assistant could answer" },
    { earned: !evidence.existingChatOrAutomation ? 1 : 0, reason: "No AI assistant currently deployed" },
  ]);
}

function collectDisqualifiers(evidence: ScoringEvidence): string[] {
  const reasons: string[] = [];
  if (!evidence.hasWebsite && evidence.contactMethods === 0) {
    reasons.push("No website and no published contact channel.");
  }
  if (evidence.enterpriseSignals >= 3) {
    reasons.push("Multiple enterprise-scale signals; outside the SME target profile.");
  }
  return reasons;
}

function recommendServices(result: Omit<ScoreResult, "recommendedServices" | "disqualifiers">): TargetService[] {
  const byKey = new Map(result.dimensions.map((item) => [item.key, item]));
  const ratio = (key: ScoreDimensionKey) => {
    const item = byKey.get(key);
    if (!item) return 0;
    return item.possible === 0 ? 0 : item.earned / item.possible;
  };

  const recommendations: Array<{ service: TargetService; weight: number }> = [
    { service: "SEO_AND_GOOGLE_VISIBILITY", weight: (1 - ratio("seo")) * 3 + (1 - ratio("googleVisibility")) * 2 },
    { service: "WEBSITE", weight: (1 - ratio("websiteQuality")) * 3 },
    { service: "LEAD_CAPTURE", weight: (1 - ratio("leadCapture")) * 3 },
    { service: "BOOKING_AND_QUOTES", weight: (1 - ratio("commerceOrBooking")) * 2.5 },
    { service: "ECOMMERCE", weight: ratio("commerceOrBooking") === 0 ? 1.5 : 0 },
    { service: "SOCIAL_MEDIA", weight: (1 - ratio("socialPresence")) * 2 },
    { service: "WORKFLOW_AUTOMATION", weight: (1 - ratio("automationOpportunity")) * 2 },
    { service: "AI_ASSISTANT", weight: (1 - ratio("aiOpportunity")) * 1.5 },
  ];

  return recommendations
    .filter((item) => item.weight > 0)
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 4)
    .map((item) => item.service)
    .filter((service) => OUTREACH_TARGET_SERVICES.some((entry) => entry.value === service));
}

export function scoreOpportunity(evidence: ScoringEvidence): ScoreResult {
  const dimensions = [
    scoreWebsiteQuality(evidence),
    scoreSeo(evidence),
    scoreLeadCapture(evidence),
    scoreCommerceOrBooking(evidence),
    scoreGoogleVisibility(evidence),
    scoreSocialPresence(evidence),
    scoreAutomationOpportunity(evidence),
    scoreAiOpportunity(evidence),
  ];

  const total = clamp(
    dimensions.reduce((sum, item) => sum + item.earned, 0),
    0,
    SCORE_TOTAL
  );

  const partial = { total, dimensions, findings: dimensions.flatMap((item) => item.reasons) };
  return {
    ...partial,
    recommendedServices: recommendServices(partial),
    disqualifiers: collectDisqualifiers(evidence),
  };
}

export type { TargetService };
