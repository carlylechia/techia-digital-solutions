import { assertSameOrigin, requireSuperAdmin } from "@/lib/blog/auth";
import { writeAuditLog } from "@/lib/admin/session";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { metaApiError, metaNoStore } from "@/lib/meta/http";
import {
  listMetaPublications,
  publishMetaPublication,
  MetaPublishingError,
} from "@/lib/meta/publishing";
import { MetaGraphError } from "@/lib/meta/graph";
import { MetaAccountError } from "@/lib/meta/accounts";
import {
  metaPublicationListQuerySchema,
  metaPublishInputSchema,
} from "@/lib/meta/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    const rate = checkRateLimit(
      `meta-publications-list:${actor.id}:${requestIp(request.headers)}`,
      120,
      60_000,
    );
    if (!rate.ok)
      return metaNoStore(
        {
          ok: false,
          error: "Too many history requests. Try again shortly.",
          code: "rate_limited",
        },
        429,
      );

    const url = new URL(request.url);
    const parsed = metaPublicationListQuerySchema.safeParse({
      postId: url.searchParams.get("postId") || undefined,
      limit: url.searchParams.get("limit") || undefined,
      offset: url.searchParams.get("offset") || undefined,
    });
    if (!parsed.success)
      return metaNoStore({ ok: false, error: "Invalid history query." }, 400);

    const result = await listMetaPublications({
      adminUserId: actor.id,
      ...parsed.data,
    });
    return metaNoStore({ ok: true, ...result });
  } catch (error) {
    return metaApiError("meta_publications_list_failed", error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    const rate = checkRateLimit(
      `meta-publish:${actor.id}:${requestIp(request.headers)}`,
      10,
      60_000,
    );
    if (!rate.ok)
      return metaNoStore(
        {
          ok: false,
          error: "Publishing attempts are limited. Try again shortly.",
          code: "rate_limited",
        },
        429,
      );

    const json = await request.json().catch(() => null);
    const parsed = metaPublishInputSchema.safeParse(json);
    if (!parsed.success) {
      return metaNoStore(
        {
          ok: false,
          error:
            "Invalid publish request. Review the destination, graphic, and confirmation.",
          issues: parsed.error.issues,
        },
        400,
      );
    }

    await writeAuditLog({
      actorId: actor.id,
      action: "meta.publication.started",
      entityType: "MetaPublication",
      entityId: parsed.data.idempotencyKey,
      metadata: {
        postId: parsed.data.postId,
        platform: parsed.data.platform,
        connectedAccountId: parsed.data.connectedAccountId,
        graphicId: parsed.data.graphicId || null,
      },
      ip: requestIp(request.headers),
    }).catch(() => undefined);

    try {
      const result = await publishMetaPublication(parsed.data, actor.id);
      await writeAuditLog({
        actorId: actor.id,
        action: "meta.publication.result",
        entityType: "MetaPublication",
        entityId: result.publication.id,
        metadata: {
          status: result.publication.status,
          platform: result.publication.platform,
          replayed: result.replayed,
          externalId: result.publication.externalId,
        },
        ip: requestIp(request.headers),
      }).catch(() => undefined);
      return metaNoStore({ ok: true, ...result }, result.replayed ? 200 : 201);
    } catch (error) {
      const code =
        error instanceof MetaPublishingError
          ? error.code
          : error instanceof MetaGraphError
            ? error.category
            : error instanceof MetaAccountError
              ? error.code
              : "publish_failed";
      await writeAuditLog({
        actorId: actor.id,
        action: "meta.publication.failed",
        entityType: "MetaPublication",
        entityId: parsed.data.idempotencyKey,
        metadata: {
          postId: parsed.data.postId,
          platform: parsed.data.platform,
          code,
        },
        ip: requestIp(request.headers),
      }).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    return metaApiError("meta_publish_failed", error);
  }
}
