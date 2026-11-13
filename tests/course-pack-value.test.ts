import { describe, expect, it } from "vitest";
import { calculatePackValue } from "@/lib/courses/pack-value";

const courses = [
  { slug: "course-a", priceMinor: 2000, currency: "XAF" },
  { slug: "course-b", priceMinor: 2000, currency: "XAF" },
  { slug: "course-c", priceMinor: 2500, currency: "XAF" },
];

describe("calculatePackValue", () => {
  it("calculates the real saving against current course prices", () => {
    expect(
      calculatePackValue(
        {
          priceMinor: 3000,
          priceCurrency: "XAF",
          includedCourses: [{ slug: "course-a" }, { slug: "course-b" }],
        },
        courses,
      ),
    ).toEqual({
      separateTotalMinor: 4000,
      savingsMinor: 1000,
      savingsPercent: 25,
    });
  });

  it("never invents a saving when the pack is not cheaper", () => {
    expect(
      calculatePackValue(
        {
          priceMinor: 6000,
          priceCurrency: "XAF",
          includedCourses: [{ slug: "course-a" }, { slug: "course-b" }],
        },
        courses,
      ),
    ).toBeNull();
  });

  it("returns null when an included course is missing or unpublished", () => {
    expect(
      calculatePackValue(
        {
          priceMinor: 5000,
          priceCurrency: "XAF",
          includedCourses: [{ slug: "course-a" }, { slug: "missing-course" }],
        },
        courses,
      ),
    ).toBeNull();
  });

  it("returns null when currencies do not match", () => {
    expect(
      calculatePackValue(
        {
          priceMinor: 5000,
          priceCurrency: "XAF",
          includedCourses: [{ slug: "course-a" }, { slug: "course-usd" }],
        },
        [
          ...courses,
          { slug: "course-usd", priceMinor: 1000, currency: "USD" },
        ],
      ),
    ).toBeNull();
  });

  it("counts each included course once", () => {
    expect(
      calculatePackValue(
        {
          priceMinor: 3000,
          priceCurrency: "XAF",
          includedCourses: [{ slug: "course-c" }, { slug: "course-c" }],
        },
        courses,
      ),
    ).toBeNull();
  });
});
