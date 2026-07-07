export type PublicLocale = "en" | "fr";

const FRENCH_EXACT_PATH_ALIASES: Record<string, string> = {
  "/courses": "/cours",
  "/courses/bonuses": "/cours/bonus-officiels",
  "/courses/claim-bonus": "/cours/reclamer-bonus",
  "/courses/digital-skills-pack": "/cours/pack-complet-competences-digitales",
  "/courses/complete-digital-skills-pack":
    "/cours/pack-complet-competences-digitales",
  "/courses/digital-marketing-online-business":
    "/cours/marketing-digital-business-en-ligne",
  "/courses/creative-design-content-creation":
    "/cours/design-creatif-creation-contenu",
  "/courses/ai-tech-programming": "/cours/ia-tech-programmation",
  "/courses/office-business-professional-skills":
    "/cours/bureautique-business-competences-professionnelles",
  "/courses/finance-market-education": "/cours/finance-education-marche",
};

const FRENCH_REVERSE_PATH_ALIASES = Object.fromEntries(
  Object.entries(FRENCH_EXACT_PATH_ALIASES).map(
    ([internalPath, publicPath]) => [publicPath, internalPath],
  ),
) as Record<string, string>;

function findAliasMatch(
  path: string,
  aliases: Record<string, string>,
): [string, string] | null {
  const match = Object.entries(aliases)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([alias]) => path === alias || path.startsWith(`${alias}/`));

  return match || null;
}

function splitPathSuffix(path: string) {
  const match = path.match(/^([^?#]*)(.*)$/);
  return {
    pathname: match?.[1] || "/",
    suffix: match?.[2] || "",
  };
}

function normalizePathname(pathname: string) {
  if (!pathname) return "/";
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

export function localizePublicPath(locale: PublicLocale, path = "") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const { pathname, suffix } = splitPathSuffix(normalized);
  const cleanPathname = normalizePathname(pathname);

  if (locale !== "fr") {
    return `${cleanPathname}${suffix}`;
  }

  const exactPath = FRENCH_EXACT_PATH_ALIASES[cleanPathname];
  if (exactPath) {
    return `${exactPath}${suffix}`;
  }

  const nestedAlias = findAliasMatch(cleanPathname, FRENCH_EXACT_PATH_ALIASES);
  if (nestedAlias) {
    const [internalPath, publicPath] = nestedAlias;
    const remainder = cleanPathname.slice(internalPath.length);
    return `${publicPath}${remainder}${suffix}`;
  }

  if (cleanPathname === "/courses") {
    return `/cours${suffix}`;
  }

  if (cleanPathname.startsWith("/courses/")) {
    return `${cleanPathname.replace(/^\/courses/, "/cours")}${suffix}`;
  }

  return `${cleanPathname}${suffix}`;
}

export function delocalizePublicPath(locale: PublicLocale, path = "") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const { pathname, suffix } = splitPathSuffix(normalized);
  const cleanPathname = normalizePathname(pathname);

  if (locale !== "fr") {
    return `${cleanPathname}${suffix}`;
  }

  const internalPath = FRENCH_REVERSE_PATH_ALIASES[cleanPathname];
  if (internalPath) {
    return `${internalPath}${suffix}`;
  }

  const nestedAlias = findAliasMatch(cleanPathname, FRENCH_REVERSE_PATH_ALIASES);
  if (nestedAlias) {
    const [publicPath, internalBase] = nestedAlias;
    const remainder = cleanPathname.slice(publicPath.length);
    return `${internalBase}${remainder}${suffix}`;
  }

  if (cleanPathname === "/cours") {
    return `/courses${suffix}`;
  }

  if (cleanPathname.startsWith("/cours/")) {
    return `${cleanPathname.replace(/^\/cours/, "/courses")}${suffix}`;
  }

  return `${cleanPathname}${suffix}`;
}

export function getLocalizedAppPath(locale: PublicLocale, path = "") {
  const normalized = path ? (path.startsWith("/") ? path : `/${path}`) : "/";
  const publicPath = localizePublicPath(locale, normalized);
  return `/${locale}${publicPath === "/" ? "" : publicPath}`;
}
