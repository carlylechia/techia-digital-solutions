import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCoursesBonusClaimUrl,
  getCoursesBonusClaimDestination,
  getCoursesWhatsappUrl,
  publicBonusDownloadsEnabled,
} from "../src/lib/courses/chariowLinks";
import { getBuyerBonusItems } from "../src/lib/courses/bonusPacks";
import {
  buildBonusDeliveryUrl,
  getEligibleDeliverableBonusIds,
} from "../src/lib/courses/bonusClaims";
import { getBonusResourceContentType } from "../src/lib/courses/bonusMime";

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

  it("builds a prefilled WhatsApp claim helper URL", () => {
    vi.stubEnv("NEXT_PUBLIC_COURSES_WHATSAPP_URL", "https://wa.me/237670000000");

    const url = getCoursesWhatsappUrl(
      "Hello teChia, I want to claim my official buyer bonus.",
    );

    expect(url).toContain("wa.me");
    expect(url).toContain("text=");
  });

  it("keeps public bonus downloads disabled by default", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_PUBLIC_BONUS_DOWNLOADS", "");
    expect(publicBonusDownloadsEnabled()).toBe(false);
  });

  it("uses the built-in localized claim form when no external form URL is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_COURSES_BONUS_CLAIM_URL", "");
    expect(getCoursesBonusClaimUrl("en")).toBe("/courses/claim-bonus");
    expect(getCoursesBonusClaimDestination("fr")).toEqual({
      href: "/courses/claim-bonus",
      channel: "form",
    });
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
    expect(roadmap?.filePath).toMatch(/\.docx$/);
    expect(roadmap?.downloadPath).toContain(
      "/courses/bonuses/digital-skills-learning-roadmap/download",
    );
  });

  it("serves docx bonus resources with the correct mime type", () => {
    expect(
      getBonusResourceContentType(
        "src/content/courses/bonuses/docx/course-learning-tracker.docx",
      ),
    ).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });

  it("keeps full-pack delivery eligibility to file-backed bonus resources", () => {
    expect(getEligibleDeliverableBonusIds("complete-digital-skills-pack")).toEqual([
      "digital-skills-learning-roadmap",
      "skill-monetization-starter-guide",
      "course-learning-tracker",
      "business-digital-checkup-template",
      "thirty-day-digital-skills-action-plan",
    ]);
  });

  it("builds signed private delivery URLs", () => {
    const url = buildBonusDeliveryUrl("claim_123", "course-learning-tracker");
    expect(url).toContain("/api/courses/bonus-delivery/claim_123/course-learning-tracker");
    expect(url).toContain("exp=");
    expect(url).toContain("sig=");
  });
});
