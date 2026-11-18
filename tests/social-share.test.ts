import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import {
  socialCaptionGenerateInputSchema,
  socialGraphicGenerateInputSchema,
  socialPublishStatusInputSchema,
  socialCaptionEditInputSchema,
  facebookCaptionSchema,
  instagramCaptionSchema,
  whatsappCaptionSchema,
  socialPlatformOptions,
  socialGraphicFormatOptions,
} from "@/lib/ai/social-share-types";
import { EDITORIAL_BURST_REQUEST_TYPES } from "@/lib/ai/editorial-usage";
import { saveEditedCaption, getSocialKit, generateSocialCaption } from "@/lib/ai/social-share-service";

const prisma = getPrisma();

describe("social share kit schemas", () => {
  it("accepts valid caption request", () => {
    expect(() => socialCaptionGenerateInputSchema.parse({ postId: "abc", platform: "FACEBOOK" })).not.toThrow();
  });

  it("rejects invalid platform", () => {
    expect(() => socialCaptionGenerateInputSchema.parse({ postId: "abc", platform: "TWITTER" })).toThrow();
  });

  it("rejects empty postId", () => {
    expect(() => socialCaptionGenerateInputSchema.parse({ postId: "", platform: "FACEBOOK" })).toThrow();
  });

  it("validates facebook caption", () => {
    expect(() => facebookCaptionSchema.parse({ caption: "Hello world" })).not.toThrow();
    expect(() => facebookCaptionSchema.parse({ caption: "" })).toThrow();
  });

  it("validates instagram caption with short caption", () => {
    expect(() => instagramCaptionSchema.parse({ caption: "Long caption", shortCaption: "Short" })).not.toThrow();
  });

  it("validates whatsapp caption", () => {
    expect(() => whatsappCaptionSchema.parse({ statusCaption: "Status", directCaption: "Direct" })).not.toThrow();
  });

  it("validates graphic request", () => {
    expect(() => socialGraphicGenerateInputSchema.parse({ postId: "abc", format: "SQUARE" })).not.toThrow();
    expect(() => socialGraphicGenerateInputSchema.parse({ postId: "abc", format: "ROUND" })).toThrow();
  });

  it("validates publish status request", () => {
    expect(() => socialPublishStatusInputSchema.parse({ postId: "abc", platform: "WHATSAPP", status: "PUBLISHED" })).not.toThrow();
    expect(() => socialPublishStatusInputSchema.parse({ postId: "abc", platform: "WHATSAPP", status: "DONE" })).toThrow();
  });

  it("validates caption edit request", () => {
    expect(() =>
      socialCaptionEditInputSchema.parse({
        postId: "abc",
        platform: "INSTAGRAM",
        editedCaption: "edited",
        shortCaption: "short",
      }),
    ).not.toThrow();
  });

  it("exposes platform options", () => {
    expect(socialPlatformOptions).toEqual(["FACEBOOK", "INSTAGRAM", "WHATSAPP"]);
    expect(socialGraphicFormatOptions).toEqual(["SQUARE", "VERTICAL"]);
  });

  it("enforces refinement max length", () => {
    const long = "a".repeat(1001);
    expect(() => socialCaptionGenerateInputSchema.parse({ postId: "abc", platform: "FACEBOOK", refinement: long })).toThrow();
  });

  it("includes social caption requests in burst accounting", () => {
    expect(EDITORIAL_BURST_REQUEST_TYPES).toContain("SOCIAL_SHARE_CAPTION");
  });
});

describe("social share persistence", () => {
  const createdPostIds: string[] = [];
  const createdKitIds: string[] = [];

  beforeAll(() => {
    process.env.EDITORIAL_AI_ENABLED = "true";
    process.env.OPENAI_EDITORIAL_TEXT_MODEL = process.env.OPENAI_EDITORIAL_TEXT_MODEL || "gpt-4o-mini";
  });

  afterAll(async () => {
    if (!prisma) return;
    for (const kitId of createdKitIds) {
      await prisma.socialShareKit.delete({ where: { id: kitId } }).catch(() => undefined);
    }
    for (const postId of createdPostIds) {
      await prisma.blogPost.delete({ where: { id: postId } }).catch(() => undefined);
    }
  });

  async function createPost() {
    if (!prisma) return null;
    const post = await prisma.blogPost.create({
      data: {
        slug: `social-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: "Social Test Article",
        excerpt: "A sufficiently long excerpt for validation purposes here.",
        content: "<p>Test content for social share kit.</p>",
        contentText: "Test content for social share kit.",
        locale: "en",
        status: "DRAFT",
      },
    });
    createdPostIds.push(post.id);
    return post;
  }

  it("saves and reloads instagram short caption", async () => {
    if (!prisma) return;
    const post = await createPost();
    if (!post) return;
    const kit = await prisma.socialShareKit.create({
      data: { postId: post.id },
    });
    createdKitIds.push(kit.id);
    await prisma.socialShareVariant.create({
      data: {
        kitId: kit.id,
        platform: "INSTAGRAM",
        generatedCaption: "generated ig caption",
      },
    });

    await saveEditedCaption({
      postId: post.id,
      platform: "INSTAGRAM",
      editedCaption: "edited ig caption",
      shortCaption: "short edited",
    });

    const reloaded = await getSocialKit(post.id);
    const variant = reloaded?.variants.find((v) => v.platform === "INSTAGRAM");
    expect(variant?.editedCaption).toBe("edited ig caption");
    expect(variant?.shortCaption).toBe("short edited");
  });

  it("saves and reloads whatsapp status and direct captions", async () => {
    if (!prisma) return;
    const post = await createPost();
    if (!post) return;
    const kit = await prisma.socialShareKit.create({
      data: { postId: post.id },
    });
    createdKitIds.push(kit.id);
    await prisma.socialShareVariant.create({
      data: {
        kitId: kit.id,
        platform: "WHATSAPP",
        generatedCaption: "generated wa",
      },
    });

    await saveEditedCaption({
      postId: post.id,
      platform: "WHATSAPP",
      editedCaption: "direct edited",
      statusCaption: "status edited",
      directCaption: "direct edited",
    });

    const reloaded = await getSocialKit(post.id);
    const variant = reloaded?.variants.find((v) => v.platform === "WHATSAPP");
    expect(variant?.statusCaption).toBe("status edited");
    expect(variant?.directCaption).toBe("direct edited");
  });

  it("keeps existing data when edit fails", async () => {
    if (!prisma) return;
    const post = await createPost();
    if (!post) return;
    const kit = await prisma.socialShareKit.create({
      data: { postId: post.id },
    });
    createdKitIds.push(kit.id);
    await prisma.socialShareVariant.create({
      data: {
        kitId: kit.id,
        platform: "FACEBOOK",
        generatedCaption: "original caption",
        editedCaption: "original edited",
      },
    });

    await expect(
      saveEditedCaption({
        postId: "nonexistent-post-id",
        platform: "FACEBOOK",
        editedCaption: "new",
      }),
    ).rejects.toThrow();

    const reloaded = await getSocialKit(post.id);
    const variant = reloaded?.variants.find((v) => v.platform === "FACEBOOK");
    expect(variant?.editedCaption).toBe("original edited");
  });

  it("handles missing variant gracefully", async () => {
    if (!prisma) return;
    const post = await createPost();
    if (!post) return;
    const kit = await prisma.socialShareKit.create({
      data: { postId: post.id },
    });
    createdKitIds.push(kit.id);

    await expect(
      saveEditedCaption({
        postId: post.id,
        platform: "FACEBOOK",
        editedCaption: "new",
      }),
    ).rejects.toThrow();
  });

  it("resets publishing state after regeneration", async () => {
    if (!prisma) return;
    const post = await createPost();
    if (!post) return;
    const kit = await prisma.socialShareKit.create({
      data: { postId: post.id },
    });
    createdKitIds.push(kit.id);
    await prisma.socialShareVariant.create({
      data: {
        kitId: kit.id,
        platform: "FACEBOOK",
        generatedCaption: "old caption",
        publishStatus: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    // Mock OpenAI response
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        output_text: JSON.stringify({ caption: "new caption" }),
        usage: { input_tokens: 10, output_tokens: 5, input_tokens_details: { cached_tokens: 0 } },
      }),
    }) as unknown as typeof fetch;

    try {
      await generateSocialCaption({ postId: post.id, platform: "FACEBOOK" }, "test-actor");
    } finally {
      global.fetch = originalFetch;
    }

    const reloaded = await getSocialKit(post.id);
    const variant = reloaded?.variants.find((v) => v.platform === "FACEBOOK");
    expect(variant?.generatedCaption).toBe("new caption");
    expect(variant?.publishStatus).toBe("NOT_STARTED");
    expect(variant?.publishedAt).toBeNull();
  });
});
