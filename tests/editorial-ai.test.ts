import { describe, expect, it } from "vitest";
import { isEditorialAiEnabled, getEditorialTextModel, getEditorialImageModel } from "@/lib/ai/editorial-config";
import { estimateEditorialTextCost, estimateEditorialImageCost } from "@/lib/ai/editorial-pricing";
import { editorialArticleSchema, editorialEditResultSchema, editorialTranslateResultSchema, editorialReviewResultSchema } from "@/lib/ai/editorial-types";
import { z } from "zod";
import { normalizeArticleHtml } from "@/lib/blog/sanitize";
import { isReasoningModel } from "@/lib/ai/editorial-service";

describe("editorial AI configuration", () => {
  it("is disabled unless explicitly enabled", () => {
    expect(isEditorialAiEnabled()).toBe(false);
  });

  it("does not hardcode deprecated model fallbacks", () => {
    expect(getEditorialTextModel()).toBe("");
    expect(getEditorialImageModel()).toBe("");
  });

  it("returns null for unknown pricing", () => {
    expect(estimateEditorialTextCost("unknown-model", 10, 10)).toBeNull();
    expect(estimateEditorialImageCost("unknown-model", "1536x1024")).toBeNull();
  });

  it("uses corrected text pricing", () => {
    expect(estimateEditorialTextCost("gpt-5.4", 1_000_000, 1_000_000)).toBe(17.5);
    expect(estimateEditorialTextCost("gpt-5.4-mini", 1_000_000, 1_000_000)).toBe(5.25);
    expect(estimateEditorialTextCost("gpt-6-luna", 1_000_000, 1_000_000)).toBe(0.6);
  });

  it("accounts for cached input tokens", () => {
    expect(estimateEditorialTextCost("gpt-4o-mini", 1_000_000, 0, 500_000)).toBeCloseTo(0.0825, 6);
  });

  it("does not present image output estimates as complete costs", () => {
    expect(estimateEditorialImageCost("gpt-image-1.5", "1536x1024", "high")).toBeNull();
  });

  it("validates the structured article package", () => {
    expect(() =>
      editorialArticleSchema.parse({
        title: "A useful title",
        suggestedSlug: "a-useful-title",
        excerpt: "A clear summary that helps a business choose a useful next step.",
        articleContent: "<p>Read this practical guide to improve your digital systems. It explains how dashboards, automation and websites help small businesses grow with clearer processes and better customer journeys. Each section includes practical examples, clear headings, and a conclusion that supports a confident next step for the reader.</p>",
        seoTitle: "A useful title",
        metaDescription: "A practical guide for growing businesses that want clearer digital systems.",
        focusKeyword: "digital systems",
        secondaryKeywords: ["growth"],
        suggestedCategory: "Strategy",
        suggestedTags: ["digital"],
        suggestedInternalLinks: ["/services"],
        suggestedCallToAction: "Contact teChia to plan your next step.",
        imagePrompt: "A clean professional editorial illustration of a business dashboard.",
        imageAltText: "A business dashboard on a laptop",
        editorialNotes: ["Verify claims."],
        claimsToVerify: ["No statistics were supplied."],
      }),
    ).not.toThrow();
  });

  function assertStrict(schema: unknown) {
    if (!schema || typeof schema !== "object") return;
    const node = schema as Record<string, unknown>;
    if (node.type === "object" && node.properties && typeof node.properties === "object") {
      expect(node.additionalProperties).toBe(false);
      expect(Array.isArray(node.required)).toBe(true);
      expect((node.required as string[]).length).toBe(Object.keys(node.properties as Record<string, unknown>).length);
      for (const value of Object.values(node.properties as Record<string, unknown>)) {
        assertStrict(value);
      }
    }
    if (node.type === "array" && node.items) assertStrict(node.items);
    if (node.anyOf) for (const value of node.anyOf as unknown[]) assertStrict(value);
    if (node.oneOf) for (const value of node.oneOf as unknown[]) assertStrict(value);
    if (node.allOf) for (const value of node.allOf as unknown[]) assertStrict(value);
  }

  it("generates strict JSON schemas for structured outputs", () => {
    for (const schema of [editorialArticleSchema, editorialEditResultSchema, editorialTranslateResultSchema, editorialReviewResultSchema]) {
      assertStrict(z.toJSONSchema(schema));
    }
  });

  it("sanitizes article HTML without Node Buffer", () => {
    const originalBuffer = globalThis.Buffer;
    // @ts-expect-error test-only browser simulation
    delete globalThis.Buffer;
    try {
      const clean = normalizeArticleHtml("<p>Hello <strong>world</strong></p><script>alert(1)</script>");
      expect(clean).toContain("<strong>world</strong>");
      expect(clean).not.toContain("script");
    } finally {
      globalThis.Buffer = originalBuffer;
    }
  });

  it("omits sampling parameters for reasoning models", () => {
    expect(isReasoningModel("gpt-6-luna")).toBe(true);
    expect(isReasoningModel("gpt-4o")).toBe(false);
  });
});
