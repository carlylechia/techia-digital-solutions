import type { Locale } from "@/content/site";
import { getLocalizedAppPath } from "@/lib/site-routes";

export type BonusEligibility = "all-buyers" | "full-pack";
export type BonusType = "guide" | "template" | "support" | "update";

type BonusCopy = {
  title: string;
  summary: string;
};

type BonusDefinition = {
  id: string;
  eligibility: BonusEligibility;
  type: BonusType;
  filePath?: string;
  iconKey:
    | "roadmap"
    | "monetization"
    | "tracker"
    | "checkup"
    | "action-plan"
    | "support"
    | "updates";
  copy: Record<Locale, BonusCopy>;
};

export type BuyerBonusItem = {
  id: string;
  title: string;
  summary: string;
  eligibility: BonusEligibility;
  type: BonusType;
  filePath?: string;
  iconKey: BonusDefinition["iconKey"];
  downloadPath?: string;
};

const BONUS_DEFINITIONS: BonusDefinition[] = [
  {
    id: "digital-skills-learning-roadmap",
    eligibility: "all-buyers",
    type: "guide",
    filePath:
      "src/content/courses/bonuses/docx/digital-skills-learning-roadmap.docx",
    iconKey: "roadmap",
    copy: {
      en: {
        title: "Digital Skills Learning Roadmap",
        summary:
          "A premium editable roadmap workbook that helps buyers choose the right skill path, set priorities, and plan proof of learning.",
      },
      fr: {
        title: "Feuille de route des competences digitales",
        summary:
          "Un workbook premium editable pour aider les acheteurs a choisir le bon parcours, fixer les priorites et planifier des preuves d'apprentissage.",
      },
    },
  },
  {
    id: "skill-monetization-starter-guide",
    eligibility: "all-buyers",
    type: "guide",
    filePath:
      "src/content/courses/bonuses/docx/skill-monetization-starter-guide.docx",
    iconKey: "monetization",
    copy: {
      en: {
        title: "Skill Monetization Starter Guide",
        summary:
          "An editable premium workbook for turning digital skills into clear starter offers, proof assets, and professional service ideas.",
      },
      fr: {
        title: "Guide de depart pour monetiser ses competences",
        summary:
          "Un workbook premium editable pour transformer des competences digitales en offres simples, preuves de valeur et services plus professionnels.",
      },
    },
  },
  {
    id: "course-learning-tracker",
    eligibility: "all-buyers",
    type: "template",
    filePath: "src/content/courses/bonuses/docx/course-learning-tracker.docx",
    iconKey: "tracker",
    copy: {
      en: {
        title: "Course Learning Tracker",
        summary:
          "A premium editable tracker with structured tables for weekly study plans, practice logs, proof tracking, and reflection.",
      },
      fr: {
        title: "Suivi d'apprentissage des cours",
        summary:
          "Un tracker premium editable avec de vraies tables pour planifier l'etude, suivre la pratique, documenter les preuves et rester regulier.",
      },
    },
  },
  {
    id: "business-digital-checkup-template",
    eligibility: "full-pack",
    type: "template",
    filePath:
      "src/content/courses/bonuses/docx/business-digital-checkup-template.docx",
    iconKey: "checkup",
    copy: {
      en: {
        title: "Business Digital Checkup Template",
        summary:
          "A premium executive-style audit workbook with scorecards, channel reviews, and action-planning tables for business improvement.",
      },
      fr: {
        title: "Modele de diagnostic digital business",
        summary:
          "Un workbook premium de diagnostic avec scorecards, revue des canaux et tables d'action pour aider les dirigeants a mieux prioriser.",
      },
    },
  },
  {
    id: "thirty-day-digital-skills-action-plan",
    eligibility: "full-pack",
    type: "guide",
    filePath:
      "src/content/courses/bonuses/docx/thirty-day-digital-skills-action-plan.docx",
    iconKey: "action-plan",
    copy: {
      en: {
        title: "30-Day Digital Skills Action Plan",
        summary:
          "A premium editable 30-day execution workbook with a day-by-day action table, weekly reviews, and continuity planning.",
      },
      fr: {
        title: "Plan d'action competences digitales sur 30 jours",
        summary:
          "Un workbook premium editable sur 30 jours avec tableau quotidien, revues hebdomadaires et plan de continuite pour passer a l'action.",
      },
    },
  },
  {
    id: "priority-buyer-support",
    eligibility: "full-pack",
    type: "support",
    iconKey: "support",
    copy: {
      en: {
        title: "Priority Buyer Support",
        summary:
          "Full-pack buyers receive priority support for purchase, access, and bonus-claim issues.",
      },
      fr: {
        title: "Support prioritaire acheteur",
        summary:
          "Les acheteurs du pack complet recoivent un support prioritaire pour les questions d'achat, d'acces et de reclamation du bonus.",
      },
    },
  },
  {
    id: "future-resource-updates",
    eligibility: "full-pack",
    type: "update",
    iconKey: "updates",
    copy: {
      en: {
        title: "Future Resource Updates",
        summary:
          "Get early access notifications for future teChia learning resources when they become available.",
      },
      fr: {
        title: "Mises a jour de futures ressources",
        summary:
          "Recevez des notifications d'acces anticipe lorsque de nouvelles ressources d'apprentissage teChia deviennent disponibles.",
      },
    },
  },
];

export function getBuyerBonusDefinitions() {
  return BONUS_DEFINITIONS;
}

export function getBuyerBonusDefinitionById(id: string) {
  return BONUS_DEFINITIONS.find((item) => item.id === id) || null;
}

export function getBuyerBonusItems(locale: Locale) {
  return BONUS_DEFINITIONS.map<BuyerBonusItem>((item) => ({
    id: item.id,
    title: item.copy[locale].title,
    summary: item.copy[locale].summary,
    eligibility: item.eligibility,
    type: item.type,
    filePath: item.filePath,
    iconKey: item.iconKey,
    downloadPath: item.filePath
      ? getLocalizedAppPath(locale, `/courses/bonuses/${item.id}/download`)
      : undefined,
  }));
}

export function getBuyerBonusItemsByIds(locale: Locale, ids: readonly string[]) {
  const lookup = new Set(ids);
  return getBuyerBonusItems(locale).filter((item) => lookup.has(item.id));
}

export function getDeliverableBuyerBonusItems(locale: Locale) {
  return getBuyerBonusItems(locale).filter((item) => Boolean(item.filePath));
}

export function getStandardBuyerBonusItems(locale: Locale) {
  return getBuyerBonusItems(locale).filter(
    (item) => item.eligibility === "all-buyers",
  );
}

export function getFullPackExclusiveBonusItems(locale: Locale) {
  return getBuyerBonusItems(locale).filter(
    (item) => item.eligibility === "full-pack",
  );
}
