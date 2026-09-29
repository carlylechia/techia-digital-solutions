import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/content/site";
import { getPrisma } from "@/lib/prisma";
import { getOutreachActor } from "@/lib/outreach/auth";
import { loadOutreachCampaigns, loadOutreachProspects } from "@/lib/outreach/queries";
import { OUTREACH_DISCOVERY_PROVIDER_LABELS, OUTREACH_DISCOVERY_PROVIDERS, OUTREACH_PROSPECT_STATUSES, OUTREACH_QUALIFICATION_LABELS, OUTREACH_QUALIFICATION_STATUSES, OUTREACH_STATUS_LABELS, prospectStatusTone } from "@/lib/outreach/constants";
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
import { OutreachPager, formatDate } from "@/components/admin/outreach/outreach-nav";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return {
    ...createMetadata({
      locale,
      title: "Outreach prospects",
      description: "Discovered and qualified business prospects.",
      path: "/admin/outreach/prospects",
    }),
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AdminOutreachProspectsPage({
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
        <h2 className="text-2xl font-semibold">Prospects are temporarily unavailable.</h2>
      </OutreachPanel>
    );
  }

  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const campaignId = sp.campaign ?? "";
  const status = OUTREACH_PROSPECT_STATUSES.find((value) => value === sp.status) ?? "";
  const search = (sp.q ?? "").slice(0, 80);
  const provider = OUTREACH_DISCOVERY_PROVIDERS.find((value) => value === sp.provider) ?? "";
  const qualificationStatus = OUTREACH_QUALIFICATION_STATUSES.find((value) => value === sp.qualification) ?? "";
  const minReadiness = sp.minReadiness ? Number.parseInt(sp.minReadiness, 10) : undefined;
  const missingContact = sp.missingContact === "1";

  const [result, campaigns] = await Promise.all([
    loadOutreachProspects(prisma, {
      page,
      campaignId: campaignId || undefined,
      status: status || undefined,
      search: search || undefined,
      provider: provider || undefined,
      qualificationStatus: qualificationStatus || undefined,
      minReadinessScore: minReadiness,
      missingContact: missingContact || undefined,
    }),
    loadOutreachCampaigns(prisma),
  ]);

  const buildHref = (nextPage: number) => {
    const params2 = new URLSearchParams();
    if (campaignId) params2.set("campaign", campaignId);
    if (status) params2.set("status", status);
    if (provider) params2.set("provider", provider);
    if (search) params2.set("q", search);
    if (qualificationStatus) params2.set("qualification", qualificationStatus);
    if (minReadiness !== undefined) params2.set("minReadiness", String(minReadiness));
    if (missingContact) params2.set("missingContact", "1");
    params2.set("page", String(nextPage));
    return `/admin/outreach/prospects?${params2.toString()}`;
  };

  return (
    <OutreachPanel>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Prospects</h2>
          <p className="mt-1 text-sm text-muted">
            {result.total} prospect{result.total === 1 ? "" : "s"} match the current filters, ordered by deterministic
            opportunity score.
          </p>
        </div>
        <form className="flex flex-wrap items-end gap-2" method="get">
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
          <label className="grid gap-1 text-xs">
            <span className="font-semibold text-muted">Status</span>
            <select name="status" defaultValue={status} className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm">
              <option value="">All statuses</option>
              {OUTREACH_PROSPECT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {OUTREACH_STATUS_LABELS[value] ?? value}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs">
            <span className="font-semibold text-muted">Provider</span>
            <select name="provider" defaultValue={provider} className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm">
              <option value="">All providers</option>
              {OUTREACH_DISCOVERY_PROVIDERS.map((value) => (
                <option key={value} value={value}>
                  {OUTREACH_DISCOVERY_PROVIDER_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs">
            <span className="font-semibold text-muted">Qualification</span>
            <select name="qualification" defaultValue={qualificationStatus} className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm">
              <option value="">All</option>
              {OUTREACH_QUALIFICATION_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {OUTREACH_QUALIFICATION_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs">
            <span className="font-semibold text-muted">Min Readiness</span>
            <select name="minReadiness" defaultValue={minReadiness !== undefined ? String(minReadiness) : ""} className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm">
              <option value="">Any</option>
              <option value="70">70+</option>
              <option value="60">60+</option>
              <option value="50">50+</option>
              <option value="40">40+</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs">
            <span className="font-semibold text-muted">Search</span>
            <input
              name="q"
              defaultValue={search}
              placeholder="Name, city or email"
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              maxLength={80}
            />
          </label>
          <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-[#001018]">
            Filter
          </button>
        </form>
      </div>

      <div className="mt-5">
        {result.rows.length === 0 ? (
          <OutreachEmptyState
            title="No prospects match these filters"
            description="Clear the filters, or activate a campaign and run discovery to build an audience."
          />
        ) : (
          <OutreachTable className="min-w-[1200px]">
            <thead>
              <tr className="border-b border-border">
                <OutreachTh>Business</OutreachTh>
                <OutreachTh>Location</OutreachTh>
                <OutreachTh>Status</OutreachTh>
                <OutreachTh>Qualification</OutreachTh>
                <OutreachTh>Opportunity</OutreachTh>
                <OutreachTh>Readiness</OutreachTh>
                <OutreachTh>Primary Opportunity</OutreachTh>
                <OutreachTh>Contact</OutreachTh>
                <OutreachTh>Sent</OutreachTh>
                <OutreachTh>Discovered</OutreachTh>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((prospect) => (
                <OutreachTr key={prospect.id}>
                  <OutreachTd>
                    <Link href={`/admin/outreach/prospects/${prospect.id}`} className="font-semibold text-primary hover:text-accent">
                      {prospect.businessName}
                    </Link>
                    {prospect.industry ? <p className="mt-0.5 text-xs text-muted">{prospect.industry}</p> : null}
                  </OutreachTd>
                  <OutreachTd className="text-sm text-muted">
                    {[prospect.city, prospect.country].filter(Boolean).join(", ") || "—"}
                  </OutreachTd>
                  <OutreachTd>
                    <OutreachPill tone={prospectStatusTone(prospect.status)}>{OUTREACH_STATUS_LABELS[prospect.status] ?? prospect.status}</OutreachPill>
                  </OutreachTd>
                  <OutreachTd>
                    {prospect.qualificationStatus ? (
                      <OutreachPill tone={prospect.qualificationStatus === "QUALIFIED" ? "good" : prospect.qualificationStatus === "REVIEW" ? "warn" : "danger"}>
                        {OUTREACH_QUALIFICATION_LABELS[prospect.qualificationStatus] ?? prospect.qualificationStatus}
                      </OutreachPill>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </OutreachTd>
                  <OutreachTd className="tabular-nums">
                    <span className={prospect.opportunityScore >= 60 ? "text-emerald-300" : prospect.opportunityScore >= 40 ? "text-amber-300" : "text-muted"}>
                      {prospect.opportunityScore}
                    </span>
                    <span className="text-xs text-muted">/100</span>
                  </OutreachTd>
                  <OutreachTd className="tabular-nums">
                    <span className={prospect.outreachReadinessScore >= 70 ? "text-emerald-300" : prospect.outreachReadinessScore >= 40 ? "text-amber-300" : "text-muted"}>
                      {prospect.outreachReadinessScore}
                    </span>
                    <span className="text-xs text-muted">/100</span>
                  </OutreachTd>
                  <OutreachTd className="text-xs text-muted">{prospect.primaryOpportunity || "—"}</OutreachTd>
                  <OutreachTd className="text-xs text-muted">
                    {prospect.publicEmail ? (
                      <a href={`mailto:${prospect.publicEmail}`} className="hover:text-accent">
                        {prospect.publicEmail}
                      </a>
                    ) : (
                      <span className="text-amber-300">no public email</span>
                    )}
                  </OutreachTd>
                  <OutreachTd className="tabular-nums text-muted">{prospect.emailsSentCount}</OutreachTd>
                  <OutreachTd className="text-xs text-muted">{formatDate(prospect.discoveredAt)}</OutreachTd>
                </OutreachTr>
              ))}
            </tbody>
          </OutreachTable>
        )}
      </div>

      <OutreachPager page={result.page} totalPages={result.totalPages} buildHref={buildHref} />
    </OutreachPanel>
  );
}
