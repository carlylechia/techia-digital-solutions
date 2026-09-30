import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { isLocale } from "@/content/site";
import { getPrisma } from "@/lib/prisma";
import { getOutreachActor } from "@/lib/outreach/auth";
import { OUTREACH_DISCOVERY_PROVIDER_LABELS } from "@/lib/outreach/constants";
import { loadOutreachCampaigns } from "@/lib/outreach/queries";
import { createMetadata } from "@/lib/seo";
import { OutreachCampaignActions } from "@/components/admin/outreach/outreach-campaign-actions";
import {
  OutreachEmptyState,
  OutreachPanel,
  OutreachPill,
  OutreachTable,
  OutreachTd,
  OutreachTh,
  OutreachTr,
} from "@/components/admin/outreach/outreach-ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return {
    ...createMetadata({
      locale,
      title: "Outreach campaigns",
      description: "Configure and monitor teChia SME outreach campaigns.",
      path: "/admin/outreach/campaigns",
    }),
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AdminOutreachCampaignsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const actor = await getOutreachActor();
  if (!actor || (!actor.canView && actor.roleLevel < 100)) notFound();

  const prisma = getPrisma();
  if (!prisma) {
    return (
      <OutreachPanel>
        <h2 className="text-2xl font-semibold">Campaigns are temporarily unavailable.</h2>
        <p className="mt-2 text-sm text-muted">Restore database connectivity to manage outreach campaigns.</p>
      </OutreachPanel>
    );
  }

  const campaigns = await loadOutreachCampaigns(prisma).catch(() => []);

  return (
    <div className="grid gap-5">
      <OutreachPanel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Campaigns</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Each campaign owns its own audience, limits, sending window, compliance basis and reply pipeline. Campaigns
              start in draft and default to requiring human approval.
            </p>
          </div>
          {actor.canManage ? (
            <Link
              href="/admin/outreach/campaigns/new"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-[#001018] transition hover:opacity-90"
            >
              <Plus className="size-4" />
              New campaign
            </Link>
          ) : null}
        </div>

        <div className="mt-5">
          {campaigns.length === 0 ? (
            <OutreachEmptyState
              title="No campaigns configured"
              description="Create your first campaign to start discovering businesses. Discovery stays off until the campaign is active."
            />
          ) : (
            <div className="grid gap-5">
              {/* Active campaigns */}
              <OutreachTable className="min-w-[1000px]">
                <thead>
                  <tr className="border-b border-border">
                    <OutreachTh>Campaign</OutreachTh>
                    <OutreachTh>Status</OutreachTh>
                    <OutreachTh>Mode</OutreachTh>
                    <OutreachTh>Discovery</OutreachTh>
                    <OutreachTh>Target</OutreachTh>
                    <OutreachTh>Limits</OutreachTh>
                    <OutreachTh>Window</OutreachTh>
                    <OutreachTh>Volume</OutreachTh>
                    <OutreachTh>Actions</OutreachTh>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.filter((c) => c.status !== "ARCHIVED").map((campaign) => (
                    <OutreachTr key={campaign.id}>
                      <OutreachTd>
                        <Link href={`/admin/outreach/campaigns/${campaign.id}`} className="font-semibold text-primary hover:text-accent">
                          {campaign.name}
                        </Link>
                        {campaign.complianceBasis ? (
                          <p className="mt-1 max-w-sm text-xs text-muted">Compliance: {campaign.complianceBasis}</p>
                        ) : null}
                      </OutreachTd>
                      <OutreachTd>
                        <OutreachPill
                          tone={
                            campaign.status === "ACTIVE"
                              ? "good"
                              : campaign.status === "PAUSED"
                                ? "warn"
                                : campaign.status === "DRAFT"
                                  ? "quiet"
                                  : "default"
                          }
                        >
                          {campaign.status}
                        </OutreachPill>
                      </OutreachTd>
                      <OutreachTd>
                        <OutreachPill tone={campaign.mode === "AUTOMATIC" ? "warn" : "default"}>
                          {campaign.mode.replace("_", " ")}
                        </OutreachPill>
                        <p className="mt-1 text-xs text-muted">
                          {campaign.requireApproval ? "approval required" : "no approval gate"}
                        </p>
                      </OutreachTd>
                      <OutreachTd>
                        <OutreachPill tone={campaign.discoveryProviderMode === "AUTO" ? "quiet" : "default"}>
                          {campaign.discoveryProviderMode === "AUTO"
                            ? "Automatic"
                            : OUTREACH_DISCOVERY_PROVIDER_LABELS[campaign.discoveryProviderMode] ?? campaign.discoveryProviderMode}
                        </OutreachPill>
                      </OutreachTd>
                      <OutreachTd className="text-sm text-muted">
                        {campaign.cities.length > 0 ? campaign.cities.slice(0, 2).join(", ") : campaign.regions.length > 0 ? campaign.regions.slice(0, 2).join(", ") : "—"}
                        <br />
                        {campaign.industries.slice(0, 2).join(", ") || "no industry filter"}
                      </OutreachTd>
                      <OutreachTd className="text-sm text-muted">
                        {campaign.dailyDiscoveryLimit}/day discovery
                        <br />
                        {campaign.dailySendLimit}/day send
                        <br />
                        ≥{campaign.minOpportunityScore} score
                      </OutreachTd>
                      <OutreachTd className="text-sm text-muted">
                        {campaign.sendingWindowStart}–{campaign.sendingWindowEnd}
                        <br />
                        {campaign.timezone}
                      </OutreachTd>
                      <OutreachTd className="text-sm text-muted">
                        {campaign._count.prospects} prospects
                        <br />
                        {campaign._count.messages} messages
                      </OutreachTd>
                      <OutreachTd>
                        <OutreachCampaignActions
                          campaignId={campaign.id}
                          status={campaign.status}
                          canManage={actor.canManage}
                          canSend={actor.canSend}
                        />
                      </OutreachTd>
                    </OutreachTr>
                  ))}
                </tbody>
              </OutreachTable>

              {/* Archived campaigns — separated at the bottom */}
              {campaigns.some((c) => c.status === "ARCHIVED") ? (
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Archived campaigns
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <OutreachTable className="min-w-[1000px]">
                    <thead>
                      <tr className="border-b border-border">
                        <OutreachTh>Campaign</OutreachTh>
                        <OutreachTh>Status</OutreachTh>
                        <OutreachTh>Mode</OutreachTh>
                        <OutreachTh>Discovery</OutreachTh>
                        <OutreachTh>Target</OutreachTh>
                        <OutreachTh>Limits</OutreachTh>
                        <OutreachTh>Window</OutreachTh>
                        <OutreachTh>Volume</OutreachTh>
                        <OutreachTh>Actions</OutreachTh>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.filter((c) => c.status === "ARCHIVED").map((campaign) => (
                        <OutreachTr key={campaign.id} className="opacity-60">
                          <OutreachTd>
                            <Link href={`/admin/outreach/campaigns/${campaign.id}`} className="font-semibold text-primary hover:text-accent">
                              {campaign.name}
                            </Link>
                            {campaign.complianceBasis ? (
                              <p className="mt-1 max-w-sm text-xs text-muted">Compliance: {campaign.complianceBasis}</p>
                            ) : null}
                          </OutreachTd>
                          <OutreachTd>
                            <OutreachPill tone="quiet">
                              {campaign.status}
                            </OutreachPill>
                          </OutreachTd>
                          <OutreachTd>
                            <OutreachPill tone={campaign.mode === "AUTOMATIC" ? "warn" : "default"}>
                              {campaign.mode.replace("_", " ")}
                            </OutreachPill>
                            <p className="mt-1 text-xs text-muted">
                              {campaign.requireApproval ? "approval required" : "no approval gate"}
                            </p>
                          </OutreachTd>
                          <OutreachTd>
                            <OutreachPill tone={campaign.discoveryProviderMode === "AUTO" ? "quiet" : "default"}>
                              {campaign.discoveryProviderMode === "AUTO"
                                ? "Automatic"
                                : OUTREACH_DISCOVERY_PROVIDER_LABELS[campaign.discoveryProviderMode] ?? campaign.discoveryProviderMode}
                            </OutreachPill>
                          </OutreachTd>
                          <OutreachTd className="text-sm text-muted">
                            {campaign.cities.length > 0 ? campaign.cities.slice(0, 2).join(", ") : campaign.regions.length > 0 ? campaign.regions.slice(0, 2).join(", ") : "—"}
                            <br />
                            {campaign.industries.slice(0, 2).join(", ") || "no industry filter"}
                          </OutreachTd>
                          <OutreachTd className="text-sm text-muted">
                            {campaign.dailyDiscoveryLimit}/day discovery
                            <br />
                            {campaign.dailySendLimit}/day send
                            <br />
                            ≥{campaign.minOpportunityScore} score
                          </OutreachTd>
                          <OutreachTd className="text-sm text-muted">
                            {campaign.sendingWindowStart}–{campaign.sendingWindowEnd}
                            <br />
                            {campaign.timezone}
                          </OutreachTd>
                          <OutreachTd className="text-sm text-muted">
                            {campaign._count.prospects} prospects
                            <br />
                            {campaign._count.messages} messages
                          </OutreachTd>
                          <OutreachTd>
                            <OutreachCampaignActions
                              campaignId={campaign.id}
                              status={campaign.status}
                              canManage={actor.canManage}
                              canSend={actor.canSend}
                            />
                          </OutreachTd>
                        </OutreachTr>
                      ))}
                    </tbody>
                  </OutreachTable>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </OutreachPanel>
    </div>
  );
}
