import { describe, expect, it } from "vitest";

import {
  buildCheckoutMessage,
  buildCheckoutPath,
  extractRecommendationCandidates,
  isPurchaseIntent,
  messageMentionsCheckout,
  messageMentionsSlug,
  stripRecommendationMarkers,
  type AcademyRecommendation,
} from "@/lib/ai/recommendation";

const recommendation: AcademyRecommendation = {
  type: "pack",
  slug: "digital-skills-pack",
  title: "Digital Skills Pack",
  productPath: "/courses/digital-skills-pack",
  checkoutPath: "/courses/checkout?item=pack:digital-skills-pack",
  priceLabel: "FCFA 5,000",
};

describe("AI recommendation parsing", () => {
  it("reads the hidden recommendation marker", () => {
    const candidates = extractRecommendationCandidates(
      "This pack fits your goal.\n[[TECHIA_RECOMMEND:pack:digital-skills-pack]]",
    );

    expect(candidates).toEqual([
      { type: "pack", slug: "digital-skills-pack", source: "marker" },
    ]);
  });

  it("reads explicit checkout URLs before ordinary product links", () => {
    const candidates = extractRecommendationCandidates(
      "Continue here: /courses/checkout?item=course:ai-tech-programming and see /courses/design-course.",
    );

    expect(candidates[0]).toEqual({
      type: "course",
      slug: "ai-tech-programming",
      source: "checkout",
    });
  });

  it("treats ordinary course and French course links as candidates", () => {
    const candidates = extractRecommendationCandidates(
      "Try [Marketing](/courses/digital-marketing-online-business) or [Design](/cours/design-creatif-creation-contenu).",
    );

    expect(candidates.map((candidate) => candidate.slug)).toEqual([
      "digital-marketing-online-business",
      "creative-design-content-creation",
    ]);
  });

  it("ignores reserved course routes", () => {
    const candidates = extractRecommendationCandidates(
      "Go to /courses/checkout or /courses/bonuses.",
    );

    expect(candidates).toEqual([]);
  });

  it("removes every hidden marker from the visitor-facing message", () => {
    const message = stripRecommendationMarkers(
      "This is the best fit.\n[[TECHIA_RECOMMEND:course:seo-course]]\n\nLet me know.",
    );

    expect(message).toBe("This is the best fit.\n\nLet me know.");
  });

  it("detects purchase confirmations in English and French", () => {
    expect(isPurchaseIntent("Yes, let's do it")).toBe(true);
    expect(isPurchaseIntent("D'accord, je prends")).toBe(true);
    expect(isPurchaseIntent("Which one is cheaper?")).toBe(false);
  });

  it("recognises when a reply already includes the exact checkout link", () => {
    expect(
      messageMentionsCheckout(
        "Continue: /courses/checkout?item=pack:digital-skills-pack",
        recommendation,
      ),
    ).toBe(true);
    expect(
      messageMentionsCheckout(
        "Continue: /courses/checkout?item=course:another-item",
        recommendation,
      ),
    ).toBe(false);
  });

  it("matches slugs and encoded slugs in a reply", () => {
    expect(
      messageMentionsSlug(
        "See /courses/digital-skills-pack",
        "digital-skills-pack",
      ),
    ).toBe(true);
    expect(
      messageMentionsSlug(
        "Voir /cours/pack-de-competences",
        "pack-de-competences",
      ),
    ).toBe(true);
  });

  it("builds a language-neutral checkout URL for the exact item", () => {
    expect(buildCheckoutPath("course", "ai & data")).toBe(
      "/courses/checkout?item=course:ai%20%26%20data",
    );
  });

  it("adds a clickable checkout link to the final message", () => {
    const message = buildCheckoutMessage(recommendation, false);

    expect(message).toContain("Share your details");
    expect(message).toContain(
      "[Continue to secure checkout for Digital Skills Pack](/courses/checkout?item=pack:digital-skills-pack)",
    );
  });
});
