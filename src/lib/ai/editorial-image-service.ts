import "server-only";

import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import { detectImageMime, isAllowedBlogImageMime } from "@/lib/blog/media-validation";
import { isEditorialImageEnabled, getEditorialImageModel, EDITORIAL_AI_CONFIG } from "./editorial-config";
import { EditorialAiError } from "./editorial-service";
import { reserveEditorialUsage, finalizeEditorialUsage, failEditorialUsage, checkEditorialBurstLimit } from "./editorial-usage";
import { estimateEditorialImageCost } from "./editorial-pricing";
import { editorialImageInputSchema } from "./editorial-types";
export { EditorialAiError } from "./editorial-service";

export type EditorialImageResult = {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  altText: string;
  model: string;
};

export async function generateEditorialImage(input: z.infer<typeof editorialImageInputSchema>, actorId: string): Promise<EditorialImageResult> {
  if (!isEditorialImageEnabled()) throw new EditorialAiError("disabled", "Editorial image generation is disabled.");
  const validated = editorialImageInputSchema.safeParse(input);
  if (!validated.success) throw new EditorialAiError("invalid_input", "Invalid image request.");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new EditorialAiError("not_configured", "OPENAI_API_KEY is not configured.");

  const model = getEditorialImageModel();
  if (!model) throw new EditorialAiError("not_configured", "OPENAI_EDITORIAL_IMAGE_MODEL is not configured.");

  await checkEditorialBurstLimit(actorId, 10);

  const reservationId = await reserveEditorialUsage({
    actorId,
    requestType: "EDITORIAL_IMAGE",
    limit: EDITORIAL_AI_CONFIG.maxImageGenerationsPerDay,
    model,
    imageCount: 1,
    burstLimit: 10,
  });

  let providerRequestStarted = false;
  let providerResponded = false;
  let providerHttpOk = false;
  let providerGenerated = false;
  let uploadedPublicId: string | null = null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), EDITORIAL_AI_CONFIG.imageTimeoutMs);
    let response: Response;
    providerRequestStarted = true;
    try {
      response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          prompt: `${validated.data.imagePrompt}\n\nStyle: professional, clean, premium digital solutions brand, text-free, logo-free, no watermarks, no embedded typography, landscape 16:9 editorial artwork.`,
          n: 1,
          size: "1536x1024",
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

    providerResponded = true;
    if (!response.ok) {
      if (response.status === 404) throw new EditorialAiError("model_unavailable", `Image model (${model}) is not available.`);
      if (response.status === 429) throw new EditorialAiError("quota", "Image generation quota or rate limit reached.");
      if (response.status === 401 || response.status === 403) throw new EditorialAiError("auth", "Image generation credentials were rejected.");
      throw new EditorialAiError("api", `Image generation returned HTTP ${response.status}.`);
    }

    providerHttpOk = true;
    const payload = (await response.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
    const b64 = payload.data?.[0]?.b64_json;
    if (!b64) throw new EditorialAiError("malformed_output", "The image model did not return image data.");

    let buffer: Buffer;
    try {
      buffer = Buffer.from(b64, "base64");
    } catch {
      throw new EditorialAiError("malformed_output", "The image data could not be decoded.");
    }
    if (buffer.byteLength <= 0 || buffer.byteLength > 15 * 1024 * 1024) {
      throw new EditorialAiError("too_large", "The generated image is too large to upload.");
    }

    const detected = detectImageMime(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer);
    if (!isAllowedBlogImageMime(detected)) {
      throw new EditorialAiError("malformed_output", "The generated image format is not supported.");
    }

    providerGenerated = true;

    const filename = `editorial-ai-${Date.now()}.png`;
    const file = new File([new Uint8Array(buffer)], filename, { type: detected || "image/png" });

    const result = await uploadToCloudinary(file, "techia/blog", { forceSigned: true });
    uploadedPublicId = result.public_id;
    if (result.resource_type !== "image" || !result.width || !result.height) {
      await deleteFromCloudinary(result.public_id).catch(() => undefined);
      uploadedPublicId = null;
      throw new EditorialAiError("malformed_output", "The uploaded image could not be verified.");
    }

    const prisma = getPrisma();
    if (!prisma) {
      await deleteFromCloudinary(result.public_id).catch(() => undefined);
      uploadedPublicId = null;
      throw new EditorialAiError("not_configured", "Media storage is unavailable.");
    }

    const altText = (validated.data.altText && validated.data.altText.trim()) || validated.data.articleTitle || "Editorial illustration";
    const media = await prisma.$transaction(async (tx) => {
      const created = await tx.blogMedia.create({
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          resourceType: result.resource_type,
          format: result.format,
          mimeType: detected || "image/png",
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          altText,
          uploadedById: actorId,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: "blog.ai_image_generated",
          entityType: "BlogMedia",
          entityId: created.id,
          metadata: { model, format: created.format, bytes: created.bytes },
        },
      });
      return created;
    });

    const estimatedCost = estimateEditorialImageCost(model, "1536x1024", "high");
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
      url: media.url,
      publicId: media.publicId,
      width: media.width || result.width,
      height: media.height || result.height,
      format: media.format,
      bytes: media.bytes,
      altText: media.altText || altText,
      model,
    };
  } catch (error) {
    if (uploadedPublicId) await deleteFromCloudinary(uploadedPublicId).catch(() => undefined);
    const ambiguous = providerRequestStarted && !(providerResponded && !providerHttpOk);
    if (providerGenerated) {
      const estimatedCost = estimateEditorialImageCost(model, "1536x1024", "high");
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
    } else if (ambiguous) {
      await finalizeEditorialUsage(reservationId, {
        model,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCost: null,
        costAvailable: false,
        imageCount: 0,
        status: "PROVIDER_OUTCOME_UNKNOWN",
        providerOutcome: "PROVIDER_OUTCOME_UNKNOWN",
        reconciliationRequired: true,
      });
    } else {
      await failEditorialUsage(reservationId);
    }
    console.error("[editorial-ai] image_generation_failed", {
      reservationId,
      actorId,
      model,
      requestType: "EDITORIAL_IMAGE",
      providerRequestStarted,
      providerResponded,
      providerHttpOk,
      providerGenerated,
      reconciliationRequired: providerGenerated || ambiguous,
    });
    if (error instanceof EditorialAiError) throw error;
    throw new EditorialAiError("api", `Image upload failed: ${getErrorMessage(error)}`);
  }
}
