/**
 * Money helpers for the academy checkout.
 *
 * Amounts are always stored as integer minor units. No floating-point value is
 * ever used for an order total, a comparison, or a database write. Currency
 * exponents are explicit because XAF/XOF have zero decimal places while most
 * other supported currencies have two.
 */

const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

export function normalizeCurrency(currency: string) {
  return currency.trim().toUpperCase();
}

export function currencyExponent(currency: string) {
  return ZERO_DECIMAL_CURRENCIES.has(normalizeCurrency(currency)) ? 0 : 2;
}

export function isValidCurrency(currency: string) {
  return /^[A-Z]{3}$/.test(normalizeCurrency(currency));
}

/**
 * Convert a provider's major-unit value (for example 1500 for XAF, or 19.99
 * for USD) into integer minor units. Provider JSON may contain a number, so we
 * convert through its decimal string representation and round half-up without
 * performing arithmetic on an imprecise float.
 */
/**
 * Parse an administrator-entered major-unit string without ever using a float
 * for the stored value. Returns null when the input is malformed or has more
 * decimal places than the currency supports.
 */
export function majorStringToMinor(
  value: string,
  currency: string,
): number | null {
  const raw = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null;

  const exponent = currencyExponent(currency);
  const [whole, fraction = ""] = raw.split(".");
  if (exponent === 0 && fraction) return null;
  if (fraction.length > exponent) return null;

  const digits = `${whole}${fraction.padEnd(exponent, "0")}`;
  const minor = Number(digits);
  return Number.isSafeInteger(minor) ? minor : null;
}

export function majorToMinor(value: unknown, currency: string): number | null {
  if (value === null || value === undefined) return null;
  const raw =
    typeof value === "number" || typeof value === "string"
      ? String(value).trim()
      : "";
  if (!/^\d+(\.\d+)?$/.test(raw)) return null;

  const exponent = currencyExponent(currency);
  const [whole, fraction = ""] = raw.split(".");
  if (exponent === 0) {
    // Reject genuinely fractional major units for zero-decimal currencies.
    if (fraction.replace(/0+$/, "")) return null;
    return Number(whole);
  }

  const padded = `${fraction}${"0".repeat(exponent)}`.slice(0, exponent + 1);
  const kept = padded.slice(0, exponent);
  const nextDigit = Number(padded[exponent] || 0);
  const base = Number(`${whole}${kept}`);
  return Number.isSafeInteger(base) ? base + (nextDigit >= 5 ? 1 : 0) : null;
}

export function minorToMajorString(minor: number, currency: string) {
  const exponent = currencyExponent(currency);
  const normalized = Math.trunc(minor);
  const negative = normalized < 0;
  const digits = String(Math.abs(normalized)).padStart(exponent + 1, "0");
  if (exponent === 0) return `${negative ? "-" : ""}${digits}`;
  const whole = digits.slice(0, -exponent);
  const fraction = digits.slice(-exponent);
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

export function formatMoney(
  minor: number,
  currency: string,
  locale: "en" | "fr" = "en",
) {
  const normalized = normalizeCurrency(currency);
  const value = minorToMajorString(minor, normalized);
  try {
    return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: normalized,
      minimumFractionDigits: currencyExponent(normalized),
      maximumFractionDigits: currencyExponent(normalized),
    }).format(Number(value));
  } catch {
    return `${value} ${normalized}`;
  }
}

export function assertPositiveMinorAmount(amount: number) {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error("A positive integer minor-unit amount is required.");
  }
  return amount;
}
