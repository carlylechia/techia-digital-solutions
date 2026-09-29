"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelOutreachCampaignJobs, deleteOutreachCampaign, setOutreachCampaignStatus, triggerOutreachDiscovery } from "@/app/[locale]/admin/outreach/actions";
import { OutreachButton } from "./outreach-ui";

/**
 * Campaign controls.
 *
 * Every button calls a server action that re-checks authorization, so hiding a
 * control in the UI is a convenience, never the enforcement.
 */
export function OutreachCampaignControls({
  campaignId,
  status,
  canManage,
  canSend,
  sendingEnabled,
}: {
  campaignId: string;
  status: string;
  canManage: boolean;
  canSend: boolean;
  sendingEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function run(action: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>) {
    setFeedback(null);
    startTransition(async () => {
      const result = await action();
      setFeedback(result.ok ? result.message : result.error);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {status !== "ACTIVE" ? (
          <OutreachButton
            type="button"
            tone="good"
            disabled={pending || !canManage}
            onClick={() => run(() => setOutreachCampaignStatus({ campaignId, status: "ACTIVE" }))}
          >
            Activate campaign
          </OutreachButton>
        ) : (
          <OutreachButton
            type="button"
            tone="warn"
            disabled={pending || !canManage}
            onClick={() => run(() => setOutreachCampaignStatus({ campaignId, status: "PAUSED" }))}
          >
            Pause campaign
          </OutreachButton>
        )}

        <OutreachButton
          type="button"
          disabled={pending || !canManage || status !== "ACTIVE"}
          onClick={() => run(() => triggerOutreachDiscovery({ campaignId }))}
        >
          Run discovery now
        </OutreachButton>

        {status === "ACTIVE" ? (
          <OutreachButton
            type="button"
            tone="danger"
            disabled={pending || !canSend}
            onClick={() => run(() => cancelOutreachCampaignJobs({ campaignId }))}
          >
            Emergency stop sends
          </OutreachButton>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {canManage && status !== "ARCHIVED" ? (
          <OutreachButton
            type="button"
            tone="quiet"
            disabled={pending}
            onClick={() => run(() => setOutreachCampaignStatus({ campaignId, status: "ARCHIVED" }))}
          >
            Archive campaign
          </OutreachButton>
        ) : null}
        {canSend && status !== "ACTIVE" ? (
          <OutreachButton
            type="button"
            tone="danger"
            disabled={pending}
            onClick={() => setConfirmDelete(true)}
          >
            Delete campaign
          </OutreachButton>
        ) : null}
      </div>

      {confirmDelete ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-xs text-red-200">
            Delete this campaign and all its prospects, messages, events and jobs? This cannot be undone.
          </p>
          <div className="mt-2 flex gap-2">
            <OutreachButton
              type="button"
              tone="danger"
              disabled={pending}
              onClick={() => run(() => deleteOutreachCampaign({ campaignId }))}
            >
              Confirm delete
            </OutreachButton>
            <OutreachButton type="button" tone="quiet" disabled={pending} onClick={() => setConfirmDelete(false)}>
              Cancel
            </OutreachButton>
          </div>
        </div>
      ) : null}

      {!sendingEnabled ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Global sending is disabled, so no message from this campaign can be delivered regardless of approval state.
        </p>
      ) : null}

      {feedback ? <p className="text-xs text-muted">{feedback}</p> : null}
    </div>
  );
}
