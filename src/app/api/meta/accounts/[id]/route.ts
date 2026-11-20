import { assertSameOrigin, requireSuperAdmin } from "@/lib/blog/auth";
import { writeAuditLog } from "@/lib/admin/session";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { disconnectMetaAccount } from "@/lib/meta/accounts";
import { metaApiError, metaNoStore } from "@/lib/meta/http";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    const rate = checkRateLimit(
      `meta-account-disconnect:${actor.id}:${requestIp(request.headers)}`,
      10,
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

    const { id } = await params;
    if (!id || id.length > 64)
      return metaNoStore({ ok: false, error: "Invalid account id." }, 400);

    const result = await disconnectMetaAccount(id, actor.id);
    await writeAuditLog({
      actorId: actor.id,
      action: "meta.account.disconnected",
      entityType: "MetaConnectedAccount",
      entityId: id,
      metadata: {},
      ip: requestIp(request.headers),
    }).catch(() => undefined);

    return metaNoStore({ ok: true, ...result });
  } catch (error) {
    return metaApiError("meta_account_disconnect_failed", error);
  }
}
