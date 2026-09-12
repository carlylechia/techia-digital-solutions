import { describe, expect, it } from "vitest";
import {
  delocalizePublicPath,
  getLocalizedAppPath,
  getPublicAppPath,
} from "../src/lib/site-routes";
import {
  getCoursePackBySlug,
  getFullCoursePack,
} from "../src/lib/courses/coursePacks";

describe("course academy routing", () => {
  it("keeps the courses index path language-neutral", () => {
    expect(getLocalizedAppPath("fr", "/courses")).toBe("/courses");
  });

  it("keeps buyer bonus page paths language-neutral", () => {
    expect(getLocalizedAppPath("fr", "/courses/bonuses")).toBe(
      "/courses/bonuses",
    );
  });

  it("keeps course detail paths language-neutral", () => {
    expect(
      getLocalizedAppPath("fr", "/courses/complete-digital-skills-pack"),
    ).toBe("/courses/complete-digital-skills-pack");
  });

  it("normalizes old locale-prefixed links to the canonical URL", () => {
    expect(getPublicAppPath("/fr/cours/reclamer-bonus")).toBe(
      "/courses/claim-bonus",
    );
  });

  it("maps French public slugs back to internal course pack paths", () => {
    expect(delocalizePublicPath("fr", "/cours/finance-education-marche")).toBe(
      "/courses/finance-market-education",
    );
  });

  it("maps French buyer bonus paths back to the internal bonuses route", () => {
    expect(
      delocalizePublicPath(
        "fr",
        "/cours/bonus-officiels/digital-skills-learning-roadmap/download",
      ),
    ).toBe("/courses/bonuses/digital-skills-learning-roadmap/download");
  });

  it("keeps the buyer bonus claim form path language-neutral", () => {
    expect(getLocalizedAppPath("fr", "/courses/claim-bonus")).toBe(
      "/courses/claim-bonus",
    );
  });
});

describe("course academy data", () => {
  it("returns the localized French public slug for a translated pack page", () => {
    expect(getCoursePackBySlug("fr", "finance-market-education")?.slug).toBe(
      "finance-education-marche",
    );
  });

  it("keeps the full pack as the recommended 16-course offer", () => {
    const pack = getFullCoursePack("en");
    expect(pack?.recommended).toBe(true);
    expect(pack?.courseCount).toBe(16);
  });
});
