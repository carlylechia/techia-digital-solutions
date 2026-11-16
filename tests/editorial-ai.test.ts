import { describe, expect, it } from "vitest";
import { isEditorialAiEnabled, getEditorialTextModel, getEditorialImageModel } from "@/lib/ai/editorial-config";
import { estimateEditorialTextCost, estimateEditorialImageCost } from "@/lib/ai/editorial-pricing";
import { editorialArticleSchema, editorialEditResultSchema, editorialTranslateResultSchema, editorialReviewResultSchema } from "@/lib/ai/editorial-types";
import { z } from "zod";

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

  it("generates strict JSON schemas for structured outputs", () => {
    for (const schema of [editorialArticleSchema, editorialEditResultSchema, editorialTranslateResultSchema, editorialReviewResultSchema]) {
      const jsonSchema = z.toJSONSchema(schema) as { required?: string[]; additionalProperties?: boolean; properties?: Record<string, unknown> };
      expect(jsonSchema.additionalProperties).toBe(false);
      expect(Array.isArray(jsonSchema.required)).toBe(true);
      expect(jsonSchema.required?.length).toBe(Object.keys(jsonSchema.properties || {}).length);
    }
  });
});
