import { describe, expect, it } from "vitest";
import {
  DEFAULT_COURSE_PRICE_MINOR,
  DEFAULT_PACK_PRICE_MINOR,
  effectiveCoursePriceMinor,
  effectivePackPriceMinor,
  isPositivePrice,
} from "@/lib/courses/pricing";

describe("academy default prices", () => {
  it("falls back to the business defaults for unpriced XAF items", () => {
    expect(DEFAULT_COURSE_PRICE_MINOR).toBe(2000);
    expect(DEFAULT_PACK_PRICE_MINOR).toBe(5000);
    expect(effectiveCoursePriceMinor(null, "XAF")).toBe(2000);
    expect(effectivePackPriceMinor(null, "XAF")).toBe(5000);
  });

  it("treats a missing currency argument as XAF", () => {
    expect(effectiveCoursePriceMinor(null)).toBe(2000);
    expect(effectivePackPriceMinor(undefined)).toBe(5000);
  });

  it("passes through positive admin-set prices unchanged", () => {
    expect(effectiveCoursePriceMinor(10000, "XAF")).toBe(10000);
    expect(effectivePackPriceMinor(25000, "USD")).toBe(25000);
    expect(effectiveCoursePriceMinor(1, "EUR")).toBe(1);
  });

  it("returns null for unpriced items in non-XAF currencies (no invented conversion)", () => {
    expect(effectiveCoursePriceMinor(null, "USD")).toBeNull();
    expect(effectivePackPriceMinor(null, "CAD")).toBeNull();
    expect(effectiveCoursePriceMinor(null, "EUR")).toBeNull();
  });

  it("handles currency casing and whitespace", () => {
    expect(effectiveCoursePriceMinor(null, "xaf")).toBe(2000);
    expect(effectivePackPriceMinor(null, " xaf ")).toBe(5000);
    expect(effectiveCoursePriceMinor(null, "usd")).toBeNull();
  });

  it("treats zero, negative and non-safe-integer values as unset", () => {
    expect(effectiveCoursePriceMinor(0, "XAF")).toBe(2000);
    expect(effectivePackPriceMinor(0, "XAF")).toBe(5000);
    expect(effectiveCoursePriceMinor(-500, "XAF")).toBe(2000);
    expect(effectivePackPriceMinor(1.5, "XAF")).toBe(5000);
    expect(effectiveCoursePriceMinor(Number.MAX_SAFE_INTEGER + 1, "XAF")).toBe(2000);
    // And in non-XAF currencies those same invalid values stay unpriced:
    expect(effectiveCoursePriceMinor(0, "USD")).toBeNull();
    expect(effectivePackPriceMinor(-1, "USD")).toBeNull();
  });

  it("validates positive prices with isPositivePrice", () => {
    expect(isPositivePrice(1)).toBe(true);
    expect(isPositivePrice(2000)).toBe(true);
    expect(isPositivePrice(0)).toBe(false);
    expect(isPositivePrice(-1)).toBe(false);
    expect(isPositivePrice(null)).toBe(false);
    expect(isPositivePrice(undefined)).toBe(false);
    expect(isPositivePrice(12.5)).toBe(false);
    expect(isPositivePrice(Number.NaN)).toBe(false);
  });
});
