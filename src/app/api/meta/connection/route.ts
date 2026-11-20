import { assertSameOrigin, requireSuperAdmin } from "@/lib/blog/auth";
import { writeAuditLog } from "@/lib/admin/session";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { disconnectMetaConnection } from "@/lib/meta/accounts";
import { metaApiError, metaNoStore } from "@/lib/meta/http";
import { metaDisconnectConnectionSchema } from "@/lib/meta/types";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    const rate = checkRateLimit(
      `meta-connection-disconnect:${actor.id}:${requestIp(request.headers)}`,
      6,
      60_000,
    );
    if (!rate.ok)
      return metaNoStore(
        {
          ok: false,
          error: "Too many disconnect requests. Try again shortly.",
          code: "rate_limited",
        },
        429,
      );

    const json = await request.json().catch(() => null);
    const parsed = metaDisconnectConnectionSchema.safeParse(json);
    if (!parsed.success)
      return metaNoStore(
        { ok: false, error: "Invalid connection request." },
        400,
      );

    const result = await disconnectMetaConnection(
      parsed.data.connectionId,
      actor.id,
    );
    await writeAuditLog({
      actorId: actor.id,
      action: "meta.connection.disconnected",
      entityType: "MetaConnection",
      entityId: parsed.data.connectionId,
      metadata: {},
      ip: requestIp(request.headers),
    }).catch(() => undefined);

    return metaNoStore({ ok: true, ...result });
  } catch (error) {
    return metaApiError("meta_connection_disconnect_failed", error);
  }
}
