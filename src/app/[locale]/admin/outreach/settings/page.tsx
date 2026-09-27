import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/content/site";
import { getPrisma } from "@/lib/prisma";
import { getOutreachActor } from "@/lib/outreach/auth";
import { getOutreachSendingState, isGooglePlacesConfigured, OUTREACH_LIMITS, OUTREACH_PROMPTS, OUTREACH_SAFETY, OUTREACH_SENDER, OUTREACH_AI } from "@/lib/outreach/config";
import { isOutreachEmailConfigured } from "@/lib/outreach/email-service";
import { countQueuedJobs } from "@/lib/outreach/jobs";
import { getProviderStatus } from "@/lib/outreach/providers/registry";
import { loadOutreachAnalytics } from "@/lib/outreach/queries";
import { OUTREACH_STATUS_LABELS } from "@/lib/outreach/constants";
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
import { OutreachStatusBanner } from "@/components/admin/outreach/outreach-nav";
import { OutreachRunNow } from "@/components/admin/outreach/outreach-run-now";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return {
    ...createMetadata({
      locale,
      title: "Outreach settings",
      description: "Runtime configuration, safety switches, prompt versions and pipeline analytics.",
      path: "/admin/outreach/settings",
    }),
    robots: { index: false, follow: false, nocache: true },
  };
}

/**
 * Settings.
 *
 * Secrets are never read into the page payload. Each integration reports only a
 * boolean "configured" state, so nothing sensitive can reach the browser even in
 * a compromised client.
 */
export default async function AdminOutreachSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const actor = await getOutreachActor();
  if (!actor || (!actor.canView && actor.roleLevel < 100)) notFound();

  const sendingState = getOutreachSendingState();
  const prisma = getPrisma();

  // Provider readiness. Every value rendered here is a boolean, a timestamp or
  // our own classification text — never an API key or a raw provider response.
  const providerStatus = await getProviderStatus().catch(() => null);

  const integrations = [
    { name: "Google Places API (New)", variable: "GOOGLE_MAPS_PLATFORM_API_KEY", configured: isGooglePlacesConfigured(), required: true, note: "Server-side only. Discovery and enrichment are disabled without it." },
    { name: "OpenAI", variable: "OPENAI_API_KEY", configured: Boolean(process.env.OPENAI_API_KEY), required: true, note: "Reused from the existing AI Growth Agent. Never exposed to the browser." },
    { name: "Email provider", variable: "RESEND_API_KEY or OUTREACH_RESEND_API_KEY", configured: isOutreachEmailConfigured(), required: true, note: "Outreach uses its own service layer and never touches newsletter subscribers." },
    { name: "Outreach sending domain", variable: "OUTREACH_FROM_EMAIL", configured: Boolean(process.env.OUTREACH_FROM_EMAIL), required: false, note: "Optional dedicated subdomain for outreach reputation isolation." },
    { name: "Provider webhook secret", variable: "OUTREACH_WEBHOOK_SECRET", configured: Boolean(process.env.OUTREACH_WEBHOOK_SECRET || process.env.RESEND_WEBHOOK_SECRET), required: false, note: "Needed for bounce, complaint and inbound reply events." },
    { name: "Cron authentication", variable: "CRON_SECRET", configured: Boolean(process.env.CRON_SECRET), required: true, note: "Shared with the existing blog cron. Every outreach job endpoint requires it." },
  ];

  const jobs = prisma ? await countQueuedJobs().catch(() => ({ pending: 0, processing: 0, failed: 0 })) : { pending: 0, processing: 0, failed: 0 };
  const analytics = prisma ? await loadOutreachAnalytics(prisma).catch(() => null) : null;

  const crons = [
    {
      path: "/api/cron/outreach/daily",
      purpose:
        "The only scheduled outreach endpoint. Queues discovery for campaigns inside their daily budget, processes a bounded batch of due jobs, schedules due follow-ups and refreshes daily statistics. Requires CRON_SECRET.",
    },
    {
      path: "/api/cron/outreach/process",
      purpose:
        "Not scheduled. Drains due jobs on demand, for example after a deploy, using the same due-work rules as the daily cycle. Requires CRON_SECRET.",
    },
  ];

  return (
    <div className="grid gap-5">
      <OutreachStatusBanner
        sendingEnabled={sendingState.enabled}
        environment={sendingState.environment}
        reason={sendingState.reason}
        googlePlaces={isGooglePlacesConfigured()}
        emailProvider={isOutreachEmailConfigured()}
      />

      <OutreachPanel>
        <h2 className="text-lg font-semibold">Discovery providers</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Google Places is the primary source. Automatic mode falls back to OpenStreetMap only when Google is
          unconfigured, out of quota, or temporarily unavailable, and it returns to Google by itself once the cooldown
          expires. Google-only mode never switches providers.
        </p>

        {!providerStatus ? (
          <div className="mt-4">
            <OutreachEmptyState title="Provider status unavailable" description="Discovery data is unavailable right now." />
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              {
                role: "Primary",
                label: providerStatus.primary.label,
                available: providerStatus.primary.configured && !providerStatus.primary.inCooldown,
                reason: providerStatus.primary.inCooldown
                  ? `Temporarily cooling down after ${providerStatus.primary.consecutiveFailures} consecutive failure(s). ${providerStatus.primary.reason ?? ""}`.trim()
                  : providerStatus.primary.reason ?? "Ready to serve discovery requests.",
                extra: providerStatus.primary.lastFailureCategory
                  ? `Last failure: ${providerStatus.primary.lastFailureCategory}${providerStatus.primary.lastSuccessAt ? ` · last success ${new Date(providerStatus.primary.lastSuccessAt).toISOString().slice(0, 10)}` : ""}`
                  : providerStatus.primary.lastSuccessAt
                    ? `Last success ${new Date(providerStatus.primary.lastSuccessAt).toISOString().slice(0, 10)}`
                    : null,
              },
              {
                role: "Fallback",
                label: providerStatus.fallback.label,
                available: providerStatus.fallback.configured,
                reason: providerStatus.fallback.reason ?? "No credential required. Active only while Google cannot serve a request.",
                extra: null,
              },
            ].map((provider) => (
              <div key={provider.role} className="subtle-tile rounded-[1.25rem] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{provider.role}</p>
                    <p className="mt-1 text-sm font-semibold text-primary">{provider.label}</p>
                  </div>
                  <OutreachPill tone={provider.available ? "good" : "warn"}>
                    <span aria-hidden="true" className="mr-1.5">
                      ●
                    </span>
                    {provider.available ? "Available" : "Unavailable"}
                  </OutreachPill>
                </div>
                <p className="mt-3 text-xs leading-6 text-muted">{provider.reason}</p>
                {provider.extra ? <p className="mt-1 text-xs text-muted">{provider.extra}</p> : null}
              </div>
            ))}
          </div>
        )}

        {providerStatus && (!providerStatus.primary.configured || providerStatus.primary.inCooldown) ? (
          <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Automatic-mode campaigns are currently using the OpenStreetMap fallback.
            {providerStatus.primary.configured
              ? " Google is configured and will be retried automatically once the cooldown expires."
              : " Set GOOGLE_MAPS_PLATFORM_API_KEY and redeploy to return to Google; no code change is needed."}
          </p>
        ) : null}
      </OutreachPanel>

      <OutreachPanel>
        <h2 className="text-lg font-semibold">Integrations</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Only a configured/not-configured state is ever rendered. Credential values stay in the server environment.
        </p>
        <div className="mt-4">
          <OutreachTable className="min-w-[720px]">
            <thead>
              <tr className="border-b border-border">
                <OutreachTh>Integration</OutreachTh>
                <OutreachTh>Environment variable</OutreachTh>
                <OutreachTh>State</OutreachTh>
                <OutreachTh>Notes</OutreachTh>
              </tr>
            </thead>
            <tbody>
              {integrations.map((integration) => (
                <OutreachTr key={integration.variable}>
                  <OutreachTd className="text-sm font-semibold">{integration.name}</OutreachTd>
                  <OutreachTd className="font-mono text-xs text-muted">{integration.variable}</OutreachTd>
                  <OutreachTd>
                    <OutreachPill tone={integration.configured ? "good" : integration.required ? "danger" : "quiet"}>
                      {integration.configured ? "configured" : integration.required ? "required, missing" : "not configured"}
                    </OutreachPill>
                  </OutreachTd>
                  <OutreachTd className="text-xs text-muted">{integration.note}</OutreachTd>
                </OutreachTr>
              ))}
            </tbody>
          </OutreachTable>
        </div>
      </OutreachPanel>

      <div className="grid gap-5 lg:grid-cols-2">
        <OutreachPanel>
          <h2 className="text-lg font-semibold">Safety envelope</h2>
          <p className="mt-1 text-sm text-muted">Configured bounds, not compiled constants.</p>
          <dl className="mt-4 grid gap-2 text-sm">
            {[
              ["Max daily discovery per campaign", OUTREACH_LIMITS.maxDailyDiscovery],
              ["Max daily sends per campaign", OUTREACH_LIMITS.maxDailySend],
              ["Max automated follow-ups", OUTREACH_LIMITS.maxFollowUps],
              ["Hard max messages per prospect", OUTREACH_SAFETY.hardMaxMessagesPerProspect],
              ["Minimum hours between sends", OUTREACH_SAFETY.minHoursBetweenSends],
              ["Max website bytes fetched", OUTREACH_SAFETY.maxWebsiteBytes.toLocaleString()],
              ["Max AI evidence characters", OUTREACH_SAFETY.maxAiEvidenceChars.toLocaleString()],
              ["Job lock timeout (minutes)", OUTREACH_SAFETY.jobLockTimeoutMinutes],
              ["Bounce alert threshold", `${Math.round(OUTREACH_SAFETY.bounceRateAlertThreshold * 100)}% over ${OUTREACH_SAFETY.bounceRateAlertMinSends} sends`],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
                <dt className="text-muted">{label}</dt>
                <dd className="font-semibold tabular-nums text-primary">{value}</dd>
              </div>
            ))}
          </dl>
        </OutreachPanel>

        <OutreachPanel>
          <h2 className="text-lg font-semibold">Prompts and sender</h2>
          <dl className="mt-4 grid gap-2 text-sm">
            {[
              ["Assessment prompt", OUTREACH_PROMPTS.assessment],
              ["Email prompt", OUTREACH_PROMPTS.email],
              ["Reply classifier prompt", OUTREACH_PROMPTS.reply],
              ["Model", OUTREACH_AI.model],
              ["Max output tokens", OUTREACH_AI.maxOutputTokens],
              ["Sender name", OUTREACH_SENDER.name],
              ["Sender brand", OUTREACH_SENDER.brand],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
                <dt className="text-muted">{label}</dt>
                <dd className="font-semibold text-primary">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted">
            Every stored assessment and generated message records the model and prompt version that produced it, so an old
            decision can always be explained.
          </p>
        </OutreachPanel>
      </div>

      <OutreachPanel>
        <h2 className="text-lg font-semibold">Scheduled jobs</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          The outreach engine runs from a single daily schedule. Vercel&apos;s Hobby plan allows a cron at most once per
          day, so that run asks what work is due and processes a bounded batch of it, leaving the rest queued for the
          next day. Nothing is scheduled by wall-clock time here, and a job is only ever processed once.
        </p>
        <ul className="mt-4 grid gap-2">
          {crons.map((cron) => (
            <li key={cron.path} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <span className="font-mono text-xs text-accent">{cron.path}</span>
              <p className="mt-1 text-xs text-muted">{cron.purpose}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <OutreachStatCard label="Pending jobs" value={jobs.pending} tone="quiet" />
          <OutreachStatCard label="Processing" value={jobs.processing} tone="warn" />
          <OutreachStatCard label="Failed" value={jobs.failed} tone={jobs.failed > 0 ? "danger" : "good"} />
        </div>
        <div className="mt-5">
          <OutreachRunNow canRun={actor.canSend || actor.roleLevel >= 100} />
        </div>
      </OutreachPanel>

      <OutreachPanel>
        <h2 className="text-lg font-semibold">Analytics by dimension</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Last 30 days. Counts are shown with their raw totals so a small sample is never presented as a conclusion.
        </p>
        {!analytics ? (
          <div className="mt-4">
            <OutreachEmptyState title="Analytics unavailable" description="The outreach tables may not be migrated yet." />
          </div>
        ) : (
          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            <div className="grid gap-4">
              <BreakdownTable title="By campaign" rows={analytics.campaignBreakdown.map((row) => ({ key: row.name, count: row._count.prospects }))} />
              <BreakdownTable title="By industry" rows={analytics.byIndustry} />
              <BreakdownTable title="By country" rows={analytics.byCountry} />
            </div>
            <div className="grid gap-4">
              <BreakdownTable title="By city" rows={analytics.byCity} />
              <div>
                <h3 className="text-sm font-semibold">By recommended service</h3>
                {analytics.byService.length === 0 ? (
                  <div className="mt-3">
                    <OutreachEmptyState title="No service recommendations yet" />
                  </div>
                ) : (
                  <OutreachTable className="mt-3 min-w-[420px]">
                    <thead>
                      <tr className="border-b border-border">
                        <OutreachTh>Service</OutreachTh>
                        <OutreachTh>Prospects</OutreachTh>
                        <OutreachTh>Qualified</OutreachTh>
                        <OutreachTh>Won</OutreachTh>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.byService.map((row) => (
                        <OutreachTr key={row.key}>
                          <OutreachTd className="text-sm">{row.label}</OutreachTd>
                          <OutreachTd className="tabular-nums">{row.count}</OutreachTd>
                          <OutreachTd className="tabular-nums">{row.qualified}</OutreachTd>
                          <OutreachTd className="tabular-nums">{row.won}</OutreachTd>
                        </OutreachTr>
                      ))}
                    </tbody>
                  </OutreachTable>
                )}
              </div>
            </div>
          </div>
        )}
        <p className="mt-4 text-xs text-muted">
          Looking for the headline counters?{" "}
          <Link href="/admin/outreach" className="text-accent hover:underline">
            Open the outreach dashboard
          </Link>
          .
        </p>
      </OutreachPanel>

      <OutreachPanel>
        <h2 className="text-sm font-semibold">Campaign status reference</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(OUTREACH_STATUS_LABELS)
            .filter(([key]) => ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED", "MANUAL", "SEMI_AUTOMATIC", "AUTOMATIC"].includes(key))
            .map(([key, label]) => (
              <OutreachPill key={key} tone="quiet">
                {label}
              </OutreachPill>
            ))}
        </div>
      </OutreachPanel>
    </div>
  );
}

function BreakdownTable({ title, rows }: { title: string; rows: Array<{ key: string; count: number }> }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <div className="mt-3">
          <OutreachEmptyState title={`No ${title.toLowerCase()} data yet`} />
        </div>
      ) : (
        <OutreachTable className="mt-3 min-w-[320px]">
          <thead>
            <tr className="border-b border-border">
              <OutreachTh>{title.replace("By ", "")}</OutreachTh>
              <OutreachTh>Count</OutreachTh>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <OutreachTr key={row.key}>
                <OutreachTd className="text-sm">{row.key}</OutreachTd>
                <OutreachTd className="tabular-nums">{row.count}</OutreachTd>
              </OutreachTr>
            ))}
          </tbody>
        </OutreachTable>
      )}
    </div>
  );
}
