import "server-only";

import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { OUTREACH_AI_USAGE_REQUEST_TYPE, OUTREACH_SAFETY } from "./config";
import { OUTREACH_SERVICE_LABELS } from "./constants";
import { recordEvent, recordStatusChange } from "./events";
import { enrichWebsite, evidenceFrom, type WebsiteSnapshot } from "./enrichment";
import { fetchPlaceDetails } from "./google-places";
import { incrementDailyStat, startOfUtcDay } from "./stats";
import { scoreOpportunity } from "./scoring";
import { scoreReadiness } from "./readiness";
import { evaluateQualification } from "./qualification";
import { canGenerateOutreach } from "./limits";
import { getOutreachDailyTokenUsage } from "./ai-client";
import { OutreachJobError } from "./jobs";
import { OutreachAiError, reconcileAssessment, runAssessment, runEmailGeneration } from "./ai-services";
import { enqueueJob } from "./jobs";
import { buildFallbackEmail, buildOpportunityBrief, finalizeEmailDraft } from "./opportunity-brief";

/**
 * Pipeline stages that turn a discovered place into a reviewable, evidence-backed
 * prospect. Each stage is separately queued so a failure in one never corrupts
 * the previous stage's output.
 */

function googleEvidenceFor(snapshot: WebsiteSnapshot | null, rating: number | null, reviewCount: number | null) {
  return {
    listingPresent: true,
    rating: rating ?? "unknown",
    reviewCount: reviewCount ?? "unknown",
    primaryType: snapshot?.errorCategory === null ? "unknown" : "unknown",
    websiteListed: Boolean(snapshot),
  };
}

/**
 * A neutral snapshot for records that were created before enrichment ran, or
 * whose stored snapshot is missing. It carries no implied facts: every signal is
 * false and the error category says the site was not inspected.
 */
function emptyWebsiteSnapshot(errorCategory: string): WebsiteSnapshot {
  return {
    fetchedAt: new Date().toISOString(),
    url: "",
    status: 0,
    https: false,
    title: null,
    metaDescription: null,
    hasH1: false,
    h1Text: null,
    viewportPresent: false,
    canonicalPresent: false,
    textExcerpt: "",
    socialPlatforms: [],
    contactMethods: [],
    trustSignals: [],
    testimonialSignals: 0,
    leadCaptureForm: false,
    hasBooking: false,
    hasQuoteOrForm: false,
    hasEcommerce: false,
    hasCatalogue: false,
    clearCallToAction: false,
    hoursOrLocationInfo: false,
    repetitiveContentBlocks: 0,
    existingChatOrAutomation: false,
    localAreaSignals: [],
    serviceKeywords: [],
    industryKeywords: [],
    contactPageUrl: null,
    publishedEmails: [],
    robotsRespected: true,
    errorCategory,
    hasPropertyListings: false,
    hasPropertyEnquiry: false,
    hasPhoneCta: false,
    hasWhatsAppCta: false,
    hasViewingRequest: false,
    hasLocationInfo: false,
    hasServicesListed: false,
    hasAgentProfiles: false,
    hasPropertyReviews: false,
  };
}

function scoringEvidenceFor(snapshot: WebsiteSnapshot | null) {
  return snapshot ? evidenceFrom(snapshot) : evidenceFrom(emptyWebsiteSnapshot("no_snapshot"));
}

export async function runEnrichment(prospectId: string) {
  const prisma = getPrisma();
  if (!prisma) throw new OutreachJobError("Database unavailable", { retryable: false });

  const prospect = await prisma.outreachProspect.findUnique({
    where: { id: prospectId },
    include: { campaign: true },
  });
  if (!prospect) throw new OutreachJobError("Prospect not found", { retryable: false });

  // Enrichment is the expensive step, so it is skipped for prospects that could
  // never qualify anyway.
  const threshold = prospect.campaign.minOpportunityScore;
  if (prospect.opportunityScore > 0 && prospect.opportunityScore >= threshold + 40) {
    return { skipped: "already_high_scoring" as const, score: prospect.opportunityScore };
  }

  let place = null;
  if (prospect.googlePlaceId) {
    place = await fetchPlaceDetails(prospect.googlePlaceId).catch((error) => {
      console.warn("[outreach-enrich] place_details_failed", { prospectId, error: getErrorMessage(error) });
      return null;
    });
  }

  const websiteUrl = place?.websiteUri ?? prospect.websiteUrl;
  const enrichment = websiteUrl
    ? await enrichWebsite(websiteUrl, {
        industries: prospect.campaign.industries,
        businessTypes: prospect.campaign.businessTypes,
      })
    : null;

  const snapshot = enrichment?.snapshot ?? null;
  const evidence = evidenceFrom(
    snapshot ?? {
      fetchedAt: new Date().toISOString(),
      url: "",
      status: 0,
      https: false,
      title: null,
      metaDescription: null,
      hasH1: false,
      h1Text: null,
      viewportPresent: false,
      canonicalPresent: false,
      textExcerpt: "",
      socialPlatforms: [],
      contactMethods: [],
      trustSignals: [],
      testimonialSignals: 0,
      leadCaptureForm: false,
      hasBooking: false,
      hasQuoteOrForm: false,
      hasEcommerce: false,
      hasCatalogue: false,
      clearCallToAction: false,
      hoursOrLocationInfo: false,
      repetitiveContentBlocks: 0,
      existingChatOrAutomation: false,
      localAreaSignals: [],
      serviceKeywords: [],
      industryKeywords: [],
      contactPageUrl: null,
      publishedEmails: [],
      robotsRespected: true,
      errorCategory: "no_website",
      hasPropertyListings: false,
      hasPropertyEnquiry: false,
      hasPhoneCta: false,
      hasWhatsAppCta: false,
      hasViewingRequest: false,
      hasLocationInfo: false,
      hasServicesListed: false,
      hasAgentProfiles: false,
      hasPropertyReviews: false,
    },
    { hasListing: Boolean(prospect.googlePlaceId), rating: place?.rating ?? null, reviewCount: place?.userRatingCount ?? null }
  );

  const score = scoreOpportunity(evidence);
  const readiness = scoreReadiness(evidence);
  const publishedEmail = snapshot?.publishedEmails[0] ?? null;
  const now = new Date();

  await prisma.outreachProspect.update({
    where: { id: prospectId },
    data: {
      status: score.disqualifiers.length > 0 ? "DISQUALIFIED" : "DISCOVERED",
      websiteUrl: websiteUrl ?? prospect.websiteUrl,
      contactPageUrl: snapshot?.contactPageUrl ?? prospect.contactPageUrl,
      // Only an address the business published on its own page is ever stored.
      publicEmail: publishedEmail,
      publicPhone: place?.phone ?? prospect.publicPhone,
      industry: place?.primaryType ?? prospect.industry,
      country: place?.country ?? prospect.country,
      region: place?.region ?? prospect.region,
      city: place?.city ?? prospect.city,
      websiteSnapshot: (snapshot ?? undefined) as object | undefined,
      digitalAssessment: {
        dimensions: score.dimensions.map((dimension) => ({
          key: dimension.key,
          label: dimension.label,
          earned: dimension.earned,
          possible: dimension.possible,
          reasons: dimension.reasons,
        })),
        total: score.total,
        disqualifiers: score.disqualifiers,
        websiteErrorCategory: snapshot?.errorCategory ?? null,
        placeId: prospect.googlePlaceId,
      } as object,
      opportunityScore: score.total,
      recommendedServices: score.recommendedServices,
      outreachReadinessScore: readiness.total,
      lastEnrichedAt: now,
    },
  });

  await recordEvent({
    type: "ENRICHED",
    campaignId: prospect.campaignId,
    prospectId,
    summary: `Deterministic score ${score.total}/100`,
    metadata: {
      hasWebsite: Boolean(websiteUrl),
      websiteErrorCategory: snapshot?.errorCategory ?? null,
      contactMethods: snapshot?.contactMethods ?? [],
      publishedEmailFound: Boolean(publishedEmail),
    },
  });

  if (score.disqualifiers.length > 0) {
    await recordStatusChange({ prospectId, campaignId: prospect.campaignId, from: "DISCOVERED", to: "DISQUALIFIED", reason: score.disqualifiers[0] });
    await recordEvent({ type: "DISQUALIFIED", campaignId: prospect.campaignId, prospectId, summary: score.disqualifiers[0] });
    await incrementDailyStat(prospect.campaignId, "disqualified", 1, now);
    return { skipped: "disqualified" as const, score: score.total };
  }

  await enqueueJob({
    type: "ASSESS",
    campaignId: prospect.campaignId,
    prospectId,
    dedupeKey: `ASSESS:${prospectId}`,
    payload: { threshold },
  });

  return { skipped: null, score: score.total };
}

export async function runAssessmentStage(prospectId: string) {
  const prisma = getPrisma();
  if (!prisma) throw new OutreachJobError("Database unavailable", { retryable: false });

  const prospect = await prisma.outreachProspect.findUnique({
    where: { id: prospectId },
    include: { campaign: true },
  });
  if (!prospect) throw new OutreachJobError("Prospect not found", { retryable: false });
  if (prospect.status === "DISQUALIFIED") return { skipped: "disqualified" as const };

  const dayStart = startOfUtcDay();
  const assessedToday = await prisma.outreachJob.count({
    where: { campaignId: prospect.campaignId, type: "ASSESS", status: "COMPLETED", createdAt: { gte: dayStart } },
  });
  if (assessedToday >= Math.max(0, prospect.campaign.dailyAiAssessLimit)) {
    throw new OutreachJobError("Daily AI assessment limit reached for this campaign", { retryable: true, category: "ai_quota" });
  }

  const dailyTokens = await getOutreachDailyTokenUsage();
  if (dailyTokens > 1_000_000) {
    throw new OutreachJobError("Daily outreach AI token budget exhausted", { retryable: true, category: "ai_quota" });
  }

  const snapshot = (prospect.websiteSnapshot ?? null) as WebsiteSnapshot | null;
  const assessment = (prospect.digitalAssessment ?? null) as Record<string, unknown> | null;
  const now = new Date();

  const googleEvidence = googleEvidenceFor(snapshot, null, null);
  const websiteEvidence = {
    title: snapshot?.title ?? "unknown",
    metaDescription: snapshot?.metaDescription ?? "unknown",
    hasH1: snapshot?.hasH1 ?? false,
    viewport: snapshot?.viewportPresent ?? false,
    canonical: snapshot?.canonicalPresent ?? false,
    https: snapshot?.https ?? false,
    contactMethods: snapshot?.contactMethods ?? [],
    booking: snapshot?.hasBooking ?? false,
    ecommerce: snapshot?.hasEcommerce ?? false,
    catalogue: snapshot?.hasCatalogue ?? false,
    leadCaptureForm: snapshot?.leadCaptureForm ?? false,
    clearCallToAction: snapshot?.clearCallToAction ?? false,
    trustSignals: snapshot?.trustSignals ?? [],
    localAreaSignals: snapshot?.localAreaSignals ?? [],
    pageText: (snapshot?.textExcerpt ?? "").slice(0, OUTREACH_SAFETY.maxAiEvidenceChars),
    websiteError: snapshot?.errorCategory ?? "no_website",
  };
  const socialEvidence = { platforms: snapshot?.socialPlatforms ?? [], testimonials: snapshot?.testimonialSignals ?? 0 };

  // The brief is deterministic. It is built before the model call so the model
  // sees the same facts an operator can audit, and it is reused for the
  // qualification decision rather than trusting the model's self-assessment.
  const evidence = scoringEvidenceFor(snapshot);
  const websiteInspectionFailed = Boolean(prospect.websiteUrl) && (!snapshot || Boolean(snapshot.errorCategory));
  const brief = buildOpportunityBrief({
    businessName: prospect.businessName,
    city: prospect.city,
    industry: prospect.industry,
    evidence,
    preferredService: prospect.recommendedServices[0] ?? null,
    websiteUrl: prospect.websiteUrl,
    websiteInspectionFailed,
  });

  const result = await runAssessment({
    business: prospect.businessName,
    location: [prospect.city, prospect.region, prospect.country].filter(Boolean).join(", ") || "unknown",
    industry: prospect.industry ?? "unknown",
    googleEvidence,
    websiteEvidence,
    socialEvidence,
    deterministicScore: prospect.opportunityScore,
    recommendedByRules: prospect.recommendedServices,
    threshold: prospect.campaign.minOpportunityScore,
    verifiedGaps: brief.gaps.slice(0, 4).map((gap) => gap.observation),
  });

  const reconciled = reconcileAssessment(
    prospect.opportunityScore,
    prospect.recommendedServices,
    result.data
  );

  // The deterministic gap wins over the model's service preference. The model
  // may explain the opportunity, but it cannot invent one.
  const groundedService = brief.primaryGap?.service ?? reconciled.primaryService;
  const groundedServices = brief.primaryGap && !reconciled.recommendedServices.includes(brief.service)
    ? [brief.service, ...reconciled.recommendedServices].slice(0, 6)
    : reconciled.recommendedServices;

  const readiness = scoreReadiness(evidence);
  const qualification = evaluateQualification({
    // Recompute from evidence rather than a stale stored number. Older records
    // may have a 0 stored even though their snapshot is rich.
    readinessScore: readiness.total,
    readiness,
    evidence,
    hasConcreteOpportunity: brief.gaps.length > 0,
    hasContactMethod: prospect.publicEmail !== null || prospect.publicPhone !== null,
    appearsActive: prospect.websiteSnapshot !== null || prospect.googlePlaceId !== null,
    hasServiceFit: Boolean(brief.primaryGap?.service || reconciled.recommendedServices.length > 0),
    isSuppressed: false, // Checked at send time
    isDuplicate: prospect.possibleDuplicateOfId !== null,
    alreadyContacted: prospect.emailsSentCount > 0,
    // A blocked or missing page is not evidence of a weak site, but an
    // inspected page (even a healthy one) is enough to personalize from.
    hasEnoughEvidence: brief.gaps.length > 0 || Boolean(snapshot && !snapshot.errorCategory),
    minReadinessScore: prospect.campaign.minReadinessScore,
  });

  const primaryOpportunity = brief.primaryGap?.observation ?? qualification.primaryOpportunity;
  const blocked = Boolean(reconciled.doNotContactReason);
  // Qualification is authoritative. The old fallback let a high opportunity
  // score turn a DISQUALIFIED result back into QUALIFIED, which defeated the
  // deterministic hard rules.
  const nextStatus = blocked || qualification.status === "DISQUALIFIED"
    ? "DISQUALIFIED"
    : qualification.status === "QUALIFIED"
      ? "QUALIFIED"
      : "READY_FOR_REVIEW";

  // Historical assessments are appended, never overwritten.
  await prisma.$transaction(async (tx) => {
    await tx.outreachAssessment.updateMany({ where: { prospectId, isCurrent: true }, data: { isCurrent: false } });
    await tx.outreachAssessment.create({
      data: {
        prospectId,
        model: result.model,
        promptVersion: result.promptVersion,
        sourceData: {
          google: googleEvidence,
          website: { ...websiteEvidence, pageText: undefined },
          social: socialEvidence,
          deterministicScore: prospect.opportunityScore,
          opportunityBrief: {
            primaryGap: brief.primaryGap?.id ?? null,
            primaryObservation: brief.primaryGap?.observation ?? null,
            service: groundedService,
            verifiedFacts: brief.evidenceFacts,
          },
        },
        opportunityScore: prospect.opportunityScore,
        confidence: reconciled.confidence,
        findings: {
          observations: reconciled.observations,
          opportunities: reconciled.opportunities.length > 0 ? reconciled.opportunities : brief.gaps.map((gap) => gap.observation),
          dimensions: assessment?.dimensions ?? [],
          evidenceGaps: brief.gaps.map((gap) => ({ id: gap.id, service: gap.service, observation: gap.observation })),
        },
        recommendations: { services: groundedServices, primaryService: groundedService, reason: reconciled.reason },
        summary: reconciled.summary,
        primaryService: groundedService,
        doNotContactReason: reconciled.doNotContactReason,
        outreachReadinessScore: readiness.total,
        qualificationStatus: qualification.status,
        qualificationConfidence: qualification.confidence,
        primaryOpportunity,
        qualificationReason: qualification.reason,
        disqualificationReason: qualification.disqualificationReason,
        recommendedNextAction: qualification.recommendedNextAction,
        isCurrent: true,
      },
    });

    await tx.outreachProspect.update({
      where: { id: prospectId },
      data: {
        status: nextStatus,
        opportunityScore: prospect.opportunityScore,
        recommendedServices: groundedServices,
        aiSummary: reconciled.summary,
        aiReasoning: reconciled.reason,
        automationStoppedReason: blocked ? (reconciled.doNotContactReason ?? "do_not_contact") : null,
        qualificationStatus: qualification.status,
        qualificationConfidence: qualification.confidence,
        primaryOpportunity,
        qualificationReason: qualification.reason,
        disqualificationReason: qualification.disqualificationReason,
        recommendedNextAction: qualification.recommendedNextAction,
      },
    });
  });
  await recordEvent({
    type: nextStatus === "QUALIFIED" ? "QUALIFIED" : nextStatus === "READY_FOR_REVIEW" ? "QUALIFIED" : "DISQUALIFIED",
    campaignId: prospect.campaignId,
    prospectId,
    summary: reconciled.summary.slice(0, 200),
    metadata: {
      model: result.model,
      promptVersion: result.promptVersion,
      deterministicScore: prospect.opportunityScore,
      confidence: reconciled.confidence,
      primaryService: groundedService,
      primaryGap: brief.primaryGap?.id ?? null,
      readinessScore: readiness.total,
      doNotContactReason: reconciled.doNotContactReason,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost: result.estimatedCost,
    },
  });
  await recordStatusChange({
    prospectId,
    campaignId: prospect.campaignId,
    from: prospect.status,
    to: nextStatus,
    reason: nextStatus === "QUALIFIED"
      ? qualification.reason
      : nextStatus === "READY_FOR_REVIEW"
        ? qualification.reason
        : qualification.disqualificationReason ?? "Disqualified by hard qualification rules",
  });
  await incrementDailyStat(prospect.campaignId, nextStatus === "QUALIFIED" || nextStatus === "READY_FOR_REVIEW" ? "qualified" : "disqualified", 1, now);

  if (nextStatus === "QUALIFIED") {
    await enqueueJob({
      type: "GENERATE_EMAIL",
      campaignId: prospect.campaignId,
      prospectId,
      dedupeKey: `GENERATE_EMAIL:${prospectId}:INITIAL`,
      payload: { messageType: "INITIAL" },
    });
  }

  return { skipped: null, status: nextStatus, service: groundedService };
}

/**
 * Generate one message for a prospect.
 *
 * `testRun` is set only by an administrator's Test Run. It changes two things and
 * nothing else: the message is stored as a DRAFT and labelled as a test artefact,
 * and no SEND_EMAIL job is created. Every other part of the stage — the AI call,
 * the evidence gathering, the prompt-injection and character guards — is the same
 * code the scheduled run uses, so a Test Run genuinely exercises the pipeline.
 */
export async function runEmailGenerationStage(
  prospectId: string,
  messageType: "INITIAL" | "FOLLOW_UP_1" | "FOLLOW_UP_2",
  options: { testRun?: boolean } = {}
) {
  const testRun = options.testRun ?? false;
  const prisma = getPrisma();
  if (!prisma) throw new OutreachJobError("Database unavailable", { retryable: false });

  const prospect = await prisma.outreachProspect.findUnique({
    where: { id: prospectId },
    include: { campaign: true, assessments: { where: { isCurrent: true }, take: 1, orderBy: { createdAt: "desc" } } },
  });
  if (!prospect) throw new OutreachJobError("Prospect not found", { retryable: false });
  if (!canGenerateOutreach(prospect.status)) return { skipped: "prospect_not_eligible" as const };

  const existing = await prisma.outreachMessage.findUnique({ where: { prospectId_type: { prospectId, type: messageType } }, select: { id: true, status: true } });
  if (existing && existing.status !== "DRAFT") return { skipped: "already_generated" as const };

  const assessment = prospect.assessments[0] ?? null;
  const snapshot = (prospect.websiteSnapshot ?? null) as WebsiteSnapshot | null;
  const senderName = prospect.campaign.senderNameOverride ?? "Chia Carlyle";
  const now = new Date();

  const evidence = scoringEvidenceFor(snapshot);
  // The brief selects a real observed gap. The model can no longer be talked
  // into a generic pitch by the deterministic score alone. A site that exists
  // but could not be read yields no gaps instead of false negatives.
  const websiteInspectionFailed = Boolean(prospect.websiteUrl) && (!snapshot || Boolean(snapshot.errorCategory));
  const brief = buildOpportunityBrief({
    businessName: prospect.businessName,
    city: prospect.city,
    industry: prospect.industry,
    evidence,
    preferredService: assessment?.primaryService ?? prospect.recommendedServices[0] ?? null,
    websiteUrl: prospect.websiteUrl,
    websiteInspectionFailed,
  });

  let draft: { subject: string; body: string };
  let model = "deterministic-fallback";
  let promptVersion = "OUTREACH_FALLBACK_V1";
  let qualityIssues: string[] = [];
  let usedFallback = true;

  try {
    const result = await runEmailGeneration({
      business: prospect.businessName,
      city: prospect.city ?? "",
      industry: prospect.industry ?? "",
      brief,
      messageType,
      senderName,
    });
    const finalized = finalizeEmailDraft({
      subject: result.data.subject,
      body: result.data.body,
      brief,
      messageType,
      senderName,
    });
    draft = { subject: finalized.subject, body: finalized.body };
    model = finalized.usedFallback ? "deterministic-fallback" : result.model;
    promptVersion = finalized.usedFallback ? "OUTREACH_FALLBACK_V1" : result.promptVersion;
    qualityIssues = finalized.issues;
    usedFallback = finalized.usedFallback;
  } catch (error) {
    // A malformed model response is recoverable: use the grounded fallback and
    // record why. Provider, quota and timeout failures still propagate so the
    // job system can retry them instead of quietly degrading every message.
    if (!(error instanceof OutreachAiError) || error.category !== "malformed_output") throw error;
    draft = buildFallbackEmail({ brief, messageType, senderName });
    qualityIssues = ["malformed_model_output"];
    model = "deterministic-fallback";
    promptVersion = "OUTREACH_FALLBACK_V1";
    usedFallback = true;
  }

  // A test run never produces a sendable message. Forcing DRAFT here means the
  // message is not merely unsent by convention: `deliverOutreachMessage` requires
  // an approval timestamp, so even a later scheduled run cannot deliver it.
  const status = testRun ? "DRAFT" : prospect.campaign.requireApproval ? "PENDING_APPROVAL" : "APPROVED";
  const message = existing
    ? await prisma.outreachMessage.update({
        where: { id: existing.id },
        data: {
          subject: draft.subject,
          bodyText: draft.body,
          aiGenerated: true,
          aiPromptVersion: promptVersion,
          status,
          failureReason: null,
        },
        select: { id: true },
      })
    : await prisma.outreachMessage.create({
        data: {
          prospectId,
          campaignId: prospect.campaignId,
          type: messageType,
          status,
          subject: draft.subject,
          bodyText: draft.body,
          aiGenerated: true,
          aiPromptVersion: promptVersion,
          scheduledAt: now,
        },
        select: { id: true },
      });

  await recordEvent({
    type: "EMAIL_GENERATED",
    campaignId: prospect.campaignId,
    prospectId,
    messageId: message.id,
    summary: draft.subject.slice(0, 160),
    // `testRun` is recorded so a test artefact is identifiable in the event log
    // and in the run history, rather than looking like ordinary output.
    metadata: {
      messageType,
      model,
      promptVersion,
      status,
      testRun,
      primaryGap: brief.primaryGap?.id ?? null,
      usedFallback,
      qualityIssues,
    },
  });

  // A campaign that opted out of human review moves straight to the queue. The
  // send gate still has the final word. A test run stops here: no send job is
  // created at all, so there is nothing for any later run to deliver.
  if (status === "APPROVED" && !testRun) {
    await enqueueJob({ type: "SEND_EMAIL", campaignId: prospect.campaignId, prospectId, dedupeKey: `SEND_EMAIL:${message.id}` });
  }

  return { skipped: null, messageId: message.id, status };
}

export const OUTREACH_AI_REQUEST_TYPES = OUTREACH_AI_USAGE_REQUEST_TYPE;
export { OUTREACH_SERVICE_LABELS };
