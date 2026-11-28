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

export type EditorialImageEditInput = {
  sourceImageUrl: string;
  articleTitle?: string;
  altText?: string;
  imagePrompt?: string;
};

const MAX_SOURCE_IMAGE_BYTES = 25 * 1024 * 1024;
const SOURCE_IMAGE_TIMEOUT_MS = 30_000;
const IMAGE_SIZE = "1536x1024";

function providerStatusError(status: number, model: string) {
  if (status === 404) return new EditorialAiError("model_unavailable", `Image model (${model}) is not available.`);
  if (status === 429) return new EditorialAiError("quota", "Image generation quota or rate limit reached.");
  if (status === 401 || status === 403) return new EditorialAiError("auth", "Image generation credentials were rejected.");
  return new EditorialAiError("api", `Image generation returned HTTP ${status}.`);
}

async function fetchProviderImage(url: string, init: RequestInit, operation: "generation" | "editing") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EDITORIAL_AI_CONFIG.imageTimeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) throw new EditorialAiError("timeout", `Image ${operation} timed out.`);
    throw new EditorialAiError("api", `Image ${operation} failed: ${getErrorMessage(error)}`);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Shared reservation, provider response, billing classification and upload
 * pipeline for both image generation and image editing. Keeping the two modes
 * on one code path means they cannot drift on quota accounting or cleanup.
 */
async function runEditorialImageJob(input: {
  actorId: string;
  model: string;
  altText: string;
  auditAction: string;
  providerCall: () => Promise<Response>;
}): Promise<EditorialImageResult> {
  await checkEditorialBurstLimit(input.actorId, 10);

  const reservationId = await reserveEditorialUsage({
    actorId: input.actorId,
    requestType: "EDITORIAL_IMAGE",
    limit: EDITORIAL_AI_CONFIG.maxImageGenerationsPerDay,
    model: input.model,
    imageCount: 1,
    burstLimit: 10,
  });

  let providerRequestStarted = false;
  let providerResponded = false;
  let providerHttpOk = false;
  let providerHttpStatus: number | null = null;
  let providerGenerated = false;
  let uploadedPublicId: string | null = null;

  try {
    providerRequestStarted = true;
    const response = await input.providerCall();

    providerResponded = true;
    providerHttpStatus = response.status;
    if (!response.ok) throw providerStatusError(response.status, input.model);

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

    const altText = input.altText.trim() || "Editorial illustration";
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
          uploadedById: input.actorId,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: input.actorId,
          action: input.auditAction,
          entityType: "BlogMedia",
          entityId: created.id,
          metadata: { model: input.model, format: created.format, bytes: created.bytes },
        },
      });
      return created;
    });

    const estimatedCost = estimateEditorialImageCost(input.model, IMAGE_SIZE, "high");
    await finalizeEditorialUsage(reservationId, {
      model: input.model,
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
      model: input.model,
    };
  } catch (error) {
    if (uploadedPublicId) await deleteFromCloudinary(uploadedPublicId).catch(() => undefined);
    const ambiguous = providerRequestStarted && (
      !providerResponded ||
      providerHttpStatus === null ||
      providerHttpStatus >= 500 ||
      providerHttpStatus === 408 ||
      providerHttpOk
    );

    if (providerGenerated) {
      const estimatedCost = estimateEditorialImageCost(input.model, IMAGE_SIZE, "high");
      await finalizeEditorialUsage(reservationId, {
        model: input.model,
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
        model: input.model,
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

    console.error("[editorial-ai] image_operation_failed", {
      reservationId,
      actorId: input.actorId,
      model: input.model,
      requestType: "EDITORIAL_IMAGE",
      action: input.auditAction,
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

export async function generateEditorialImage(input: z.infer<typeof editorialImageInputSchema>, actorId: string): Promise<EditorialImageResult> {
  if (!isEditorialImageEnabled()) throw new EditorialAiError("disabled", "Editorial image generation is disabled.");
  const validated = editorialImageInputSchema.safeParse(input);
  if (!validated.success) throw new EditorialAiError("invalid_input", "Invalid image request.");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new EditorialAiError("not_configured", "OPENAI_API_KEY is not configured.");

  const model = getEditorialImageModel();
  if (!model) throw new EditorialAiError("not_configured", "OPENAI_EDITORIAL_IMAGE_MODEL is not configured.");

  const altText = (validated.data.altText && validated.data.altText.trim()) || validated.data.articleTitle || "Editorial illustration";

  return runEditorialImageJob({
    actorId,
    model,
    altText,
    auditAction: "blog.ai_image_generated",
    providerCall: () =>
      fetchProviderImage(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            prompt: `${validated.data.imagePrompt}\n\nStyle: professional, clean, premium digital solutions brand, text-free, logo-free, no watermarks, no embedded typography, landscape 16:9 editorial artwork.`,
            n: 1,
            size: IMAGE_SIZE,
            quality: "high",
            output_format: "png",
          }),
        },
        "generation",
      ),
  });
}

function approvedSourceImageUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new EditorialAiError("invalid_input", "The source image URL is invalid.");
  }
  const hosts = new Set(["res.cloudinary.com", "techiadigital.com", "www.techiadigital.com"]);
  if (process.env.NODE_ENV !== "production") {
    hosts.add("localhost");
    hosts.add("127.0.0.1");
  }
  if (url.protocol !== "https:" || !hosts.has(url.hostname.toLowerCase()) || url.username || url.password) {
    throw new EditorialAiError("invalid_input", "The source image must come from the approved media storage.");
  }
  return url;
}

async function fetchSourceImage(sourceImageUrl: string) {
  const url = approvedSourceImageUrl(sourceImageUrl);
  // Cloudinary can normalize any supported source into an editable PNG. Other
  // approved hosts are read as-is and validated by their byte signature.
  const fetchUrl = url.hostname.toLowerCase() === "res.cloudinary.com"
    ? url.toString().replace("/image/upload/", "/image/upload/f_png,q_90/")
    : url.toString();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SOURCE_IMAGE_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(fetchUrl, { signal: controller.signal, redirect: "follow" });
  } catch (error) {
    if (controller.signal.aborted) throw new EditorialAiError("timeout", "The source image download timed out.");
    throw new EditorialAiError("api", `The source image could not be downloaded: ${getErrorMessage(error)}`);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) throw new EditorialAiError("api", `The source image could not be downloaded (HTTP ${response.status}).`);
  const declaredLength = Number(response.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_SOURCE_IMAGE_BYTES) {
    throw new EditorialAiError("too_large", "The source image is too large to edit.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength <= 0 || buffer.byteLength > MAX_SOURCE_IMAGE_BYTES) {
    throw new EditorialAiError("too_large", "The source image is empty or too large to edit.");
  }

  const detected = detectImageMime(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer);
  if (!isAllowedBlogImageMime(detected)) {
    throw new EditorialAiError("invalid_input", "The source image format is not supported for editing.");
  }
  if (detected === "image/avif") {
    throw new EditorialAiError("invalid_input", "The source image must be a PNG, JPEG, or WebP file to translate its text.");
  }

  const extension = detected === "image/jpeg" ? "jpg" : detected.split("/")[1] || "png";
  return { buffer, mimeType: detected, filename: `source-${Date.now()}.${extension}` };
}

/**
 * Translates the visible text inside an existing featured image while keeping
 * the rest of the composition. Used by the French translation workflow when the
 * editor chooses "translate the image text".
 */
export async function editEditorialImageInstruction(input: {
  sourceImageUrl: string;
  instruction: string;
  altText?: string;
  articleTitle?: string;
}, actorId: string): Promise<EditorialImageResult> {
  if (!isEditorialImageEnabled()) throw new EditorialAiError("disabled", "Editorial image editing is disabled.");
  if (!input.sourceImageUrl.trim()) throw new EditorialAiError("invalid_input", "The source image is missing.");
  if (!input.instruction.trim()) throw new EditorialAiError("invalid_input", "An edit instruction is required.");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new EditorialAiError("not_configured", "OPENAI_API_KEY is not configured.");

  const model = getEditorialImageModel();
  if (!model) throw new EditorialAiError("not_configured", "OPENAI_EDITORIAL_IMAGE_MODEL is not configured.");

  const source = await fetchSourceImage(input.sourceImageUrl);
  const instruction = input.instruction.trim();
  const prompt = [
    "Edit the supplied image according to this instruction:",
    instruction,
    "Preserve the overall composition, crop, subjects, objects, colours, lighting, camera angle, graphic style, and brand feel.",
    "Apply only the requested correction. Do not add text, watermarks, logos, captions, or unrelated changes.",
    "If the instruction refers to an anatomical or object defect, fix only that defect and keep everything else unchanged.",
    input.articleTitle ? `Article title for context: "${input.articleTitle}".` : "",
  ].filter(Boolean).join(" ");

  return runEditorialImageJob({
    actorId,
    model,
    altText: (input.altText && input.altText.trim()) || input.articleTitle || "Editorial illustration",
    auditAction: "blog.ai_image_edited",
    providerCall: () => {
      const form = new FormData();
      form.set("model", model);
      form.set("image", new File([new Uint8Array(source.buffer)], source.filename, { type: source.mimeType }));
      form.set("prompt", prompt);
      form.set("n", "1");
      form.set("size", IMAGE_SIZE);
      form.set("quality", "high");
      form.set("output_format", "png");
      if (/^gpt-image/i.test(model)) form.set("input_fidelity", "high");
      return fetchProviderImage(
        "https://api.openai.com/v1/images/edits",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: form,
        },
        "editing",
      );
    },
  });
}

export async function editEditorialImage(input: EditorialImageEditInput, actorId: string): Promise<EditorialImageResult> {
  if (!isEditorialImageEnabled()) throw new EditorialAiError("disabled", "Editorial image generation is disabled.");
  if (!input.sourceImageUrl.trim()) throw new EditorialAiError("invalid_input", "The source image is missing.");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new EditorialAiError("not_configured", "OPENAI_API_KEY is not configured.");

  const model = getEditorialImageModel();
  if (!model) throw new EditorialAiError("not_configured", "OPENAI_EDITORIAL_IMAGE_MODEL is not configured.");

  const source = await fetchSourceImage(input.sourceImageUrl);
  const prompt = [
    "Edit the supplied featured image for the French version of a professional blog article.",
    "Translate every visible word, headline, label, caption, interface string, number unit and call to action inside the image into natural, professional French.",
    "Keep the composition, crop, subjects, objects, colours, lighting, graphic style, photographic realism and existing logos unchanged.",
    "Do not add new elements, watermarks, captions or promotional copy. If the image contains no readable text, preserve the image faithfully without changes.",
    input.articleTitle ? `Article title for context: "${input.articleTitle}".` : "",
    input.imagePrompt ? `Editorial context: ${input.imagePrompt}` : "",
  ].filter(Boolean).join(" ");

  return runEditorialImageJob({
    actorId,
    model,
    altText: (input.altText && input.altText.trim()) || input.articleTitle || "Illustration éditoriale",
    auditAction: "blog.ai_image_edited",
    providerCall: () => {
      const form = new FormData();
      form.set("model", model);
      form.set("image", new File([new Uint8Array(source.buffer)], source.filename, { type: source.mimeType }));
      form.set("prompt", prompt);
      form.set("n", "1");
      form.set("size", IMAGE_SIZE);
      form.set("quality", "high");
      form.set("output_format", "png");
      if (/^gpt-image/i.test(model)) form.set("input_fidelity", "high");
      return fetchProviderImage(
        "https://api.openai.com/v1/images/edits",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: form,
        },
        "editing",
      );
    },
  });
}
