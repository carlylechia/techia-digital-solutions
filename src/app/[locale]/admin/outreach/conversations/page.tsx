import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/content/site";
import { getPrisma } from "@/lib/prisma";
import { getOutreachActor } from "@/lib/outreach/auth";
import { loadConversations } from "@/lib/outreach/queries";
import { OUTREACH_ESCALATION_CATEGORIES, OUTREACH_STATUS_LABELS, prospectStatusTone } from "@/lib/outreach/constants";
import { createMetadata } from "@/lib/seo";
import {
  OutreachEmptyState,
  OutreachPanel,
  OutreachPill,
  OutreachTable,
  OutreachTd,
  OutreachTh,
  OutreachTr,
} from "@/components/admin/outreach/outreach-ui";
import { OutreachPager, formatDateTime } from "@/components/admin/outreach/outreach-nav";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return {
    ...createMetadata({
      locale,
      title: "Outreach conversations",
      description: "Classified replies that need a human decision.",
      path: "/admin/outreach/conversations",
    }),
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AdminOutreachConversationsPage({
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
        <h2 className="text-2xl font-semibold">Conversations cannot load right now.</h2>
      </OutreachPanel>
    );
  }

  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const category = (sp.category ?? "").slice(0, 40);

  const result = await loadConversations(prisma, { category: category || undefined, page });

  // Filtering happens in the database, so the page count and total already
  // reflect the active category. Re-filtering here would silently empty pages.
  const rows = result.rows;
  const needsAttention = rows.filter((row) => row.category && OUTREACH_ESCALATION_CATEGORIES.includes(row.category as never)).length;

  return (
    <div className="grid gap-5">
      <OutreachPanel>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Conversations</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted">
              {result.total} prospect{result.total === 1 ? "" : "s"} in the conversation view.{" "}
              {needsAttention > 0 ? (
                <span className="font-semibold text-amber-300">{needsAttention} need a human decision now.</span>
              ) : (
                "Nothing currently needs an urgent decision."
              )}
            </p>
          </div>
          <form className="flex items-end gap-2" method="get">
            <label className="grid gap-1 text-xs">
              <span className="font-semibold text-muted">Category</span>
              <select name="category" defaultValue={category} className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm">
                <option value="">All categories</option>
                {["INTERESTED", "QUESTION", "MEETING_REQUEST", "PRICE_REQUEST", "NOT_INTERESTED", "ALREADY_HAS_PROVIDER", "LATER", "WRONG_CONTACT", "UNSUBSCRIBED", "OTHER"].map((value) => (
                  <option key={value} value={value}>
                    {value.replace(/_/g, " ").toLowerCase()}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-[#001018]">
              Filter
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {OUTREACH_ESCALATION_CATEGORIES.map((value) => (
            <Link
              key={value}
              href={`/admin/outreach/conversations?category=${value}`}
              className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
            >
              {value.replace(/_/g, " ").toLowerCase()}
            </Link>
          ))}
        </div>

        <div className="mt-5">
          {rows.length === 0 ? (
            <OutreachEmptyState
              title="No conversations yet"
              description="Replies appear here as soon as the provider webhook or a manual entry receives one."
            />
          ) : (
            <OutreachTable>
              <thead>
                <tr className="border-b border-border">
                  <OutreachTh>Prospect</OutreachTh>
                  <OutreachTh>Status</OutreachTh>
                  <OutreachTh>Classification</OutreachTh>
                  <OutreachTh>Last message</OutreachTh>
                  <OutreachTh>Action required</OutreachTh>
                  <OutreachTh>Time</OutreachTh>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const needsHuman = Boolean(row.category && OUTREACH_ESCALATION_CATEGORIES.includes(row.category as never));
                  return (
                    <OutreachTr key={row.id}>
                      <OutreachTd>
                        <Link href={`/admin/outreach/prospects/${row.id}`} className="font-semibold text-primary hover:text-accent">
                          {row.businessName}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted">{row.city ?? "—"}</p>
                      </OutreachTd>
                      <OutreachTd>
                        <OutreachPill tone={prospectStatusTone(row.status)}>{OUTREACH_STATUS_LABELS[row.status] ?? row.status}</OutreachPill>
                      </OutreachTd>
                      <OutreachTd>
                        {row.category ? (
                          <OutreachPill tone={needsHuman ? "warn" : "quiet"}>{row.category.replace(/_/g, " ").toLowerCase()}</OutreachPill>
                        ) : (
                          <span className="text-xs text-muted">no reply classified</span>
                        )}
                      </OutreachTd>
                      <OutreachTd className="max-w-md text-xs text-muted">
                        {row.lastMessage ? (
                          <>
                            <span className="font-semibold text-primary">{row.lastMessage.subject}</span>
                            <span className="mt-1 block line-clamp-3">{row.lastMessage.bodyText.slice(0, 220)}</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </OutreachTd>
                      <OutreachTd className="max-w-xs text-xs">
                        {needsHuman ? (
                          <span className="font-semibold text-amber-300">{row.suggestedAction ?? "Human decision required."}</span>
                        ) : (
                          <span className="text-muted">{row.suggestedAction ?? "No action needed."}</span>
                        )}
                      </OutreachTd>
                      <OutreachTd className="whitespace-nowrap text-xs text-muted">
                        {formatDateTime(row.lastMessage?.createdAt ?? row.updatedAt)}
                      </OutreachTd>
                    </OutreachTr>
                  );
                })}
              </tbody>
            </OutreachTable>
          )}
        </div>

        <OutreachPager
          page={result.page}
          totalPages={result.totalPages}
          buildHref={(next) => `/admin/outreach/conversations?${new URLSearchParams({ ...(category ? { category } : {}), page: String(next) }).toString()}`}
        />
      </OutreachPanel>

      <OutreachPanel>
        <h3 className="text-sm font-semibold">How replies are handled</h3>
        <ul className="mt-3 grid gap-2 text-sm text-muted">
          <li>• Meeting requests, price questions, genuine questions and interest stop automation and raise a notification.</li>
          <li>• The engine never quotes a price, offers a discount or makes a contractual promise.</li>
          <li>• An opt-out is suppressed immediately; a hard bounce suppresses the address too.</li>
          <li>• An ambiguous reply is recorded as OTHER, never as interest.</li>
        </ul>
      </OutreachPanel>
    </div>
  );
}
