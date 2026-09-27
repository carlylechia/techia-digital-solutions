import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/content/site";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { getOutreachActor } from "@/lib/outreach/auth";
import { loadOutreachCampaignDetail, loadOutreachRunHistory } from "@/lib/outreach/queries";
import { getOutreachSendingState } from "@/lib/outreach/config";
import { OUTREACH_STATUS_LABELS, jobStatusTone, prospectStatusTone, runStatusTone } from "@/lib/outreach/constants";
import { createMetadata } from "@/lib/seo";
import { OutreachCampaignForm } from "@/components/admin/outreach/outreach-campaign-form";
import { OutreachCampaignControls } from "@/components/admin/outreach/outreach-campaign-controls";
import { OutreachRunControls } from "@/components/admin/outreach/outreach-run-controls";
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
import { formatDateTime } from "@/components/admin/outreach/outreach-nav";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return {
    ...createMetadata({
      locale,
      title: "Outreach campaign",
      description: "Campaign configuration, performance and safety controls.",
      path: "/admin/outreach/campaigns",
    }),
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function OutreachCampaignDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const actor = await getOutreachActor();
  if (!actor || (!actor.canView && actor.roleLevel < 100)) notFound();

  const prisma = getPrisma();
  if (!prisma) {
    return (
      <OutreachPanel>
        <h2 className="text-2xl font-semibold">This campaign cannot load right now.</h2>
      </OutreachPanel>
    );
  }

  const data = await loadOutreachCampaignDetail(prisma, id).catch((error) => {
    console.error("outreach_campaign_load_failed", getErrorMessage(error));
    return null;
  });

  if (!data) {
    return (
      <OutreachPanel>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Not available</p>
        <h2 className="mt-3 text-2xl font-semibold">This campaign could not be found.</h2>
        <p className="mt-2 text-sm text-muted">
          It may have been removed, or the outreach tables have not been migrated yet.
        </p>
        <Link href="/admin/outreach/campaigns" className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">
          ← Back to campaigns
        </Link>
      </OutreachPanel>
    );
  }

  const { campaign, statusGroups, jobGroups, failedJobs, bounceRate, sentTotal } = data;
  const sendingState = getOutreachSendingState();
  const statusEntries = Object.entries(statusGroups).sort((a, b) => b[1] - a[1]);
  const totalProspects = statusEntries.reduce((sum, [, count]) => sum + count, 0);

  // Run history is a separate read so a failure there cannot stop the campaign
  // page from rendering.
  const runHistory = await loadOutreachRunHistory(prisma, id).catch((error) => {
    console.error("outreach_run_history_load_failed", getErrorMessage(error));
    return [];
  });
  const runInProgress = campaign.activeRunId !== null;

  return (
    <div className="grid gap-5">
      <OutreachPanel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link href="/admin/outreach/campaigns" className="text-xs font-semibold text-accent hover:underline">
              ← Campaigns
            </Link>
            <h2 className="mt-2 text-2xl font-semibold">{campaign.name}</h2>
            {campaign.description ? <p className="mt-2 max-w-3xl text-sm text-muted">{campaign.description}</p> : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <OutreachPill tone={campaign.status === "ACTIVE" ? "good" : campaign.status === "PAUSED" ? "warn" : "quiet"}>
                {OUTREACH_STATUS_LABELS[campaign.status] ?? campaign.status}
              </OutreachPill>
              <OutreachPill tone={campaign.mode === "AUTOMATIC" ? "warn" : "default"}>{campaign.mode.replace("_", " ")}</OutreachPill>
              <OutreachPill tone={campaign.requireApproval ? "default" : "warn"}>
                {campaign.requireApproval ? "approval required" : "no approval gate"}
              </OutreachPill>
            </div>
          </div>
          <OutreachCampaignControls
            campaignId={campaign.id}
            status={campaign.status}
            canManage={actor.canManage}
            canSend={actor.canSend}
            sendingEnabled={sendingState.enabled}
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <OutreachStatCard label="Prospects" value={totalProspects} />
          <OutreachStatCard label="Messages" value={campaign._count.messages} />
          <OutreachStatCard label="Sent (all time)" value={sentTotal} />
          <OutreachStatCard
            label="Bounce rate"
            value={`${bounceRate}%`}
            tone={bounceRate > 10 ? "danger" : bounceRate > 0 ? "warn" : "good"}
            hint="Provider-reported hard bounces"
          />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">Prospect status breakdown</h3>
            {statusEntries.length === 0 ? (
              <div className="mt-3">
                <OutreachEmptyState title="No prospects yet" description="Run discovery to build the audience." />
              </div>
            ) : (
              <ul className="mt-3 grid gap-2">
                {statusEntries.map(([status, count]) => (
                  <li key={status} className="grid gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <OutreachPill tone={prospectStatusTone(status)}>{OUTREACH_STATUS_LABELS[status] ?? status}</OutreachPill>
                      </span>
                      <span className="tabular-nums text-muted">{count}</span>
                    </div>
                    <OutreachBar value={count} max={Math.max(1, totalProspects)} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold">Job activity</h3>
            {jobGroups.length === 0 ? (
              <div className="mt-3">
                <OutreachEmptyState title="No jobs recorded" description="Jobs appear once the cron ticks start." />
              </div>
            ) : (
              <OutreachTable className="mt-3 min-w-[380px]">
                <thead>
                  <tr className="border-b border-border">
                    <OutreachTh>Type</OutreachTh>
                    <OutreachTh>Status</OutreachTh>
                    <OutreachTh>Count</OutreachTh>
                  </tr>
                </thead>
                <tbody>
                  {jobGroups.map((group) => (
                    <OutreachTr key={`${group.type}-${group.status}`}>
                      <OutreachTd className="text-xs">{group.type}</OutreachTd>
                      <OutreachTd>
                        <OutreachPill tone={jobStatusTone(group.status)}>{group.status}</OutreachPill>
                      </OutreachTd>
                      <OutreachTd className="tabular-nums">{group.count}</OutreachTd>
                    </OutreachTr>
                  ))}
                </tbody>
              </OutreachTable>
            )}

            {failedJobs.length > 0 ? (
              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Recent failures</h4>
                <ul className="mt-2 grid gap-2">
                  {failedJobs.map((job) => (
                    <li key={job.id} className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-muted">
                      <span className="font-semibold text-red-300">{job.type}</span> · attempt {job.attempts} ·{" "}
                      {formatDateTime(job.updatedAt)}
                      <span className="mt-1 block break-words">{job.errorMessage ?? "No error recorded."}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </OutreachPanel>

      <OutreachPanel>
        <h3 className="text-lg font-semibold">Run this campaign</h3>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Trigger the pipeline immediately instead of waiting for the daily schedule. Both actions run the same engine
          the scheduled cycle runs, so every existing safeguard still applies.
        </p>
        <div className="mt-4">
          {actor.canSend || actor.canManage ? (
            <OutreachRunControls
              campaignId={campaign.id}
              canManage={actor.canManage}
              canSend={actor.canSend}
              campaignActive={campaign.status === "ACTIVE"}
              runInProgress={runInProgress}
            />
          ) : (
            <p className="text-sm text-muted">You do not have permission to run this campaign.</p>
          )}
        </div>
      </OutreachPanel>

      <OutreachPanel>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Run history</h3>
            <p className="mt-1 max-w-3xl text-sm text-muted">
              Scheduled, manual and test runs, newest first. A test run always reports zero emails sent.
            </p>
          </div>
        </div>
        {runHistory.length === 0 ? (
          <div className="mt-4">
            <OutreachEmptyState
              title="No runs recorded yet"
              description="Runs appear here once the daily schedule or a manual run has executed."
            />
          </div>
        ) : (
          <OutreachTable className="mt-4 min-w-[900px]">
            <thead>
              <tr className="border-b border-border">
                <OutreachTh>Started</OutreachTh>
                <OutreachTh>Trigger</OutreachTh>
                <OutreachTh>Status</OutreachTh>
                <OutreachTh>Discovered</OutreachTh>
                <OutreachTh>Processed</OutreachTh>
                <OutreachTh>Qualified</OutreachTh>
                <OutreachTh>Drafts</OutreachTh>
                <OutreachTh>Sent</OutreachTh>
                <OutreachTh>Failed</OutreachTh>
                <OutreachTh>Duration</OutreachTh>
              </tr>
            </thead>
            <tbody>
              {runHistory.map((run) => (
                <OutreachTr key={run.id}>
                  <OutreachTd className="whitespace-nowrap text-xs text-muted">{formatDateTime(run.startedAt)}</OutreachTd>
                  <OutreachTd className="text-xs">
                    {run.trigger === "CRON" ? "Scheduled" : run.trigger === "TEST" ? "Test" : "Manual"}
                  </OutreachTd>
                  <OutreachTd>
                    <OutreachPill tone={runStatusTone(run.status)}>{run.status}</OutreachPill>
                  </OutreachTd>
                  <OutreachTd className="tabular-nums">{run.discoveredCount ?? "—"}</OutreachTd>
                  <OutreachTd className="tabular-nums">{run.processedCount ?? "—"}</OutreachTd>
                  <OutreachTd className="tabular-nums">{run.qualifiedCount ?? "—"}</OutreachTd>
                  <OutreachTd className="tabular-nums">{run.draftsGeneratedCount ?? "—"}</OutreachTd>
                  <OutreachTd className="tabular-nums">{run.emailsSentCount ?? 0}</OutreachTd>
                  <OutreachTd className="tabular-nums">{run.failedCount ?? "—"}</OutreachTd>
                  <OutreachTd className="whitespace-nowrap text-xs text-muted">
                    {run.durationMs === null ? "—" : `${(run.durationMs / 1000).toFixed(1)}s`}
                  </OutreachTd>
                </OutreachTr>
              ))}
            </tbody>
          </OutreachTable>
        )}
        {runHistory.some((run) => run.status === "FAILED" || run.status === "PARTIAL") ? (
          <ul className="mt-4 grid gap-2">
            {runHistory
              .filter((run) => run.status === "FAILED" || run.status === "PARTIAL")
              .slice(0, 5)
              .map((run) => (
                <li
                  key={`summary-${run.id}`}
                  className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-muted"
                >
                  <span className="font-semibold text-amber-300">{run.status}</span> · {formatDateTime(run.startedAt)}
                  <span className="mt-1 block break-words">{run.summary ?? "No summary recorded."}</span>
                </li>
              ))}
          </ul>
        ) : null}
      </OutreachPanel>

      <OutreachPanel>
        <h3 className="text-lg font-semibold">Configuration</h3>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Discovery targets, limits, sending window, automation mode and compliance basis. API credentials are never
          editable here.
        </p>
        <div className="mt-5">
          {actor.canManage ? (
            <OutreachCampaignForm
              campaign={{
                id: campaign.id,
                name: campaign.name,
                description: campaign.description ?? "",
                status: campaign.status,
                mode: campaign.mode,
                country: campaign.country,
                regions: campaign.regions,
                cities: campaign.cities,
                industries: campaign.industries,
                businessTypes: campaign.businessTypes,
                targetServices: campaign.targetServices,
                excludedIndustries: campaign.excludedIndustries,
                excludedKeywords: campaign.excludedKeywords,
                dailyDiscoveryLimit: campaign.dailyDiscoveryLimit,
                dailySendLimit: campaign.dailySendLimit,
                minOpportunityScore: campaign.minOpportunityScore,
                dailyAiAssessLimit: campaign.dailyAiAssessLimit,
                requireApproval: campaign.requireApproval,
                followUpEnabled: campaign.followUpEnabled,
                maxFollowUps: campaign.maxFollowUps,
                sendingWindowStart: campaign.sendingWindowStart,
                sendingWindowEnd: campaign.sendingWindowEnd,
                timezone: campaign.timezone,
                discoveryProviderMode: campaign.discoveryProviderMode,
                complianceBasis: campaign.complianceBasis ?? "",
                complianceNote: campaign.complianceNote ?? "",
                senderNameOverride: campaign.senderNameOverride ?? "",
              }}
            />
          ) : (
            <p className="text-sm text-muted">You have read-only access to this campaign.</p>
          )}
        </div>
      </OutreachPanel>

      <OutreachPanel>
        <h3 className="text-lg font-semibold">Daily statistics</h3>
        {campaign.dailyStats.length === 0 ? (
          <div className="mt-4">
            <OutreachEmptyState title="No daily statistics yet" description="Aggregates are rebuilt each night by the stats job." />
          </div>
        ) : (
          <OutreachTable className="mt-4 min-w-[760px]">
            <thead>
              <tr className="border-b border-border">
                <OutreachTh>Date</OutreachTh>
                <OutreachTh>Discovered</OutreachTh>
                <OutreachTh>Qualified</OutreachTh>
                <OutreachTh>Sent</OutreachTh>
                <OutreachTh>Delivered</OutreachTh>
                <OutreachTh>Replies</OutreachTh>
                <OutreachTh>Meetings</OutreachTh>
                <OutreachTh>Won</OutreachTh>
              </tr>
            </thead>
            <tbody>
              {campaign.dailyStats.map((row) => (
                <OutreachTr key={row.id}>
                  <OutreachTd className="text-xs text-muted">{row.date.toISOString().slice(0, 10)}</OutreachTd>
                  <OutreachTd className="tabular-nums">{row.discovered}</OutreachTd>
                  <OutreachTd className="tabular-nums">{row.qualified}</OutreachTd>
                  <OutreachTd className="tabular-nums">{row.emailsSent}</OutreachTd>
                  <OutreachTd className="tabular-nums">{row.delivered}</OutreachTd>
                  <OutreachTd className="tabular-nums">{row.replies}</OutreachTd>
                  <OutreachTd className="tabular-nums">{row.meetings}</OutreachTd>
                  <OutreachTd className="tabular-nums">{row.won}</OutreachTd>
                </OutreachTr>
              ))}
            </tbody>
          </OutreachTable>
        )}
      </OutreachPanel>
    </div>
  );
}
