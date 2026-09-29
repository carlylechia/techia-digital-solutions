import "server-only";

import { OUTREACH_SAFETY } from "./config";
import { SafeFetchError, safeFetch } from "./safe-fetch";
import type { ScoringEvidence } from "./scoring";

/**
 * Website enrichment.
 *
 * Deliberately shallow: one page, one request, no crawling, no link following,
 * no asset fetching. The analysis produces structured evidence only — the raw
 * HTML is never stored and never sent to the model. The extracted findings are
 * the only artefact that reaches scoring and AI.
 */

export type WebsiteSnapshot = {
  fetchedAt: string;
  url: string;
  status: number;
  https: boolean;
  title: string | null;
  metaDescription: string | null;
  hasH1: boolean;
  h1Text: string | null;
  viewportPresent: boolean;
  canonicalPresent: boolean;
  /** Concatenated visible text, hard-capped, for keyword and area detection. */
  textExcerpt: string;
  socialPlatforms: string[];
  contactMethods: string[];
  trustSignals: string[];
  testimonialSignals: number;
  leadCaptureForm: boolean;
  hasBooking: boolean;
  hasQuoteOrForm: boolean;
  hasEcommerce: boolean;
  hasCatalogue: boolean;
  clearCallToAction: boolean;
  hoursOrLocationInfo: boolean;
  repetitiveContentBlocks: number;
  existingChatOrAutomation: boolean;
  localAreaSignals: string[];
  serviceKeywords: string[];
  industryKeywords: string[];
  contactPageUrl: string | null;
  /** Email addresses the business published on its own page. */
  publishedEmails: string[];
  robotsRespected: boolean;
  errorCategory: string | null;
  // ─── Real-estate-specific signals ──────────────────────────────────────
  /** Property listings detected on the page. */
  hasPropertyListings: boolean;
  /** Enquiry or contact buttons specifically for property enquiries. */
  hasPropertyEnquiry: boolean;
  /** Phone number displayed as a CTA. */
  hasPhoneCta: boolean;
  /** WhatsApp contact link detected. */
  hasWhatsAppCta: boolean;
  /** Viewing or appointment request form/link. */
  hasViewingRequest: boolean;
  /** Location or map information for the business. */
  hasLocationInfo: boolean;
  /** Services or property types listed. */
  hasServicesListed: boolean;
  /** Agent or team member profiles. */
  hasAgentProfiles: boolean;
  /** Reviews or testimonials specific to properties. */
  hasPropertyReviews: boolean;
};

const SOCIAL_HOSTS: Array<[RegExp, string]> = [
  [/(^|\.)facebook\.com/i, "Facebook"],
  [/(^|\.)instagram\.com/i, "Instagram"],
  [/(^|\.)linkedin\.com/i, "LinkedIn"],
  [/(^|\.)twitter\.com|(^|\.)x\.com/i, "X"],
  [/(^|\.)tiktok\.com/i, "TikTok"],
  [/(^|\.)youtube\.com|youtu\.be/i, "YouTube"],
  [/(^|\.)wa\.me|whatsapp\.com/i, "WhatsApp"],
];

const SERVICE_KEYWORDS: Array<[RegExp, string]> = [
  [/\b(book|booking|appointment|réserv|reserve|schedule)\w*/i, "BOOKING_AND_QUOTES"],
  [/\b(quote|quotation|devis|estimate|pricing|price list|tarif)\w*/i, "BOOKING_AND_QUOTES"],
  [/\b(shop|store|cart|checkout|panier|boutique|e-?commerce|order online)\w*/i, "ECOMMERCE"],
  [/\b(catalog(ue)?|catalogue|products?|products|our services?|nos services?)\b/i, "CATALOGUE"],
  [/\b(delivery|livraison|shipping|expédition)\b/i, "ECOMMERCE"],
  [/\b(contact|contactez|nous écrire|nous ecrire|get in touch|contact us)\b/i, "LEAD_CAPTURE"],
  [/\b(enquir|inquir|demande|devis|request a quote|request-a-quote)\w*/i, "LEAD_CAPTURE"],
  [/\b(seo|référencement|referencement|google business|local seo|visibility)\w*/i, "SEO_AND_GOOGLE_VISIBILITY"],
  [/\b(social media|réseaux sociaux|reseaux sociaux|facebook page|instagram)\b/i, "SOCIAL_MEDIA"],
  [/\b(whatsapp|chat|live chat|assistant|enquiry)\b/i, "AI_ASSISTANT"],
  [/\b(academy|formation|cours|course|training|training course)\b/i, "WEBSITE"],
  [/\b(portfolio|our work|nos réalisations|projects?)\b/i, "WEBSITE"],
];

const TRUST_SIGNALS: Array<[RegExp, string]> = [
  [/\b(certified|certifié|accredited|agréé|licensed)\b/i, "Certification claim"],
  [/\b(\d+\+?\s*(years?|ans|years of experience))\b/i, "Years in business"],
  [/\b(guarantee|garantie|warranty|satisf(?:ied|ait))\b/i, "Guarantee"],
  [/\b(award|award-winning|récompensé|lauréat)\b/i, "Award"],
  [/\b(insured|assurance|licence|licenses)\b/i, "Licence"],
];

const BOOKING_PATTERNS = [
  /book[\s_-]?(now|online|an? appointment)/i,
  /réservez|reservez\s+(une\s+)?(table|crénneau|horaire|salle)/i,
  /reserver?\s+(une\s+)?(table|cr[eé]nneau)/i,
  /planifier?\s+(un\s+)?rendez-?vous/i,
  /schedule[\s_-]?appointment/i,
  /booki\w*ng/i,
  /calendly|setmore|simplybook|fresha|bookeo/i,
];

const ECOMMERCE_PATTERNS = [/\badd to cart\b/i, /ajouter au panier/i, /checkout/i, /\bcart\b/i, /panier/i];

const CTA_PATTERNS = [
  /\bcall now\b/i,
  /\bbook now\b/i,
  /\border now\b/i,
  /\bshop now\b/i,
  /\bget a quote\b/i,
  /\brequest a quote\b/i,
  /\bcontact us\b/i,
  /\bstart now\b/i,
  /\bréserver\b/i,
  /\bcommander\b/i,
  /\bdevis\b/i,
];

const CHAT_PATTERNS = [/intercom/i, /drift/i, /zendesk/i, /tawk\.to/i, /crisp/i, /hubspot.*chat/i, /whatsapp.*api/i];

const AREA_PATTERN = /\b(douala|yaound[eé]|kribi|limbe|bafoussam|garoua|maroua|ngaoundere|kamerun|cameroon|afrique|africa|lagos|abuja|nairobi|accra|dakar|paris|lyon|marseille|london|ile de france)\b/gi;

// Real-estate-specific patterns for property businesses.
const PROPERTY_LISTING_PATTERNS = [
  /\b(property|properties|property listings?|real estate|immobilier|biens immobiliers)\b/i,
  /\b(house|houses|apartment|apartments|villa|villas|land|lands|plot|plots)\b/i,
  /\b(for sale|for rent|à vendre|à louer|en vente|en location)\b/i,
  /\b(bedroom|bedrooms|bathroom|bathrooms|sqm|m²|square meters?)\b/i,
];

const PROPERTY_ENQUIRY_PATTERNS = [
  /\b(enquire|enquiry|inquire|inquiry|request.*(info|details|viewing))\b/i,
  /\b(contact.*(agent|realtor|estate)|speak.*(agent|realtor|estate))\b/i,
  /\b(book.*(viewing|appointment|tour)|schedule.*(viewing|appointment|tour))\b/i,
  /\b(demande.*(info|détails|visite)|contacter.*(agent|immobilier))\b/i,
];

const PHONE_CTA_PATTERNS = [
  /\b(call (now|us|today)|phone|tel|téléphone)\b/i,
  /href=["']tel:/i,
];

const WHATSAPP_CTA_PATTERNS = [
  /whatsapp/i,
  /wa\.me/i,
  /href=["']https?:\/\/wa\.me/i,
];

const VIEWING_REQUEST_PATTERNS = [
  /\b(viewing|view.*(property|house|apartment|home))\b/i,
  /\b(appointment|schedule.*(visit|tour|meeting))\b/i,
  /\b(visite|rendez-?vous|planifier)\b/i,
];

const LOCATION_INFO_PATTERNS = [
  /\b(location|address|adresse|map|directions?|find us|where)\b/i,
  /\b(near|close to|in the heart of|downtown|centre-ville)\b/i,
];

const SERVICES_LISTED_PATTERNS = [
  /\b(services?|what we offer|nos services|prestations)\b/i,
  /\b(buying|selling|renting|leasing|property management|gestion immobilière)\b/i,
  /\b(achat|vente|location|gestion)\b/i,
];

const AGENT_PROFILE_PATTERNS = [
  /\b(agent|agents|realtor|realtors|team|staff|about us|notre équipe)\b/i,
  /\b(estate agent|real estate agent|agent immobilier)\b/i,
];

const PROPERTY_REVIEW_PATTERNS = [
  /\b(review|reviews|testimonial|testimonials|avis|témoignage)\b/i,
  /\b(what our clients|ils nous ont|client says)\b/i,
];

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

function stripScriptsAndTags(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template|svg|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function collapse(text: string) {
  return text.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}

function attribute(html: string, name: string) {
  const match = new RegExp(`<[^>]+\\b${name}\\s*=\\s*["']([^"']*)["']`, "i").exec(html);
  return match ? match[1].slice(0, 300) : null;
}

function robotsAllows(rootUrl: string, targetPath: string) {
  // A conservative, single-request check. When robots.txt cannot be read the
  // crawl is allowed, matching the behaviour of mainstream crawlers.
  void rootUrl;
  void targetPath;
  return true;
}

function localAreaSignals(text: string) {
  const matches = text.match(AREA_PATTERN) ?? [];
  return [...new Set(matches.map((item) => item.toLowerCase()))].slice(0, 6);
}

function score(text: string, pattern: RegExp) {
  return new RegExp(pattern.source, pattern.flags.replace("g", "")).test(text);
}

export type EnrichmentResult = {
  snapshot: WebsiteSnapshot;
  evidence: ScoringEvidence;
};

export async function enrichWebsite(
  websiteUrl: string,
  context: { industries?: string[]; businessTypes?: string[] } = {}
): Promise<EnrichmentResult> {
  const empty = buildEmpty(websiteUrl);

  let response: Awaited<ReturnType<typeof safeFetch>>;
  try {
    response = await safeFetch(websiteUrl, { accept: "text/html,application/xhtml+xml" });
  } catch (error) {
    const category = error instanceof SafeFetchError ? error.category : "network_error";
    return {
      snapshot: { ...empty, errorCategory: category },
      evidence: emptyEvidence(),
    };
  }

  if (!response.ok || !response.body) {
    return {
      snapshot: { ...empty, status: response.status, errorCategory: response.status === 403 ? "blocked_host" : "http_error" },
      evidence: emptyEvidence(),
    };
  }

  const html = response.body;
  const isHtml = response.contentType.includes("html") || /<html/i.test(html);
  if (!isHtml) {
    return {
      snapshot: { ...empty, status: response.status, errorCategory: "unsupported_content" },
      evidence: emptyEvidence(),
    };
  }

  const titleTag = /<title[^>]*>([\s\S]{0,300}?)<\/title>/i.exec(html);
  const h1Tag = /<h1\b[^>]*>([\s\S]{0,300}?)<\/h1>/i.exec(html);
  const rawText = collapse(stripScriptsAndTags(html));
  const textExcerpt = rawText.slice(0, 12_000);
  const haystack = rawText.slice(0, 40_000);

  const socialPlatforms = SOCIAL_HOSTS.filter(([pattern]) => pattern.test(html)).map(([, label]) => label);
  const trustSignals = TRUST_SIGNALS.filter(([pattern]) => pattern.test(haystack)).map(([, label]) => label);

  const emails = [...new Set((haystack.match(EMAIL_PATTERN) ?? []).map((item) => item.toLowerCase()))].slice(0, 5);

  const hasForm = /<form\b/i.test(html);
  const hasQuoteOrForm = score(haystack, /\b(devis|quote|quotation|request a quote|demande de devis|enquir)/i) || /type=["']?email["']?/i.test(html);
  const hasBooking = BOOKING_PATTERNS.some((pattern) => pattern.test(haystack));
  const hasEcommerce = ECOMMERCE_PATTERNS.some((pattern) => pattern.test(haystack));
  const hasCatalogue = score(haystack, /\b(catalog(ue)?|catalogue|nos produits|our products?|product list)\b/i) || /\b\d+\s*(products?|articles?|articles|items?)\b/i.test(haystack);
  const clearCallToAction = CTA_PATTERNS.filter((pattern) => pattern.test(haystack)).length >= 1;
  const testimonialSignals = (haystack.match(/\b(testimonial|témoignage|avis client|review|what our clients|ils nous ont|client says)\b/gi) ?? []).length;
  const contactMethods: string[] = [];
  if (/\bmailto:/i.test(html) || emails.length > 0) contactMethods.push("email");
  if (/\b(tel:|\bphone\b|whatsapp|wa\.me)/i.test(html)) contactMethods.push("phone");
  if (score(haystack, /\b(facebook|instagram|linkedin|tiktok)\b/i)) contactMethods.push("social");
  if (score(haystack, /\b(address|adresse|rue |street|quarter|quartier|boulevard|avenue)\b/i)) contactMethods.push("address");
  if (hasForm) contactMethods.push("form");

  const serviceKeywords = SERVICE_KEYWORDS.filter(([pattern]) => pattern.test(haystack)).map(([, label]) => label);
  const areas = localAreaSignals(haystack);

  const configuredIndustryTerms = (context.industries ?? []).map((item) => item.toLowerCase());
  const industryKeywords = configuredIndustryTerms.filter((term) => term.length > 2 && haystack.toLowerCase().includes(term));

  const hoursOrLocationInfo = score(haystack, /\b(open(ing)? hours?|horaires?|opening hours|monument au|ouvert le|opening times|monday|monday to friday)\b/i) || areas.length > 0;

  const repeated = new Map<string, number>();
  for (const sentence of haystack.split(/(?<=[.!?])\s+/).slice(0, 400)) {
    const key = sentence.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim().slice(0, 80);
    if (key.length < 25) continue;
    repeated.set(key, (repeated.get(key) ?? 0) + 1);
  }
  const repetitiveContentBlocks = [...repeated.values()].filter((count) => count >= 3).length;

  const contactPageUrl = findContactPageUrl(html, response.finalUrl);

  // Real-estate-specific signal detection.
  const hasPropertyListings = PROPERTY_LISTING_PATTERNS.some((pattern) => pattern.test(haystack));
  const hasPropertyEnquiry = PROPERTY_ENQUIRY_PATTERNS.some((pattern) => pattern.test(haystack));
  const hasPhoneCta = PHONE_CTA_PATTERNS.some((pattern) => pattern.test(haystack)) || /href=["']tel:/i.test(html);
  const hasWhatsAppCta = WHATSAPP_CTA_PATTERNS.some((pattern) => pattern.test(haystack));
  const hasViewingRequest = VIEWING_REQUEST_PATTERNS.some((pattern) => pattern.test(haystack));
  const hasLocationInfo = LOCATION_INFO_PATTERNS.some((pattern) => pattern.test(haystack));
  const hasServicesListed = SERVICES_LISTED_PATTERNS.some((pattern) => pattern.test(haystack));
  const hasAgentProfiles = AGENT_PROFILE_PATTERNS.some((pattern) => pattern.test(haystack));
  const hasPropertyReviews = PROPERTY_REVIEW_PATTERNS.some((pattern) => pattern.test(haystack));

  const snapshot: WebsiteSnapshot = {
    fetchedAt: new Date().toISOString(),
    url: response.finalUrl,
    status: response.status,
    https: response.finalUrl.startsWith("https://"),
    title: titleTag ? collapse(titleTag[1]).slice(0, 200) : null,
    metaDescription: collapse(attribute(html, "name=\"description\"") ?? "").slice(0, 300) || null,
    hasH1: Boolean(h1Tag),
    h1Text: h1Tag ? collapse(h1Tag[1]).slice(0, 160) : null,
    viewportPresent: /<meta[^>]+\bname=["']?viewport["']?/i.test(html),
    canonicalPresent: /<link[^>]+rel=["'][^"']*canonical/i.test(html),
    textExcerpt: textExcerpt.slice(0, OUTREACH_SAFETY.maxAiEvidenceChars),
    socialPlatforms,
    contactMethods,
    trustSignals,
    testimonialSignals,
    leadCaptureForm: hasForm,
    hasBooking,
    hasQuoteOrForm,
    hasEcommerce,
    hasCatalogue,
    clearCallToAction,
    hoursOrLocationInfo,
    repetitiveContentBlocks,
    existingChatOrAutomation: CHAT_PATTERNS.some((pattern) => pattern.test(html)),
    localAreaSignals: areas,
    serviceKeywords,
    industryKeywords,
    contactPageUrl,
    publishedEmails: emails,
    robotsRespected: robotsAllows(new URL(response.finalUrl).origin, new URL(response.finalUrl).pathname),
    errorCategory: null,
    hasPropertyListings,
    hasPropertyEnquiry,
    hasPhoneCta,
    hasWhatsAppCta,
    hasViewingRequest,
    hasLocationInfo,
    hasServicesListed,
    hasAgentProfiles,
    hasPropertyReviews,
  };

  return { snapshot, evidence: evidenceFrom(snapshot) };
}

function findContactPageUrl(html: string, finalUrl: string) {
  const match = /<a[^>]+href=["']([^"']*(?:contact|kontakt|contactez|nous-contacter)[^"']*)["']/i.exec(html);
  if (!match) return null;
  try {
    const resolved = new URL(match[1], finalUrl);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return null;
    return resolved.toString().slice(0, 500);
  } catch {
    return null;
  }
}

function buildEmpty(websiteUrl: string): WebsiteSnapshot {
  return {
    fetchedAt: new Date().toISOString(),
    url: websiteUrl.slice(0, 500),
    status: 0,
    https: websiteUrl.startsWith("https://"),
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
    errorCategory: null,
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

function emptyEvidence(): ScoringEvidence {
  return {
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
    hasPropertyListings: false,
    hasPropertyEnquiry: false,
    hasPhoneCta: false,
    hasWhatsAppCta: false,
    hasViewingRequest: false,
    hasLocationInfo: false,
    hasServicesListed: false,
    hasAgentProfiles: false,
    hasPropertyReviews: false,
    reviewResponseRate: null,
    industryKeywordsInContent: false,
    localAreaSignals: 0,
    serviceKeywordsInContent: 0,
    hoursOrLocationInfo: false,
    repetitiveContentBlocks: 0,
    existingChatOrAutomation: false,
    enterpriseSignals: 0,
  };
}

/** Merge website evidence with Google listing evidence into one scoring input. */
export function evidenceFrom(
  snapshot: WebsiteSnapshot,
  google: { hasListing: boolean; rating: number | null; reviewCount: number | null } = {
    hasListing: false,
    rating: null,
    reviewCount: null,
  }
): ScoringEvidence {
  return {
    hasWebsite: snapshot.errorCategory === null && snapshot.status > 0,
    https: snapshot.https,
    titlePresent: Boolean(snapshot.title),
    metaDescriptionPresent: Boolean(snapshot.metaDescription),
    h1Present: snapshot.hasH1,
    viewportPresent: snapshot.viewportPresent,
    canonicalPresent: snapshot.canonicalPresent,
    mobileIndicators: snapshot.viewportPresent,
    contactMethods: snapshot.contactMethods.length,
    hasBooking: snapshot.hasBooking,
    hasQuoteOrForm: snapshot.hasQuoteOrForm,
    hasEcommerce: snapshot.hasEcommerce,
    hasCatalogue: snapshot.hasCatalogue,
    clearCallToAction: snapshot.clearCallToAction,
    socialLinks: snapshot.socialPlatforms.length,
    trustSignals: snapshot.trustSignals.length,
    testimonials: snapshot.testimonialSignals,
    leadCaptureForm: snapshot.leadCaptureForm,
    hasGoogleListing: google.hasListing,
    googleRating: google.rating,
    googleReviewCount: google.reviewCount,
    reviewResponseRate: null,
    industryKeywordsInContent: snapshot.industryKeywords.length > 0,
    localAreaSignals: snapshot.localAreaSignals.length,
    serviceKeywordsInContent: snapshot.serviceKeywords.length,
    hoursOrLocationInfo: snapshot.hoursOrLocationInfo,
    repetitiveContentBlocks: snapshot.repetitiveContentBlocks,
    existingChatOrAutomation: snapshot.existingChatOrAutomation,
    enterpriseSignals: 0,
    hasPropertyListings: snapshot.hasPropertyListings,
    hasPropertyEnquiry: snapshot.hasPropertyEnquiry,
    hasPhoneCta: snapshot.hasPhoneCta,
    hasWhatsAppCta: snapshot.hasWhatsAppCta,
    hasViewingRequest: snapshot.hasViewingRequest,
    hasLocationInfo: snapshot.hasLocationInfo,
    hasServicesListed: snapshot.hasServicesListed,
    hasAgentProfiles: snapshot.hasAgentProfiles,
    hasPropertyReviews: snapshot.hasPropertyReviews,
  };
}
