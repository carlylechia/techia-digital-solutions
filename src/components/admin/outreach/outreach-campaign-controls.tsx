"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelOutreachCampaignJobs, setOutreachCampaignStatus, triggerOutreachDiscovery } from "@/app/[locale]/admin/outreach/actions";
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

      {!sendingEnabled ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Global sending is disabled, so no message from this campaign can be delivered regardless of approval state.
        </p>
      ) : null}

      {feedback ? <p className="text-xs text-muted">{feedback}</p> : null}
    </div>
  );
}
