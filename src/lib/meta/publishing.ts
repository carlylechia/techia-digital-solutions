import "server-only";

import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { siteConfig } from "@/content/site";
import { getAbsoluteBlogPostUrl } from "@/lib/blog/slug";
import {
  getMetaConfigurationSummary,
  isMetaEnvPublishingEnabled,
} from "./config";
import {
  MetaGraphError,
  isAmbiguousMetaFailure,
  metaGraphRequest,
  sanitizeMetaErrorText,
} from "./graph";
import {
  MetaAccountError,
  getMetaPublishingSettings,
  getMetaConnectionStatusForAdmin,
  getPublishingAccount,
  type MetaConnectionDto,
} from "./accounts";
import type { MetaPublishInput, MetaPublishPlatform } from "./types";

export class MetaPublishingError extends Error {
  readonly code:
    | "already_published"
    | "disabled"
    | "not_configured"
    | "not_public"
    | "no_variant"
    | "no_caption"
    | "caption_too_long"
    | "media_unsupported"
    | "media_unavailable"
    | "in_progress"
    | "idempotency_conflict"
    | "ambiguous"
    | "not_found"
    | "not_reconcilable"
    | "database_unavailable";

  constructor(code: MetaPublishingError["code"], message: string) {
    super(message);
    this.name = "MetaPublishingError";
    this.code = code;
  }
}

const publicationInclude = {
  article: { select: { id: true, title: true, slug: true, locale: true } },
  connectedAccount: {
    select: {
      id: true,
      displayName: true,
      platform: true,
      platformAccountId: true,
    },
  },
  attempts: { orderBy: { attemptNumber: "asc" as const } },
  initiatedBy: { select: { name: true, email: true } },
} satisfies Prisma.MetaPublicationInclude;

type PublicationWithRelations = Prisma.MetaPublicationGetPayload<{
  include: typeof publicationInclude;
}>;

export type MetaPublicationAttemptDto = {
  attemptNumber: number;
  requestAt: string;
  responseAt: string | null;
  outcome: string;
  httpStatus: number | null;
  errorCode: string | null;
  errorSummary: string | null;
  metaRequestId: string | null;
};

export type MetaPublicationDto = {
  id: string;
  platform: string;
  status: string;
  caption: string;
  mediaUrl: string | null;
  mediaFormat: string | null;
  articleId: string | null;
  articleTitle: string | null;
  articleUrl: string | null;
  destinationName: string | null;
  destinationAccountId: string | null;
  externalId: string | null;
  externalUrl: string | null;
  startedAt: string;
  publishedAt: string | null;
  completedAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  attemptCount: number;
  reconciliationAttemptedAt: string | null;
  canRetry: boolean;
  canReconcile: boolean;
  canResolve: boolean;
  hashPending: boolean;
  attempts: MetaPublicationAttemptDto[];
  initiatedBy: string | null;
};

function toPublicationDto(
  publication: PublicationWithRelations,
): MetaPublicationDto {
  const active = ["PENDING", "PROCESSING", "UNKNOWN_RESULT"].includes(
    publication.status,
  );
  const pendingAgeMs = Date.now() - publication.startedAt.getTime();
  return {
    id: publication.id,
    platform: publication.platform,
    status: publication.status,
    caption: publication.captionSnapshot,
    mediaUrl: publication.mediaUrl,
    mediaFormat: publication.mediaFormat,
    articleId: publication.articleId,
    articleTitle: publication.article?.title || null,
    articleUrl: publication.articleUrl,
    destinationName: publication.destinationName,
    destinationAccountId: publication.destinationAccountId,
    externalId: publication.externalId,
    externalUrl: publication.externalUrl,
    startedAt: publication.startedAt.toISOString(),
    publishedAt: publication.publishedAt?.toISOString() || null,
    completedAt: publication.completedAt?.toISOString() || null,
    lastErrorCode: publication.lastErrorCode,
    lastErrorMessage: publication.lastErrorMessage,
    attemptCount: publication.attemptCount,
    reconciliationAttemptedAt:
      publication.reconciliationAttemptedAt?.toISOString() || null,
    canRetry: publication.status === "FAILED",
    canReconcile:
      publication.status === "PROCESSING" ||
      publication.status === "UNKNOWN_RESULT" ||
      (publication.status === "PENDING" && pendingAgeMs > 120_000),
    canResolve:
      publication.status === "UNKNOWN_RESULT" ||
      publication.status === "PROCESSING",
    hashPending: active,
    attempts: publication.attempts.map((attempt) => ({
      attemptNumber: attempt.attemptNumber,
      requestAt: attempt.requestAt.toISOString(),
      responseAt: attempt.responseAt?.toISOString() || null,
      outcome: attempt.outcome,
      httpStatus: attempt.httpStatus,
      errorCode: attempt.errorCode,
      errorSummary: attempt.errorSummary,
      metaRequestId: attempt.metaRequestId,
    })),
    initiatedBy:
      publication.initiatedBy?.name || publication.initiatedBy?.email || null,
  };
}

function prismaOrThrow() {
  const prisma = getPrisma();
  if (!prisma)
    throw new MetaPublishingError(
      "database_unavailable",
      "Publishing data is unavailable.",
    );
  return prisma;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUniqueError(error: unknown) {
  return Boolean(
    error &&
    typeof error === "object" &&
    (error as { code?: string }).code === "P2002",
  );
}

function normalizeCaption(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function allowedArticleHosts() {
  const hosts = new Set(["techiadigital.com", "www.techiadigital.com"]);
  try {
    hosts.add(new URL(siteConfig.url).hostname);
  } catch {
    // siteConfig.url is normalised by the application; keep the defaults.
  }
  return hosts;
}

function resolvePublicArticleUrl(post: {
  locale: "en" | "fr";
  slug: string;
  canonicalUrl: string | null;
}) {
  const hosts = allowedArticleHosts();
  if (post.canonicalUrl) {
    try {
      const url = new URL(post.canonicalUrl);
      if (url.protocol === "https:" && hosts.has(url.hostname))
        return url.toString();
    } catch {
      // fall through to the derived public URL
    }
  }
  return getAbsoluteBlogPostUrl(post.locale, post.slug);
}

function assertTrustedCloudinaryImage(url: string) {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  if (!cloudName)
    throw new MetaPublishingError(
      "not_configured",
      "Cloudinary is not configured.",
    );
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new MetaPublishingError(
      "media_unavailable",
      "The selected graphic URL is not valid.",
    );
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.hostname !== "res.cloudinary.com" ||
    parsed.port
  ) {
    throw new MetaPublishingError(
      "media_unavailable",
      "The selected graphic is not stored on the trusted media host.",
    );
  }
  if (!parsed.pathname.startsWith(`/${cloudName}/image/upload/`)) {
    throw new MetaPublishingError(
      "media_unavailable",
      "The selected graphic does not belong to this application's media library.",
    );
  }
  return parsed;
}

function metaJpegUrl(rawUrl: string) {
  assertTrustedCloudinaryImage(rawUrl);
  const marker = "/image/upload/";
  const index = rawUrl.indexOf(marker);
  if (index === -1)
    throw new MetaPublishingError(
      "media_unavailable",
      "The selected graphic URL is not a Cloudinary image.",
    );
  const before = rawUrl.slice(0, index + marker.length);
  const after = rawUrl.slice(index + marker.length);
  if (after.startsWith("f_jpg")) return rawUrl;
  return `${before}f_jpg,q_90/${after}`;
}

/**
 * Meta fetches media itself, but checking first gives the administrator a
 * useful error instead of an opaque provider failure. The URL is always built
 * from an app-owned Cloudinary record, never from browser input.
 */
async function verifyMediaIsPublic(
  mediaUrl: string,
  platform: MetaPublishPlatform,
) {
  const timeout = 10_000;
  let response: Response;
  try {
    response = await fetch(mediaUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(timeout),
      redirect: "follow",
      cache: "no-store",
    });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(mediaUrl, {
        method: "GET",
        headers: { Range: "bytes=0-1024" },
        signal: AbortSignal.timeout(timeout),
        redirect: "follow",
        cache: "no-store",
      });
    }
  } catch {
    throw new MetaPublishingError(
      "media_unavailable",
      "The selected graphic could not be reached. Regenerate it and try again.",
    );
  }

  if (!response.ok && response.status !== 206) {
    throw new MetaPublishingError(
      "media_unavailable",
      "The selected graphic is not publicly reachable.",
    );
  }
  let finalUrl: URL;
  try {
    finalUrl = new URL(response.url);
  } catch {
    throw new MetaPublishingError(
      "media_unavailable",
      "The media host returned an invalid response.",
    );
  }
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  if (
    finalUrl.hostname !== "res.cloudinary.com" ||
    !finalUrl.pathname.startsWith(`/${cloudName}/image/upload/`)
  ) {
    throw new MetaPublishingError(
      "media_unavailable",
      "The media request was redirected away from the trusted host.",
    );
  }
  const contentType = (
    response.headers.get("content-type") || ""
  ).toLowerCase();
  if (!contentType.startsWith("image/")) {
    throw new MetaPublishingError(
      "media_unavailable",
      "The selected asset is not an image.",
    );
  }
  if (platform === "INSTAGRAM" && !contentType.startsWith("image/jpeg")) {
    throw new MetaPublishingError(
      "media_unsupported",
      "Instagram requires a JPEG image. Select the square graphic so the app can create a JPEG derivative.",
    );
  }
  const length = Number(response.headers.get("content-length") || "0");
  if (Number.isFinite(length) && length > 25 * 1024 * 1024) {
    throw new MetaPublishingError(
      "media_unsupported",
      "The selected graphic exceeds Meta's image size limit.",
    );
  }
  return { contentType, bytes: length };
}

export async function getMetaPublishingOverview(adminUserId: string) {
  const config = getMetaConfigurationSummary();
  const settings = await getMetaPublishingSettings();
  let connection: MetaConnectionDto | null = null;
  try {
    connection = await getMetaConnectionStatusForAdmin(adminUserId);
  } catch {
    connection = null;
  }
  const publishingEnabled =
    config.configured &&
    config.envPublishingEnabled &&
    settings.publishingEnabled;
  return {
    configured: config.configured,
    graphVersion: config.graphVersion,
    encryptionKeyConfigured: config.encryptionKeyConfigured,
    envPublishingEnabled: config.envPublishingEnabled,
    databasePublishingEnabled: settings.publishingEnabled,
    publishingEnabled,
    settingsUpdatedAt: settings.updatedAt,
    connection,
  };
}

async function assertPublishingEnabled() {
  const config = getMetaConfigurationSummary();
  if (!config.configured) {
    throw new MetaPublishingError(
      "not_configured",
      "Meta is not configured. Add the Meta app credentials and encryption key.",
    );
  }
  if (!isMetaEnvPublishingEnabled()) {
    throw new MetaPublishingError(
      "disabled",
      "Direct publishing is disabled by the environment switch (META_PUBLISHING_ENABLED).",
    );
  }
  const settings = await getMetaPublishingSettings();
  if (!settings.publishingEnabled) {
    throw new MetaPublishingError(
      "disabled",
      "Direct publishing is disabled in the application settings.",
    );
  }
}

async function beginAttempt(publicationId: string) {
  const prisma = prismaOrThrow();
  return prisma.$transaction(async (tx) => {
    const current = await tx.metaPublication.findUnique({
      where: { id: publicationId },
      select: { attemptCount: true },
    });
    if (!current)
      throw new MetaPublishingError("not_found", "Publication not found.");
    const attemptNumber = current.attemptCount + 1;
    const attempt = await tx.metaPublicationAttempt.create({
      data: { publicationId, attemptNumber, outcome: "PENDING" },
    });
    await tx.metaPublication.update({
      where: { id: publicationId },
      data: { attemptCount: attemptNumber },
    });
    return attempt;
  });
}

async function finishAttempt(input: {
  attemptId: string;
  outcome: "SUCCEEDED" | "FAILED" | "AMBIGUOUS";
  httpStatus?: number | null;
  errorCode?: string | null;
  errorSummary?: string | null;
  metaRequestId?: string | null;
}) {
  const prisma = prismaOrThrow();
  await prisma.metaPublicationAttempt.update({
    where: { id: input.attemptId },
    data: {
      outcome: input.outcome,
      responseAt: new Date(),
      httpStatus: input.httpStatus ?? null,
      errorCode: input.errorCode || null,
      errorSummary: input.errorSummary
        ? sanitizeMetaErrorText(input.errorSummary)
        : null,
      metaRequestId: input.metaRequestId || null,
    },
  });
}

async function loadPublication(publicationId: string) {
  const prisma = prismaOrThrow();
  const publication = await prisma.metaPublication.findUnique({
    where: { id: publicationId },
    include: publicationInclude,
  });
  if (!publication)
    throw new MetaPublishingError("not_found", "Publication not found.");
  return publication;
}

async function setDefinitiveFailure(input: {
  publicationId: string;
  error: MetaGraphError;
  releaseSlot: boolean;
  status?: "FAILED" | "REQUIRES_REAUTHORIZATION";
}) {
  const prisma = prismaOrThrow();
  await prisma.metaPublication.update({
    where: { id: input.publicationId },
    data: {
      status: input.status || "FAILED",
      activeKey: input.releaseSlot ? null : undefined,
      completedAt: new Date(),
      lastErrorCode:
        input.error.code !== null
          ? `META_${input.error.code}`
          : input.error.category,
      lastErrorMessage: input.error.message,
    },
  });
}

async function markAccountFailure(accountId: string, error: MetaGraphError) {
  const prisma = prismaOrThrow();
  const auth = error.category === "authentication";
  const permission = error.category === "permission";
  if (!auth && !permission) return;
  await prisma.$transaction(async (tx) => {
    const account = await tx.metaConnectedAccount.update({
      where: { id: accountId },
      data: {
        healthStatus: auth ? "TOKEN_REVOKED" : "PERMISSION_MISSING",
        healthMessage: error.message,
        permissionStatus: permission ? "MISSING" : undefined,
        lastHealthCheckAt: new Date(),
      },
      select: { connectionId: true },
    });
    await tx.metaConnection.update({
      where: { id: account.connectionId },
      data: {
        status: auth ? "REVOKED" : "ATTENTION_REQUIRED",
        healthMessage: error.message,
        lastHealthCheckAt: new Date(),
      },
    });
  });
}

async function publishToFacebook(input: {
  publication: PublicationWithRelations;
  pageId: string;
  pageToken: string;
  mediaUrl: string | null;
  caption: string;
  articleUrl: string;
}) {
  const prisma = prismaOrThrow();
  const attempt = await beginAttempt(input.publication.id);
  try {
    const result = input.mediaUrl
      ? await metaGraphRequest<{ id?: string; post_id?: string }>(
          `${input.pageId}/photos`,
          {
            method: "POST",
            params: {
              url: input.mediaUrl,
              caption: input.caption,
              published: true,
            },
            accessToken: input.pageToken,
            retry: false,
          },
        )
      : await metaGraphRequest<{ id?: string; post_id?: string }>(
          `${input.pageId}/feed`,
          {
            method: "POST",
            params: {
              message: input.caption,
              link: input.articleUrl,
              published: true,
            },
            accessToken: input.pageToken,
            retry: false,
          },
        );

    const externalId = result.post_id || result.id || null;
    if (!externalId) {
      throw new MetaGraphError({
        category: "ambiguous",
        message:
          "Meta accepted the request but did not return a post identifier. Check the Page before retrying.",
        technicalMessage: "Missing post id in Facebook publishing response.",
      });
    }

    const externalUrl = `https://www.facebook.com/${externalId}`;
    await prisma.metaPublication.update({
      where: { id: input.publication.id },
      data: {
        status: "PUBLISHED",
        externalId,
        externalUrl,
        publishedAt: new Date(),
        completedAt: new Date(),
        activeKey: null,
        lastErrorCode: null,
        lastErrorMessage: null,
      },
    });
    await finishAttempt({
      attemptId: attempt.id,
      outcome: "SUCCEEDED",
      httpStatus: 200,
    });
    return loadPublication(input.publication.id);
  } catch (error) {
    if (error instanceof MetaGraphError) {
      if (isAmbiguousMetaFailure(error)) {
        await prisma.metaPublication.update({
          where: { id: input.publication.id },
          data: {
            status: "UNKNOWN_RESULT",
            lastErrorCode: error.category,
            lastErrorMessage: error.message,
          },
        });
        await finishAttempt({
          attemptId: attempt.id,
          outcome: "AMBIGUOUS",
          httpStatus: error.httpStatus,
          errorCode: error.code !== null ? String(error.code) : error.category,
          errorSummary: error.message,
          metaRequestId: error.traceId,
        });
      } else {
        const auth =
          error.category === "authentication" ||
          error.category === "permission";
        await setDefinitiveFailure({
          publicationId: input.publication.id,
          error,
          releaseSlot: true,
          status: auth ? "REQUIRES_REAUTHORIZATION" : "FAILED",
        });
        await finishAttempt({
          attemptId: attempt.id,
          outcome: "FAILED",
          httpStatus: error.httpStatus,
          errorCode: error.code !== null ? String(error.code) : error.category,
          errorSummary: error.message,
          metaRequestId: error.traceId,
        });
        await markAccountFailure(
          input.publication.connectedAccountId || "",
          error,
        ).catch(() => undefined);
      }
    } else {
      await prisma.metaPublication.update({
        where: { id: input.publication.id },
        data: {
          status: "UNKNOWN_RESULT",
          lastErrorCode: "unexpected",
          lastErrorMessage:
            "The publishing request was interrupted. Check the Page before retrying.",
        },
      });
      await finishAttempt({
        attemptId: attempt.id,
        outcome: "AMBIGUOUS",
        errorCode: "unexpected",
        errorSummary: "Unexpected publishing interruption.",
      });
    }
    return loadPublication(input.publication.id);
  }
}

async function fetchInstagramPermalink(mediaId: string, token: string) {
  try {
    const result = await metaGraphRequest<{ permalink?: string }>(mediaId, {
      method: "GET",
      params: { fields: "permalink" },
      accessToken: token,
      retry: false,
    });
    return result.permalink || null;
  } catch {
    return null;
  }
}

async function publishInstagramContainer(input: {
  publication: PublicationWithRelations;
  igId: string;
  pageToken: string;
}) {
  const prisma = prismaOrThrow();
  const attempt = await beginAttempt(input.publication.id);
  try {
    const containerId = input.publication.containerId;
    if (!containerId) {
      throw new MetaGraphError({
        category: "invalid_request",
        message:
          "The Instagram media container is missing. Start a new publication.",
        technicalMessage: "Missing Instagram container id.",
      });
    }
    const result = await metaGraphRequest<{ id?: string }>(
      `${input.igId}/media_publish`,
      {
        method: "POST",
        params: { creation_id: containerId },
        accessToken: input.pageToken,
        retry: false,
      },
    );
    if (!result.id) {
      throw new MetaGraphError({
        category: "ambiguous",
        message:
          "Meta accepted the publish request but did not return a media ID.",
        technicalMessage: "Missing Instagram media id.",
      });
    }
    const externalUrl = await fetchInstagramPermalink(
      result.id,
      input.pageToken,
    );
    await prisma.metaPublication.update({
      where: { id: input.publication.id },
      data: {
        status: "PUBLISHED",
        externalId: result.id,
        externalUrl,
        publishedAt: new Date(),
        completedAt: new Date(),
        activeKey: null,
        lastErrorCode: null,
        lastErrorMessage: null,
      },
    });
    await finishAttempt({
      attemptId: attempt.id,
      outcome: "SUCCEEDED",
      httpStatus: 200,
    });
    return loadPublication(input.publication.id);
  } catch (error) {
    if (error instanceof MetaGraphError) {
      if (isAmbiguousMetaFailure(error)) {
        await prisma.metaPublication.update({
          where: { id: input.publication.id },
          data: {
            status: "UNKNOWN_RESULT",
            lastErrorCode: error.category,
            lastErrorMessage: error.message,
          },
        });
        await finishAttempt({
          attemptId: attempt.id,
          outcome: "AMBIGUOUS",
          httpStatus: error.httpStatus,
          errorCode: error.code !== null ? String(error.code) : error.category,
          errorSummary: error.message,
          metaRequestId: error.traceId,
        });
      } else {
        const auth =
          error.category === "authentication" ||
          error.category === "permission";
        await setDefinitiveFailure({
          publicationId: input.publication.id,
          error,
          releaseSlot: true,
          status: auth ? "REQUIRES_REAUTHORIZATION" : "FAILED",
        });
        await finishAttempt({
          attemptId: attempt.id,
          outcome: "FAILED",
          httpStatus: error.httpStatus,
          errorCode: error.code !== null ? String(error.code) : error.category,
          errorSummary: error.message,
          metaRequestId: error.traceId,
        });
        await markAccountFailure(
          input.publication.connectedAccountId || "",
          error,
        ).catch(() => undefined);
      }
    } else {
      await prisma.metaPublication.update({
        where: { id: input.publication.id },
        data: {
          status: "UNKNOWN_RESULT",
          lastErrorCode: "unexpected",
          lastErrorMessage:
            "The Instagram publish request was interrupted. Check the account before retrying.",
        },
      });
      await finishAttempt({
        attemptId: attempt.id,
        outcome: "AMBIGUOUS",
        errorCode: "unexpected",
        errorSummary: "Unexpected Instagram publishing interruption.",
      });
    }
    return loadPublication(input.publication.id);
  }
}

async function createInstagramContainer(input: {
  publication: PublicationWithRelations;
  igId: string;
  pageToken: string;
  mediaUrl: string;
  caption: string;
}) {
  const prisma = prismaOrThrow();
  const attempt = await beginAttempt(input.publication.id);
  try {
    const container = await metaGraphRequest<{ id?: string }>(
      `${input.igId}/media`,
      {
        method: "POST",
        params: { image_url: input.mediaUrl, caption: input.caption },
        accessToken: input.pageToken,
        retry: false,
      },
    );
    if (!container.id) {
      throw new MetaGraphError({
        category: "invalid_request",
        message: "Meta did not create an Instagram media container.",
        technicalMessage: "Missing Instagram container id in response.",
      });
    }
    await prisma.metaPublication.update({
      where: { id: input.publication.id },
      data: {
        status: "PROCESSING",
        containerId: container.id,
        lastErrorCode: null,
        lastErrorMessage: null,
      },
    });
    await finishAttempt({
      attemptId: attempt.id,
      outcome: "SUCCEEDED",
      httpStatus: 200,
      errorSummary: "Instagram media container created.",
    });
    return container.id;
  } catch (error) {
    if (error instanceof MetaGraphError) {
      const ambiguous = isAmbiguousMetaFailure(error);
      await prisma.metaPublication.update({
        where: { id: input.publication.id },
        data: ambiguous
          ? {
              status: "UNKNOWN_RESULT",
              lastErrorCode: error.category,
              lastErrorMessage: error.message,
            }
          : {
              status:
                error.category === "authentication" ||
                error.category === "permission"
                  ? "REQUIRES_REAUTHORIZATION"
                  : "FAILED",
              activeKey: null,
              completedAt: new Date(),
              lastErrorCode:
                error.code !== null ? `META_${error.code}` : error.category,
              lastErrorMessage: error.message,
            },
      });
      await finishAttempt({
        attemptId: attempt.id,
        outcome: ambiguous ? "AMBIGUOUS" : "FAILED",
        httpStatus: error.httpStatus,
        errorCode: error.code !== null ? String(error.code) : error.category,
        errorSummary: error.message,
        metaRequestId: error.traceId,
      });
      if (!ambiguous)
        await markAccountFailure(
          input.publication.connectedAccountId || "",
          error,
        ).catch(() => undefined);
    } else {
      await prisma.metaPublication.update({
        where: { id: input.publication.id },
        data: {
          status: "UNKNOWN_RESULT",
          lastErrorCode: "unexpected",
          lastErrorMessage: "The Instagram container request was interrupted.",
        },
      });
      await finishAttempt({
        attemptId: attempt.id,
        outcome: "AMBIGUOUS",
        errorCode: "unexpected",
        errorSummary: "Unexpected Instagram container interruption.",
      });
    }
    throw error;
  }
}

type InstagramContainerStatus =
  | "EXPIRED"
  | "ERROR"
  | "FINISHED"
  | "IN_PROGRESS"
  | "PUBLISHED"
  | string;

async function readInstagramContainerStatus(
  containerId: string,
  token: string,
): Promise<InstagramContainerStatus> {
  const result = await metaGraphRequest<{ status_code?: string }>(containerId, {
    method: "GET",
    params: { fields: "status_code" },
    accessToken: token,
    retry: false,
  });
  return result.status_code || "IN_PROGRESS";
}

async function findRecentInstagramPost(
  publication: PublicationWithRelations,
  igId: string,
  token: string,
) {
  try {
    const result = await metaGraphRequest<{
      data?: Array<{
        id: string;
        permalink?: string;
        caption?: string;
        timestamp?: string;
      }>;
    }>(`${igId}/media`, {
      method: "GET",
      params: { fields: "id,permalink,caption,timestamp", limit: 15 },
      accessToken: token,
      retry: false,
    });
    const start = publication.startedAt.getTime() - 5 * 60_000;
    return (
      (result.data || []).find((item) => {
        if (
          normalizeCaption(item.caption || "") !==
          normalizeCaption(publication.captionSnapshot)
        )
          return false;
        const stamp = item.timestamp ? Date.parse(item.timestamp) : NaN;
        return Number.isFinite(stamp) ? stamp >= start : true;
      }) || null
    );
  } catch {
    return null;
  }
}

type FacebookFeedLookup =
  | { kind: "found"; post: { id: string; permalink_url?: string } }
  | { kind: "not_found" }
  | { kind: "failed"; error: MetaGraphError };

async function findRecentFacebookPost(
  publication: PublicationWithRelations,
  pageId: string,
  token: string,
): Promise<FacebookFeedLookup> {
  try {
    const result = await metaGraphRequest<{
      data?: Array<{
        id: string;
        message?: string;
        created_time?: string;
        permalink_url?: string;
      }>;
    }>(`${pageId}/feed`, {
      method: "GET",
      params: { fields: "id,message,created_time,permalink_url", limit: 15 },
      accessToken: token,
      retry: false,
    });
    const start = publication.startedAt.getTime() - 5 * 60_000;
    const match =
      (result.data || []).find((item) => {
        if (
          normalizeCaption(item.message || "") !==
          normalizeCaption(publication.captionSnapshot)
        )
          return false;
        const stamp = item.created_time ? Date.parse(item.created_time) : NaN;
        return Number.isFinite(stamp) ? stamp >= start : true;
      }) || null;
    if (match) return { kind: "found", post: match };
    return { kind: "not_found" };
  } catch (error) {
    if (error instanceof MetaGraphError) return { kind: "failed", error };
    return {
      kind: "failed",
      error: new MetaGraphError({
        category: "outage",
        message: "Meta is temporarily unavailable. Try again shortly.",
        technicalMessage:
          error instanceof Error ? error.message : "Facebook feed lookup failed.",
      }),
    };
  }
}

async function markReconciled(
  publicationId: string,
  externalId: string,
  externalUrl: string | null,
) {
  const prisma = prismaOrThrow();
  await prisma.metaPublication.update({
    where: { id: publicationId },
    data: {
      status: "PUBLISHED",
      externalId,
      externalUrl,
      publishedAt: new Date(),
      completedAt: new Date(),
      activeKey: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      reconciliationAttemptedAt: new Date(),
    },
  });
}

/**
 * Completes a pending Instagram container or reconciles an ambiguous result.
 * It never creates a second external post for the same approved publication.
 */
export async function reconcileMetaPublication(
  publicationId: string,
  adminUserId: string,
) {
  const prisma = prismaOrThrow();
  const publication = await loadPublication(publicationId);
  if (
    publication.status === "PUBLISHED" ||
    publication.status === "FAILED" ||
    publication.status === "CANCELLED"
  ) {
    return toPublicationDto(publication);
  }

  const account = publication.connectedAccountId
    ? await prisma.metaConnectedAccount.findUnique({
        where: { id: publication.connectedAccountId },
      })
    : null;
  if (!account) {
    throw new MetaPublishingError(
      "not_reconcilable",
      "The destination account is no longer available. Resolve the publication manually.",
    );
  }

  let pageToken: string | null = null;
  try {
    const resolved = await getPublishingAccount({
      accountId: account.id,
      adminUserId,
      platform: publication.platform === "FACEBOOK" ? "FACEBOOK" : "INSTAGRAM",
    });
    pageToken = resolved.pageToken;
  } catch (error) {
    if (error instanceof MetaAccountError) {
      // Reconciliation can still read a Page feed with an existing token even
      // when the cached health is stale; fall back only when a token exists.
      pageToken = null;
    } else {
      throw error;
    }
  }
  if (!pageToken) {
    const fallback = await prisma.metaConnectedAccount.findFirst({
      where: {
        OR: [
          { id: account.id, encryptedAccessToken: { not: null } },
          {
            connectionId: account.connectionId,
            platform: "FACEBOOK_PAGE",
            platformAccountId: account.pageId || "",
          },
        ],
      },
      select: { encryptedAccessToken: true },
    });
    if (fallback?.encryptedAccessToken) {
      try {
        const { decryptMetaToken } = await import("./crypto");
        pageToken = decryptMetaToken(fallback.encryptedAccessToken);
      } catch {
        pageToken = null;
      }
    }
  }

  if (!pageToken) {
    throw new MetaPublishingError(
      "not_reconcilable",
      "Reconnect the destination before checking this publication.",
    );
  }

  // A pending record older than two minutes may have been interrupted before
  // any external call. For Instagram, no container means no post was created.
  if (
    publication.status === "PENDING" &&
    Date.now() - publication.startedAt.getTime() > 120_000
  ) {
    if (publication.platform === "FACEBOOK" && account.pageId) {
      const lookup = await findRecentFacebookPost(
        publication,
        account.pageId,
        pageToken,
      );
      if (lookup.kind === "found") {
        await markReconciled(
          publication.id,
          lookup.post.id,
          lookup.post.permalink_url || `https://www.facebook.com/${lookup.post.id}`,
        );
        return toPublicationDto(await loadPublication(publication.id));
      }
      await prisma.metaPublication.update({
        where: { id: publication.id },
        data: {
          status: "UNKNOWN_RESULT",
          reconciliationAttemptedAt: new Date(),
          lastErrorCode:
            lookup.kind === "not_found" ? "no_matching_post" : lookup.error.category,
          lastErrorMessage:
            lookup.kind === "not_found"
              ? "No matching Facebook post was found, but feed visibility can be delayed. The result remains unresolved."
              : lookup.error.message,
        },
      });
      return toPublicationDto(await loadPublication(publication.id));
    }
    await prisma.metaPublication.update({
      where: { id: publication.id },
      data: {
        status: "UNKNOWN_RESULT",
        reconciliationAttemptedAt: new Date(),
        lastErrorCode: "interrupted",
        lastErrorMessage:
          "The publishing request was interrupted before Meta confirmed a result. The result remains unresolved.",
      },
    });
    return toPublicationDto(await loadPublication(publication.id));
  }

  if (publication.platform === "FACEBOOK") {
    if (!account.pageId)
      throw new MetaPublishingError(
        "not_reconcilable",
        "The Page destination is missing.",
      );
    const lookup = await findRecentFacebookPost(
      publication,
      account.pageId,
      pageToken,
    );
    if (lookup.kind === "found") {
      await markReconciled(
        publication.id,
        lookup.post.id,
        lookup.post.permalink_url || `https://www.facebook.com/${lookup.post.id}`,
      );
    } else if (lookup.kind === "not_found") {
      await prisma.metaPublication.update({
        where: { id: publication.id },
        data: {
          reconciliationAttemptedAt: new Date(),
          lastErrorCode: "no_matching_post",
          lastErrorMessage:
            "No matching Facebook post was found. Feed visibility can be delayed; the publication remains unresolved.",
        },
      });
    } else {
      await prisma.metaPublication.update({
        where: { id: publication.id },
        data: {
          reconciliationAttemptedAt: new Date(),
          lastErrorCode: lookup.error.category,
          lastErrorMessage: lookup.error.message,
        },
      });
    }
    return toPublicationDto(await loadPublication(publication.id));
  }

  if (!publication.containerId) {
    throw new MetaPublishingError(
      "not_reconcilable",
      "The Instagram container was not stored. Resolve this publication manually.",
    );
  }

  let statusCode: string;
  try {
    statusCode = await readInstagramContainerStatus(
      publication.containerId,
      pageToken,
    );
  } catch (error) {
    const mapped =
      error instanceof MetaGraphError
        ? error
        : new MetaGraphError({
            category: "outage",
            message: "Meta is temporarily unavailable. Try again shortly.",
            technicalMessage:
              error instanceof Error ? error.message : "Instagram status lookup failed.",
          });
    await prisma.metaPublication.update({
      where: { id: publication.id },
      data: {
        status: "UNKNOWN_RESULT",
        reconciliationAttemptedAt: new Date(),
        lastErrorCode: mapped.category,
        lastErrorMessage: mapped.message,
      },
    });
    return toPublicationDto(await loadPublication(publication.id));
  }
  if (statusCode === "FINISHED") {
    const result = await publishInstagramContainer({
      publication,
      igId: account.platformAccountId,
      pageToken,
    });
    return toPublicationDto(result);
  }
  if (statusCode === "PUBLISHED") {
    const match = await findRecentInstagramPost(
      publication,
      account.platformAccountId,
      pageToken,
    );
    if (match) {
      await markReconciled(publication.id, match.id, match.permalink || null);
    } else {
      await prisma.metaPublication.update({
        where: { id: publication.id },
        data: {
          status: "UNKNOWN_RESULT",
          reconciliationAttemptedAt: new Date(),
          lastErrorCode: "reconciliation_pending",
          lastErrorMessage:
            "Meta reports the container as published, but the media could not be matched yet. Check the Instagram account.",
        },
      });
    }
    return toPublicationDto(await loadPublication(publication.id));
  }
  if (statusCode === "ERROR" || statusCode === "EXPIRED") {
    await prisma.metaPublication.update({
      where: { id: publication.id },
      data: {
        status: "FAILED",
        activeKey: null,
        completedAt: new Date(),
        reconciliationAttemptedAt: new Date(),
        lastErrorCode:
          statusCode === "EXPIRED" ? "container_expired" : "container_error",
        lastErrorMessage:
          statusCode === "EXPIRED"
            ? "The Instagram media container expired before publishing. Start a new publication."
            : "Meta could not process the Instagram media container.",
      },
    });
    return toPublicationDto(await loadPublication(publication.id));
  }

  await prisma.metaPublication.update({
    where: { id: publication.id },
    data: {
      status: "PROCESSING",
      reconciliationAttemptedAt: new Date(),
      lastErrorMessage: "Meta is still processing the Instagram media.",
    },
  });
  return toPublicationDto(await loadPublication(publication.id));
}

/**
 * Publishes exactly the saved Social Share Kit variant for a public article.
 * The browser cannot supply the caption, account ID, or media URL.
 */
export async function publishMetaPublication(
  input: MetaPublishInput,
  adminUserId: string,
) {
  await assertPublishingEnabled();
  const prisma = prismaOrThrow();

  const post = await prisma.blogPost.findUnique({
    where: { id: input.postId },
    select: {
      id: true,
      title: true,
      slug: true,
      locale: true,
      status: true,
      published: true,
      publishedAt: true,
      canonicalUrl: true,
      socialShareKits: {
        select: {
          id: true,
          variants: {
            select: {
              id: true,
              platform: true,
              generatedCaption: true,
              editedCaption: true,
            },
          },
          graphics: {
            select: {
              id: true,
              format: true,
              url: true,
              width: true,
              height: true,
              formatMime: true,
            },
          },
        },
      },
    },
  });
  if (!post) throw new MetaPublishingError("not_found", "Article not found.");
  if (
    post.status !== "PUBLISHED" ||
    !post.published ||
    !post.publishedAt ||
    post.publishedAt.getTime() > Date.now()
  ) {
    throw new MetaPublishingError(
      "not_public",
      "This article is not publicly available. Publish the article before promoting it on social media.",
    );
  }

  const kit = post.socialShareKits[0] || null;
  if (!kit)
    throw new MetaPublishingError(
      "no_variant",
      "Generate a Social Share Kit caption before publishing.",
    );
  const variant = kit.variants.find((item) => item.platform === input.platform);
  if (!variant)
    throw new MetaPublishingError(
      "no_variant",
      `Generate a ${input.platform === "FACEBOOK" ? "Facebook" : "Instagram"} caption first.`,
    );

  const caption = normalizeCaption(
    variant.editedCaption || variant.generatedCaption,
  );
  if (!caption)
    throw new MetaPublishingError(
      "no_caption",
      "The selected caption is empty.",
    );
  if (input.platform === "INSTAGRAM" && caption.length > 2200) {
    throw new MetaPublishingError(
      "caption_too_long",
      "Instagram captions must be 2,200 characters or fewer.",
    );
  }
  if (input.platform === "FACEBOOK" && caption.length > 63_206) {
    throw new MetaPublishingError(
      "caption_too_long",
      "The Facebook caption is too long.",
    );
  }

  const graphic = input.graphicId
    ? kit.graphics.find((item) => item.id === input.graphicId)
    : null;
  if (input.graphicId && !graphic) {
    throw new MetaPublishingError(
      "media_unavailable",
      "The selected graphic does not belong to this article.",
    );
  }
  if (input.platform === "INSTAGRAM" && !graphic) {
    throw new MetaPublishingError(
      "media_unsupported",
      "Instagram publishing requires a square branded graphic.",
    );
  }
  if (
    input.platform === "INSTAGRAM" &&
    graphic &&
    graphic.format !== "SQUARE"
  ) {
    throw new MetaPublishingError(
      "media_unsupported",
      "Instagram feed publishing supports the square graphic. The vertical 1080×1920 asset is not a supported feed aspect ratio.",
    );
  }

  const articleUrl = resolvePublicArticleUrl({
    locale: post.locale === "fr" ? "fr" : "en",
    slug: post.slug,
    canonicalUrl: post.canonicalUrl,
  });

  const destination = await getPublishingAccount({
    accountId: input.connectedAccountId,
    adminUserId,
    platform: input.platform,
  });

  const mediaUrl = graphic ? metaJpegUrl(graphic.url) : null;
  const mediaFormat = graphic ? (mediaUrl ? "jpg" : graphic.formatMime) : null;
  if (mediaUrl) await verifyMediaIsPublic(mediaUrl, input.platform);

  if (
    input.platform === "FACEBOOK" &&
    (!destination.pageId || !destination.pageToken)
  ) {
    throw new MetaPublishingError(
      "not_configured",
      "The Facebook Page credential is missing. Reconnect the Page.",
    );
  }
  if (input.platform === "INSTAGRAM" && !destination.pageToken) {
    throw new MetaPublishingError(
      "not_configured",
      "The Instagram publishing credential is missing. Reconnect the parent Page.",
    );
  }

  const activeKey = `${variant.id}:${destination.account.id}`;

  const existingByKey = await prisma.metaPublication.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: publicationInclude,
  });
  if (existingByKey) {
    const same =
      existingByKey.articleId === post.id &&
      existingByKey.platform === input.platform &&
      existingByKey.connectedAccountId === destination.account.id &&
      existingByKey.graphicId === (graphic?.id || null) &&
      normalizeCaption(existingByKey.captionSnapshot) === caption;
    if (!same) {
      throw new MetaPublishingError(
        "idempotency_conflict",
        "This idempotency key was already used for different content.",
      );
    }
    return { publication: toPublicationDto(existingByKey), replayed: true };
  }

  // A second confirmation with a fresh idempotency key must never produce an
  // exact duplicate of content that is already live on the same destination.
  const duplicate = await prisma.metaPublication.findFirst({
    where: {
      variantId: variant.id,
      connectedAccountId: destination.account.id,
      status: "PUBLISHED",
      captionSnapshot: caption,
      graphicId: graphic?.id || null,
    },
    select: { id: true, externalUrl: true, publishedAt: true },
  });
  if (duplicate) {
    throw new MetaPublishingError(
      "already_published",
      `This exact content is already published to this destination. Open the existing post from the publication history instead of publishing it again.`,
    );
  }

  const active = await prisma.metaPublication.findFirst({
    where: {
      activeKey,
      status: { in: ["PENDING", "PROCESSING", "UNKNOWN_RESULT"] },
    },
    select: { id: true, status: true },
  });
  if (active) {
    throw new MetaPublishingError(
      active.status === "UNKNOWN_RESULT" ? "ambiguous" : "in_progress",
      active.status === "UNKNOWN_RESULT"
        ? "A previous publication for this content has an unknown result. Check the publication history before creating another post."
        : "A publication for this content and destination is already in progress.",
    );
  }

  let publication: PublicationWithRelations;
  try {
    publication = await prisma.$transaction(async (tx) => {
      const created = await tx.metaPublication.create({
        data: {
          variantId: variant.id,
          graphicId: graphic?.id || null,
          connectedAccountId: destination.account.id,
          platform: input.platform,
          status: "PENDING",
          captionSnapshot: caption,
          mediaUrl,
          mediaFormat,
          articleId: post.id,
          articleUrl,
          destinationName: destination.account.displayName,
          destinationAccountId: destination.account.platformAccountId,
          idempotencyKey: input.idempotencyKey,
          activeKey,
          initiatedById: adminUserId,
        },
        include: publicationInclude,
      });
      return created;
    });
  } catch (error) {
    if (isUniqueError(error)) {
      const raced = await prisma.metaPublication.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: publicationInclude,
      });
      if (raced)
        return { publication: toPublicationDto(raced), replayed: true };
      throw new MetaPublishingError(
        "in_progress",
        "Another publication for this content started at the same time. Check the publication history before retrying.",
      );
    }
    throw error;
  }

  if (input.platform === "FACEBOOK") {
    if (!destination.pageId || !destination.pageToken) {
      throw new MetaPublishingError(
        "not_configured",
        "The Facebook Page credential is missing.",
      );
    }
    const result = await publishToFacebook({
      publication,
      pageId: destination.pageId,
      pageToken: destination.pageToken,
      mediaUrl,
      caption,
      articleUrl,
    });
    return { publication: toPublicationDto(result), replayed: false };
  }

  if (!mediaUrl || !graphic) {
    throw new MetaPublishingError(
      "media_unsupported",
      "Instagram publishing requires a square branded graphic.",
    );
  }
  if (!destination.pageToken) {
    throw new MetaPublishingError(
      "not_configured",
      "The Instagram publishing credential is missing.",
    );
  }

  const containerId = await createInstagramContainer({
    publication,
    igId: destination.destinationId,
    pageToken: destination.pageToken,
    mediaUrl,
    caption,
  }).catch(async (error) => {
    // The helper already persisted the failure. Return the current record
    // instead of throwing through the route as an opaque 500.
    if (error instanceof MetaGraphError) return null;
    throw error;
  });

  if (!containerId) {
    return {
      publication: toPublicationDto(await loadPublication(publication.id)),
      replayed: false,
    };
  }

  const latest = await loadPublication(publication.id);
  const statusDeadline = Date.now() + 25_000;
  const interval = 2_000;
  let statusCode: InstagramContainerStatus = "IN_PROGRESS";
  while (Date.now() < statusDeadline) {
    statusCode = await readInstagramContainerStatus(
      containerId,
      destination.pageToken,
    );
    if (statusCode !== "IN_PROGRESS") break;
    await sleep(interval);
  }

  if (statusCode === "FINISHED") {
    const result = await publishInstagramContainer({
      publication: latest,
      igId: destination.destinationId,
      pageToken: destination.pageToken,
    });
    return { publication: toPublicationDto(result), replayed: false };
  }
  if (statusCode === "PUBLISHED") {
    const match = await findRecentInstagramPost(
      latest,
      destination.destinationId,
      destination.pageToken,
    );
    if (match) {
      await markReconciled(latest.id, match.id, match.permalink || null);
    }
    return {
      publication: toPublicationDto(await loadPublication(publication.id)),
      replayed: false,
    };
  }
  if (statusCode === "ERROR" || statusCode === "EXPIRED") {
    await prisma.metaPublication.update({
      where: { id: publication.id },
      data: {
        status: "FAILED",
        activeKey: null,
        completedAt: new Date(),
        lastErrorCode:
          statusCode === "EXPIRED" ? "container_expired" : "container_error",
        lastErrorMessage:
          statusCode === "EXPIRED"
            ? "The Instagram media container expired before publishing."
            : "Meta could not process the Instagram media container.",
      },
    });
    return {
      publication: toPublicationDto(await loadPublication(publication.id)),
      replayed: false,
    };
  }

  await prisma.metaPublication.update({
    where: { id: publication.id },
    data: {
      status: "PROCESSING",
      lastErrorMessage:
        "Meta is still processing the Instagram media. Check the status again shortly.",
    },
  });
  return {
    publication: toPublicationDto(await loadPublication(publication.id)),
    replayed: false,
  };
}

export async function listMetaPublications(input: {
  adminUserId: string;
  postId?: string;
  limit?: number;
  offset?: number;
}) {
  const prisma = prismaOrThrow();
  const limit = Math.min(Math.max(input.limit || 10, 1), 50);
  const offset = Math.max(input.offset || 0, 0);
  const [rows, total] = await prisma.$transaction([
    prisma.metaPublication.findMany({
      where: input.postId ? { articleId: input.postId } : {},
      include: publicationInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.metaPublication.count({
      where: input.postId ? { articleId: input.postId } : {},
    }),
  ]);
  return { publications: rows.map(toPublicationDto), total, limit, offset };
}

export async function getMetaPublication(publicationId: string) {
  return toPublicationDto(await loadPublication(publicationId));
}

export async function resolveMetaPublication(input: {
  publicationId: string;
  adminUserId: string;
  action: "confirm_published" | "mark_failed";
  externalUrl?: string;
}) {
  const prisma = prismaOrThrow();
  const publication = await loadPublication(input.publicationId);
  if (
    !["UNKNOWN_RESULT", "PROCESSING", "PENDING"].includes(publication.status)
  ) {
    throw new MetaPublishingError(
      "not_reconcilable",
      "This publication is already in a final state.",
    );
  }

  if (input.action === "confirm_published") {
    const externalUrl = input.externalUrl?.trim() || null;
    if (externalUrl) {
      try {
        const url = new URL(externalUrl);
        if (url.protocol !== "https:" && url.protocol !== "http:")
          throw new Error("bad protocol");
      } catch {
        throw new MetaPublishingError(
          "not_reconcilable",
          "Enter a valid external publication URL.",
        );
      }
    }
    await prisma.metaPublication.update({
      where: { id: publication.id },
      data: {
        status: "PUBLISHED",
        externalUrl,
        publishedAt: new Date(),
        completedAt: new Date(),
        activeKey: null,
        lastErrorCode: null,
        lastErrorMessage: null,
        reconciliationAttemptedAt: new Date(),
      },
    });
  } else {
    await prisma.metaPublication.update({
      where: { id: publication.id },
      data: {
        status: "FAILED",
        activeKey: null,
        completedAt: new Date(),
        reconciliationAttemptedAt: new Date(),
        lastErrorCode: "manual_failure",
        lastErrorMessage:
          "An administrator confirmed that no external post was created.",
      },
    });
  }
  return getMetaPublication(publication.id);
}
