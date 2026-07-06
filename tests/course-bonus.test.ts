import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCoursesBonusClaimDestination,
  publicBonusDownloadsEnabled,
} from "../src/lib/courses/chariowLinks";
import { getBuyerBonusItems } from "../src/lib/courses/bonusPacks";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("course buyer bonus configuration", () => {
  it("prefers the explicit claim form URL when it exists", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_COURSES_BONUS_CLAIM_URL",
      "https://example.com/claim-bonus",
    );
    vi.stubEnv("NEXT_PUBLIC_COURSES_WHATSAPP_URL", "https://wa.me/237670000000");

    expect(getCoursesBonusClaimDestination("en")).toEqual({
      href: "https://example.com/claim-bonus",
      channel: "form",
    });
  });

  it("falls back to WhatsApp with a prefilled claim message", () => {
    vi.stubEnv("NEXT_PUBLIC_COURSES_BONUS_CLAIM_URL", "");
    vi.stubEnv("NEXT_PUBLIC_COURSES_WHATSAPP_URL", "https://wa.me/237670000000");

    const destination = getCoursesBonusClaimDestination("en");

    expect(destination?.channel).toBe("whatsapp");
    expect(destination?.href).toContain("wa.me");
    expect(destination?.href).toContain("text=");
  });

  it("keeps public bonus downloads disabled by default", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_PUBLIC_BONUS_DOWNLOADS", "");
    expect(publicBonusDownloadsEnabled()).toBe(false);
  });
});

describe("course buyer bonus data", () => {
  it("includes the future updates item while keeping resource downloads attached to file-backed items", () => {
    const items = getBuyerBonusItems("en");
    const updates = items.find((item) => item.id === "future-resource-updates");
    const roadmap = items.find(
      (item) => item.id === "digital-skills-learning-roadmap",
    );

    expect(updates?.eligibility).toBe("full-pack");
    expect(roadmap?.downloadPath).toContain(
      "/en/courses/bonuses/digital-skills-learning-roadmap/download",
    );
  });
});
