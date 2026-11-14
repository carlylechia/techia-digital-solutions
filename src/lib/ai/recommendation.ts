import { delocalizePublicPath, getPublicAppPath } from "@/lib/site-routes";

export type AcademyRecommendationType = "course" | "pack";

export type AcademyRecommendation = {
  type: AcademyRecommendationType;
  slug: string;
  title: string;
  productPath: string;
  checkoutPath: string | null;
  priceLabel: string | null;
};

export type RecommendationRef = {
  type: AcademyRecommendationType;
  slug: string;
};

export type RecommendationCandidate = {
  type?: AcademyRecommendationType;
  slug: string;
  source: "marker" | "checkout" | "product";
};

const MARKER_PATTERN =
  /\[\[\s*TECHIA_RECOMMEND\s*:\s*(course|pack)\s*:\s*([A-Za-z0-9][A-Za-z0-9_-]*)\s*\]\]/gi;
const CHECKOUT_PATTERN =
  /\/courses\/checkout\?item=(course|pack):([A-Za-z0-9%._~-]+)/gi;
const PRODUCT_PATTERN = /\/(?:courses|cours)\/([A-Za-z0-9][A-Za-z0-9_-]*)/gi;
const RESERVED_PRODUCT_SLUGS = new Set([
  "checkout",
  "bonuses",
  "claim-bonus",
  "return",
]);

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function validSlug(value: string) {
  return /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(value);
}

function pushCandidate(
  candidates: RecommendationCandidate[],
  candidate: RecommendationCandidate,
) {
  if (!validSlug(candidate.slug)) return;
  if (
    candidates.some(
      (existing) =>
        existing.type === candidate.type &&
        existing.slug === candidate.slug &&
        existing.source === candidate.source,
    )
  ) {
    return;
  }
  candidates.push(candidate);
}

/**
 * Reads the hidden marker first, then explicit checkout links, then ordinary
 * course/pack links. The model is instructed to emit the marker, but the
 * link fallbacks keep older conversations working too.
 */
export function extractRecommendationCandidates(
  message: string,
): RecommendationCandidate[] {
  const candidates: RecommendationCandidate[] = [];

  for (const match of message.matchAll(MARKER_PATTERN)) {
    pushCandidate(candidates, {
      type: match[1].toLowerCase() as AcademyRecommendationType,
      slug: match[2],
      source: "marker",
    });
  }

  for (const match of message.matchAll(CHECKOUT_PATTERN)) {
    pushCandidate(candidates, {
      type: match[1].toLowerCase() as AcademyRecommendationType,
      slug: safeDecode(match[2]),
      source: "checkout",
    });
  }

  for (const match of message.matchAll(PRODUCT_PATTERN)) {
    const rawSlug = match[1];
    if (RESERVED_PRODUCT_SLUGS.has(rawSlug.toLowerCase())) continue;

    let slug = rawSlug;
    if (match[0].startsWith("/cours/")) {
      const internalPath = delocalizePublicPath("fr", match[0]);
      const internalSlug = internalPath.split("/").filter(Boolean).at(-1);
      if (internalSlug) slug = internalSlug;
    }

    pushCandidate(candidates, {
      slug,
      source: "product",
    });
  }

  return candidates;
}

export function stripRecommendationMarkers(message: string) {
  return message
    .replace(MARKER_PATTERN, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const PURCHASE_INTENT_PATTERN =
  /\b(yes|yeah|yep|sure|okay|ok|buy|buying|purchase|purchasing|enroll|enrolling|checkout|pay|paying|sign me up|i want it|i'll take it|i will take it|let'?s do it|let'?s go|sounds good|go ahead|proceed|i'?m in)\b|\b(oui|ouais|d'accord|acheter|payer|paiement|inscrire|inscription|je le veux|je la veux|je prends|allons-y|je suis prêt|je suis prête|c'?est bon|procéder)\b/i;

/**
 * Only used when a recommendation is already known. Kept deliberately narrow so
 * "what should I start with?" does not look like a purchase confirmation.
 */
export function isPurchaseIntent(message: string) {
  return PURCHASE_INTENT_PATTERN.test(message);
}

export function recommendationKey(
  recommendation: Pick<AcademyRecommendation, "type" | "slug">,
) {
  return `${recommendation.type}:${recommendation.slug}`;
}

export function buildCheckoutPath(
  type: AcademyRecommendationType,
  slug: string,
) {
  return getPublicAppPath(
    `/courses/checkout?item=${type}:${encodeURIComponent(slug)}`,
  );
}

export function messageMentionsCheckout(
  message: string,
  recommendation: AcademyRecommendation,
) {
  const encodedSlug = encodeURIComponent(recommendation.slug);
  return (
    message.includes(`item=${recommendation.type}:${recommendation.slug}`) ||
    message.includes(`item=${recommendation.type}:${encodedSlug}`)
  );
}

export function messageMentionsSlug(message: string, slug: string) {
  return message.includes(slug) || message.includes(encodeURIComponent(slug));
}

export function buildCheckoutMessage(
  recommendation: AcademyRecommendation,
  leadCaptured: boolean,
) {
  const href = recommendation.checkoutPath ?? recommendation.productPath;
  const action = recommendation.checkoutPath
    ? `Continue to secure checkout for ${recommendation.title}`
    : `View ${recommendation.title}`;
  const leadLine = leadCaptured
    ? "Your details are saved."
    : "Share your details in the short form below, then continue to secure checkout.";
  return `${leadLine}\n\n[${action}](${href})`;
}
