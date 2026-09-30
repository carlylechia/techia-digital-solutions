import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/content/site";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { loadOutreachDashboard } from "@/lib/outreach/queries";
import { getOutreachActor } from "@/lib/outreach/auth";
import { jobStatusTone, prospectStatusTone, OUTREACH_STATUS_LABELS } from "@/lib/outreach/constants";
import { createMetadata } from "@/lib/seo";
import {
  OutreachBar,
  OutreachEmptyState,
  OutreachPanel,
  OutreachPill,
  OutreachStatCard,
  OutreachTable,
  OutreachTd,
  OutreachTh,
  OutreachTr,
} from "@/components/admin/outreach/outreach-ui";
import { OutreachStatusBanner, formatDateTime } from "@/components/admin/outreach/outreach-nav";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return {
    ...createMetadata({
      locale,
      title: "Outreach console",
      description: "AI-assisted SME outreach pipeline: discovery, scoring, review, sending and reply handling.",
      path: "/admin/outreach",
    }),
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AdminOutreachPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const actor = await getOutreachActor();
  if (!actor || (!actor.canView && actor.roleLevel < 100)) notFound();

  const prisma = getPrisma();
  if (!prisma) {
    return (
      <OutreachPanel>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Database unavailable</p>
        <h2 className="mt-3 text-2xl font-semibold">The outreach console cannot load yet.</h2>
        <p className="mt-2 text-sm text-muted">
          Set DATABASE_URL and run the outreach Prisma migration to enable this view.
        </p>
      </OutreachPanel>
    );
  }

  const data = await loadOutreachDashboard(prisma).catch((error) => {
    console.error("outreach_dashboard_load_failed", getErrorMessage(error));
    return null;
  });

  if (!data) {
    return (
      <OutreachPanel>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Outreach data unavailable</p>
        <h2 className="mt-3 text-2xl font-semibold">The outreach console cannot load yet.</h2>
        <p className="mt-2 text-sm text-muted">
          Run the latest Prisma migrations to create the outreach engine tables, then reload this page. The console never
          falls back to another data source, so the existing admin, website and AI features are unaffected.
        </p>
      </OutreachPanel>
    );
  }

  const c = data.counters;

  return (
    <div className="grid gap-5">
      <OutreachStatusBanner
        sendingEnabled={data.sendingState.enabled}
        environment={data.sendingState.environment}
        reason={data.sendingState.reason}
        googlePlaces={data.integrations.googlePlaces}
        emailProvider={data.integrations.emailProvider}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <OutreachStatCard label="Active campaigns" value={c.activeCampaigns} />
        <OutreachStatCard label="Discovered today" value={c.discoveredToday} />
        <OutreachStatCard label="Qualified" value={c.qualifiedTotal} tone="good" />
        <OutreachStatCard
          label="Awaiting approval"
          value={c.awaitingApproval}
          tone={c.awaitingApproval > 0 ? "warn" : "quiet"}
          hint={c.awaitingApproval > 0 ? "Human review required" : "Nothing waiting"}
        />
        <OutreachStatCard label="Sent today" value={c.sentToday} />
        <OutreachStatCard label="Sent total" value={c.sentTotal} />
        <OutreachStatCard label="Replies" value={c.repliesTotal} tone={c.repliesTotal > 0 ? "warn" : "quiet"} />
        <OutreachStatCard label="Interested" value={c.interestedTotal} tone="good" />
        <OutreachStatCard label="Meetings booked" value={c.meetingsTotal} tone="good" />
        <OutreachStatCard label="Proposals" value={c.proposalsTotal} />
        <OutreachStatCard label="Converted clients" value={c.wonTotal} tone="good" />
        <OutreachStatCard label="Disqualified" value={c.disqualifiedTotal} tone="quiet" />
        <OutreachStatCard label="Lost" value={c.lostTotal} tone="quiet" />
        <OutreachStatCard
          label="Queue"
          value={`${data.jobs.pending} / ${data.jobs.processing}`}
          hint={`${data.jobs.failed} failed`}
          tone={data.jobs.failed > 0 ? "danger" : "default"}
        />
        <OutreachStatCard
          label="Job lock window"
          value={`${data.jobs.processing} active`}
          hint="Stale locks are reclaimed automatically"
          tone="quiet"
        />
      </div>

      <OutreachPanel>
        <h2 className="text-lg font-semibold">Campaign performance</h2>
        <p className="mt-1 text-sm text-muted">
          Reply rate uses total replies per campaign against messages sent in the last 30 days. Small samples are shown
          honestly rather than presented as a trend.
        </p>

        <div className="mt-4 grid gap-3">
          {data.performance.length === 0 ? (
            <OutreachEmptyState
              title="No campaigns yet"
              description="Create a campaign to start discovering businesses and generating reviewable outreach."
            />
          ) : (
            data.performance.map((campaign) => (
              <div key={campaign.id} className="subtle-tile rounded-[1.25rem] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/outreach/campaigns/${campaign.id}`}
                      className="truncate text-sm font-semibold text-primary hover:text-accent"
                    >
                      {campaign.name}
                    </Link>
                    <p className="text-xs text-muted">
                      {campaign.mode.replace("_", " ").toLowerCase()} · {campaign.requireApproval ? "approval required" : "no approval gate"} ·{" "}
                      {campaign.country}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <OutreachPill tone={campaign.status === "ACTIVE" ? "good" : campaign.status === "PAUSED" ? "warn" : "quiet"}>
                      {OUTREACH_STATUS_LABELS[campaign.status] ?? campaign.status}
                    </OutreachPill>
                    <span className="text-xs text-muted">{campaign.prospects} prospects</span>
                    <span className="text-xs text-muted">{campaign.sent} sent</span>
                    <span className="text-xs text-muted">{campaign.replied} replies</span>
                    <OutreachPill tone={campaign.replyRate >= 10 ? "good" : "quiet"}>{campaign.replyRate}% reply rate</OutreachPill>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </OutreachPanel>

      <div className="grid gap-5 lg:grid-cols-2">
        <OutreachPanel>
          <h2 className="text-lg font-semibold">Pipeline funnel</h2>
          <p className="mt-1 text-sm text-muted">Cumulative counts across all campaigns.</p>
          <ul className="mt-4 grid gap-3">
            {data.funnel.map((item, index) => {
              const previous = index === 0 ? item.value : data.funnel[index - 1].value;
              const conversion = previous > 0 ? Math.round((item.value / previous) * 100) : 0;
              return (
                <li key={item.stage} className="grid gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary">{item.stage}</span>
                    <span className="tabular-nums text-muted">
                      {item.value.toLocaleString()}
                      {index > 0 ? <span className="ml-2 text-xs">{conversion}%</span> : null}
                    </span>
                  </div>
                  <OutreachBar value={item.value} max={Math.max(1, data.funnel[0]?.value ?? 1)} tone={item.value > 0 ? "default" : "quiet"} />
                </li>
              );
            })}
          </ul>
        </OutreachPanel>

        <OutreachPanel>
          <h2 className="text-lg font-semibold">Latest prospects</h2>
          <p className="mt-1 text-sm text-muted">Most recently discovered businesses.</p>
          {data.recentProspects.length === 0 ? (
            <div className="mt-4">
              <OutreachEmptyState title="No prospects discovered yet" description="Activate a campaign and run discovery." />
            </div>
          ) : (
            <ul className="mt-4 grid gap-2">
              {data.recentProspects.map((prospect) => (
                <li key={prospect.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2">
                  <Link href={`/admin/outreach/prospects/${prospect.id}`} className="min-w-0 truncate text-sm font-semibold text-primary hover:text-accent">
                    {prospect.businessName}
                  </Link>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted">{prospect.city ?? "—"}</span>
                    <OutreachPill tone={prospectStatusTone(prospect.status)}>{OUTREACH_STATUS_LABELS[prospect.status] ?? prospect.status}</OutreachPill>
                    <span className="text-xs tabular-nums text-muted">{prospect.opportunityScore}/100</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </OutreachPanel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <OutreachPanel>
          <h2 className="text-lg font-semibold">Daily volume (last 30 days)</h2>
          {data.timeline.length === 0 ? (
            <div className="mt-4">
              <OutreachEmptyState title="No daily statistics yet" description="Statistics aggregate overnight via the stats job." />
            </div>
          ) : (
            <OutreachTable className="mt-4">
              <thead>
                <tr className="border-b border-border">
                  <OutreachTh>Date</OutreachTh>
                  <OutreachTh>Discovered</OutreachTh>
                  <OutreachTh>Qualified</OutreachTh>
                  <OutreachTh>Sent</OutreachTh>
                  <OutreachTh>Replies</OutreachTh>
                </tr>
              </thead>
              <tbody>
                {data.timeline.slice(-14).reverse().map((row) => (
                  <OutreachTr key={`${row.campaignId}-${row.date}`}>
                    <OutreachTd className="text-xs text-muted">{row.date}</OutreachTd>
                    <OutreachTd className="tabular-nums">{row.discovered}</OutreachTd>
                    <OutreachTd className="tabular-nums">{row.qualified}</OutreachTd>
                    <OutreachTd className="tabular-nums">{row.emailsSent}</OutreachTd>
                    <OutreachTd className="tabular-nums">{row.replies}</OutreachTd>
                  </OutreachTr>
                ))}
              </tbody>
            </OutreachTable>
          )}
        </OutreachPanel>

        <OutreachPanel>
          <h2 className="text-lg font-semibold">Job queue</h2>
          <p className="mt-1 text-sm text-muted">
            Jobs are claimed atomically, so two processors can never work the same row.
          </p>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
              <span className="text-muted">Pending</span>
              <OutreachPill tone="quiet">{data.jobs.pending}</OutreachPill>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
              <span className="text-muted">Processing</span>
              <OutreachPill tone={jobStatusTone("PROCESSING")}>{data.jobs.processing}</OutreachPill>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
              <span className="text-muted">Failed</span>
              <OutreachPill tone={jobStatusTone("FAILED")}>{data.jobs.failed}</OutreachPill>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted">Dashboard generated {formatDateTime(new Date())}.</p>
          <p className="mt-1 text-xs text-muted">
            <code>isPrismaSchemaDriftError</code> is available for diagnostics; the outreach tables are independent of every
            existing feature.
          </p>
        </OutreachPanel>
      </div>
    </div>
  );
}
