import { assertSameOrigin, requireSuperAdmin } from "@/lib/blog/auth";
import { writeAuditLog } from "@/lib/admin/session";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { refreshMetaConnectionHealth } from "@/lib/meta/accounts";
import { metaApiError, metaNoStore } from "@/lib/meta/http";
import { metaHealthInputSchema } from "@/lib/meta/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    const rate = checkRateLimit(
      `meta-health:${actor.id}:${requestIp(request.headers)}`,
      6,
      60_000,
    );
    if (!rate.ok)
      return metaNoStore(
        {
          ok: false,
          error: "Health checks are limited. Try again shortly.",
          code: "rate_limited",
        },
        429,
      );

    const json = await request.json().catch(() => null);
    const parsed = metaHealthInputSchema.safeParse(json);
    if (!parsed.success)
      return metaNoStore(
        { ok: false, error: "Invalid health-check request." },
        400,
      );

    const connection = await refreshMetaConnectionHealth(
      parsed.data.connectionId,
      actor.id,
    );
    await writeAuditLog({
      actorId: actor.id,
      action: "meta.accounts.health_checked",
      entityType: "MetaConnection",
      entityId: parsed.data.connectionId,
      metadata: {
        status: connection.status,
        accounts: connection.accounts.length,
      },
      ip: requestIp(request.headers),
    }).catch(() => undefined);

    return metaNoStore({ ok: true, connection });
  } catch (error) {
    return metaApiError("meta_health_failed", error);
  }
}
