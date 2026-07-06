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
    filePath: "src/content/courses/bonuses/digital-skills-learning-roadmap.md",
    iconKey: "roadmap",
    copy: {
      en: {
        title: "Digital Skills Learning Roadmap",
        summary:
          "A simple guide that helps students, job seekers, freelancers, creators, professionals, and business owners know where to start and what to focus on.",
      },
      fr: {
        title: "Feuille de route des competences digitales",
        summary:
          "Un guide simple pour aider les etudiants, chercheurs d'emploi, freelances, createurs, professionnels et dirigeants a savoir par ou commencer et quoi prioriser.",
      },
    },
  },
  {
    id: "skill-monetization-starter-guide",
    eligibility: "all-buyers",
    type: "guide",
    filePath: "src/content/courses/bonuses/skill-monetization-starter-guide.md",
    iconKey: "monetization",
    copy: {
      en: {
        title: "Skill Monetization Starter Guide",
        summary:
          "Practical ideas for turning digital skills into useful services, freelance offers, content, or business support.",
      },
      fr: {
        title: "Guide de depart pour monetiser ses competences",
        summary:
          "Des pistes pratiques pour transformer des competences digitales en services utiles, offres freelance, contenus ou appuis business.",
      },
    },
  },
  {
    id: "course-learning-tracker",
    eligibility: "all-buyers",
    type: "template",
    filePath: "src/content/courses/bonuses/course-learning-tracker.md",
    iconKey: "tracker",
    copy: {
      en: {
        title: "Course Learning Tracker",
        summary:
          "A simple tracker to help you organize your learning, track progress, and stay consistent.",
      },
      fr: {
        title: "Suivi d'apprentissage des cours",
        summary:
          "Un tracker simple pour organiser l'apprentissage, suivre les progres et rester regulier.",
      },
    },
  },
  {
    id: "business-digital-checkup-template",
    eligibility: "full-pack",
    type: "template",
    filePath:
      "src/content/courses/bonuses/business-digital-checkup-template.md",
    iconKey: "checkup",
    copy: {
      en: {
        title: "Business Digital Checkup Template",
        summary:
          "A practical checklist for business owners who want to assess their branding, online presence, customer journey, and digital systems.",
      },
      fr: {
        title: "Modele de diagnostic digital business",
        summary:
          "Une checklist pratique pour aider les dirigeants a evaluer leur marque, leur presence en ligne, leur parcours client et leurs systemes digitaux.",
      },
    },
  },
  {
    id: "thirty-day-digital-skills-action-plan",
    eligibility: "full-pack",
    type: "guide",
    filePath:
      "src/content/courses/bonuses/thirty-day-digital-skills-action-plan.md",
    iconKey: "action-plan",
    copy: {
      en: {
        title: "30-Day Digital Skills Action Plan",
        summary:
          "A focused 30-day plan to help full-pack buyers move from learning to action.",
      },
      fr: {
        title: "Plan d'action competences digitales sur 30 jours",
        summary:
          "Un plan cible sur 30 jours pour aider les acheteurs du pack complet a passer de l'apprentissage a l'action.",
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
