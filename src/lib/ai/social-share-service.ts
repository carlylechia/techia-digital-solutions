import "server-only";

import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { getAbsoluteBlogPostUrl } from "@/lib/blog/slug";
import { normalizeArticleHtml, htmlToPlainText } from "@/lib/blog/sanitize";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { isEditorialAiEnabled, getEditorialTextModel, EDITORIAL_AI_CONFIG } from "./editorial-config";
import { EditorialAiError, callOpenAiJson } from "./editorial-service";
import { reserveEditorialUsage, finalizeEditorialUsage, failEditorialUsage, checkEditorialBurstLimit } from "./editorial-usage";
import { estimateEditorialTextCost, estimateEditorialImageCost } from "./editorial-pricing";
import {
  socialCaptionGenerateInputSchema,
  facebookCaptionSchema,
  instagramCaptionSchema,
  whatsappCaptionSchema,
  type SocialPlatform,
  type SocialGraphicFormat,
  type FacebookCaption,
  type InstagramCaption,
  type WhatsAppCaption,
  type SocialPublishStatus,
} from "./social-share-types";

const REQUEST_TYPE = "SOCIAL_SHARE_CAPTION";
export type SocialArticleSource = {
  id: string;
  title: string;
  slug: string;
  locale: string;
  status: string;
  excerpt: string;
  contentText: string;
  featuredImageUrl: string | null;
  canonicalUrl: string;
  categories: string[];
  tags: string[];
  seoTitle: string | null;
  metaDescription: string | null;
};

export async function getSocialArticleSource(postId: string): Promise<SocialArticleSource | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      title: true,
      slug: true,
      locale: true,
      status: true,
      excerpt: true,
      content: true,
      contentText: true,
      featuredImageUrl: true,
      canonicalUrl: true,
      seoTitle: true,
      seoDescription: true,
      category: { select: { name: true } },
      tags: { select: { tag: { select: { name: true } } } },
    },
  });
  if (!post) return null;
  const locale = post.locale === "fr" ? "fr" : "en";
  const contentText = (post.contentText || htmlToPlainText(normalizeArticleHtml(post.content))).trim();
  const canonical = post.canonicalUrl && /^https?:\/\//i.test(post.canonicalUrl)
    ? post.canonicalUrl
    : getAbsoluteBlogPostUrl(locale as "en" | "fr", post.slug);
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    locale,
    status: post.status,
    excerpt: post.excerpt,
    contentText: contentText.slice(0, EDITORIAL_AI_CONFIG.maxInputChars),
    featuredImageUrl: post.featuredImageUrl,
    canonicalUrl: canonical,
    categories: post.category?.name ? [post.category.name] : [],
    tags: post.tags.map((t) => t.tag.name),
    seoTitle: post.seoTitle,
    metaDescription: post.seoDescription,
  };
}

function articleContextBlock(article: SocialArticleSource) {
  return `Article title: ${article.title}
Article URL: ${article.canonicalUrl}
Excerpt: ${article.excerpt}
Categories: ${article.categories.join(", ") || "(none)"}
Tags: ${article.tags.join(", ") || "(none)"}
SEO title: ${article.seoTitle || "(none)"}
Meta description: ${article.metaDescription || "(none)"}

Article content:
<<<ARTICLE
${article.contentText}
ARTICLE>>>`;
}

const SYSTEM_BRAND = `You are the teChia Digital Solutions Social Share Kit assistant.

teChia Digital Solutions: "Digitalize. Simplify. Grow."
Professional, modern, trustworthy, practical. Never invent facts, statistics, quotations, or claims. Stay faithful to the source article. Avoid misleading clickbait. Avoid generic AI-sounding introductions. Use natural human-readable copy. Avoid excessive emojis and hashtags.

Return valid JSON only, matching the requested schema exactly.`;

async function generateForPlatform(params: {
  article: SocialArticleSource;
  platform: SocialPlatform;
  refinement?: string;
  customInstruction?: string;
  actorId: string;
}) {
  if (!isEditorialAiEnabled()) throw new EditorialAiError("disabled", "Editorial AI is disabled.");
  const model = getEditorialTextModel();
  if (!model) throw new EditorialAiError("not_configured", "OPENAI_EDITORIAL_TEXT_MODEL (or OPENAI_MODEL) is not configured.");

  await checkEditorialBurstLimit(params.actorId, 20);

  const reservationId = await reserveEditorialUsage({
    actorId: params.actorId,
    requestType: REQUEST_TYPE,
    limit: EDITORIAL_AI_CONFIG.maxArticleGenerationsPerDay * 5,
    model,
    burstLimit: 20,
  });

  let schema: z.ZodTypeAny;
  let system: string;
  let user: string;
  if (params.platform === "FACEBOOK") {
    schema = facebookCaptionSchema;
    system = `${SYSTEM_BRAND}

Generate a Facebook post caption from the article. Optimize for attention-grabbing opening, conversational but professional tone, compelling explanation of value, natural engagement prompts, appropriate calls to action, relevant hashtags where useful, and include the article link.

Return JSON only: {"caption": "..."}.`;
    user = `${articleContextBlock(params.article)}

Refinement: ${params.refinement || "(none)"}
Custom instruction: ${params.customInstruction || "(none)"}

Include the article URL naturally. Return JSON only.`;
  } else if (params.platform === "INSTAGRAM") {
    schema = instagramCaptionSchema;
    system = `${SYSTEM_BRAND}

Generate an Instagram caption from the article. Optimize for strong opening hook, concise engaging copy, natural storytelling, mobile readability, relevant hashtags, appropriate calls to action. Do not assume clickable links in ordinary captions; instruct the reader to visit the profile link or use the appropriate link-sharing method. Also generate a separate short caption suitable for brevity.

Return JSON only: {"caption": "...", "shortCaption": "..."}.`;
    user = `${articleContextBlock(params.article)}

Refinement: ${params.refinement || "(none)"}
Custom instruction: ${params.customInstruction || "(none)"}

Return JSON only.`;
  } else {
    schema = whatsappCaptionSchema;
    system = `${SYSTEM_BRAND}

Generate WhatsApp sharing copy from the article. Optimize for natural conversational language, short readable messages, compelling reason to open the article, clear call to action, complete article URL. Provide separate versions for WhatsApp Status and direct messages.

Return JSON only: {"statusCaption": "...", "directCaption": "..."}.`;
    user = `${articleContextBlock(params.article)}

Refinement: ${params.refinement || "(none)"}
Custom instruction: ${params.customInstruction || "(none)"}

Return JSON only.`;
  }

  try {
    const result = await callOpenAiJson({
      model,
      system,
      user,
      schema,
      timeoutMs: EDITORIAL_AI_CONFIG.timeoutMs,
      maxTokens: 2048,
    });

    const estimatedCost = estimateEditorialTextCost(model, result.inputTokens, result.outputTokens, result.cachedInputTokens);
    await finalizeEditorialUsage(reservationId, {
      model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost,
      costAvailable: estimatedCost !== null,
      providerOutcome: "PROVIDER_SUCCEEDED",
      reconciliationRequired: false,
    });

    return { data: result.data, model, inputTokens: result.inputTokens, outputTokens: result.outputTokens };
  } catch (error) {
    const isAmb = error instanceof EditorialAiError && (error.providerState === "started" || error.providerState === "responded");
    if (isAmb) {
      await finalizeEditorialUsage(reservationId, {
        model,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCost: null,
        costAvailable: false,
        status: "PROVIDER_OUTCOME_UNKNOWN",
        providerOutcome: "PROVIDER_OUTCOME_UNKNOWN",
        reconciliationRequired: true,
      });
    } else {
      await failEditorialUsage(reservationId);
    }
    throw error;
  }
}

export async function generateSocialCaption(input: z.infer<typeof socialCaptionGenerateInputSchema>, actorId: string) {
  const validated = socialCaptionGenerateInputSchema.safeParse(input);
  if (!validated.success) throw new EditorialAiError("invalid_input", "Invalid social caption request.");
  const article = await getSocialArticleSource(validated.data.postId);
  if (!article) throw new EditorialAiError("invalid_input", "Article not found.");

  const result = await generateForPlatform({
    article,
    platform: validated.data.platform,
    refinement: validated.data.refinement || undefined,
    customInstruction: validated.data.customInstruction || undefined,
    actorId,
  });

  // Persist
  const prisma = getPrisma();
  if (!prisma) throw new EditorialAiError("not_configured", "Database is unavailable.");
  const kit = await prisma.socialShareKit.upsert({
    where: { postId: article.id },
    create: { postId: article.id, createdById: actorId },
    update: {},
  });

  const platform = validated.data.platform;
  let generatedCaption = "";
  let shortCaption: string | null = null;
  let statusCaption: string | null = null;
  let directCaption: string | null = null;
  if (platform === "FACEBOOK") {
    generatedCaption = (result.data as FacebookCaption).caption;
  } else if (platform === "INSTAGRAM") {
    const d = result.data as InstagramCaption;
    generatedCaption = d.caption;
    shortCaption = d.shortCaption;
  } else {
    const d = result.data as WhatsAppCaption;
    generatedCaption = d.directCaption;
    statusCaption = d.statusCaption;
    directCaption = d.directCaption;
  }

  await prisma.socialShareVariant.upsert({
    where: { kitId_platform: { kitId: kit.id, platform } },
    create: {
      kitId: kit.id,
      platform,
      generatedCaption,
      editedCaption: null,
      shortCaption,
      statusCaption,
      directCaption,
    },
    update: {
      generatedCaption,
      shortCaption,
      statusCaption,
      directCaption,
      editedCaption: null,
      publishStatus: "NOT_STARTED",
      publishedAt: null,
      publishedById: null,
    },
  });

  return { ok: true, platform, kitId: kit.id, result: result.data, model: result.model };
}

export async function getSocialKit(postId: string) {
  const prisma = getPrisma();
  if (!prisma) return null;
  const kit = await prisma.socialShareKit.findUnique({
    where: { postId },
    include: { variants: true, graphics: true },
  });
  return kit;
}

export type SocialCaptionEditInput = {
  postId: string;
  platform: SocialPlatform;
  editedCaption: string;
  shortCaption?: string;
  statusCaption?: string;
  directCaption?: string;
};

export async function saveEditedCaption(input: SocialCaptionEditInput) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable.");
  const kit = await prisma.socialShareKit.findUnique({ where: { postId: input.postId } });
  if (!kit) throw new Error("Social kit not found.");

  const data: Record<string, unknown> = { editedCaption: input.editedCaption };
  if (input.platform === "INSTAGRAM") {
    if (input.shortCaption !== undefined) data.shortCaption = input.shortCaption || null;
  }
  if (input.platform === "WHATSAPP") {
    if (input.statusCaption !== undefined) data.statusCaption = input.statusCaption || null;
    if (input.directCaption !== undefined) {
      data.directCaption = input.directCaption || null;
      data.editedCaption = input.directCaption || input.editedCaption;
    }
  }

  await prisma.socialShareVariant.update({
    where: { kitId_platform: { kitId: kit.id, platform: input.platform } },
    data,
  });
  return { ok: true };
}

export async function refineSocialCaption(input: { postId: string; platform: SocialPlatform; instruction: string }, actorId: string) {
  const validated = socialCaptionGenerateInputSchema.safeParse({ postId: input.postId, platform: input.platform, refinement: input.instruction });
  if (!validated.success) throw new EditorialAiError("invalid_input", "Invalid refinement request.");
  // Treat as regeneration with refinement instruction
  return generateSocialCaption(
    { postId: input.postId, platform: input.platform, refinement: input.instruction },
    actorId,
  );
}

export async function updatePublishStatus(postId: string, platform: SocialPlatform, status: SocialPublishStatus, actorId: string) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable.");
  const kit = await prisma.socialShareKit.findUnique({ where: { postId } });
  if (!kit) throw new Error("Social kit not found.");
  await prisma.socialShareVariant.update({
    where: { kitId_platform: { kitId: kit.id, platform } },
    data: {
      publishStatus: status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      publishedById: status === "PUBLISHED" ? actorId : null,
    },
  });
  return { ok: true };
}

// ---- Graphics ----

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length <= maxChars) {
      current = (current + " " + w).trim();
    } else {
      if (current) lines.push(current);
      current = w;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  // If too long, ellipsize last line
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[maxLines - 1];
    if (last.length > 3) lines[maxLines - 1] = last.slice(0, Math.max(0, maxChars - 1)) + "…";
  }
  return lines;
}

function shortenHeadline(title: string): string {
  // Keep first ~10 words
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length <= 10) return title;
  return words.slice(0, 10).join(" ") + "…";
}


function readLogoSvgFallback(): string {
  const candidates = [
    path.join(process.cwd(), "public", "brand", "logo-horizontal-white.svg"),
    path.join(process.cwd(), "public", "brand", "logo-mark.svg"),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return fs.readFileSync(c, "utf8");
    } catch {
      // ignore
    }
  }
  return "";
}

/**
 * Resolve the logo the SuperAdmin actually uploaded. The English brand asset is
 * used only as a safe fallback when no logo is selected or the stored asset can
 * no longer be fetched, so a graphic generation never fails because of a logo.
 */
async function resolveLogoDataUri(logoId?: string): Promise<string> {
  if (logoId) {
    const prisma = getPrisma();
    const logo = prisma
      ? await prisma.socialShareLogo.findFirst({
          where: { id: logoId, isActive: true },
          select: { url: true, mimeType: true },
        })
      : null;
    if (logo) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      try {
        const response = await fetch(logo.url, { signal: controller.signal, redirect: "follow" });
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());
          if (buffer.byteLength > 0 && buffer.byteLength <= 8 * 1024 * 1024) {
            return `data:${logo.mimeType};base64,${buffer.toString("base64")}`;
          }
        }
      } catch {
        // Fall through to the official brand asset.
      } finally {
        clearTimeout(timer);
      }
    }
  }

  const logoSvg = readLogoSvgFallback();
  return logoSvg ? `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}` : "";
}

export async function generateSocialGraphic(
  postId: string,
  format: SocialGraphicFormat,
  actorId: string,
  prompt?: string,
  logoId?: string,
) {
  const article = await getSocialArticleSource(postId);
  if (!article) throw new EditorialAiError("invalid_input", "Article not found.");

  if (!isEditorialAiEnabled()) throw new EditorialAiError("disabled", "Editorial AI is disabled.");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new EditorialAiError("not_configured", "OPENAI_API_KEY is not configured.");

  const model = process.env.OPENAI_EDITORIAL_IMAGE_MODEL?.trim() || "gpt-image-1.5";

  await checkEditorialBurstLimit(actorId, 10);

  const reservationId = await reserveEditorialUsage({
    actorId,
    requestType: "EDITORIAL_IMAGE",
    limit: EDITORIAL_AI_CONFIG.maxImageGenerationsPerDay,
    model,
    imageCount: 1,
    burstLimit: 10,
  });

  const isSquare = format === "SQUARE";
  const width = 1080;
  const height = isSquare ? 1080 : 1920;

  const finalPrompt =
    (prompt && prompt.trim()) ||
    `A premium, professional, human-designed editorial illustration for a social media post about: "${article.title}". ${article.excerpt}. Modern digital business, innovation, technology, growth, trust. Clean composition, rich visual detail, cinematic lighting, no text, no logos, no watermarks. Whenever people or places are depicted, show Black Africans in authentic African settings.`;

  let providerGenerated = false;
  let b64: string | null = null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), EDITORIAL_AI_CONFIG.imageTimeoutMs);
    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          prompt: `${finalPrompt}\n\nStyle: premium teChia brand aesthetic — deep navy, electric blue, cyan accents, modern, trustworthy, professional, no text, no logos, no watermarks, high resolution. People and places must depict Black Africans in authentic African settings; never default to white, European or American people/settings.`,
          n: 1,
          size: isSquare ? "1024x1024" : "1024x1536",
          quality: "high",
          output_format: "png",
        }),
      });
    } catch (error) {
      if (controller.signal.aborted) throw new EditorialAiError("timeout", "Image generation timed out.");
      throw new EditorialAiError("api", `Image generation failed: ${getErrorMessage(error)}`);
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      if (response.status === 404) throw new EditorialAiError("model_unavailable", `Image model (${model}) is not available.`);
      if (response.status === 429) throw new EditorialAiError("quota", "Image generation quota or rate limit reached.");
      if (response.status === 401 || response.status === 403) throw new EditorialAiError("auth", "Image generation credentials were rejected.");
      throw new EditorialAiError("api", `Image generation returned HTTP ${response.status}.`);
    }

    const payload = (await response.json()) as { data?: Array<{ b64_json?: string }> };
    b64 = payload.data?.[0]?.b64_json || null;
    if (!b64) throw new EditorialAiError("malformed_output", "The image model did not return image data.");

    providerGenerated = true;

    const imageBuffer = Buffer.from(b64, "base64");
    const base64Image = imageBuffer.toString("base64");
    const mimeType = "image/png";
    const dataUri = `data:${mimeType};base64,${base64Image}`;

    const logoDataUri = await resolveLogoDataUri(logoId);

    const headline = shortenHeadline(article.title);
    const lines = wrapText(headline, isSquare ? 20 : 18, isSquare ? 4 : 5);
    const lineHeight = isSquare ? 70 : 62;
    const headlineStartY = isSquare ? Math.round(height * 0.55) : Math.round(height * 0.62);
    const headlineSvg = lines
      .map((line, i) => `<text x="80" y="${headlineStartY + i * lineHeight}" font-family="Manrope, Arial, sans-serif" font-size="${isSquare ? 58 : 52}" font-weight="700" fill="#ffffff" style="text-shadow:0 2px 12px rgba(0,0,0,0.6)">${escapeXml(line)}</text>`)
      .join("\n");

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="overlay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(4,8,18,0.15)"/>
      <stop offset="55%" stop-color="rgba(4,8,18,0.35)"/>
      <stop offset="100%" stop-color="rgba(4,8,18,0.85)"/>
    </linearGradient>
  </defs>
  <image href="${dataUri}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>
  <rect width="${width}" height="${height}" fill="url(#overlay)"/>
  ${logoDataUri ? `<image href="${logoDataUri}" x="80" y="70" width="${isSquare ? 260 : 300}" height="60" preserveAspectRatio="xMinYMid meet"/>` : `<text x="80" y="115" font-family="Manrope, Arial, sans-serif" font-size="34" font-weight="700" fill="#22d3ee">teChia Digital Solutions</text>`}
  <text x="80" y="150" font-family="Manrope, Arial, sans-serif" font-size="20" font-weight="500" fill="#9db0c7" letter-spacing="3">DIGITALIZE · SIMPLIFY · GROW</text>
  ${headlineSvg}
  <rect x="80" y="${height - 200}" width="120" height="4" fill="#22d3ee"/>
  <text x="80" y="${height - 145}" font-family="Manrope, Arial, sans-serif" font-size="24" font-weight="600" fill="#f7fbff">Read the full article</text>
  <text x="80" y="${height - 105}" font-family="Manrope, Arial, sans-serif" font-size="18" fill="#9db0c7">${escapeXml(article.canonicalUrl.replace(/^https?:\/\//, ""))}</text>
</svg>`;

    const svgBuffer = Buffer.from(svg, "utf8");
    const filename = `${article.slug}-${format.toLowerCase()}.svg`;
    const file = new File([new Uint8Array(svgBuffer)], filename, { type: "image/svg+xml" });

    const result = await uploadToCloudinary(file, "techia/social-share/graphics", { forceSigned: true });

    const prisma = getPrisma();
    if (!prisma) throw new EditorialAiError("not_configured", "Media storage is unavailable.");

    const kit = await prisma.socialShareKit.upsert({
      where: { postId: article.id },
      create: { postId: article.id, createdById: actorId },
      update: {},
    });

    await prisma.socialShareGraphic.upsert({
      where: { kitId_format: { kitId: kit.id, format } },
      create: {
        kitId: kit.id,
        format,
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width || width,
        height: result.height || height,
        bytes: result.bytes,
        formatMime: "image/svg+xml",
      },
      update: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width || width,
        height: result.height || height,
        bytes: result.bytes,
        formatMime: "image/svg+xml",
      },
    });

    const estimatedCost = estimateEditorialImageCost(model, isSquare ? "1024x1024" : "1024x1536", "high");
    await finalizeEditorialUsage(reservationId, {
      model,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost,
      costAvailable: estimatedCost !== null,
      imageCount: 1,
      status: "SUCCEEDED",
      providerOutcome: "PROVIDER_SUCCEEDED",
      reconciliationRequired: false,
    });

    return {
      url: result.secure_url,
      pngUrl: result.secure_url.replace("/upload/", "/upload/f_png/"),
      publicId: result.public_id,
      width: result.width || width,
      height: result.height || height,
      format,
    };
  } catch (error) {
    if (providerGenerated) {
      const estimatedCost = estimateEditorialImageCost(model, isSquare ? "1024x1024" : "1024x1536", "high");
      await finalizeEditorialUsage(reservationId, {
        model,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCost,
        costAvailable: estimatedCost !== null,
        imageCount: 1,
        status: "PROVIDER_SUCCEEDED_UPLOAD_FAILED",
        providerOutcome: "PROVIDER_SUCCEEDED",
        reconciliationRequired: true,
      });
    } else {

      await failEditorialUsage(reservationId);
    }
    if (error instanceof EditorialAiError) throw error;
    throw new EditorialAiError("api", `Graphic generation failed: ${getErrorMessage(error)}`);
  }
}

export async function getSocialGraphics(postId: string) {
  const prisma = getPrisma();
  if (!prisma) return [];
  const kit = await prisma.socialShareKit.findUnique({ where: { postId }, include: { graphics: true } });
  return kit?.graphics || [];
}

export { EditorialAiError } from "./editorial-service";
