import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/content/site";
import { getPrisma } from "@/lib/prisma";
import { getOutreachActor } from "@/lib/outreach/auth";
import { loadOutreachCampaigns, loadReviewQueue, loadReviewQueueCounts, type ReviewQueueScope } from "@/lib/outreach/queries";
import { createMetadata } from "@/lib/seo";
import { OutreachPanel } from "@/components/admin/outreach/outreach-ui";
import { OutreachPager } from "@/components/admin/outreach/outreach-nav";
import { OutreachReviewQueue } from "@/components/admin/outreach/outreach-review-queue";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return {
    ...createMetadata({
      locale,
      title: "Outreach review queue",
      description: "Approve, edit or reject AI-drafted outreach before anything is sent.",
      path: "/admin/outreach/review",
    }),
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AdminOutreachReviewPage({
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
        <h2 className="text-2xl font-semibold">The review queue cannot load right now.</h2>
      </OutreachPanel>
    );
  }

  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const campaignId = (sp.campaign ?? "").slice(0, 64);
  const scope: ReviewQueueScope =
    sp.scope === "hidden" || sp.scope === "all" ? sp.scope : "actionable";

  const [queue, campaigns, counts] = await Promise.all([
    loadReviewQueue(prisma, campaignId || undefined, page, scope),
    loadOutreachCampaigns(prisma),
    loadReviewQueueCounts(prisma, campaignId || undefined),
  ]);

  const items = queue.rows.map((row) => ({
    messageId: row.id,
    subject: row.subject,
    bodyText: row.bodyText,
    type: row.type,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    prospect: {
      id: row.prospect.id,
      businessName: row.prospect.businessName,
      city: row.prospect.city,
      country: row.prospect.country,
      industry: row.prospect.industry,
      opportunityScore: row.prospect.opportunityScore,
      publicEmail: row.prospect.publicEmail,
      websiteUrl: row.prospect.websiteUrl,
      recommendedServices: row.prospect.recommendedServices,
      aiSummary: row.prospect.aiSummary,
      status: row.prospect.status,
    },
  }));

  const tabs = [
    { key: "actionable" as const, label: "Actionable", count: counts.actionable },
    { key: "hidden" as const, label: "Hidden drafts", count: counts.hidden },
    { key: "all" as const, label: "All pending", count: counts.all },
  ];
  const scopeHref = (nextScope: ReviewQueueScope) =>
    `/admin/outreach/review?${new URLSearchParams({
      ...(campaignId ? { campaign: campaignId } : {}),
      ...(nextScope === "actionable" ? {} : { scope: nextScope }),
      page: "1",
    }).toString()}`;
  const queueSummary =
    scope === "hidden"
      ? `${counts.hidden} pending draft${counts.hidden === 1 ? "" : "s"} hidden because the prospect is no longer qualified or approved.`
      : scope === "all"
        ? `${counts.all} pending message${counts.all === 1 ? "" : "s"} in total, including hidden drafts.`
        : `${counts.actionable} message${counts.actionable === 1 ? "" : "s"} awaiting a human decision.`;

  return (
    <OutreachPanel>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Review queue</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            {queueSummary} Approving queues the message; the send gate still re-checks suppression, limits, the sending
            window and the global switch before delivery.
          </p>
        </div>
        <form className="flex items-end gap-2" method="get">
          {scope !== "actionable" ? <input type="hidden" name="scope" value={scope} /> : null}
          <label className="grid gap-1 text-xs">
            <span className="font-semibold text-muted">Campaign</span>
            <select name="campaign" defaultValue={campaignId} className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm">
              <option value="">All campaigns</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-[#001018]">
            Filter
          </button>
        </form>
      </div>

      <nav aria-label="Review queue views" className="mt-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={scopeHref(tab.key)}
            aria-current={scope === tab.key ? "page" : undefined}
            className={
              scope === tab.key
                ? "inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-3 py-1.5 text-xs font-semibold text-[#001018]"
                : "inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-accent hover:text-accent"
            }
          >
            {tab.label}
            <span className="rounded-full bg-black/10 px-1.5 text-[10px] tabular-nums">{tab.count}</span>
          </Link>
        ))}
      </nav>

      {scope === "hidden" && counts.hidden > 0 ? (
        <p className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          These drafts are read-only here because their prospect is disqualified, paused or otherwise no longer in the
          reviewable state. Open the prospect to edit its contact information, requalify it, or generate a new message.
        </p>
      ) : null}

      <div className="mt-5">
        <OutreachReviewQueue items={items} canManage={actor.canManage} readOnly={scope === "hidden"} />
      </div>

      <OutreachPager
        page={queue.page}
        totalPages={queue.totalPages}
        buildHref={(next) => `/admin/outreach/review?${new URLSearchParams({ ...(campaignId ? { campaign: campaignId } : {}), ...(scope === "actionable" ? {} : { scope }), page: String(next) }).toString()}`}
      />

      <p className="mt-4 text-xs text-muted">
        Prefer to work from a business rather than a message?{" "}
        <Link href="/admin/outreach/prospects" className="text-accent hover:underline">
          Open the prospect list
        </Link>
        .
      </p>
    </OutreachPanel>
  );
}
