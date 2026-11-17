import { NextResponse } from "next/server";
import { assertSameOrigin, requireSuperAdmin, BlogAuthorizationError } from "@/lib/blog/auth";
import { runEditorialUsageReconciliation } from "@/lib/ai/editorial-usage";

/**
 * SuperAdmin-only operational endpoint that runs one bounded, idempotent
 * usage-reconciliation pass over PostgreSQL. It never re-runs provider
 * generation, never fabricates token usage or cost, and is safe to invoke
 * repeatedly or concurrently.
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireSuperAdmin();

    const json = (await request.json().catch(() => ({}))) as { batchSize?: unknown };
    const parsedBatch = Number.parseInt(String(json.batchSize ?? "10"), 10);
    const batchSize = Number.isFinite(parsedBatch) ? Math.min(Math.max(parsedBatch, 1), 50) : 10;

    const result = await runEditorialUsageReconciliation({ batchSize });
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BlogAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    console.error("editorial_reconciliation_failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ ok: false, error: "Reconciliation could not run." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
