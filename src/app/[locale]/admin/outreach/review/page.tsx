import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/content/site";
import { getPrisma } from "@/lib/prisma";
import { getOutreachActor } from "@/lib/outreach/auth";
import { loadOutreachCampaigns, loadReviewQueue } from "@/lib/outreach/queries";
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

  const [queue, campaigns] = await Promise.all([
    loadReviewQueue(prisma, campaignId || undefined, page),
    loadOutreachCampaigns(prisma),
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

  return (
    <OutreachPanel>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Review queue</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            {queue.total} message{queue.total === 1 ? "" : "s"} awaiting a human decision. Approving queues the message;
            the send gate still re-checks suppression, limits, the sending window and the global switch before delivery.
          </p>
        </div>
        <form className="flex items-end gap-2" method="get">
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

      <div className="mt-5">
        <OutreachReviewQueue items={items} canManage={actor.canManage} />
      </div>

      <OutreachPager
        page={queue.page}
        totalPages={queue.totalPages}
        buildHref={(next) => `/admin/outreach/review?${new URLSearchParams({ ...(campaignId ? { campaign: campaignId } : {}), page: String(next) }).toString()}`}
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
