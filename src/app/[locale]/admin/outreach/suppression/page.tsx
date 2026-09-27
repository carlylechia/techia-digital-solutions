import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/content/site";
import { getPrisma } from "@/lib/prisma";
import { getOutreachActor } from "@/lib/outreach/auth";
import { loadSuppressionList } from "@/lib/outreach/queries";
import { createMetadata } from "@/lib/seo";
import {
  OutreachEmptyState,
  OutreachPanel,
  OutreachPill,
  OutreachStatCard,
  OutreachTable,
  OutreachTd,
  OutreachTh,
  OutreachTr,
} from "@/components/admin/outreach/outreach-ui";
import {
  OutreachSuppressionForm,
  OutreachSuppressionRemove,
} from "@/components/admin/outreach/outreach-suppression-form";
import { OutreachPager, formatDateTime } from "@/components/admin/outreach/outreach-nav";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return {
    ...createMetadata({
      locale,
      title: "Outreach suppression",
      description: "Addresses and domains teChia must never email.",
      path: "/admin/outreach/suppression",
    }),
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AdminOutreachSuppressionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const actor = await getOutreachActor();
  if (!actor || (!actor.canView && actor.roleLevel < 100)) notFound();

  const prisma = getPrisma();
  if (!prisma) {
    return (
      <OutreachPanel>
        <h2 className="text-2xl font-semibold">The suppression list cannot load right now.</h2>
      </OutreachPanel>
    );
  }

  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const result = await loadSuppressionList(prisma, page);

  return (
    <div className="grid gap-5">
      <OutreachPanel>
        <h2 className="text-lg font-semibold">Suppression list</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Every send checks this list first, by exact address and then by domain. Opt-outs, hard bounces and spam
          complaints are added here automatically.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <OutreachStatCard label="Entries" value={result.total} tone={result.total > 0 ? "warn" : "quiet"} />
          {Object.entries(result.reasons).map(([reason, count]) => (
            <OutreachStatCard key={reason} label={reason.replace(/_/g, " ").toLowerCase()} value={count} tone="quiet" />
          ))}
        </div>
      </OutreachPanel>

      <OutreachPanel>
        <h3 className="text-sm font-semibold">Add an entry</h3>
        <div className="mt-4">
          <OutreachSuppressionForm canManage={actor.canManage} canSend={actor.canSend} />
        </div>
      </OutreachPanel>

      <OutreachPanel>
        <h3 className="text-sm font-semibold">Entries</h3>
        <div className="mt-4">
          {result.rows.length === 0 ? (
            <OutreachEmptyState title="The suppression list is empty" description="Opt-outs and bounces will populate it automatically." />
          ) : (
            <OutreachTable className="min-w-[720px]">
              <thead>
                <tr className="border-b border-border">
                  <OutreachTh>Email</OutreachTh>
                  <OutreachTh>Domain</OutreachTh>
                  <OutreachTh>Reason</OutreachTh>
                  <OutreachTh>Source</OutreachTh>
                  <OutreachTh>Created</OutreachTh>
                  <OutreachTh>Action</OutreachTh>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((entry) => (
                  <OutreachTr key={entry.id}>
                    <OutreachTd className="text-sm">{entry.email ?? "—"}</OutreachTd>
                    <OutreachTd className="text-sm text-muted">{entry.domain ?? "—"}</OutreachTd>
                    <OutreachTd>
                      <OutreachPill tone={entry.reason === "MANUAL" ? "quiet" : "danger"}>
                        {entry.reason.replace(/_/g, " ").toLowerCase()}
                      </OutreachPill>
                      {entry.notes ? <p className="mt-1 text-xs text-muted">{entry.notes}</p> : null}
                    </OutreachTd>
                    <OutreachTd className="text-xs text-muted">{entry.source}</OutreachTd>
                    <OutreachTd className="whitespace-nowrap text-xs text-muted">{formatDateTime(entry.createdAt)}</OutreachTd>
                    <OutreachTd>
                      <OutreachSuppressionRemove id={entry.id} canSend={actor.canSend} />
                    </OutreachTd>
                  </OutreachTr>
                ))}
              </tbody>
            </OutreachTable>
          )}
        </div>

        <OutreachPager page={result.page} totalPages={result.totalPages} buildHref={(next) => `/admin/outreach/suppression?page=${next}`} />
      </OutreachPanel>
    </div>
  );
}
