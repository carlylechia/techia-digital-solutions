"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { runOutreachOrchestratorNow } from "@/app/[locale]/admin/outreach/actions";
import { OutreachButton } from "./outreach-ui";

/**
 * Manual orchestrator run.
 *
 * Exists so the daily cycle can be exercised without waiting for the scheduled
 * cron. The action requires the `outreach.send` permission and re-runs exactly
 * the same orchestrator the cron calls, so every limit, approval rule,
 * suppression check and the global kill switch still apply.
 */
export function OutreachRunNow({ canRun }: { canRun: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "good" | "danger"; text: string } | null>(null);

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <OutreachButton
          type="button"
          disabled={pending || !canRun}
          onClick={() =>
            startTransition(async () => {
              setFeedback(null);
              const result = await runOutreachOrchestratorNow();
              setFeedback({ tone: result.ok ? "good" : "danger", text: result.ok ? result.message : result.error });
              if (result.ok) router.refresh();
            })
          }
        >
          {pending ? "Running daily cycle…" : "Run daily cycle now"}
        </OutreachButton>
        {!canRun ? (
          <span className="text-xs text-muted">Requires the outreach send permission.</span>
        ) : null}
      </div>
      <p className="text-xs leading-6 text-muted">
        Processes only work that is already due, within a bounded batch. It cannot send an email that the daily schedule
        would have refused: approvals, daily limits, the sending window, suppression and the global email kill switch are
        all re-checked.
      </p>
      {feedback ? (
        <p
          role="status"
          className={`text-xs ${feedback.tone === "good" ? "text-emerald-300" : "text-red-300"}`}
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
