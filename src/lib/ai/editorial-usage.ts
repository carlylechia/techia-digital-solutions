import "server-only";

import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { EditorialAiError } from "./editorial-service";

export async function reserveEditorialUsage(params: {
  actorId: string;
  requestType: string;
  limit: number;
  model: string;
  imageCount?: number;
  burstLimit?: number;
}) {
  const prisma = getPrisma();
  if (!prisma) throw new EditorialAiError("not_configured", "Editorial AI usage tracking is unavailable.");

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${params.actorId + ":" + params.requestType}))`;
    if (params.burstLimit) {
      const burstSince = new Date(Date.now() - 60_000);
      const burstCount = await tx.aIUsage.count({
        where: {
          userId: params.actorId,
          createdAt: { gte: burstSince },
          requestType: { in: ["EDITORIAL_ARTICLE", "EDITORIAL_EDIT", "EDITORIAL_TRANSLATE", "EDITORIAL_REVIEW", "EDITORIAL_IMAGE"] },
        },
      });
      if (burstCount >= params.burstLimit) {
        throw new EditorialAiError("quota", "Too many editorial AI requests. Try again shortly.");
      }
    }
    const used = await tx.aIUsage.count({
      where: { userId: params.actorId, requestType: params.requestType, createdAt: { gte: start } },
    });
    if (used >= params.limit) {
      throw new EditorialAiError("limit_reached", `Daily limit of ${params.limit} requests reached.`);
    }
    const row = await tx.aIUsage.create({
      data: {
        userId: params.actorId,
        model: params.model,
        requestType: params.requestType,
        status: "RESERVED",
        estimatedCost: null,
        costAvailable: false,
        imageCount: params.imageCount ?? 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      },
    });
    return row.id;
  }, { isolationLevel: "Serializable" });
}

export async function finalizeEditorialUsage(id: string | null, data: {
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number | null;
  costAvailable: boolean;
  imageCount?: number;
  status?: string;
}) {
  if (!id) return;
  const prisma = getPrisma();
  if (!prisma) return;
  try {
    await prisma.aIUsage.update({
      where: { id },
      data: {
        model: data.model,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        totalTokens: data.inputTokens + data.outputTokens,
        estimatedCost: data.estimatedCost,
        costAvailable: data.costAvailable,
        imageCount: data.imageCount ?? 0,
        status: data.status ?? "SUCCEEDED",
      },
    });
  } catch (error) {
    console.warn("[editorial-ai] usage_finalize_failed", getErrorMessage(error));
  }
}

export async function failEditorialUsage(id: string | null) {
  if (!id) return;
  const prisma = getPrisma();
  if (!prisma) return;
  try {
    await prisma.aIUsage.update({
      where: { id },
      data: { status: "FAILED" },
    });
  } catch (error) {
    console.warn("[editorial-ai] usage_fail_record_failed", getErrorMessage(error));
  }
}

const EDITORIAL_BURST_REQUEST_TYPES = [
  "EDITORIAL_ARTICLE",
  "EDITORIAL_EDIT",
  "EDITORIAL_TRANSLATE",
  "EDITORIAL_REVIEW",
  "EDITORIAL_IMAGE",
];

export async function checkEditorialBurstLimit(actorId: string, limit: number, windowMs = 60_000) {
  const prisma = getPrisma();
  if (!prisma) throw new EditorialAiError("not_configured", "Editorial AI usage tracking is unavailable.");
  const since = new Date(Date.now() - windowMs);
  const count = await prisma.aIUsage.count({
    where: {
      userId: actorId,
      createdAt: { gte: since },
      requestType: { in: EDITORIAL_BURST_REQUEST_TYPES },
    },
  });
  if (count >= limit) {
    throw new EditorialAiError("quota", "Too many editorial AI requests. Try again shortly.");
  }
}
