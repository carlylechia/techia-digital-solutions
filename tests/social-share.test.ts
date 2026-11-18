import { describe, expect, it } from "vitest";
import {
  socialCaptionGenerateInputSchema,
  socialGraphicGenerateInputSchema,
  socialPublishStatusInputSchema,
  facebookCaptionSchema,
  instagramCaptionSchema,
  whatsappCaptionSchema,
  socialPlatformOptions,
  socialGraphicFormatOptions,
} from "@/lib/ai/social-share-types";
import { z } from "zod";

describe("social share kit schemas", () => {
  it("accepts valid caption request", () => {
    expect(() =>
      socialCaptionGenerateInputSchema.parse({ postId: "abc", platform: "FACEBOOK" }),
    ).not.toThrow();
  });

  it("rejects invalid platform", () => {
    expect(() =>
      socialCaptionGenerateInputSchema.parse({ postId: "abc", platform: "TWITTER" }),
    ).toThrow();
  });

  it("rejects empty postId", () => {
    expect(() =>
      socialCaptionGenerateInputSchema.parse({ postId: "", platform: "FACEBOOK" }),
    ).toThrow();
  });

  it("validates facebook caption", () => {
    expect(() => facebookCaptionSchema.parse({ caption: "Hello world" })).not.toThrow();
    expect(() => facebookCaptionSchema.parse({ caption: "" })).toThrow();
  });

  it("validates instagram caption with short caption", () => {
    expect(() =>
      instagramCaptionSchema.parse({ caption: "Long caption", shortCaption: "Short" }),
    ).not.toThrow();
  });

  it("validates whatsapp caption", () => {
    expect(() =>
      whatsappCaptionSchema.parse({ statusCaption: "Status", directCaption: "Direct" }),
    ).not.toThrow();
  });

  it("validates graphic request", () => {
    expect(() =>
      socialGraphicGenerateInputSchema.parse({ postId: "abc", format: "SQUARE" }),
    ).not.toThrow();
    expect(() =>
      socialGraphicGenerateInputSchema.parse({ postId: "abc", format: "ROUND" }),
    ).toThrow();
  });

  it("validates publish status request", () => {
    expect(() =>
      socialPublishStatusInputSchema.parse({ postId: "abc", platform: "WHATSAPP", status: "PUBLISHED" }),
    ).not.toThrow();
    expect(() =>
      socialPublishStatusInputSchema.parse({ postId: "abc", platform: "WHATSAPP", status: "DONE" }),
    ).toThrow();
  });

  it("exposes platform options", () => {
    expect(socialPlatformOptions).toEqual(["FACEBOOK", "INSTAGRAM", "WHATSAPP"]);
    expect(socialGraphicFormatOptions).toEqual(["SQUARE", "VERTICAL"]);
  });

  it("enforces refinement max length", () => {
    const long = "a".repeat(1001);
    expect(() =>
      socialCaptionGenerateInputSchema.parse({ postId: "abc", platform: "FACEBOOK", refinement: long }),
    ).toThrow();
  });
});
