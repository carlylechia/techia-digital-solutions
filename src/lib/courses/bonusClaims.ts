import { createHmac } from "node:crypto";
import type {
  BonusDeliveryPreference,
  CourseBonusClaim,
  CourseBonusClaimDelivery,
} from "@prisma/client";
import { siteConfig, type Locale } from "@/content/site";
import {
  getBuyerBonusItemsByIds,
  type BuyerBonusItem,
} from "@/lib/courses/bonusPacks";
import { getCoursePackById } from "@/lib/courses/coursePacks";
import { whatsappLink } from "@/lib/email";

export const STANDARD_BONUS_IDS = [
  "digital-skills-learning-roadmap",
  "skill-monetization-starter-guide",
  "course-learning-tracker",
] as const;

export const FULL_PACK_EXTRA_BONUS_IDS = [
  "business-digital-checkup-template",
  "thirty-day-digital-skills-action-plan",
] as const;

const DELIVERY_LINK_TTL_SECONDS = 60 * 60 * 24 * 7;

function deliverySecret() {
  return (
    process.env.COURSE_BONUS_DELIVERY_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.ADMIN_PASSWORD_SEED ||
    "techia-course-bonus-secret"
  );
}

function signPayload(payload: string) {
  return createHmac("sha256", deliverySecret()).update(payload).digest("hex");
}

function isFullPackId(coursePackId: string) {
  return coursePackId === "complete-digital-skills-pack";
}

function uniqueBonusIds(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)));
}

export function getEligibleDeliverableBonusIds(coursePackId: string) {
  return isFullPackId(coursePackId)
    ? [...STANDARD_BONUS_IDS, ...FULL_PACK_EXTRA_BONUS_IDS]
    : [...STANDARD_BONUS_IDS];
}

export function getEligibleDeliverableBonusItems(
  locale: Locale,
  coursePackId: string,
) {
  return getBuyerBonusItemsByIds(locale, getEligibleDeliverableBonusIds(coursePackId));
}

export function normalizeRequestedBonusIds(
  coursePackId: string,
  requestedBonusIds: string[],
) {
  const eligible = new Set(getEligibleDeliverableBonusIds(coursePackId));
  const filtered = uniqueBonusIds(requestedBonusIds).filter((id) =>
    eligible.has(id as (typeof STANDARD_BONUS_IDS)[number]),
  );

  return filtered.length > 0
    ? filtered
    : Array.from(eligible);
}

export function getCoursePackBonusClaimSummary(
  locale: Locale,
  coursePackId: string,
) {
  const pack = getCoursePackById(locale, coursePackId);
  const title = pack?.title || coursePackId;
  const bonusItems = getEligibleDeliverableBonusItems(locale, coursePackId);

  return {
    title,
    deliverableBonusItems: bonusItems,
    includesFullPackExtras: isFullPackId(coursePackId),
  };
}

export function buildBonusDeliveryToken(
  claimId: string,
  bonusId: string,
  expiresAt: number,
) {
  return signPayload(`${claimId}:${bonusId}:${expiresAt}`);
}

export function verifyBonusDeliveryToken(
  claimId: string,
  bonusId: string,
  expiresAt: number,
  signature: string,
) {
  if (!signature) return false;
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  const expected = buildBonusDeliveryToken(claimId, bonusId, expiresAt);
  return expected === signature;
}

export function buildBonusDeliveryUrl(
  claimId: string,
  bonusId: string,
  expiresInSeconds = DELIVERY_LINK_TTL_SECONDS,
) {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  const signature = buildBonusDeliveryToken(claimId, bonusId, expiresAt);
  const url = new URL(
    `/api/courses/bonus-delivery/${claimId}/${bonusId}`,
    siteConfig.url,
  );
  url.searchParams.set("exp", String(expiresAt));
  url.searchParams.set("sig", signature);
  return url.toString();
}

export function buildBonusDeliveryBundleLinks(
  claimId: string,
  bonusIds: string[],
  locale: Locale,
) {
  return getBuyerBonusItemsByIds(locale, bonusIds).map((item) => ({
    ...item,
    deliveryUrl: buildBonusDeliveryUrl(claimId, item.id),
  }));
}

export function bonusDeliveryBaseUrlIsLocal() {
  try {
    const url = new URL(siteConfig.url);
    return /^(localhost|127\.0\.0\.1)$/i.test(url.hostname);
  } catch {
    return true;
  }
}

export function resolveClaimLocale(locale?: Locale | null): Locale {
  return locale === "fr" ? "fr" : "en";
}

export function buildBonusDeliveryEmailBody({
  locale,
  buyerName,
  coursePackTitle,
  bonusItems,
}: {
  locale: Locale;
  buyerName: string;
  coursePackTitle: string;
  bonusItems: Array<BuyerBonusItem & { deliveryUrl: string }>;
}) {
  const greeting = locale === "fr" ? "Bonjour" : "Hello";
  const intro =
    locale === "fr"
      ? `Votre Official teChia Buyer Bonus pour ${coursePackTitle} a ete verifie. Vous trouverez vos ressources ci-jointes, avec des liens de secours ci-dessous.`
      : `Your Official teChia Buyer Bonus for ${coursePackTitle} has been verified. Your bonus resources are attached, with backup links below.`;
  const outro =
    locale === "fr"
      ? "Merci d'apprendre avec teChia Digital Academy.\nDigitalize. Simplify. Grow."
      : "Thank you for learning with teChia Digital Academy.\nDigitalize. Simplify. Grow.";

  const lines = [
    `${greeting} ${buyerName},`,
    "",
    intro,
    "",
    ...bonusItems.flatMap((item, index) => [
      `${index + 1}. ${item.title}`,
      `${item.deliveryUrl}`,
      "",
    ]),
    "Bonus resources are provided as practical learning support materials. They do not guarantee income, employment, certification, or business results.",
    "",
    outro,
  ];

  return lines.join("\n");
}

export function buildBonusDeliveryWhatsappMessage({
  locale,
  buyerName,
  coursePackTitle,
  bonusItems,
  includesFullPackExtras,
}: {
  locale: Locale;
  buyerName: string;
  coursePackTitle: string;
  bonusItems: Array<BuyerBonusItem & { deliveryUrl: string }>;
  includesFullPackExtras: boolean;
}) {
  const intro =
    locale === "fr"
      ? `Bonjour ${buyerName}, votre Official teChia Buyer Bonus pour ${coursePackTitle} a ete verifie.`
      : `Hello ${buyerName}, your Official teChia Buyer Bonus for ${coursePackTitle} has been verified.`;
  const bundleNote =
    includesFullPackExtras && locale === "fr"
      ? "Votre pack complet inclut aussi le support prioritaire et les futures mises a jour de ressources lorsqu'elles seront disponibles."
      : includesFullPackExtras
        ? "Your full pack also includes priority buyer support and future resource updates when available."
        : "";

  return [
    intro,
    "",
    locale === "fr" ? "Voici vos ressources bonus :" : "Here are your bonus resources:",
    "",
    ...bonusItems.flatMap((item, index) => [
      `${index + 1}. ${item.title}`,
      item.deliveryUrl,
      "",
    ]),
    bundleNote,
    locale === "fr"
      ? "Digitalize. Simplify. Grow."
      : "Digitalize. Simplify. Grow.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildBonusClaimWhatsappUrl(options: {
  locale: Locale;
  toNumber: string;
  buyerName: string;
  coursePackTitle: string;
  includesFullPackExtras: boolean;
  bonusItems: Array<BuyerBonusItem & { deliveryUrl: string }>;
}) {
  return whatsappLink(
    options.toNumber,
    buildBonusDeliveryWhatsappMessage(options),
  );
}

type ClaimLike = Pick<
  CourseBonusClaim,
  | "id"
  | "locale"
  | "name"
  | "email"
  | "whatsapp"
  | "coursePackId"
  | "coursePackTitle"
  | "requestedBonusIds"
  | "preferredDelivery"
>;

type DeliveryLike = Pick<
  CourseBonusClaimDelivery,
  "id" | "channel" | "sentTo" | "bonusIds" | "subject" | "message" | "sentAt"
> & {
  sentBy?: { name?: string | null; email: string } | null;
};

export function serializeBonusClaimForAdmin(
  claim: ClaimLike & {
    status: string;
    adminNotes?: string | null;
    orderReference: string;
    purchaseDate?: Date | null;
    proofNotes?: string | null;
    proofUrl?: string | null;
    proofFileName?: string | null;
    proofFileType?: string | null;
    proofFileSize?: number | null;
    sourcePage?: string | null;
    createdAt: Date;
    updatedAt: Date;
    verifiedAt?: Date | null;
    fulfilledAt?: Date | null;
    verifiedBy?: { name?: string | null; email: string } | null;
    fulfilledBy?: { name?: string | null; email: string } | null;
    deliveries: DeliveryLike[];
  },
) {
  const locale = resolveClaimLocale(claim.locale);
  const requestedItems = getBuyerBonusItemsByIds(locale, claim.requestedBonusIds);
  const eligibleItems = getEligibleDeliverableBonusItems(locale, claim.coursePackId);

  return {
    ...claim,
    locale,
    requestedBonusItems: requestedItems,
    eligibleBonusItems: eligibleItems,
    includesFullPackExtras: isFullPackId(claim.coursePackId),
    preferredDelivery: claim.preferredDelivery as BonusDeliveryPreference,
    createdAt: claim.createdAt.toISOString(),
    updatedAt: claim.updatedAt.toISOString(),
    purchaseDate: claim.purchaseDate?.toISOString() || null,
    verifiedAt: claim.verifiedAt?.toISOString() || null,
    fulfilledAt: claim.fulfilledAt?.toISOString() || null,
    deliveries: claim.deliveries.map((delivery) => ({
      ...delivery,
      sentAt: delivery.sentAt.toISOString(),
    })),
  };
}

export type SerializedCourseBonusClaim = ReturnType<
  typeof serializeBonusClaimForAdmin
>;
