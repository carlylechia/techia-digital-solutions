"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  enqueueOutreachProspectJob,
  recordOutreachReply,
  setOutreachProspectStatus,
  unsubscribeOutreachProspect,
  updateOutreachProspect,
} from "@/app/[locale]/admin/outreach/actions";
import { OUTREACH_PROSPECT_STATUSES, OUTREACH_STATUS_LABELS } from "@/lib/outreach/constants";
import { OutreachButton, OutreachField, outreachInputClass } from "./outreach-ui";

/**
 * Prospect actions.
 *
 * Status changes go through server actions that re-verify `outreach.manage` on
 * every call, so a stale page cannot bypass the permission check.
 */
export function OutreachProspectActions({
  prospectId,
  currentStatus,
  hasEmail,
  canManage,
}: {
  prospectId: string;
  currentStatus: string;
  hasEmail: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replySubject, setReplySubject] = useState("");

  function run(action: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>) {
    setFeedback(null);
    startTransition(async () => {
      const result = await action();
      setFeedback(result.ok ? result.message : result.error);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
      {/* Primary action: Instant AI Assessment */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
        <OutreachButton
          type="button"
          disabled={pending || !canManage}
          onClick={() => run(() => enqueueOutreachProspectJob({ prospectId, step: "ASSESS" }))}
          className="px-4 py-2.5 text-base"
        >
          ⚡ Instant AI Assessment
        </OutreachButton>
        <p className="text-xs text-muted">
          Runs AI analysis immediately to evaluate this prospect&apos;s digital presence and qualification.
        </p>
      </div>

      {/* Secondary actions */}
      <div className="flex flex-wrap gap-2">
        <OutreachButton
          type="button"
          disabled={pending || !canManage}
          onClick={() => run(() => enqueueOutreachProspectJob({ prospectId, step: "ENRICH" }))}
        >
          Re-enrich
        </OutreachButton>
        <OutreachButton
          type="button"
          tone="good"
          disabled={pending || !canManage || !hasEmail}
          onClick={() => run(() => enqueueOutreachProspectJob({ prospectId, step: "GENERATE_EMAIL" }))}
        >
          ✉️ Generate Message
        </OutreachButton>
        <OutreachButton
          type="button"
          tone="quiet"
          disabled={pending || !canManage || currentStatus === "QUALIFIED"}
          onClick={() => run(() => setOutreachProspectStatus({ prospectId, status: "QUALIFIED" }))}
        >
          ✓ Qualify
        </OutreachButton>
        <OutreachButton
          type="button"
          tone="danger"
          disabled={pending || !canManage || !hasEmail}
          onClick={() => run(() => unsubscribeOutreachProspect({ prospectId }))}
        >
          Suppress and unsubscribe
        </OutreachButton>
        <OutreachButton type="button" tone="quiet" disabled={pending || !canManage} onClick={() => setReplyOpen((open) => !open)}>
          {replyOpen ? "Hide reply box" : "Record a reply"}
        </OutreachButton>
      </div>

      {/* Status change buttons */}
      <div className="flex flex-wrap gap-2">
        {(["INTERESTED", "MEETING_BOOKED", "PROPOSAL", "WON", "LOST", "PAUSED"] as const).map((status) => (
          <OutreachButton
            key={status}
            type="button"
            tone={status === "WON" || status === "INTERESTED" ? "good" : status === "LOST" || status === "PAUSED" ? "danger" : "quiet"}
            disabled={pending || !canManage || currentStatus === status}
            onClick={() => run(() => setOutreachProspectStatus({ prospectId, status }))}
          >
            Mark {OUTREACH_STATUS_LABELS[status] ?? status}
          </OutreachButton>
        ))}
      </div>

      {replyOpen ? (
        <div className="grid gap-3 rounded-lg border border-border bg-background p-3">
          <OutreachField label="Inbound subject">
            <input className={outreachInputClass} value={replySubject} onChange={(event) => setReplySubject(event.target.value)} maxLength={300} />
          </OutreachField>
          <OutreachField label="Inbound body" hint="The reply pipeline classifies this and stops automation when required.">
            <textarea
              className={`${outreachInputClass} min-h-28`}
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              maxLength={20000}
            />
          </OutreachField>
          <OutreachButton
            type="button"
            disabled={pending || replyBody.trim().length === 0}
            onClick={() =>
              run(async () => {
                const result = await recordOutreachReply({ prospectId, subject: replySubject, body: replyBody });
                if (result.ok) {
                  setReplyBody("");
                  setReplySubject("");
                }
                return result;
              })
            }
          >
            Queue reply for classification
          </OutreachButton>
        </div>
      ) : null}

      <div className="grid gap-3 rounded-lg border border-border bg-background p-3">
        <OutreachField label="Add a note" hint="Stored as an immutable MANUAL_NOTE event.">
          <textarea
            className={`${outreachInputClass} min-h-20`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={2000}
            placeholder="Called the owner on Monday, asked for a callback Thursday."
          />
        </OutreachField>
        <OutreachButton
          type="button"
          tone="quiet"
          disabled={pending || !canManage || note.trim().length === 0}
          onClick={() =>
            run(async () => {
              const result = await updateOutreachProspect({ id: prospectId, note });
              if (result.ok) setNote("");
              return result;
            })
          }
        >
          Save note
        </OutreachButton>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Set status:</span>
        <select
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          value={currentStatus}
          disabled={pending || !canManage}
          onChange={(event) => run(() => setOutreachProspectStatus({ prospectId, status: event.target.value }))}
        >
          {OUTREACH_PROSPECT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {OUTREACH_STATUS_LABELS[value] ?? value}
            </option>
          ))}
        </select>
      </div>

      {feedback ? <p className="text-xs text-muted">{feedback}</p> : null}
    </div>
  );
}
