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
 * Evaluate qualification conditions with a tiered approach.
 *
 * Only suppressed prospects are a hard block. All other conditions are soft
 * and contribute to a points-based score. A prospect with a high readiness
 * score is at least REVIEW even when some conditions fail.
 */
export function evaluateQualification(input: QualificationInput): QualificationResult {
  const hardFailures: string[] = [];
  const softFailures: string[] = [];

  // === HARD BLOCKS — always disqualify ===

  // 1. Suppressed prospects are never qualified
  if (input.isSuppressed) {
    hardFailures.push("Prospect is suppressed");
  }

  // === SOFT CONDITIONS — contribute to score ===

  // 2. Duplicates need review but don't auto-disqualify
  if (input.isDuplicate) {
    softFailures.push("Prospect is a duplicate");
  }

  // 3. Already contacted in a conflicting campaign
  if (input.alreadyContacted) {
    softFailures.push("Already contacted in a conflicting campaign");
  }

  // 4. Outreach Readiness Score >= threshold
  if (input.readinessScore < input.minReadinessScore) {
    softFailures.push(`Readiness score ${input.readinessScore} < ${input.minReadinessScore}`);
  }

  // 5. Legitimate business contact method
  if (!input.hasContactMethod) {
    softFailures.push("No legitimate business contact method");
  }

  // 6. At least ONE concrete evidence-backed opportunity
  if (!input.hasConcreteOpportunity) {
    softFailures.push("No concrete evidence-backed opportunity");
  }

  // 7. Active/relevant business
  if (!input.appearsActive) {
    softFailures.push("Business does not appear active");
  }

  // 8. At least one teChia service connection
  if (!input.hasServiceFit) {
    softFailures.push("No teChia service connection to the opportunity");
  }

  // 9. Enough evidence for personalized outreach
  if (!input.hasEnoughEvidence) {
    softFailures.push("Insufficient evidence for personalized outreach");
  }

  // === STATUS DETERMINATION ===

  let status: QualificationStatus;
  if (hardFailures.length > 0) {
    status = "DISQUALIFIED";
  } else if (softFailures.length === 0) {
    status = "QUALIFIED";
  } else if (input.readinessScore >= input.minReadinessScore * 0.6) {
    // Score is reasonably high but some conditions failed — needs human review
    status = "REVIEW";
  } else if (input.readinessScore >= 30) {
    // Has some readiness — still worth reviewing
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
  const allFailures = [...hardFailures, ...softFailures];
  const reason = buildReason(status, input, allFailures);
  const disqualificationReason = status === "QUALIFIED" ? null : allFailures.join("; ");
  const recommendedNextAction = buildNextAction(status, input);

  return {
    status,
    confidence,
    primaryOpportunity,
    primaryService,
    reason,
    disqualificationReason,
    recommendedNextAction,
    failedConditions: allFailures,
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
