/**
 * Hard qualification rules for outreach prospects.
 *
 * A prospect is QUALIFIED only when ALL required conditions are satisfied.
 * The numerical score alone is never sufficient. If any required condition
 * fails, the prospect is DISQUALIFIED or marked REVIEW.
 *
 * These rules are deterministic and auditable: every decision traces back to
 * a specific evidence-backed condition.
 */

import type { ScoringEvidence } from "./scoring";
import type { ReadinessResult } from "./readiness";

export type QualificationStatus = "QUALIFIED" | "REVIEW" | "DISQUALIFIED";

export type QualificationInput = {
  readinessScore: number;
  readiness: ReadinessResult;
  evidence: ScoringEvidence;
  hasConcreteOpportunity: boolean;
  hasContactMethod: boolean;
  appearsActive: boolean;
  hasServiceFit: boolean;
  isSuppressed: boolean;
  isDuplicate: boolean;
  alreadyContacted: boolean;
  hasEnoughEvidence: boolean;
  minReadinessScore: number;
};

export type QualificationResult = {
  status: QualificationStatus;
  confidence: number;
  primaryOpportunity: string | null;
  primaryService: string | null;
  reason: string;
  disqualificationReason: string | null;
  recommendedNextAction: string | null;
  failedConditions: string[];
};

/**
 * Evaluate all hard qualification conditions.
 *
 * Returns QUALIFIED only when every condition passes. Returns REVIEW when
 * the score is high but some conditions are uncertain. Returns DISQUALIFIED
 * when a hard condition fails.
 */
export function evaluateQualification(input: QualificationInput): QualificationResult {
  const failedConditions: string[] = [];

  // 1. Outreach Readiness Score >= threshold
  if (input.readinessScore < input.minReadinessScore) {
    failedConditions.push(`Readiness score ${input.readinessScore} < ${input.minReadinessScore}`);
  }

  // 2. At least ONE concrete evidence-backed opportunity
  if (!input.hasConcreteOpportunity) {
    failedConditions.push("No concrete evidence-backed opportunity");
  }

  // 3. Legitimate business contact method
  if (!input.hasContactMethod) {
    failedConditions.push("No legitimate business contact method");
  }

  // 4. Active/relevant business
  if (!input.appearsActive) {
    failedConditions.push("Business does not appear active");
  }

  // 5. At least one teChia service connection
  if (!input.hasServiceFit) {
    failedConditions.push("No teChia service connection to the opportunity");
  }

  // 6. Not suppressed
  if (input.isSuppressed) {
    failedConditions.push("Prospect is suppressed");
  }

  // 7. Not a duplicate
  if (input.isDuplicate) {
    failedConditions.push("Prospect is a duplicate");
  }

  // 8. Not already contacted in a conflicting campaign
  if (input.alreadyContacted) {
    failedConditions.push("Already contacted in a conflicting campaign");
  }

  // 9. Enough evidence for personalized outreach
  if (!input.hasEnoughEvidence) {
    failedConditions.push("Insufficient evidence for personalized outreach");
  }

  // Determine status
  let status: QualificationStatus;
  if (failedConditions.length === 0) {
    status = "QUALIFIED";
  } else if (input.readinessScore >= input.minReadinessScore && failedConditions.length <= 2) {
    // Score is high but some conditions failed — needs human review
    status = "REVIEW";
  } else {
    status = "DISQUALIFIED";
  }

  // Confidence: high when all conditions pass, lower when borderline
  const confidence = status === "QUALIFIED"
    ? 0.9
    : status === "REVIEW"
      ? 0.6
      : 0.3;

  // Primary opportunity from the readiness dimensions
  const primaryOpportunity = derivePrimaryOpportunity(input.evidence, input.readiness);

  // Primary service from the evidence
  const primaryService = derivePrimaryService(input.evidence);

  // Build human-readable reason
  const reason = buildReason(status, input, failedConditions);
  const disqualificationReason = status === "QUALIFIED" ? null : failedConditions.join("; ");
  const recommendedNextAction = buildNextAction(status, input);

  return {
    status,
    confidence,
    primaryOpportunity,
    primaryService,
    reason,
    disqualificationReason,
    recommendedNextAction,
    failedConditions,
  };
}

function derivePrimaryOpportunity(evidence: ScoringEvidence, readiness: ReadinessResult): string | null {
  // Find the highest-scoring dimension with earned points
  const scored = readiness.dimensions
    .filter((d) => d.earned > 0)
    .sort((a, b) => b.earned - a.earned);

  if (scored.length === 0) return null;

  const top = scored[0];
  switch (top.key) {
    case "specificOpportunity":
      return "Lead capture / enquiry journey";
    case "contactability":
      return "Contact channel optimization";
    case "leadGeneration":
      return "Lead generation improvement";
    case "activeBusiness":
      return "Digital presence strengthening";
    case "analyzability":
      return "Website accessibility";
    case "websiteWeakness":
      return "Website conversion experience";
    case "serviceFit":
      return "Service alignment opportunity";
    default:
      return null;
  }
}

function derivePrimaryService(evidence: ScoringEvidence): string | null {
  if (!evidence.leadCaptureForm && evidence.hasWebsite) return "LEAD_CAPTURE";
  if (!evidence.hasBooking && evidence.hasWebsite) return "BOOKING_AND_QUOTES";
  if (!evidence.hasCatalogue && evidence.hasWebsite) return "CATALOGUE";
  if (!evidence.clearCallToAction && evidence.hasWebsite) return "WEBSITE";
  if (evidence.hasWebsite) return "WEBSITE";
  return null;
}

function buildReason(status: QualificationStatus, input: QualificationInput, failed: string[]): string {
  if (status === "QUALIFIED") {
    return `Readiness score ${input.readinessScore}/100 meets threshold. All qualification conditions satisfied.`;
  }
  if (status === "REVIEW") {
    return `Readiness score ${input.readinessScore}/100 is high but ${failed.length} condition(s) need review: ${failed.join("; ")}`;
  }
  return `Disqualified: ${failed.join("; ")}`;
}

function buildNextAction(status: QualificationStatus, input: QualificationInput): string | null {
  if (status === "QUALIFIED") {
    return "Generate personalized outreach email for approval";
  }
  if (status === "REVIEW") {
    return "Manual review required before outreach";
  }
  if (!input.hasContactMethod) {
    return "Search for a published contact method";
  }
  if (!input.hasConcreteOpportunity) {
    return "Look for concrete digital opportunities on the website";
  }
  return "Do not contact at this time";
}
