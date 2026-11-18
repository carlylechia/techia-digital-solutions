"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { reviewOutreachMessage, translateOutreachMessage, setOutreachProspectStatus, instantSendOutreachMessage, regenerateOutreachMessage } from "@/app/[locale]/admin/outreach/actions";
import { OUTREACH_SERVICE_LABELS } from "@/lib/outreach/constants";
import { OutreachButton, OutreachField, OutreachPill, outreachInputClass } from "./outreach-ui";
import { ProfessionalLoader } from "@/components/ui/professional-loader";

/**
 * Human review queue.
 *
 * Nothing is sent from this screen without an explicit click. The queue is the
 * approval gate for SEMI_AUTOMATIC campaigns, which is the default mode.
 */

export type ReviewItem = {
  messageId: string;
  subject: string;
  bodyText: string;
  type: string;
  status: string;
  createdAt: string;
  prospect: {
    id: string;
    businessName: string;
    city: string | null;
    country: string | null;
    industry: string | null;
    opportunityScore: number;
    publicEmail: string | null;
    websiteUrl: string | null;
    recommendedServices: string[];
    aiSummary: string | null;
    status: string;
  };
};

export function OutreachReviewQueue({
  items,
  canManage,
  readOnly = false,
}: {
  items: ReviewItem[];
  canManage: boolean;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, { subject: string; bodyText: string }>>({});
  const [translating, setTranslating] = useState<Record<string, boolean>>({});

  async function translate(messageId: string, targetLanguage: "French" | "English") {
    setTranslating((current) => ({ ...current, [messageId]: true }));
    setFeedback((current) => {
      const next = { ...current };
      delete next[messageId];
      return next;
    });
    const result = await translateOutreachMessage({ messageId, targetLanguage });
    if (result.ok) {
      setEditing((current) => ({
        ...current,
        [messageId]: { subject: result.subject, bodyText: result.body },
      }));
      setFeedback((current) => ({ ...current, [messageId]: result.message }));
    } else {
      setFeedback((current) => ({ ...current, [messageId]: result.error }));
    }
    setTranslating((current) => ({ ...current, [messageId]: false }));
  }

  async function regenerate(messageId: string) {
    setFeedback((current) => {
      const next = { ...current };
      delete next[messageId];
      return next;
    });
    startTransition(async () => {
      const result = await regenerateOutreachMessage({ messageId });
      setFeedback((current) => ({ ...current, [messageId]: result.ok ? result.message : result.error }));
      if (result.ok) router.refresh();
    });
  }

  function act(
    messageId: string,
    action: "APPROVE" | "REJECT" | "EDIT" | "PAUSE_PROSPECT",
    overrides?: { subject?: string; bodyText?: string }
  ) {
    setFeedback((current) => {
      const next = { ...current };
      delete next[messageId];
      return next;
    });
    startTransition(async () => {
      const result = await reviewOutreachMessage({ messageId, action, ...overrides });
      setFeedback((current) => ({ ...current, [messageId]: result.ok ? result.message : result.error }));
      if (result.ok) router.refresh();
    });
  }

  async function unhide(messageId: string, prospectId: string) {
    setFeedback((current) => {
      const next = { ...current };
      delete next[messageId];
      return next;
    });
    startTransition(async () => {
      const result = await setOutreachProspectStatus({ prospectId, status: "QUALIFIED", reason: "Unhidden from review queue by an administrator." });
      setFeedback((current) => ({ ...current, [messageId]: result.ok ? "Draft unhidden. Refreshing…" : result.error }));
      if (result.ok) router.refresh();
    });
  }

  async function sendNow(messageId: string, prospectId: string) {
    setFeedback((current) => {
      const next = { ...current };
      delete next[messageId];
      return next;
    });
    startTransition(async () => {
      const result = await instantSendOutreachMessage({ prospectId, messageId });
      setFeedback((current) => ({ ...current, [messageId]: result.ok ? result.message : result.error }));
      if (result.ok) router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-background p-6 text-center">
        <p className="text-sm font-semibold text-primary">
          {readOnly ? "No hidden drafts" : "Nothing is waiting for approval"}
        </p>
        <p className="mt-2 text-sm text-muted">
          {readOnly
            ? "Every generated draft currently belongs to a prospect that is still reviewable. Hidden drafts will appear here if a prospect is disqualified or paused after a message was generated."
            : "When the pipeline generates a message for a qualified prospect it will appear here for a person to approve, edit or reject."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <ul className="grid gap-4">
        {items.map((item) => {
        const draft = editing[item.messageId];
        const subject = draft?.subject ?? item.subject;
        const bodyText = draft?.bodyText ?? item.bodyText;
        const dirty = Boolean(draft) && (draft.subject !== item.subject || draft.bodyText !== item.bodyText);

        return (
          <li key={item.messageId} className="subtle-tile grid gap-4 rounded-[1.25rem] p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/admin/outreach/prospects/${item.prospect.id}`}
                  className="text-sm font-semibold text-primary hover:text-accent"
                >
                  {item.prospect.businessName}
                </Link>
                <p className="text-xs text-muted">
                  {[item.prospect.city, item.prospect.country].filter(Boolean).join(", ") || "Location unknown"} ·{" "}
                  {item.prospect.industry ?? "industry unknown"} · score {item.prospect.opportunityScore}/100
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <OutreachPill tone="quiet">{item.type.replace("_", " ")}</OutreachPill>
                  {item.prospect.recommendedServices.slice(0, 3).map((service) => (
                    <OutreachPill key={service} tone="default">
                      {OUTREACH_SERVICE_LABELS[service] ?? service}
                    </OutreachPill>
                  ))}
                </div>
              </div>
              <div className="text-right text-xs text-muted">
                <p className="font-semibold text-primary">{item.prospect.publicEmail ?? "No published email"}</p>
                {item.prospect.websiteUrl ? (
                  <a
                    href={item.prospect.websiteUrl}
                    target="_blank"
                    rel="noreferrer nofollow noopener"
                    className="text-accent hover:underline"
                  >
                    View website
                  </a>
                ) : null}
              </div>
            </div>

            {item.prospect.aiSummary ? (
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Evidence used</p>
                <p className="mt-1.5 text-sm leading-6 text-muted">{item.prospect.aiSummary}</p>
              </div>
            ) : null}

            <div className="grid gap-3">
              <OutreachField label="Subject">
                <input
                  className={outreachInputClass}
                  value={subject}
                  disabled={readOnly || !canManage || pending}
                  maxLength={180}
                  onChange={(event) =>
                    setEditing((current) => ({
                      ...current,
                      [item.messageId]: { subject: event.target.value, bodyText: current[item.messageId]?.bodyText ?? item.bodyText },
                    }))
                  }
                />
              </OutreachField>
              <OutreachField label="Email body" hint="Plain text. The HTML version is escaped when sent, so markup here is never executed.">
                <textarea
                  className={`${outreachInputClass} min-h-44`}
                  value={bodyText}
                  disabled={readOnly || !canManage || pending}
                  maxLength={4000}
                  onChange={(event) =>
                    setEditing((current) => ({
                      ...current,
                      [item.messageId]: { subject: current[item.messageId]?.subject ?? item.subject, bodyText: event.target.value },
                    }))
                  }
                />
              </OutreachField>
            </div>

            <div className="flex flex-wrap gap-2">
              {readOnly ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    Read-only: this draft is hidden because the prospect is currently {item.prospect.status.replace(/_/g, " ")}.
                  </p>
                  <OutreachButton type="button" tone="quiet" disabled={pending || !canManage} onClick={() => void unhide(item.messageId, item.prospect.id)}>
                    Unhide draft
                  </OutreachButton>
                  <OutreachButton type="button" tone="quiet" disabled={pending || !canManage} onClick={() => void regenerate(item.messageId)}>
                    Regenerate
                  </OutreachButton>
                  <OutreachButton type="button" tone="good" disabled={pending || !canManage} onClick={() => void sendNow(item.messageId, item.prospect.id)}>
                    Send now
                  </OutreachButton>
                </div>
              ) : (
                <>
                  {dirty ? (
                    <OutreachButton
                      type="button"
                      tone="quiet"
                      disabled={pending || !canManage}
                      onClick={() => act(item.messageId, "EDIT", { subject, bodyText })}
                    >
                      Save edits
                    </OutreachButton>
                  ) : null}
                  <OutreachButton
                    type="button"
                    tone="quiet"
                    disabled={pending || !canManage || translating[item.messageId]}
                    onClick={() => void translate(item.messageId, "French")}
                  >
                    {translating[item.messageId] ? "Translating…" : "Translate to French"}
                  </OutreachButton>
                  <OutreachButton type="button" tone="good" disabled={pending || !canManage} onClick={() => act(item.messageId, "APPROVE")}>
                    Approve and queue
                  </OutreachButton>
                  <OutreachButton type="button" tone="danger" disabled={pending || !canManage} onClick={() => act(item.messageId, "REJECT")}>
                    Reject
                  </OutreachButton>
                  <OutreachButton type="button" tone="warn" disabled={pending || !canManage} onClick={() => act(item.messageId, "PAUSE_PROSPECT")}>
                    Pause prospect
                  </OutreachButton>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <OutreachButton type="button" tone="quiet" disabled={pending || !canManage} onClick={() => void regenerate(item.messageId)}>
                Regenerate
              </OutreachButton>
              <OutreachButton type="button" tone="good" disabled={pending || !canManage} onClick={() => void sendNow(item.messageId, item.prospect.id)}>
                Send now
              </OutreachButton>
            </div>
            {feedback[item.messageId] ? <p className="text-xs text-muted">{feedback[item.messageId]}</p> : null}
          </li>
        );
      })}
      </ul>
      {pending ? <ProfessionalLoader variant="overlay" label="Processing…" /> : null}
    </div>
  );
}
