import { describe, expect, it } from "vitest";
import {
  delocalizePublicPath,
  getLocalizedAppPath,
} from "../src/lib/site-routes";
import {
  getCoursePackBySlug,
  getFullCoursePack,
} from "../src/lib/courses/coursePacks";

describe("course academy routing", () => {
  it("localizes the French courses index path", () => {
    expect(getLocalizedAppPath("fr", "/courses")).toBe("/fr/cours");
  });

  it("localizes the French buyer bonus page path", () => {
    expect(getLocalizedAppPath("fr", "/courses/bonuses")).toBe(
      "/fr/cours/bonus-officiels",
    );
  });

  it("localizes the French full-pack detail path", () => {
    expect(
      getLocalizedAppPath("fr", "/courses/complete-digital-skills-pack"),
    ).toBe("/fr/cours/pack-complet-competences-digitales");
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

  it("localizes the French buyer bonus claim form path", () => {
    expect(getLocalizedAppPath("fr", "/courses/claim-bonus")).toBe(
      "/fr/cours/reclamer-bonus",
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
