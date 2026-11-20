import { assertSameOrigin, requireSuperAdmin } from "@/lib/blog/auth";
import { writeAuditLog } from "@/lib/admin/session";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { metaApiError, metaNoStore } from "@/lib/meta/http";
import {
  getMetaPublication,
  reconcileMetaPublication,
  resolveMetaPublication,
} from "@/lib/meta/publishing";
import { metaResolvePublicationInputSchema } from "@/lib/meta/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    const rate = checkRateLimit(
      `meta-publication-get:${actor.id}:${requestIp(request.headers)}`,
      120,
      60_000,
    );
    if (!rate.ok)
      return metaNoStore(
        {
          ok: false,
          error: "Too many requests. Try again shortly.",
          code: "rate_limited",
        },
        429,
      );

    const { id } = await params;
    if (!id || id.length > 64)
      return metaNoStore({ ok: false, error: "Invalid publication id." }, 400);
    const publication = await getMetaPublication(id);
    return metaNoStore({ ok: true, publication });
  } catch (error) {
    return metaApiError("meta_publication_get_failed", error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    const rate = checkRateLimit(
      `meta-publication-action:${actor.id}:${requestIp(request.headers)}`,
      20,
      60_000,
    );
    if (!rate.ok)
      return metaNoStore(
        {
          ok: false,
          error: "Too many requests. Try again shortly.",
          code: "rate_limited",
        },
        429,
      );

    const { id } = await params;
    if (!id || id.length > 64)
      return metaNoStore({ ok: false, error: "Invalid publication id." }, 400);

    const json = await request.json().catch(() => null);
    const parsed = metaResolvePublicationInputSchema.safeParse(json);
    if (!parsed.success)
      return metaNoStore(
        { ok: false, error: "Invalid publication action." },
        400,
      );

    let publication;
    if (parsed.data.action === "check") {
      publication = await reconcileMetaPublication(id, actor.id);
    } else {
      publication = await resolveMetaPublication({
        publicationId: id,
        adminUserId: actor.id,
        action: parsed.data.action,
        externalUrl: parsed.data.externalUrl || undefined,
      });
    }

    await writeAuditLog({
      actorId: actor.id,
      action:
        parsed.data.action === "check"
          ? "meta.publication.reconciled"
          : parsed.data.action === "confirm_published"
            ? "meta.publication.confirmed_published"
            : "meta.publication.confirmed_failed",
      entityType: "MetaPublication",
      entityId: id,
      metadata: { status: publication.status, action: parsed.data.action },
      ip: requestIp(request.headers),
    }).catch(() => undefined);

    return metaNoStore({ ok: true, publication });
  } catch (error) {
    return metaApiError("meta_publication_action_failed", error);
  }
}
