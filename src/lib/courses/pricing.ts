/**
 * Academy default pricing, decided by the business (Carlyle):
 *  - course:      2,000 FCFA
 *  - course pack: 5,000 FCFA
 *
 * XAF (FCFA) is a zero-decimal currency, so minor units == major units.
 *
 * The defaults apply whenever an administrator has not manually set a positive
 * price in /admin/academy **and** the item still sells in XAF (the default
 * currency). If an administrator switches an item to USD/CAD/EUR they are
 * expected to set an explicit price — no conversion is invented here.
 * The storefront, checkout resolution, and the AI advisor all use the same
 * effective price.
 */

export const DEFAULT_COURSE_PRICE_MINOR = 2000;
export const DEFAULT_PACK_PRICE_MINOR = 5000;

/** Only a positive safe integer counts as an admin-configured price. */
export function isPositivePrice(value: number | null | undefined): boolean {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isXaf(currency: string | null | undefined) {
  return (currency ?? "XAF").trim().toUpperCase() === "XAF";
}

/**
 * Effective price for a course: the admin-set value, or the 2,000 FCFA
 * default when unset and still selling in XAF. `null` = genuinely unpriced
 * (non-XAF currency without a manually set price).
 */
export function effectiveCoursePriceMinor(
  priceMinor: number | null | undefined,
  currency?: string | null,
): number | null {
  if (isPositivePrice(priceMinor)) return priceMinor as number;
  return isXaf(currency) ? DEFAULT_COURSE_PRICE_MINOR : null;
}

/**
 * Effective price for a pack: the admin-set value, or the 5,000 FCFA default
 * when unset and still selling in XAF.
 */
export function effectivePackPriceMinor(
  priceMinor: number | null | undefined,
  currency?: string | null,
): number | null {
  if (isPositivePrice(priceMinor)) return priceMinor as number;
  return isXaf(currency) ? DEFAULT_PACK_PRICE_MINOR : null;
}
