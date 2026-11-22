import { assertSameOrigin, requireSuperAdmin } from "@/lib/blog/auth";
import { writeAuditLog } from "@/lib/admin/session";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { setMetaPublishingEnabled } from "@/lib/meta/accounts";
import { metaApiError, metaNoStore } from "@/lib/meta/http";
import { getMetaPublishingOverview } from "@/lib/meta/publishing";
import { metaPublishingSettingsInputSchema } from "@/lib/meta/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    const rate = checkRateLimit(
      `meta-settings:${actor.id}:${requestIp(request.headers)}`,
      10,
      60_000,
    );
    if (!rate.ok)
      return metaNoStore(
        {
          ok: false,
          error: "Too many settings requests. Try again shortly.",
          code: "rate_limited",
        },
        429,
      );

    const json = await request.json().catch(() => null);
    const parsed = metaPublishingSettingsInputSchema.safeParse(json);
    if (!parsed.success)
      return metaNoStore(
        { ok: false, error: "Invalid publishing setting." },
        400,
      );

    const settings = await setMetaPublishingEnabled(
      parsed.data.publishingEnabled,
      actor.id,
    );
    await writeAuditLog({
      actorId: actor.id,
      action: "meta.publishing.settings_updated",
      entityType: "MetaPublishingSettings",
      entityId: "global",
      metadata: { publishingEnabled: settings.publishingEnabled },
      ip: requestIp(request.headers),
    }).catch(() => undefined);

    const overview = await getMetaPublishingOverview(actor.id);
    return metaNoStore({ ok: true, ...overview });
  } catch (error) {
    return metaApiError("meta_settings_update_failed", error);
  }
}
