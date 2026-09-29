/**
 * Outreach Readiness Score.
 *
 * The existing opportunityScore measures whether a business has digital
 * improvement opportunities. This score answers a different question:
 *
 *   "Is this business a strong candidate for personalized cold outreach right now?"
 *
 * It is deliberately separate from the opportunity score. A business with many
 * website problems but no valid contact should NOT become a good outreach
 * prospect. A business with a beautiful website but one clear, evidence-backed
 * opportunity and a valid contact may be an excellent prospect.
 *
 * The score is deterministic: the same evidence always produces the same
 * number, and every point is traceable to a concrete observation.
 */

import type { ScoringEvidence } from "./scoring";

export type ReadinessDimensionKey =
  | "specificOpportunity"
  | "contactability"
  | "leadGeneration"
  | "activeBusiness"
  | "analyzability"
  | "websiteWeakness"
  | "serviceFit";

export const READINESS_WEIGHTS: Record<ReadinessDimensionKey, number> = {
  specificOpportunity: 25,
  contactability: 20,
  leadGeneration: 15,
  activeBusiness: 10,
  analyzability: 10,
  websiteWeakness: 10,
  serviceFit: 10,
};

export const READINESS_TOTAL = Object.values(READINESS_WEIGHTS).reduce((sum, w) => sum + w, 0);

export type ReadinessDimension = {
  key: ReadinessDimensionKey;
  label: string;
  earned: number;
  possible: number;
  reasons: string[];
};

export type ReadinessResult = {
  total: number;
  dimensions: ReadinessDimension[];
  /** Machine-readable facts that drove the score. */
  findings: string[];
  /** Hard blocks detected before scoring. */
  blockers: string[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function dimension(
  key: ReadinessDimensionKey,
  label: string,
  possible: number,
  checks: Array<{ earned: number; reason: string }>
): ReadinessDimension {
  const reasons = checks.filter((c) => c.earned > 0).map((c) => c.reason);
  const earned = clamp(
    checks.reduce((sum, c) => sum + c.earned, 0),
    0,
    possible
  );
  return { key, label, earned, possible, reasons };
}

/**
 * A. Specific visible opportunity — 25 points.
 *
 * Award points only when the enrichment evidence demonstrates a concrete,
 * observable opportunity. Unknown is unknown.
 */
function scoreSpecificOpportunity(evidence: ScoringEvidence) {
  const possible = READINESS_WEIGHTS.specificOpportunity;
  return dimension("specificOpportunity", "Specific visible opportunity", possible, [
    { earned: !evidence.leadCaptureForm && evidence.hasWebsite ? 8 : 0, reason: "Website has no lead capture form" },
    { earned: !evidence.clearCallToAction && evidence.hasWebsite ? 6 : 0, reason: "No clear call to action observed" },
    { earned: !evidence.hasBooking && evidence.hasWebsite ? 5 : 0, reason: "No booking or enquiry flow observed" },
    { earned: !evidence.hasCatalogue && evidence.hasWebsite ? 3 : 0, reason: "No catalogue or listing presentation observed" },
    { earned: !evidence.metaDescriptionPresent && evidence.hasWebsite ? 3 : 0, reason: "Page has no meta description" },
  ]);
}

/**
 * B. Valid contactability — 20 points.
 *
 * Evaluate whether a legitimate business contact method exists. Do NOT guess
 * email addresses. Do NOT manufacture addresses from names/domains.
 */
function scoreContactability(evidence: ScoringEvidence) {
  const possible = READINESS_WEIGHTS.contactability;
  return dimension("contactability", "Valid contactability", possible, [
    { earned: evidence.contactMethods >= 3 ? 10 : evidence.contactMethods >= 2 ? 7 : evidence.contactMethods >= 1 ? 4 : 0, reason: "Multiple contact channels observed" },
    { earned: evidence.hasWebsite && evidence.contactMethods > 0 ? 5 : 0, reason: "Website provides a contact path" },
    { earned: evidence.hasGoogleListing ? 5 : 0, reason: "Google Business Profile provides contact information" },
  ]);
}

/**
 * C. Clear commercial lead-generation opportunity — 15 points.
 *
 * Determine whether the identified digital issue plausibly affects how the
 * business receives enquiries, customers, bookings, property enquiries,
 * quote requests, etc.
 */
function scoreLeadGeneration(evidence: ScoringEvidence) {
  const possible = READINESS_WEIGHTS.leadGeneration;
  return dimension("leadGeneration", "Lead-generation opportunity", possible, [
    { earned: !evidence.leadCaptureForm && evidence.hasWebsite ? 8 : 0, reason: "No lead capture means potential enquiries are lost" },
    { earned: !evidence.hasQuoteOrForm && evidence.hasWebsite ? 4 : 0, reason: "No quote or enquiry request path observed" },
    { earned: !evidence.clearCallToAction && evidence.hasWebsite ? 3 : 0, reason: "No clear CTA to guide visitors toward contact" },
  ]);
}

/**
 * D. Active business signals — 10 points.
 *
 * Look for evidence that the business appears active. Do not invent activity
 * dates. Unknown should remain unknown.
 */
function scoreActiveBusiness(evidence: ScoringEvidence) {
  const possible = READINESS_WEIGHTS.activeBusiness;
  return dimension("activeBusiness", "Active business signals", possible, [
    { earned: evidence.hasWebsite ? 4 : 0, reason: "Business publishes a website" },
    { earned: evidence.hasGoogleListing ? 3 : 0, reason: "Google Business Profile exists" },
    { earned: evidence.hoursOrLocationInfo ? 3 : 0, reason: "Opening hours or location information published" },
  ]);
}

/**
 * E. Website / digital presence analyzability — 10 points.
 *
 * Award points where the engine can actually inspect a meaningful digital
 * presence. A website being imperfect is useful. A completely inaccessible
 * website should not receive points simply because it "might need improvement."
 */
function scoreAnalyzability(evidence: ScoringEvidence) {
  const possible = READINESS_WEIGHTS.analyzability;
  return dimension("analyzability", "Website analyzability", possible, [
    { earned: evidence.hasWebsite ? 4 : 0, reason: "Website is accessible" },
    { earned: evidence.https ? 2 : 0, reason: "Website serves over HTTPS" },
    { earned: evidence.titlePresent ? 2 : 0, reason: "Page has an identifiable title" },
    { earned: evidence.h1Present ? 2 : 0, reason: "Page has a clear H1" },
  ]);
}

/**
 * F. Website/mobile weakness — 10 points.
 *
 * Reward observable problems that are relevant to teChia services. Do not
 * penalize a business simply because its website is visually different from
 * teChia's preferred design.
 */
function scoreWebsiteWeakness(evidence: ScoringEvidence) {
  const possible = READINESS_WEIGHTS.websiteWeakness;
  return dimension("websiteWeakness", "Website/mobile weakness", possible, [
    { earned: evidence.hasWebsite && !evidence.viewportPresent ? 4 : 0, reason: "No mobile viewport configuration" },
    { earned: evidence.hasWebsite && !evidence.leadCaptureForm ? 3 : 0, reason: "No lead capture form on the website" },
    { earned: evidence.hasWebsite && !evidence.clearCallToAction ? 3 : 0, reason: "No clear call to action" },
  ]);
}

/**
 * G. Service fit — 10 points.
 *
 * Evaluate whether the identified opportunity matches services teChia can
 * legitimately provide. The score should be based on an observed opportunity,
 * not merely the fact that teChia offers the service.
 */
function scoreServiceFit(evidence: ScoringEvidence) {
  const possible = READINESS_WEIGHTS.serviceFit;
  return dimension("serviceFit", "Service fit", possible, [
    { earned: !evidence.leadCaptureForm && evidence.hasWebsite ? 4 : 0, reason: "Lead capture service directly applicable" },
    { earned: !evidence.hasBooking && evidence.hasWebsite ? 3 : 0, reason: "Booking/enquiry system service applicable" },
    { earned: !evidence.hasCatalogue && evidence.hasWebsite ? 3 : 0, reason: "Online catalogue service applicable" },
  ]);
}

/**
 * Compute the Outreach Readiness Score from the same evidence that drives the
 * opportunity score. The two scores are independent: a high opportunity score
 * does not guarantee a high readiness score, and vice versa.
 */
export function scoreReadiness(evidence: ScoringEvidence): ReadinessResult {
  const dimensions = [
    scoreSpecificOpportunity(evidence),
    scoreContactability(evidence),
    scoreLeadGeneration(evidence),
    scoreActiveBusiness(evidence),
    scoreAnalyzability(evidence),
    scoreWebsiteWeakness(evidence),
    scoreServiceFit(evidence),
  ];

  const total = clamp(
    dimensions.reduce((sum, d) => sum + d.earned, 0),
    0,
    READINESS_TOTAL
  );

  const blockers: string[] = [];
  if (!evidence.hasWebsite && evidence.contactMethods === 0) {
    blockers.push("No website and no published contact channel.");
  }

  return {
    total,
    dimensions,
    findings: dimensions.flatMap((d) => d.reasons),
    blockers,
  };
}
