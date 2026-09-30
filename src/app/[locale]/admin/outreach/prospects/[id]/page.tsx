import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/content/site";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import { getOutreachActor } from "@/lib/outreach/auth";
import { loadOutreachProspectDetail } from "@/lib/outreach/queries";
import { OUTREACH_DISCOVERY_PROVIDER_LABELS, OUTREACH_QUALIFICATION_LABELS, OUTREACH_SERVICE_LABELS, OUTREACH_STATUS_LABELS, messageStatusTone, prospectStatusTone } from "@/lib/outreach/constants";
import { createMetadata } from "@/lib/seo";
import { OutreachProspectActions } from "@/components/admin/outreach/outreach-prospect-actions";
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
      title: "Outreach prospect",
      description: "Prospect evidence, AI assessment, message history and reply handling.",
      path: "/admin/outreach/prospects",
    }),
    robots: { index: false, follow: false, nocache: true },
  };
}

type Dimension = { key: string; label: string; earned: number; possible: number; reasons: string[] };

function asList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asText(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function yesNo(value: unknown) {
  return value ? "yes" : "no";
}

/** Typed view over the stored website snapshot. Unknown shapes degrade safely. */
function evidenceRows(snapshot: Record<string, unknown>): Array<[string, string]> {
  return [
    ["Title", asText(snapshot.title) ?? "unknown"],
    ["Meta description", snapshot.metaDescription ? "present" : "missing"],
    ["H1", yesNo(snapshot.hasH1)],
    ["Viewport", yesNo(snapshot.viewportPresent)],
    ["Canonical", yesNo(snapshot.canonicalPresent)],
    ["HTTPS", yesNo(snapshot.https)],
    ["Contact methods", asList(snapshot.contactMethods).join(", ") || "none found"],
    ["Social profiles", asList(snapshot.socialPlatforms).join(", ") || "none found"],
    ["Trust signals", asList(snapshot.trustSignals).join(", ") || "none found"],
    ["Booking", yesNo(snapshot.hasBooking)],
    ["E-commerce", yesNo(snapshot.hasEcommerce)],
    ["Catalogue", yesNo(snapshot.hasCatalogue)],
    ["Lead capture form", yesNo(snapshot.leadCaptureForm)],
    ["Call to action", yesNo(snapshot.clearCallToAction)],
    ["Local area signals", asList(snapshot.localAreaSignals).join(", ") || "none"],
  ];
}

export default async function OutreachProspectDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const actor = await getOutreachActor();
  if (!actor || (!actor.canView && actor.roleLevel < 100)) notFound();

  const prisma = getPrisma();
  if (!prisma) {
    return (
      <OutreachPanel>
        <h2 className="text-2xl font-semibold">This prospect cannot load right now.</h2>
      </OutreachPanel>
    );
  }

  const data = await loadOutreachProspectDetail(prisma, id).catch((error) => {
    console.error("outreach_prospect_load_failed", getErrorMessage(error));
    return null;
  });

  if (!data) {
    return (
      <OutreachPanel>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Not available</p>
        <h2 className="mt-3 text-2xl font-semibold">This prospect could not be found.</h2>
        <Link href="/admin/outreach/prospects" className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">
          ← Back to prospects
        </Link>
      </OutreachPanel>
    );
  }

  const { prospect, suppression } = data;
  const snapshot = (prospect.websiteSnapshot ?? null) as Record<string, unknown> | null;
  const assessment = (prospect.digitalAssessment ?? null) as { dimensions?: Dimension[]; total?: number; websiteErrorCategory?: string | null } | null;
  const current = prospect.assessments[0] ?? null;
  const sentMessages = prospect.messages.filter((message) => ["SENT", "DELIVERED", "OPENED", "CLICKED", "REPLIED", "BOUNCED"].includes(message.status));

  return (
    <div className="grid gap-5">
      <OutreachPanel>
        <Link href="/admin/outreach/prospects" className="text-xs font-semibold text-accent hover:underline">
          ← Prospects
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold">{prospect.businessName}</h2>
            <p className="mt-1 text-sm text-muted">
              {[prospect.city, prospect.region, prospect.country].filter(Boolean).join(", ") || "Location unknown"} ·{" "}
              {prospect.industry ?? "industry unknown"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <OutreachPill tone={prospectStatusTone(prospect.status)}>{OUTREACH_STATUS_LABELS[prospect.status] ?? prospect.status}</OutreachPill>
              <OutreachPill tone="quiet">{prospect.campaign.name}</OutreachPill>
              {prospect.googlePlaceId ? <OutreachPill tone="quiet">Google place ID stored</OutreachPill> : null}
              {prospect.automationStoppedReason ? <OutreachPill tone="warn">Automation stopped: {prospect.automationStoppedReason}</OutreachPill> : null}
              {suppression.length > 0 ? <OutreachPill tone="danger">Suppressed</OutreachPill> : null}
              <OutreachPill tone={prospect.discoveryProvider === "OPENSTREETMAP" ? "quiet" : "default"}>
                Discovery: {OUTREACH_DISCOVERY_PROVIDER_LABELS[prospect.discoveryProvider] ?? prospect.discoveryProvider}
              </OutreachPill>
              {prospect.possibleDuplicateOfId ? (
                <Link href={`/admin/outreach/prospects/${prospect.possibleDuplicateOfId}`}>
                  <OutreachPill tone="warn">Possible duplicate — review</OutreachPill>
                </Link>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              {prospect.websiteUrl ? (
                <a
                  href={prospect.websiteUrl}
                  target="_blank"
                  rel="noreferrer nofollow noopener"
                  className="break-all text-accent hover:underline"
                >
                  {prospect.websiteUrl}
                </a>
              ) : (
                <span className="text-muted">No website on the Google listing</span>
              )}
              {prospect.googleMapsUri ? (
                <a
                  href={prospect.googleMapsUri}
                  target="_blank"
                  rel="noreferrer nofollow noopener"
                  className="text-accent hover:underline"
                >
                  Google Maps
                </a>
              ) : null}
              {prospect.sourceUrl ? (
                <a
                  href={prospect.sourceUrl}
                  target="_blank"
                  rel="noreferrer nofollow noopener"
                  className="text-accent hover:underline"
                >
                  {prospect.discoveryProvider === "OPENSTREETMAP" ? "OpenStreetMap" : "Source listing"}
                </a>
              ) : null}
              {prospect.latitude !== null && prospect.longitude !== null ? (
                <span className="text-muted">
                  {prospect.latitude.toFixed(5)}, {prospect.longitude.toFixed(5)}
                </span>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Opportunity score</p>
            <p className="text-4xl font-semibold tabular-nums">{prospect.opportunityScore}</p>
            <p className="text-xs text-muted">out of 100</p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted">Readiness score</p>
            <p className="text-4xl font-semibold tabular-nums">{prospect.outreachReadinessScore}</p>
            <p className="text-xs text-muted">out of 100</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <OutreachStatCard label="Messages delivered" value={prospect.emailsSentCount} hint={`Max ${prospect.campaign.maxFollowUps + 1} per prospect`} />
          <OutreachStatCard label="Last contacted" value={prospect.lastContactedAt ? formatDateTime(prospect.lastContactedAt) : "Never"} tone="quiet" />
          <OutreachStatCard label="Discovered" value={formatDateTime(prospect.discoveredAt)} tone="quiet" />
          <OutreachStatCard label="Public email" value={prospect.publicEmail ?? "None found"} tone={prospect.publicEmail ? "good" : "warn"} />
        </div>

        {prospect.recommendedServices.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {prospect.recommendedServices.map((service) => (
              <OutreachPill key={service} tone="default">
                {OUTREACH_SERVICE_LABELS[service] ?? service}
              </OutreachPill>
            ))}
          </div>
        ) : null}
      </OutreachPanel>

      <OutreachPanel>
        <h3 className="text-lg font-semibold">Qualification</h3>
        <p className="mt-1 text-sm text-muted">
          The qualification decision is based on hard rules, not just the numeric score. A prospect must satisfy ALL required
          conditions to be qualified for outreach.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="subtle-tile rounded-lg px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Qualification Status</p>
            <p className="mt-1 text-sm font-semibold text-primary">
              {prospect.qualificationStatus ? (
                <OutreachPill tone={prospect.qualificationStatus === "QUALIFIED" ? "good" : prospect.qualificationStatus === "REVIEW" ? "warn" : "danger"}>
                  {OUTREACH_QUALIFICATION_LABELS[prospect.qualificationStatus] ?? prospect.qualificationStatus}
                </OutreachPill>
              ) : (
                "—"
              )}
            </p>
          </div>
          <div className="subtle-tile rounded-lg px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Confidence</p>
            <p className="mt-1 text-sm font-semibold text-primary">
              {prospect.qualificationConfidence !== null && prospect.qualificationConfidence !== undefined
                ? `${Math.round(prospect.qualificationConfidence * 100)}%`
                : "—"}
            </p>
          </div>
          <div className="subtle-tile rounded-lg px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Primary Opportunity</p>
            <p className="mt-1 text-sm font-semibold text-primary">{prospect.primaryOpportunity || "—"}</p>
          </div>
        </div>
        {prospect.qualificationReason ? (
          <div className="mt-4 rounded-lg border border-border bg-background p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Qualification Reason</p>
            <p className="mt-1 text-sm text-primary">{prospect.qualificationReason}</p>
          </div>
        ) : null}
        {prospect.disqualificationReason ? (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-red-300">Disqualification Reason</p>
            <p className="mt-1 text-sm text-red-200">{prospect.disqualificationReason}</p>
          </div>
        ) : null}
        {prospect.recommendedNextAction ? (
          <div className="mt-4 rounded-lg border border-border bg-background p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Recommended Next Action</p>
            <p className="mt-1 text-sm text-primary">{prospect.recommendedNextAction}</p>
          </div>
        ) : null}
      </OutreachPanel>

      <div className="grid gap-5 lg:grid-cols-2">
        <OutreachPanel>
          <h3 className="text-lg font-semibold">Deterministic score breakdown</h3>
          <p className="mt-1 text-sm text-muted">
            Computed by fixed rules from stored evidence. The AI interprets these findings but cannot change the number.
          </p>
          {!assessment?.dimensions?.length ? (
            <div className="mt-4">
              <OutreachEmptyState title="No score recorded yet" description="Enrichment has not produced evidence for this prospect." />
            </div>
          ) : (
            <ul className="mt-4 grid gap-3">
              {assessment.dimensions.map((dimension) => (
                <li key={dimension.key} className="grid gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary">{dimension.label}</span>
                    <span className="tabular-nums text-muted">
                      {dimension.earned}/{dimension.possible}
                    </span>
                  </div>
                  <OutreachBar value={dimension.earned} max={dimension.possible} />
                  {dimension.reasons.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {dimension.reasons.map((reason) => (
                        <li key={reason} className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted">
                          {reason}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {assessment?.websiteErrorCategory ? (
            <p className="mt-3 text-xs text-amber-300">
              Website fetch outcome: {assessment.websiteErrorCategory}. The engine does not treat a failed fetch as a
              business problem.
            </p>
          ) : null}
        </OutreachPanel>

        <OutreachPanel>
          <h3 className="text-lg font-semibold">AI assessment</h3>
          <p className="mt-1 text-sm text-muted">
            Historical assessments are appended, never overwritten. Each row records the model, prompt version and the
            evidence it read.
          </p>
          {!current ? (
            <div className="mt-4">
              <OutreachEmptyState title="No assessment yet" description="Queue an assessment from the controls below." />
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              <div className="flex flex-wrap gap-2">
                <OutreachPill tone="quiet">model: {current.model}</OutreachPill>
                <OutreachPill tone="quiet">prompt: {current.promptVersion}</OutreachPill>
                <OutreachPill tone="default">confidence {(current.confidence * 100).toFixed(0)}%</OutreachPill>
                {current.primaryService ? <OutreachPill tone="good">{OUTREACH_SERVICE_LABELS[current.primaryService] ?? current.primaryService}</OutreachPill> : null}
              </div>
              {current.summary ? <p className="text-sm leading-7 text-primary">{current.summary}</p> : null}
              {current.doNotContactReason ? (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  Do-not-contact: {current.doNotContactReason}
                </p>
              ) : null}
              <p className="text-xs text-muted">Recorded {formatDateTime(current.createdAt)}</p>
            </div>
          )}

          {prospect.aiSummary ? (
            <div className="mt-4 rounded-lg border border-border bg-background p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Latest summary</p>
              <p className="mt-2 text-sm leading-7 text-primary">{prospect.aiSummary}</p>
              {prospect.aiReasoning ? <p className="mt-2 text-xs leading-6 text-muted">{prospect.aiReasoning}</p> : null}
            </div>
          ) : null}
        </OutreachPanel>
      </div>

      <OutreachPanel>
        <h3 className="text-lg font-semibold">Website evidence</h3>
        <p className="mt-1 text-sm text-muted">
          Extracted from the business&apos;s own published page. Raw page content is never stored; only these structured
          signals are kept.
        </p>
        {!snapshot ? (
          <div className="mt-4">
            <OutreachEmptyState title="No website snapshot" description="The business may have no website on its Google listing." />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {evidenceRows(snapshot).map(([label, value]) => (
              <div key={label} className="subtle-tile rounded-lg px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
                <p className="mt-1 break-words text-sm text-primary">{value}</p>
              </div>
            ))}
          </div>
        )}
      </OutreachPanel>

      <OutreachPanel>
        <h3 className="text-lg font-semibold">Actions</h3>
        <div className="mt-4">
          <OutreachProspectActions
            prospectId={prospect.id}
            currentStatus={prospect.status}
            hasEmail={Boolean(prospect.publicEmail)}
            canManage={actor.canManage}
            canSend={actor.canSend}
          />
        </div>
      </OutreachPanel>

      <div className="grid gap-5 lg:grid-cols-2">
        <OutreachPanel>
          <h3 className="text-lg font-semibold">Message history</h3>
          {prospect.messages.length === 0 ? (
            <div className="mt-4">
              <OutreachEmptyState title="No messages yet" description="Generate one from the actions above." />
            </div>
          ) : (
            <ul className="mt-4 grid gap-3">
              {prospect.messages.map((message) => (
                <li key={message.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-primary">{message.subject}</span>
                    <span className="flex items-center gap-2">
                      <OutreachPill tone="quiet">{message.type}</OutreachPill>
                      <OutreachPill tone={messageStatusTone(message.status)}>{OUTREACH_STATUS_LABELS[message.status] ?? message.status}</OutreachPill>
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted">{message.bodyText.slice(0, 900)}</p>
                  <p className="mt-2 text-xs text-muted">
                    {message.aiGenerated ? `AI generated (${message.aiPromptVersion ?? "unknown version"})` : "Written or edited by a person"} ·{" "}
                    {message.sentAt ? `sent ${formatDateTime(message.sentAt)}` : "not sent"}
                  </p>
                  {message.failureReason ? <p className="mt-1 text-xs text-red-300">{message.failureReason}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </OutreachPanel>

        <OutreachPanel>
          <h3 className="text-lg font-semibold">Meetings</h3>
          {prospect.meetings.length === 0 ? (
            <div className="mt-4">
              <OutreachEmptyState title="No meetings recorded" description="Add one from the meetings section." />
            </div>
          ) : (
            <ul className="mt-4 grid gap-2">
              {prospect.meetings.map((meeting) => (
                <li key={meeting.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <span>{formatDateTime(meeting.scheduledAt)} · {meeting.duration} min</span>
                  <span className="flex items-center gap-2">
                    <OutreachPill tone={meeting.status === "COMPLETED" ? "good" : meeting.status === "CANCELLED" ? "danger" : "warn"}>{meeting.status}</OutreachPill>
                    {meeting.meetingUrl ? (
                      <a href={meeting.meetingUrl} target="_blank" rel="noreferrer noopener" className="text-xs text-accent hover:underline">
                        Join
                      </a>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {suppression.length > 0 ? (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-300">Suppression records</p>
              <ul className="mt-2 grid gap-1 text-xs text-muted">
                {suppression.map((entry) => (
                  <li key={entry.id}>
                    {entry.email ?? entry.domain} · {entry.reason} · {formatDateTime(entry.createdAt)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </OutreachPanel>
      </div>

      <OutreachPanel>
        <h3 className="text-lg font-semibold">Event log</h3>
        <p className="mt-1 text-sm text-muted">Append-only. Nothing here is ever used as mutable state.</p>
        {prospect.events.length === 0 ? (
          <div className="mt-4">
            <OutreachEmptyState title="No events recorded" />
          </div>
        ) : (
          <OutreachTable className="mt-4">
            <thead>
              <tr className="border-b border-border">
                <OutreachTh>When</OutreachTh>
                <OutreachTh>Event</OutreachTh>
                <OutreachTh>Detail</OutreachTh>
              </tr>
            </thead>
            <tbody>
              {prospect.events.map((event) => (
                <OutreachTr key={event.id}>
                  <OutreachTd className="whitespace-nowrap text-xs text-muted">{formatDateTime(event.createdAt)}</OutreachTd>
                  <OutreachTd>
                    <OutreachPill tone="quiet">{event.type}</OutreachPill>
                  </OutreachTd>
                  <OutreachTd className="text-xs text-muted">
                    {event.summary ?? "—"}
                    {event.metadata ? <span className="mt-1 block break-words opacity-70">{JSON.stringify(event.metadata).slice(0, 260)}</span> : null}
                  </OutreachTd>
                </OutreachTr>
              ))}
            </tbody>
          </OutreachTable>
        )}
        {sentMessages.length === 0 ? (
          <p className="mt-4 text-xs text-muted">No message has been delivered to this prospect yet.</p>
        ) : null}
      </OutreachPanel>
    </div>
  );
}
