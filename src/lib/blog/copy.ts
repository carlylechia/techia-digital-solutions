import type { BlogLocale } from "./constants";

export type BlogUiCopy = {
  searchLabel: string;
  searchPlaceholder: string;
  exploreByTopic: string;
  allTopics: string;
  categoriesNavLabel: string;
  filtersLabel: string;
  featuredEyebrow: string;
  featuredTitle: string;
  latestEyebrow: string;
  filteredEyebrow: string;
  latestTitle: string;
  resultsFor: (query: string) => string;
  articleCount: (count: number) => string;
  noMatchTitle: string;
  noMatchBody: string;
  exploreAll: string;
  noResultsTitle: string;
  emptyLocaleTitle: string;
  emptyLocaleBody: string;
  emptyLocaleLink: string;
  emptyLocaleBlockedTitle: string;
  emptyLocaleBlockedBody: string;
  emptyLocaleBlockedLink: string;
  paginationLabel: string;
  topicPaginationLabel: string;
  cardEyebrow: string;
  readArticle: string;
  breadcrumbsLabel: string;
  insightsFallback: string;
};

/**
 * Interface copy for the public blog. The blog index, topic pages, and cards
 * render editorial chrome that is not part of the site dictionary, so it is
 * translated here to keep a French visitor on a fully French page.
 */
const copy: Record<BlogLocale, BlogUiCopy> = {
  en: {
    searchLabel: "Search articles",
    searchPlaceholder: "Search practical insights",
    exploreByTopic: "Explore by topic",
    allTopics: "All",
    categoriesNavLabel: "Blog categories",
    filtersLabel: "Blog search and filters",
    featuredEyebrow: "Editor's pick",
    featuredTitle: "Featured insight",
    latestEyebrow: "Fresh thinking",
    filteredEyebrow: "Filtered reading",
    latestTitle: "Latest articles",
    resultsFor: (query) => `Results for “${query}”`,
    articleCount: (count) => `${count} ${count === 1 ? "article" : "articles"}`,
    noMatchTitle: "No published articles match that search.",
    noMatchBody: "Try a broader topic or explore all articles.",
    exploreAll: "Explore all articles",
    noResultsTitle: "No published articles in this topic yet.",
    emptyLocaleTitle: "No English articles published yet.",
    emptyLocaleBody: "Every published English article will appear here as soon as it goes live.",
    emptyLocaleLink: "Read the English articles",
    emptyLocaleBlockedTitle: "No French articles published yet.",
    emptyLocaleBlockedBody: "Our editorial team is writing the first French articles. The English articles are available in the meantime.",
    emptyLocaleBlockedLink: "Read the English articles",
    paginationLabel: "Blog pagination",
    topicPaginationLabel: "Topic pagination",
    cardEyebrow: "teChia insights",
    readArticle: "Read article",
    breadcrumbsLabel: "Breadcrumb",
    insightsFallback: "Insights",
  },
  fr: {
    searchLabel: "Rechercher un article",
    searchPlaceholder: "Rechercher un article",
    exploreByTopic: "Explorer par thème",
    allTopics: "Tous",
    categoriesNavLabel: "Catégories du blog",
    filtersLabel: "Recherche et filtres du blog",
    featuredEyebrow: "Le choix de la rédaction",
    featuredTitle: "À la une",
    latestEyebrow: "Dernières réflexions",
    filteredEyebrow: "Lecture filtrée",
    latestTitle: "Derniers articles",
    resultsFor: (query) => `Résultats pour « ${query} »`,
    articleCount: (count) => `${count} ${count === 1 ? "article" : "articles"}`,
    noMatchTitle: "Aucun article publié ne correspond à cette recherche.",
    noMatchBody: "Essayez un thème plus large ou parcourez tous les articles.",
    exploreAll: "Parcourir tous les articles",
    noResultsTitle: "Aucun article publié dans ce thème pour le moment.",
    emptyLocaleTitle: "Aucun article en anglais publié pour le moment.",
    emptyLocaleBody: "Chaque article anglais publié apparaîtra ici dès sa mise en ligne.",
    emptyLocaleLink: "Lire les articles en anglais",
    emptyLocaleBlockedTitle: "Aucun article en français publié pour le moment.",
    emptyLocaleBlockedBody: "Notre équipe éditoriale rédige les premiers articles en français. Les articles en anglais sont disponibles en attendant.",
    emptyLocaleBlockedLink: "Lire les articles en anglais",
    paginationLabel: "Pagination du blog",
    topicPaginationLabel: "Pagination du thème",
    cardEyebrow: "Analyses teChia",
    readArticle: "Lire l'article",
    breadcrumbsLabel: "Fil d'Ariane",
    insightsFallback: "Analyses",
  },
};

export function getBlogUiCopy(locale: BlogLocale): BlogUiCopy {
  return copy[locale] ?? copy.en;
}
