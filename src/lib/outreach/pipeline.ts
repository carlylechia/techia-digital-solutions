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
import { reconcileAssessment, runAssessment, runEmailGeneration } from "./ai-services";
import { enqueueJob } from "./jobs";

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

  // Ensure the new fields are available (they may be null for older records).
  const prospectWithReadiness = {
    ...prospect,
    outreachReadinessScore: prospect.outreachReadinessScore ?? 0,
    qualificationStatus: prospect.qualificationStatus ?? null,
    qualificationConfidence: prospect.qualificationConfidence ?? null,
    primaryOpportunity: prospect.primaryOpportunity ?? null,
    qualificationReason: prospect.qualificationReason ?? null,
    disqualificationReason: prospect.disqualificationReason ?? null,
    recommendedNextAction: prospect.recommendedNextAction ?? null,
  };

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
  });

  const reconciled = reconcileAssessment(
    prospect.opportunityScore,
    prospect.recommendedServices,
    result.data
  );

  // Compute qualification using the hard rules.
  // Rebuild evidence from the stored snapshot for the qualification input.
  const evidence = snapshot
    ? evidenceFrom(snapshot)
    : evidenceFrom({
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
        errorCategory: "no_snapshot",
        hasPropertyListings: false,
        hasPropertyEnquiry: false,
        hasPhoneCta: false,
        hasWhatsAppCta: false,
        hasViewingRequest: false,
        hasLocationInfo: false,
        hasServicesListed: false,
        hasAgentProfiles: false,
        hasPropertyReviews: false,
      } as WebsiteSnapshot);
  const readiness = scoreReadiness(evidence);
  const qualification = evaluateQualification({
    readinessScore: prospectWithReadiness.outreachReadinessScore,
    readiness,
    evidence,
    hasConcreteOpportunity: reconciled.opportunities.length > 0,
    hasContactMethod: prospect.publicEmail !== null || prospect.publicPhone !== null,
    appearsActive: prospect.websiteSnapshot !== null || prospect.googlePlaceId !== null,
    hasServiceFit: reconciled.recommendedServices.length > 0,
    isSuppressed: false, // Checked at send time
    isDuplicate: prospect.possibleDuplicateOfId !== null,
    alreadyContacted: prospect.emailsSentCount > 0,
    hasEnoughEvidence: reconciled.observations.length > 0,
    minReadinessScore: prospect.campaign.minReadinessScore,
  });

  const qualifies = qualification.status === "QUALIFIED";
  const needsReview = qualification.status === "REVIEW";
  const blocked = Boolean(reconciled.doNotContactReason);

  const nextStatus = blocked
    ? "DISQUALIFIED"
    : qualifies
      ? "QUALIFIED"
      : needsReview
        ? "READY_FOR_REVIEW"
        : prospect.opportunityScore >= prospect.campaign.minOpportunityScore && !reconciled.doNotContactReason
          ? "QUALIFIED"
          : "DISQUALIFIED";

  // Historical assessments are appended, never overwritten.
  await prisma.$transaction(async (tx) => {
    await tx.outreachAssessment.updateMany({ where: { prospectId, isCurrent: true }, data: { isCurrent: false } });
    await tx.outreachAssessment.create({
      data: {
        prospectId,
        model: result.model,
        promptVersion: result.promptVersion,
        sourceData: { google: googleEvidence, website: { ...websiteEvidence, pageText: undefined }, social: socialEvidence, deterministicScore: prospect.opportunityScore },
        opportunityScore: prospect.opportunityScore,
        confidence: reconciled.confidence,
        findings: { observations: reconciled.observations, opportunities: reconciled.opportunities, dimensions: assessment?.dimensions ?? [] },
        recommendations: { services: reconciled.recommendedServices, primaryService: reconciled.primaryService, reason: reconciled.reason },
        summary: reconciled.summary,
        primaryService: reconciled.primaryService,
        doNotContactReason: reconciled.doNotContactReason,
        outreachReadinessScore: prospect.outreachReadinessScore,
        qualificationStatus: qualification.status,
        qualificationConfidence: qualification.confidence,
        primaryOpportunity: qualification.primaryOpportunity,
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
        recommendedServices: reconciled.recommendedServices,
        aiSummary: reconciled.summary,
        aiReasoning: reconciled.reason,
        automationStoppedReason: blocked ? (reconciled.doNotContactReason ?? "do_not_contact") : null,
        qualificationStatus: qualification.status,
        qualificationConfidence: qualification.confidence,
        primaryOpportunity: qualification.primaryOpportunity,
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
      primaryService: reconciled.primaryService,
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
      ? `Score ${prospect.opportunityScore} >= ${prospect.campaign.minOpportunityScore}`
      : nextStatus === "READY_FOR_REVIEW"
        ? "Needs human review"
        : "Below threshold or do-not-contact",
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

  return { skipped: null, status: nextStatus, service: reconciled.primaryService };
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
  const primaryService = assessment?.primaryService ?? prospect.recommendedServices[0] ?? "WEBSITE";
  const snapshot = (prospect.websiteSnapshot ?? null) as WebsiteSnapshot | null;
  const now = new Date();

  const result = await runEmailGeneration({
    business: prospect.businessName,
    city: prospect.city ?? "",
    industry: prospect.industry ?? "",
    evidence: {
      observedWebsiteFacts: snapshot
        ? {
            title: snapshot.title,
            hasBooking: snapshot.hasBooking,
            hasEcommerce: snapshot.hasEcommerce,
            hasCatalogue: snapshot.hasCatalogue,
            leadCaptureForm: snapshot.leadCaptureForm,
            contactMethods: snapshot.contactMethods,
            socialPlatforms: snapshot.socialPlatforms,
            trustSignals: snapshot.trustSignals,
            clearCallToAction: snapshot.clearCallToAction,
            hoursOrLocationInfo: snapshot.hoursOrLocationInfo,
          }
        : "unknown",
      deterministicScore: prospect.opportunityScore,
      city: prospect.city,
      industry: prospect.industry,
    },
    primaryService,
    messageType,
    senderName: prospect.campaign.senderNameOverride ?? "Chia Carlyle",
  });

  // A test run never produces a sendable message. Forcing DRAFT here means the
  // message is not merely unsent by convention: `deliverOutreachMessage` requires
  // an approval timestamp, so even a later scheduled run cannot deliver it.
  const status = testRun ? "DRAFT" : prospect.campaign.requireApproval ? "PENDING_APPROVAL" : "APPROVED";
  const message = existing
    ? await prisma.outreachMessage.update({
        where: { id: existing.id },
        data: {
          subject: result.data.subject,
          bodyText: result.data.body,
          aiGenerated: true,
          aiPromptVersion: result.promptVersion,
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
          subject: result.data.subject,
          bodyText: result.data.body,
          aiGenerated: true,
          aiPromptVersion: result.promptVersion,
          scheduledAt: now,
        },
        select: { id: true },
      });

  await recordEvent({
    type: "EMAIL_GENERATED",
    campaignId: prospect.campaignId,
    prospectId,
    messageId: message.id,
    summary: result.data.subject.slice(0, 160),
    // `testRun` is recorded so a test artefact is identifiable in the event log
    // and in the run history, rather than looking like ordinary output.
    metadata: { messageType, model: result.model, promptVersion: result.promptVersion, status, testRun },
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
