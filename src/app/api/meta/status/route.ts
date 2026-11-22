import { assertSameOrigin, requireSuperAdmin } from "@/lib/blog/auth";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { getMetaPublishingOverview } from "@/lib/meta/publishing";
import { metaApiError, metaNoStore } from "@/lib/meta/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireSuperAdmin();
    const rate = checkRateLimit(
      `meta-status:${actor.id}:${requestIp(request.headers)}`,
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

    const overview = await getMetaPublishingOverview(actor.id);
    return metaNoStore({ ok: true, ...overview });
  } catch (error) {
    return metaApiError("meta_status_failed", error);
  }
}
