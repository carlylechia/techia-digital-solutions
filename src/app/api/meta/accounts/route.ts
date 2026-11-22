import { assertSameOrigin, requireSuperAdmin } from "@/lib/blog/auth";
import { writeAuditLog } from "@/lib/admin/session";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { connectMetaAccounts, discoverMetaAssets } from "@/lib/meta/accounts";
import { metaApiError, metaNoStore } from "@/lib/meta/http";
import {
  metaConnectAccountsInputSchema,
  metaConnectionQuerySchema,
} from "@/lib/meta/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    const rate = checkRateLimit(
      `meta-discover:${actor.id}:${requestIp(request.headers)}`,
      12,
      60_000,
    );
    if (!rate.ok)
      return metaNoStore(
        {
          ok: false,
          error: "Too many discovery requests. Try again shortly.",
          code: "rate_limited",
        },
        429,
      );

    const url = new URL(request.url);
    const parsed = metaConnectionQuerySchema.safeParse({
      connectionId: url.searchParams.get("connectionId") || undefined,
    });
    if (!parsed.success)
      return metaNoStore({ ok: false, error: "Invalid connection id." }, 400);

    const discovery = await discoverMetaAssets(
      parsed.data.connectionId,
      actor.id,
    );
    return metaNoStore({ ok: true, ...discovery });
  } catch (error) {
    return metaApiError("meta_discovery_failed", error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    const rate = checkRateLimit(
      `meta-connect:${actor.id}:${requestIp(request.headers)}`,
      10,
      60_000,
    );
    if (!rate.ok)
      return metaNoStore(
        {
          ok: false,
          error: "Too many connection requests. Try again shortly.",
          code: "rate_limited",
        },
        429,
      );

    const json = await request.json().catch(() => null);
    const parsed = metaConnectAccountsInputSchema.safeParse(json);
    if (!parsed.success) {
      return metaNoStore(
        {
          ok: false,
          error: "Invalid account selection.",
          issues: parsed.error.issues,
        },
        400,
      );
    }

    const result = await connectMetaAccounts({
      connectionId: parsed.data.connectionId,
      adminUserId: actor.id,
      selections: parsed.data.accounts,
    });

    await writeAuditLog({
      actorId: actor.id,
      action: "meta.accounts.connected",
      entityType: "MetaConnection",
      entityId: parsed.data.connectionId,
      metadata: {
        requested: parsed.data.accounts.length,
        connected: result.accounts.length,
        skipped: result.skipped.map((item) => ({
          platform: item.platform,
          reason: item.reason,
        })),
      },
      ip: requestIp(request.headers),
    }).catch(() => undefined);

    return metaNoStore({ ok: true, ...result });
  } catch (error) {
    return metaApiError("meta_connect_failed", error);
  }
}
