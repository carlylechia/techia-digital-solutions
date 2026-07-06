import { whatsappLink } from "@/lib/email";
import type { Locale } from "@/content/site";

export const CHARIOW_CHECKOUT_ENV_KEYS = {
  fullPack: "NEXT_PUBLIC_CHARIOW_FULL_PACK_URL",
  digitalMarketingOnlineBusiness:
    "NEXT_PUBLIC_CHARIOW_DIGITAL_MARKETING_ONLINE_BUSINESS_URL",
  creativeDesignContentCreation:
    "NEXT_PUBLIC_CHARIOW_CREATIVE_DESIGN_CONTENT_CREATION_URL",
  aiTechProgramming: "NEXT_PUBLIC_CHARIOW_AI_TECH_PROGRAMMING_URL",
  officeBusinessProfessionalSkills:
    "NEXT_PUBLIC_CHARIOW_OFFICE_BUSINESS_PROFESSIONAL_SKILLS_URL",
  financeMarketEducation: "NEXT_PUBLIC_CHARIOW_FINANCE_MARKET_EDUCATION_URL",
} as const;

export type CheckoutEnvKey =
  (typeof CHARIOW_CHECKOUT_ENV_KEYS)[keyof typeof CHARIOW_CHECKOUT_ENV_KEYS];

const missingCheckoutWarnings = new Set<string>();

function cleanEnv(value: string | undefined) {
  if (!value) return "";
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function warnMissingCheckoutUrl(envKey: string) {
  if (process.env.NODE_ENV !== "development") return;
  if (missingCheckoutWarnings.has(envKey)) return;
  missingCheckoutWarnings.add(envKey);
  console.warn(
    `[courses] Missing Chariow checkout URL. Set ${envKey} to enable this academy pack checkout button.`,
  );
}

function configuredWhatsappNumber() {
  return (
    cleanEnv(process.env.NEXT_PUBLIC_OFFICIAL_WHATSAPP) ||
    cleanEnv(process.env.OFFICIAL_WHATSAPP)
  );
}

export function getChariowCheckoutUrl(envKey: CheckoutEnvKey) {
  const url = cleanEnv(process.env[envKey]);
  if (!url) warnMissingCheckoutUrl(envKey);
  return url;
}

export function getCoursesWhatsappUrl(message?: string) {
  const directUrl = cleanEnv(process.env.NEXT_PUBLIC_COURSES_WHATSAPP_URL);
  if (directUrl) {
    try {
      const url = new URL(directUrl);
      const isWhatsappHost =
        url.hostname.includes("wa.me") || url.hostname.includes("whatsapp");

      if (message && isWhatsappHost && !url.searchParams.has("text")) {
        url.searchParams.set("text", message);
        return url.toString();
      }

      return directUrl;
    } catch {
      return directUrl;
    }
  }

  const number = configuredWhatsappNumber();
  return number ? whatsappLink(number, message) : "";
}

export function getCoursesSupportEmail() {
  return (
    cleanEnv(process.env.NEXT_PUBLIC_COURSES_SUPPORT_EMAIL) ||
    cleanEnv(process.env.OFFICIAL_EMAIL) ||
    cleanEnv(process.env.CONTACT_TO_EMAIL)
  );
}

export function getCoursesBonusClaimMessage(locale: Locale) {
  if (locale === "fr") {
    return "Bonjour teChia, j'ai achete un pack de cours via la page officielle teChia Digital Academy et je veux reclamer mon Official Buyer Bonus. Voici ma confirmation de paiement Chariow.";
  }

  return "Hello teChia, I bought a course pack through the official teChia Digital Academy page and I want to claim my Official Buyer Bonus. Here is my Chariow payment confirmation.";
}

export function getCoursesBonusClaimUrl() {
  return cleanEnv(process.env.NEXT_PUBLIC_COURSES_BONUS_CLAIM_URL);
}

export function getCoursesBonusClaimDestination(locale: Locale) {
  const formUrl = getCoursesBonusClaimUrl();
  if (formUrl) {
    return {
      href: formUrl,
      channel: "form" as const,
    };
  }

  const whatsappUrl = getCoursesWhatsappUrl(getCoursesBonusClaimMessage(locale));
  if (whatsappUrl) {
    return {
      href: whatsappUrl,
      channel: "whatsapp" as const,
    };
  }

  return null;
}

export function publicBonusDownloadsEnabled() {
  return (
    cleanEnv(process.env.NEXT_PUBLIC_ENABLE_PUBLIC_BONUS_DOWNLOADS)
      .toLowerCase() === "true"
  );
}
