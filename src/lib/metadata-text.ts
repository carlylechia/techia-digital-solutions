const BRAND_SUFFIX_PATTERN =
  /\s+[—–|-]\s+teChia(?:\s+Digital(?:\s+Solutions)?)?(?:\s+(?:Insights|Academy))?$/i;

const BRAND_SUFFIX_OPTIONS = [
  " | teChia Digital Solutions",
  " | teChia Digital",
  " | teChia",
] as const;

const COMPLETE_TRAINING_PREFIX = "Complete Training in ";

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function truncateAtWord(value: string, max: number) {
  if (value.length <= max) return value;
  const slice = value.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace >= 30 ? slice.slice(0, lastSpace) : slice;
  return cut.replace(/[\s,;:—–|.-]+$/u, "").trim();
}

function appendBrand(base: string, max: number) {
  for (const suffix of BRAND_SUFFIX_OPTIONS) {
    if (base.length + suffix.length <= max) return `${base}${suffix}`;
  }
  return base;
}

function shortenForSearch(value: string, min: number, max: number) {
  if (value.length >= min && value.length <= max) return value;

  const withoutBrand = value.replace(BRAND_SUFFIX_PATTERN, "").trim();
  if (withoutBrand.length >= min && withoutBrand.length <= max) {
    return withoutBrand;
  }

  const colonIndex = withoutBrand.indexOf(": ");
  if (colonIndex >= min && colonIndex <= max) {
    return withoutBrand.slice(0, colonIndex).trim();
  }

  const withoutParenthetical = withoutBrand
    .replace(/\s*\([^()]*\)\s*$/u, "")
    .trim();
  if (
    withoutParenthetical.length >= min &&
    withoutParenthetical.length <= max
  ) {
    return withoutParenthetical;
  }

  if (withoutParenthetical.startsWith(COMPLETE_TRAINING_PREFIX)) {
    const courseName = withoutParenthetical
      .slice(COMPLETE_TRAINING_PREFIX.length)
      .trim();
    if (courseName.length >= min && courseName.length <= max) {
      return courseName;
    }
    if (courseName.length < min) {
      return appendBrand(courseName, max);
    }
  }

  const truncated = truncateAtWord(withoutParenthetical, max);
  return truncated.length < min ? appendBrand(truncated, max) : truncated;
}

/**
 * Keeps metadata titles inside the range search engines display in full.
 * Long CMS titles lose a redundant brand suffix, a subtitle, or a trailing
 * parenthetical before any word-boundary truncation. Short titles gain a
 * brand suffix only when it still fits inside the maximum length.
 */
export function fitTitle(
  title: string,
  { min = 30, max = 60 }: { min?: number; max?: number } = {},
) {
  const clean = normalize(title);
  if (!clean) return clean;
  if (clean.length >= min && clean.length <= max) return clean;
  if (clean.length > max) return shortenForSearch(clean, min, max);

  const base = clean.replace(BRAND_SUFFIX_PATTERN, "").trim() || clean;
  return appendBrand(base, max);
}

/**
 * Truncates descriptions to the requested maximum, counting the ellipsis as
 * part of the final length so crawlers never receive an overlong value.
 */
export function fitDescription(description: string, max = 155) {
  const clean = normalize(description);
  if (clean.length <= max) return clean;

  const slice = clean.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  const base =
    lastSpace > 60 ? slice.slice(0, lastSpace).trim() : slice.trim();
  const withEllipsis = `${base.replace(/[.,;:!?…]+$/u, "")}…`;
  return withEllipsis.length <= max
    ? withEllipsis
    : withEllipsis.slice(0, max);
}
