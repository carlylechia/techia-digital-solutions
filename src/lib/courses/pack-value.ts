/**
 * Bundle value is derived from live prices only. Never hardcode a discount:
 * a pack only shows a saving when every included course is published, priced
 * in the same currency, and the sum is genuinely higher than the pack price.
 */
export type PackValue = {
  separateTotalMinor: number;
  savingsMinor: number;
  savingsPercent: number;
};

type PricedPack = {
  priceMinor?: number | null;
  priceCurrency?: string | null;
  includedCourses?: Array<{ slug?: string | null }> | null;
};

type PricedCourse = {
  slug: string;
  priceMinor?: number | null;
  currency?: string | null;
};

function isPositivePrice(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function calculatePackValue(
  pack: PricedPack,
  courses: PricedCourse[],
): PackValue | null {
  const packPrice = pack.priceMinor;
  if (!isPositivePrice(packPrice)) return null;

  const includedCourses = pack.includedCourses ?? [];
  if (!includedCourses.length) return null;

  const bySlug = new Map(courses.map((course) => [course.slug, course]));
  const currency = (pack.priceCurrency ?? "XAF").trim().toUpperCase();
  const counted = new Set<string>();
  let separateTotalMinor = 0;

  for (const included of includedCourses) {
    const slug = included.slug?.trim();
    if (!slug) return null;
    if (counted.has(slug)) continue;
    counted.add(slug);

    const course = bySlug.get(slug);
    if (!course || !isPositivePrice(course.priceMinor)) return null;
    if ((course.currency ?? "XAF").trim().toUpperCase() !== currency) {
      return null;
    }
    separateTotalMinor += course.priceMinor;
  }

  if (separateTotalMinor <= packPrice) return null;

  const savingsMinor = separateTotalMinor - packPrice;
  return {
    separateTotalMinor,
    savingsMinor,
    savingsPercent: Math.round((savingsMinor / separateTotalMinor) * 100),
  };
}
