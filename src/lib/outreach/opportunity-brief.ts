/**
 * Evidence-backed opportunity brief.
 *
 * The email writer is only allowed to talk about things the enrichment stage
 * actually observed. This module turns deterministic facts into:
 *
 *   1. a ranked list of concrete gaps,
 *   2. the teChia service that addresses the primary gap,
 *   3. a vetted service playbook, and
 *   4. a safe fallback email that is still specific enough to be useful.
 *
 * Nothing here calls a model or reads a database. That is deliberate: the same
 * evidence always produces the same brief, so an operator can audit why a
 * message says what it says, and a model outage never leaves the queue with an
 * empty draft.
 */

import {
  OUTREACH_SERVICE_LABELS,
  getOutreachServicePlaybook,
  type OutreachServicePlaybook,
  type TargetService,
} from "./constants";
import type { ScoringEvidence } from "./scoring";

export type EvidenceGapId =
  | "no_website"
  | "no_lead_capture"
  | "no_clear_cta"
  | "no_booking"
  | "no_quote_request"
  | "no_catalogue"
  | "no_meta_description"
  | "no_page_title"
  | "no_h1"
  | "no_mobile_viewport"
  | "no_https"
  | "no_local_info"
  | "no_social_profiles"
  | "no_contact_channel"
  | "no_service_language";

export type EvidenceGap = {
  id: EvidenceGapId;
  service: TargetService;
  /** Relative usefulness for an opening message. Higher is a stronger hook. */
  strength: number;
  /** A factual statement that is true for the supplied evidence. */
  observation: string;
  /** A careful consequence, never a claim about the prospect's results. */
  implication: string;
  /** Words an email may use when referring to this gap. */
  keywords: string[];
  /** Machine-readable evidence behind the gap. */
  evidence: Record<string, string | number | boolean | null>;
};

export type OpportunityBrief = {
  businessName: string;
  city: string | null;
  industry: string | null;
  service: TargetService;
  serviceLabel: string;
  playbook: OutreachServicePlaybook;
  primaryGap: EvidenceGap | null;
  supportingGaps: EvidenceGap[];
  gaps: EvidenceGap[];
  /** Verified facts the writer may rely on. */
  evidenceFacts: string[];
  /** Claims that are not supported by this evidence. */
  forbiddenClaims: string[];
  websiteAvailable: boolean;
  /** True only when the site existed and was actually inspected. */
  websiteInspectable: boolean;
};

export type OpportunityBriefInput = {
  businessName: string;
  city?: string | null;
  industry?: string | null;
  evidence: ScoringEvidence;
  /** Deterministic service suggestion. Used only to choose between real gaps. */
  preferredService?: string | null;
  /**
   * The URL discovery found, even when the page could not be inspected. This
   * distinguishes "no website" from "website exists but was blocked".
   */
  websiteUrl?: string | null;
  /** Set when a URL exists but the page could not be read. */
  websiteInspectionFailed?: boolean;
};

function compact(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || null;
}

function gap(input: {
  id: EvidenceGapId;
  service: TargetService;
  strength: number;
  observation: string;
  implication: string;
  keywords: string[];
  evidence: Record<string, string | number | boolean | null>;
}): EvidenceGap {
  return input;
}

/**
 * Derive only gaps that the evidence proves. Website-specific checks are never
 * applied to a business without a reachable website, and unknown signals (for
 * example Google review volume) never become a gap.
 */
export function deriveEvidenceGaps(input: {
  businessName: string;
  evidence: ScoringEvidence;
  websiteAvailable: boolean;
  /** Never infer website gaps from a page that was not actually read. */
  websiteInspectionFailed?: boolean;
}): EvidenceGap[] {
  const { evidence, businessName, websiteAvailable } = input;
  const gaps: EvidenceGap[] = [];

  if (!websiteAvailable) {
    gaps.push(
      gap({
        id: "no_website",
        service: "WEBSITE",
        strength: 10,
        observation: `We could not find a website for ${businessName} in the public sources we checked.`,
        implication:
          "A customer who wants to check the services, opening hours or availability first has no single place to do that.",
        keywords: ["website", "online presence", "web presence", "website address"],
        evidence: { hasWebsite: false, contactMethods: evidence.contactMethods },
      })
    );
    return gaps;
  }

  // The site exists but could not be read. Every website-specific signal would
  // be a false negative, so no gap can be asserted from this snapshot.
  if (input.websiteInspectionFailed || !evidence.hasWebsite) return gaps;

  if (!evidence.leadCaptureForm) {
    gaps.push(
      gap({
        id: "no_lead_capture",
        service: "LEAD_CAPTURE",
        strength: 9,
        observation: "The website does not appear to include an enquiry or lead capture form.",
        implication:
          "An interested visitor has to look for a phone number or email address instead of being able to send their details in one step.",
        keywords: ["enquiry form", "contact form", "lead capture", "enquiry path", "send an enquiry"],
        evidence: { leadCaptureForm: false },
      })
    );
  }

  if (!evidence.clearCallToAction) {
    gaps.push(
      gap({
        id: "no_clear_cta",
        service: "WEBSITE",
        strength: 7,
        observation: "The website does not show a clear, repeated call to action.",
        implication:
          "Visitors have to work out the next step for themselves, which makes it easier to leave without starting a conversation.",
        keywords: ["call to action", "next step", "contact route", "clear path"],
        evidence: { clearCallToAction: false },
      })
    );
  }

  if (!evidence.hasBooking) {
    gaps.push(
      gap({
        id: "no_booking",
        service: "BOOKING_AND_QUOTES",
        strength: 8,
        observation: "The website does not appear to offer an online booking or appointment flow.",
        implication:
          "A customer who wants to book outside opening hours has to wait for a manual reply.",
        keywords: ["booking", "appointment", "schedule", "availability"],
        evidence: { hasBooking: false },
      })
    );
  }

  if (!evidence.hasQuoteOrForm) {
    gaps.push(
      gap({
        id: "no_quote_request",
        service: "BOOKING_AND_QUOTES",
        strength: 6,
        observation: "The website does not appear to include a quote or project request flow.",
        implication:
          "A customer who is ready to ask for a price has to start from a general contact route.",
        keywords: ["quote", "estimate", "project request", "request a quote"],
        evidence: { hasQuoteOrForm: false },
      })
    );
  }

  if (!evidence.hasCatalogue) {
    gaps.push(
      gap({
        id: "no_catalogue",
        service: "CATALOGUE",
        strength: 4,
        observation: "The website does not appear to present a structured product or service catalogue.",
        implication:
          "Visitors cannot easily compare the full range before deciding what to ask about.",
        keywords: ["catalogue", "catalog", "product range", "service range", "services page"],
        evidence: { hasCatalogue: false },
      })
    );
  }

  if (!evidence.metaDescriptionPresent) {
    gaps.push(
      gap({
        id: "no_meta_description",
        service: "SEO_AND_GOOGLE_VISIBILITY",
        strength: 6,
        observation: "The homepage does not include a meta description.",
        implication:
          "Search results have to rely on whatever text the search engine selects, so the listing may not communicate the offer clearly.",
        keywords: ["meta description", "search listing", "search snippet"],
        evidence: { metaDescriptionPresent: false },
      })
    );
  }

  if (!evidence.titlePresent) {
    gaps.push(
      gap({
        id: "no_page_title",
        service: "SEO_AND_GOOGLE_VISIBILITY",
        strength: 5,
        observation: "The homepage does not have a descriptive page title.",
        implication:
          "Search results and browser tabs do not clearly identify the business or its main service.",
        keywords: ["page title", "search result", "browser tab"],
        evidence: { titlePresent: false },
      })
    );
  }

  if (!evidence.h1Present) {
    gaps.push(
      gap({
        id: "no_h1",
        service: "WEBSITE",
        strength: 3,
        observation: "The homepage does not have a clear H1 heading.",
        implication:
          "The main service message is less obvious to both visitors and search engines.",
        keywords: ["heading", "H1", "main message"],
        evidence: { h1Present: false },
      })
    );
  }

  if (!evidence.viewportPresent) {
    gaps.push(
      gap({
        id: "no_mobile_viewport",
        service: "WEBSITE",
        strength: 7,
        observation: "The website does not declare a mobile viewport.",
        implication:
          "The layout may be harder to use on a phone, which is where many local customers first visit.",
        keywords: ["mobile", "phone", "responsive layout", "small screen"],
        evidence: { viewportPresent: false },
      })
    );
  }

  if (!evidence.https) {
    gaps.push(
      gap({
        id: "no_https",
        service: "WEBSITE",
        strength: 5,
        observation: "The website is not served over HTTPS.",
        implication:
          "Browsers may warn visitors that the connection is not secure.",
        keywords: ["HTTPS", "secure connection", "security certificate"],
        evidence: { https: false },
      })
    );
  }

  if (!evidence.hoursOrLocationInfo) {
    gaps.push(
      gap({
        id: "no_local_info",
        service: "SEO_AND_GOOGLE_VISIBILITY",
        strength: 4,
        observation: "The website does not appear to publish opening hours or a clear location.",
        implication:
          "Local customers have to look elsewhere for basic visit information.",
        keywords: ["opening hours", "location", "address", "visit information"],
        evidence: { hoursOrLocationInfo: false },
      })
    );
  }

  if (evidence.socialLinks === 0) {
    gaps.push(
      gap({
        id: "no_social_profiles",
        service: "SOCIAL_MEDIA",
        strength: 3,
        observation: "No social profiles are linked from the website.",
        implication:
          "Visitors who want to check recent activity have no direct path from the site.",
        keywords: ["social profiles", "social media", "recent activity"],
        evidence: { socialLinks: 0 },
      })
    );
  }

  if (evidence.contactMethods === 0) {
    gaps.push(
      gap({
        id: "no_contact_channel",
        service: "LEAD_CAPTURE",
        strength: 8,
        observation: "The website does not appear to publish a phone number, email address or contact page.",
        implication:
          "A visitor who is ready to talk has no direct way to reach the business from the site.",
        keywords: ["contact details", "phone number", "email address", "contact page"],
        evidence: { contactMethods: 0 },
      })
    );
  }

  if (evidence.serviceKeywordsInContent === 0) {
    gaps.push(
      gap({
        id: "no_service_language",
        service: "WEBSITE",
        strength: 4,
        observation: "The website does not clearly name the specific services the business offers.",
        implication:
          "A visitor cannot quickly confirm whether their particular need is covered.",
        keywords: ["services", "service pages", "what you offer", "the offer"],
        evidence: { serviceKeywordsInContent: 0 },
      })
    );
  }

  return gaps.sort((left, right) => right.strength - left.strength);
}

function buildEvidenceFacts(evidence: ScoringEvidence) {
  const facts: string[] = [];
  facts.push(evidence.hasWebsite ? "A website is published." : "No website was found in the sources checked.");
  if (evidence.hasWebsite) {
    facts.push(evidence.https ? "The website is served over HTTPS." : "The website is not served over HTTPS.");
    facts.push(evidence.titlePresent ? "The homepage has a page title." : "The homepage has no page title.");
    facts.push(evidence.metaDescriptionPresent ? "The homepage has a meta description." : "The homepage has no meta description.");
    facts.push(evidence.h1Present ? "The homepage has an H1 heading." : "The homepage has no H1 heading.");
    facts.push(evidence.viewportPresent ? "The page declares a mobile viewport." : "The page does not declare a mobile viewport.");
    facts.push(evidence.leadCaptureForm ? "An enquiry form was found." : "No enquiry form was found.");
    facts.push(evidence.clearCallToAction ? "A clear call to action was found." : "No clear call to action was found.");
    facts.push(evidence.hasBooking ? "An online booking flow was found." : "No online booking flow was found.");
    facts.push(evidence.hasQuoteOrForm ? "A quote or enquiry request path was found." : "No quote or enquiry request path was found.");
    facts.push(evidence.hasCatalogue ? "A product or service catalogue was found." : "No product or service catalogue was found.");
    facts.push(
      evidence.hoursOrLocationInfo
        ? "Opening hours or location information is published."
        : "No opening hours or location information was found."
    );
  }
  facts.push(
    evidence.contactMethods > 0
      ? `${evidence.contactMethods} contact method${evidence.contactMethods === 1 ? "" : "s"} were found on the website.`
      : "No contact method was found on the website."
  );
  facts.push(evidence.hasGoogleListing ? "A Google Business Profile is present." : "No Google Business Profile was found in the sources checked.");
  if (evidence.googleRating !== null) facts.push(`Google rating: ${evidence.googleRating}.`);
  if (evidence.googleReviewCount !== null) facts.push(`Google review count: ${evidence.googleReviewCount}.`);
  facts.push(evidence.socialLinks > 0 ? `${evidence.socialLinks} social profile link(s) were found.` : "No social profile links were found.");
  facts.push(evidence.serviceKeywordsInContent > 0 ? "The page names specific services." : "The page does not name specific services.");
  return facts;
}

function buildForbiddenClaims(evidence: ScoringEvidence) {
  const forbidden = [
    "revenue, sales, profit, traffic, conversion, customer-count or ranking figures",
    "any guarantee, promised result or risk-free outcome",
    "any price, discount, contract term or delivery deadline",
    "any claim that the business is failing or losing customers",
    "any statement about competitors",
    "any client story, case study or testimonial",
    "any urgency or deadline that is not real",
    "any claim that teChia already works with the business",
  ];
  if (evidence.googleRating === null && evidence.googleReviewCount === null) {
    forbidden.push("Google ratings or review counts");
  }
  if (evidence.testimonials === 0) {
    forbidden.push("customer testimonials or review quotes");
  }
  if (evidence.socialLinks === 0) {
    forbidden.push("the business's social media activity or followers");
  }
  if (!evidence.hasEcommerce) {
    forbidden.push("online sales or e-commerce performance");
  }
  return forbidden;
}

export function buildOpportunityBrief(input: OpportunityBriefInput): OpportunityBrief {
  const websiteAvailable = Boolean(compact(input.websiteUrl)) || input.evidence.hasWebsite;
  const websiteInspectionFailed = input.websiteInspectionFailed ?? (websiteAvailable && !input.evidence.hasWebsite);
  const gaps = deriveEvidenceGaps({
    businessName: compact(input.businessName) || "the business",
    evidence: input.evidence,
    websiteAvailable,
    websiteInspectionFailed,
  });

  const preferred = input.preferredService
    ? gaps.find((entry) => entry.service === input.preferredService)
    : null;
  const primaryGap = preferred ?? gaps[0] ?? null;
  const service = primaryGap?.service ?? "WEBSITE";
  const playbook = getOutreachServicePlaybook(service);
  const supportingGaps = gaps
    .filter((entry) => entry.id !== primaryGap?.id)
    .slice(0, 2);

  return {
    businessName: compact(input.businessName) || "the business",
    city: compact(input.city),
    industry: compact(input.industry),
    service,
    serviceLabel: OUTREACH_SERVICE_LABELS[service] ?? "Digital improvement",
    playbook,
    primaryGap,
    supportingGaps,
    gaps,
    evidenceFacts: buildEvidenceFacts(input.evidence),
    forbiddenClaims: buildForbiddenClaims(input.evidence),
    websiteAvailable,
    websiteInspectable: websiteAvailable && !websiteInspectionFailed,
  };
}

function subjectForGap(brief: OpportunityBrief) {
  const name = brief.businessName;
  switch (brief.primaryGap?.id) {
    case "no_website":
      return `A website for ${name}`;
    case "no_lead_capture":
      return `A simpler enquiry path for ${name}`;
    case "no_booking":
      return `Online booking for ${name}`;
    case "no_quote_request":
      return `A quote request path for ${name}`;
    case "no_catalogue":
      return `An online catalogue for ${name}`;
    case "no_meta_description":
    case "no_page_title":
    case "no_h1":
    case "no_local_info":
      return `Helping ${name} get found locally`;
    case "no_mobile_viewport":
      return `The mobile experience for ${name}`;
    case "no_https":
      return `A small security fix for ${name}`;
    case "no_social_profiles":
      return `A consistent social path for ${name}`;
    case "no_contact_channel":
      return `An easier way to contact ${name}`;
    case "no_service_language":
      return `Making ${name}'s services clearer online`;
    case "no_clear_cta":
      return `One clear next step for ${name}`;
    default:
      return `A digital idea for ${name}`;
  }
}

function gapParagraph(brief: OpportunityBrief) {
  if (!brief.primaryGap) {
    if (!brief.websiteInspectable) {
      return {
        observation: `I came across ${brief.businessName} while looking at ${brief.industry ?? "local"} businesses${brief.city ? ` in ${brief.city}` : ""}.`,
        implication:
          "I did not want to make assumptions about the current site without a proper look, so I will keep this short and leave the detail for a conversation.",
      };
    }
    return {
      observation: `I had a look at ${brief.businessName}'s public digital presence while reviewing ${brief.industry ?? "local"} businesses${brief.city ? ` in ${brief.city}` : ""}.`,
      implication:
        "The basics are in place, so the most useful next step is usually a short review rather than a rebuild.",
    };
  }
  return {
    observation: brief.primaryGap.observation,
    implication: brief.primaryGap.implication,
  };
}

function serviceParagraph(brief: OpportunityBrief) {
  const deliverables = brief.playbook.deliverables.slice(0, 3);
  return `At teChia Digital Solutions, we build ${brief.playbook.summary}. In practice that covers ${deliverables.join(", ")}, so ${brief.playbook.outcome}.`;
}

/**
 * A complete, provider-independent email. It is used when the model is not
 * available, returns an unsafe draft, or fails the quality gate. It is written
 * to stand on its own rather than as a stub.
 */
export function buildFallbackEmail(input: {
  brief: OpportunityBrief;
  messageType: "INITIAL" | "FOLLOW_UP_1" | "FOLLOW_UP_2";
  senderName: string;
}) {
  const { brief, senderName } = input;
  const subject = subjectForGap(brief);
  const { observation, implication } = gapParagraph(brief);
  const signature = `Best regards,\n${senderName}\nteChia Digital Solutions\nhttps://techiadigital.com`;
  const opening = brief.primaryGap?.id === "no_website"
    ? "and noticed there was no website listed."
    : brief.websiteInspectable
      ? "and spent a few minutes reviewing the website."
      : "and wanted to get in touch.";

  if (input.messageType === "FOLLOW_UP_1") {
    return {
      subject: `Re: ${subject}`,
      body: `Hello ${brief.businessName} team,\n\nI wanted to follow up briefly on my previous note about ${brief.serviceLabel.toLowerCase()}.\n\n${observation} ${implication}\n\nIf it would be useful, I can send a short outline of how we would approach this for ${brief.businessName}. No obligation at all.\n\n${signature}`,
    };
  }

  if (input.messageType === "FOLLOW_UP_2") {
    return {
      subject: `Re: ${subject}`,
      body: `Hello ${brief.businessName} team,\n\nThis is my last note on this, so I will keep it short. ${observation}\n\nIf ${brief.serviceLabel.toLowerCase()} becomes a priority, teChia Digital Solutions would be glad to help. You can simply reply to this email.\n\n${signature}`,
    };
  }

  return {
    subject,
    body: `Hello ${brief.businessName} team,\n\nI came across ${brief.businessName} while looking at ${brief.industry ?? "local"} businesses${brief.city ? ` in ${brief.city}` : ""} ${opening}\n\n${observation} ${implication}\n\n${serviceParagraph(brief)}\n\nIf it would help, I can put together a short, no-obligation outline of how this could work for ${brief.businessName}. Would that be useful?\n\n${signature}`,
  };
}

export type EmailQualityIssue =
  | "placeholder"
  | "too_short"
  | "too_long"
  | "subject_too_long"
  | "subject_shouty"
  | "subject_exclamation"
  | "missing_gap_reference"
  | "unsupported_result_claim"
  | "guarantee_language"
  | "fake_urgency"
  | "invented_statistic"
  | "fake_familiarity"
  | "generic_opening"
  | "ai_disclosure"
  | "missing_signature"
  | "unsafe_link";

const PLACEHOLDER_PATTERN = /\[[^\]]{1,60}\]|\{\{[^}]{1,60}\}\}|\b(?:business name|company name|insert|placeholder|your name here|lorem ipsum)\b/i;
const RESULT_CLAIM_PATTERN =
  /\b(?:increase|boost|grow|double|triple|maximi[sz]e|skyrocket)\b[^.!?]{0,60}\b(?:revenue|sales|profit|customers?|leads?|traffic|conversions?|bookings?|enquiries)\b/i;
const GUARANTEE_PATTERN = /\b(?:guarantee[ds]?|risk[- ]free|100\s?%|no[- ]risk|promised results?)\b/i;
const URGENCY_PATTERN = /\b(?:limited time|act now|today only|last chance|expires (?:today|tomorrow)|urgent(?:ly)? need)\b/i;
const STATISTIC_PATTERN = /\b\d+(?:\.\d+)?\s?%|\b(?:€|£|\$|FCFA|XAF)\s?\d[\d,.]*\b|\bwithin \d+ (?:days?|weeks?|months?)\b/i;
const FAMILIARITY_PATTERN = /\b(?:I(?:'ve| have) been following|I love your work|I am a big fan|we already work together|as discussed before)\b/i;
const GENERIC_OPENING_PATTERN = /\bI hope this (?:email|message) finds you well\b/i;
const AI_PATTERN = /\b(?:as an ai|language model|generated by ai|ai-generated)\b/i;
const LINK_PATTERN = /https?:\/\/[^\s<>")]+/gi;

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function allowedLink(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "techiadigital.com" || host === "www.techiadigital.com";
  } catch {
    return false;
  }
}

/**
 * Guardrails for a model-written email. The goal is not literary criticism: it
 * is to stop a confident-sounding sentence from asserting something the
 * evidence cannot support.
 */
export function reviewGeneratedEmail(input: {
  subject: string;
  body: string;
  brief: OpportunityBrief;
  messageType: "INITIAL" | "FOLLOW_UP_1" | "FOLLOW_UP_2";
  senderName: string;
}): EmailQualityIssue[] {
  const issues: EmailQualityIssue[] = [];
  const subject = input.subject.trim();
  const body = input.body.trim();
  const words = wordCount(body);
  const limit = input.messageType === "INITIAL" ? { min: 70, max: 280 } : input.messageType === "FOLLOW_UP_1" ? { min: 30, max: 160 } : { min: 20, max: 120 };

  if (words < limit.min) issues.push("too_short");
  if (words > limit.max) issues.push("too_long");
  if (subject.length > 120) issues.push("subject_too_long");
  if (/\b[A-Z]{5,}\b/.test(subject.replace(/teChia/g, ""))) issues.push("subject_shouty");
  if (subject.includes("!")) issues.push("subject_exclamation");
  if (PLACEHOLDER_PATTERN.test(`${subject}\n${body}`)) issues.push("placeholder");

  const gapKeywords = input.brief.primaryGap?.keywords ?? [];
  const mentionsGap =
    gapKeywords.length === 0 ||
    gapKeywords.some((keyword) => body.toLowerCase().includes(keyword.toLowerCase()));
  if (!mentionsGap) issues.push("missing_gap_reference");

  if (RESULT_CLAIM_PATTERN.test(body)) issues.push("unsupported_result_claim");
  if (GUARANTEE_PATTERN.test(body)) issues.push("guarantee_language");
  if (URGENCY_PATTERN.test(body)) issues.push("fake_urgency");
  if (STATISTIC_PATTERN.test(body)) issues.push("invented_statistic");
  if (FAMILIARITY_PATTERN.test(body)) issues.push("fake_familiarity");
  if (GENERIC_OPENING_PATTERN.test(body)) issues.push("generic_opening");
  if (AI_PATTERN.test(body)) issues.push("ai_disclosure");
  if (!body.includes(input.senderName) && !body.includes("teChia Digital Solutions")) issues.push("missing_signature");

  const links = body.match(LINK_PATTERN) ?? [];
  if (links.length > 1 || links.some((link) => !allowedLink(link.replace(/[.,;:]+$/, "")))) {
    issues.push("unsafe_link");
  }

  return issues;
}

/**
 * Choose the model draft only when it passes the gate. Otherwise return the
 * grounded fallback, which keeps the queue moving and is always on-message.
 */
export function finalizeEmailDraft(input: {
  subject: string;
  body: string;
  brief: OpportunityBrief;
  messageType: "INITIAL" | "FOLLOW_UP_1" | "FOLLOW_UP_2";
  senderName: string;
}) {
  const issues = reviewGeneratedEmail(input);
  if (issues.length === 0) {
    return { subject: input.subject.trim(), body: input.body.trim(), usedFallback: false, issues };
  }
  const fallback = buildFallbackEmail({
    brief: input.brief,
    messageType: input.messageType,
    senderName: input.senderName,
  });
  return { ...fallback, usedFallback: true, issues };
}
