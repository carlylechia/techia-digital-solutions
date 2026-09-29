"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteOutreachCampaign, setOutreachCampaignStatus } from "@/app/[locale]/admin/outreach/actions";
import { OutreachButton } from "./outreach-ui";

/**
 * Campaign archive and delete actions.
 *
 * Archive is available to any manager. Delete requires the send permission
 * and is only available for non-active campaigns.
 */
export function OutreachCampaignActions({
  campaignId,
  status,
  canManage,
  canSend,
}: {
  campaignId: string;
  status: string;
  canManage: boolean;
  canSend: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  function archive() {
    setFeedback(null);
    startTransition(async () => {
      const result = await setOutreachCampaignStatus({ campaignId, status: "ARCHIVED" });
      setFeedback(result.ok ? result.message : result.error);
      if (result.ok) router.refresh();
    });
  }

  function remove() {
    setFeedback(null);
    startTransition(async () => {
      const result = await deleteOutreachCampaign({ campaignId });
      setFeedback(result.ok ? result.message : result.error);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {canManage && status !== "ARCHIVED" ? (
          <OutreachButton type="button" tone="quiet" disabled={pending} onClick={archive}>
            Archive
          </OutreachButton>
        ) : null}
        {canSend && status !== "ACTIVE" ? (
          <OutreachButton type="button" tone="danger" disabled={pending} onClick={() => setConfirmDelete(true)}>
            Delete
          </OutreachButton>
        ) : null}
      </div>

      {confirmDelete ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-xs text-red-200">
            Delete this campaign and all its prospects, messages, events and jobs? This cannot be undone.
          </p>
          <div className="mt-2 flex gap-2">
            <OutreachButton type="button" tone="danger" disabled={pending} onClick={remove}>
              Confirm delete
            </OutreachButton>
            <OutreachButton type="button" tone="quiet" disabled={pending} onClick={() => setConfirmDelete(false)}>
              Cancel
            </OutreachButton>
          </div>
        </div>
      ) : null}

      {feedback ? <p className="text-xs text-muted">{feedback}</p> : null}
    </div>
  );
}
