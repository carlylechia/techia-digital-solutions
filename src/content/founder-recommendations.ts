import type { Locale } from "@/content/site";

export type FounderRecommendation = {
  id: string;
  name: string;
  role: string;
  company: string;
  source: "LinkedIn";
  date: string;
  displayDate: string;
  status: "VISIBLE";
  quote: string;
};

type FounderRecommendationsCopy = {
  title: string;
  intro: string;
  sourceLabel: string;
  readMore: string;
  showLess: string;
  recommendedBy: string;
  viewMorePrompt: string;
  viewMoreCta: string;
  originalEnglishLabel: string;
  curatedLabel: string;
};

export const founderRecommendations: FounderRecommendation[] = [
  {
    id: "moise-mulungu-2022-04-24",
    name: "Moise Mulungu",
    role: "Student Project Reviewer (SPR)",
    company: "Microverse",
    source: "LinkedIn",
    date: "2022-04-24",
    displayDate: "Apr 24, 2022",
    status: "VISIBLE",
    quote:
      "Chia Carlyle is the kind of software developer any company would love. I built with him several Single Page Applications (SPA) using JavaScript, and React-Redux within several consecutive weeks. Anytime I got struggling with a tough data structures problem, within a few hours, He'd managed to explain a concept I'd been struggling with for days. He has a great way of simplifying complex problems into bite-sized pieces, and as a junior developer, that was really valuable for me. He's also just a fun person to chat with! If you need to get a job done simply and efficiently, Chia Carlyle is the right person for you."
  },
  {
    id: "nemwel-nyandoro-2022-04-21",
    name: "Nemwel Nyandoro",
    role: "Founder & Lead Developer",
    company: "Indago Engine",
    source: "LinkedIn",
    date: "2022-04-21",
    displayDate: "Apr 21, 2022",
    status: "VISIBLE",
    quote:
      "Chia is an amazing friend and a very smart software developer. He is usually very willing to offer help to any team member who faced any technical blockers and when he himself faced them he would always reach out for help to avoid time wastage. Chia always challenges himself to tackle tough challenges which is something that I noticed about him. He is the perfect team player who has project leader abilities but gives other people that chance so that they too can learn that invaluable soft skill. I highly recommend Chia and I would like to work with him again."
  },
  {
    id: "stanley-simeon-2022-04-19",
    name: "Stanley SIMEON",
    role: "Human Resources Positions",
    company: "Everett Public Schools MA",
    source: "LinkedIn",
    date: "2022-04-19",
    displayDate: "Apr 19, 2022",
    status: "VISIBLE",
    quote:
      "This is a great pleasure to recommend Chia Carlyle for the position of software developer. This is one of the best coding partner I was worked with during the the Microverse program. not only a colleague but also a very good teammate and even a better friend. Know how to communicate, good understanding, respectful, very smart and skilled. Always ready to help and growing his skills by helping too. Honestly I give you, Chia Carlyle my highest recommendation for every position..."
  },
  {
    id: "zahra-arshia-2022-04-15",
    name: "Zahra Arshia",
    role: "Artificial Intelligence Engineer",
    company: "Smart Giti",
    source: "LinkedIn",
    date: "2022-04-15",
    displayDate: "Apr 15, 2022",
    status: "VISIBLE",
    quote:
      "It gives me great pleasure to recommend Chia Carlyle for the position of software developer. I have known him as one of my teammates during an internship in web development. He was not only a colleague but also a very good teammate and even a better friend. He has good communication skills and a teamwork manner. I have found him very polite and respectful, also very smart and skilled. He is always ready to help teammates and juniors, and he is good at mentorship and leadership. I give Chia Carlyle my highest recommendation for the position that he is applying for."
  }
];

const founderRecommendationsCopy: Record<Locale, FounderRecommendationsCopy> = {
  en: {
    title: "LinkedIn Recommendations",
    intro:
      "These recommendations were received on Chia Carlyle’s LinkedIn profile from colleagues and collaborators who worked with him across software development, teamwork, mentorship, and technical problem-solving.",
    sourceLabel: "LinkedIn Recommendation",
    readMore: "Read full recommendation",
    showLess: "Show less",
    recommendedBy: "Recommended by",
    viewMorePrompt: "Want to see more of Chia’s professional background?",
    viewMoreCta: "View Chia on LinkedIn",
    originalEnglishLabel: "Original recommendation in English",
    curatedLabel: "Professional recommendations"
  },
  fr: {
    title: "Recommandations LinkedIn",
    intro:
      "Ces recommandations proviennent du profil LinkedIn de Chia Carlyle et ont été rédigées par des collègues et collaborateurs ayant travaillé avec lui sur le développement logiciel, le travail d’équipe, le mentorat et la résolution de problèmes techniques.",
    sourceLabel: "Recommandation LinkedIn",
    readMore: "Lire la recommandation complète",
    showLess: "Réduire",
    recommendedBy: "Recommandé par",
    viewMorePrompt: "Vous voulez en savoir plus sur le parcours professionnel de Chia ?",
    viewMoreCta: "Voir Chia sur LinkedIn",
    originalEnglishLabel: "Recommandation originale en anglais",
    curatedLabel: "Recommandations professionnelles"
  }
};

export function getFounderRecommendationsCopy(locale: Locale) {
  return founderRecommendationsCopy[locale];
}

export function getVisibleFounderRecommendations() {
  return founderRecommendations.filter((recommendation) => recommendation.status === "VISIBLE");
}

export function formatFounderRecommendationDate(locale: Locale, date: string) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00Z`));
}
