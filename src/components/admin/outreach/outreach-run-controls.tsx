"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  runOutreachCampaignNow,
  runOutreachCampaignTest,
  stopOutreachCampaignRun,
  type OutreachRunActionResult,
} from "@/app/[locale]/admin/outreach/actions";
import { OutreachButton } from "./outreach-ui";

/**
 * Run Now, Test Run and the latest-run summary for one campaign.
 *
 * Both actions call server actions, which re-read the admin session and the
 * campaign from PostgreSQL, so a permission revoked after page load cannot still
 * perform a run. Hiding or disabling a control here is a convenience only.
 *
 * The buttons are also disabled while a run is in flight, but that is not the
 * protection: a second click is refused by the database lock inside the action,
 * so a double click cannot execute the campaign twice even if this UI is bypassed.
 */

type RunState =
  | { kind: "idle" }
  | { kind: "busy"; mode: "NOW" | "TEST" }
  | { kind: "done"; result: Extract<OutreachRunActionResult, { ok: true }> }
  | { kind: "error"; message: string };

const STATUS_TONE: Record<string, string> = {
  COMPLETED: "text-emerald-300",
  PARTIAL: "text-amber-300",
  FAILED: "text-red-300",
  CANCELLED: "text-muted",
  RUNNING: "text-accent",
};

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: "completed",
  PARTIAL: "partial",
  FAILED: "failed",
  CANCELLED: "cancelled",
  RUNNING: "running",
};

export function OutreachRunControls({
  campaignId,
  canManage,
  canSend,
  campaignActive,
  runInProgress,
}: {
  campaignId: string;
  canManage: boolean;
  canSend: boolean;
  campaignActive: boolean;
  runInProgress: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<RunState>({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  // A Test Run is a real pipeline execution that spends AI tokens and makes
  // outbound discovery calls, so it is confirmed before it starts. Run Now is
  // confirmed too, because it can deliver approved email immediately.
  function confirmAndRun(mode: "NOW" | "TEST") {
    const isTest = mode === "TEST";
    const message = isTest
      ? `Run a test on "${campaignId}"?\n\nThis exercises discovery, enrichment, assessment and draft generation on a small batch. No email can be sent: messages stay as internal drafts and no send is queued.`
      : `Run this campaign now?\n\nDue work will run immediately, within the campaign's existing daily limits. Approved messages inside the sending window may be delivered.`;
    if (typeof window !== "undefined" && !window.confirm(message)) return;

    setState({ kind: "busy", mode });
    startTransition(async () => {
      const result = isTest
        ? await runOutreachCampaignTest({ campaignId })
        : await runOutreachCampaignNow({ campaignId });

      if (result.ok) {
        setState({ kind: "done", result });
        router.refresh();
      } else {
        setState({ kind: "error", message: result.error });
      }
    });
  }

  const busy = pending || state.kind === "busy";
  const locked = busy || runInProgress;

  function stopRun() {
    if (typeof window !== "undefined" && !window.confirm("Stop the current run? This will cancel all pending jobs and messages.")) return;
    setState({ kind: "idle" });
    startTransition(async () => {
      const result = await stopOutreachCampaignRun({ campaignId });
      if (result.ok) {
        setState({ kind: "idle" });
        router.refresh();
      } else {
        setState({ kind: "error", message: result.error });
      }
    });
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <OutreachButton
          type="button"
          tone="good"
          disabled={locked || !canSend || !campaignActive}
          onClick={() => confirmAndRun("NOW")}
        >
          {state.kind === "busy" && state.mode === "NOW" ? "Running…" : "Run Now"}
        </OutreachButton>

        <OutreachButton
          type="button"
          disabled={locked || !canManage}
          onClick={() => confirmAndRun("TEST")}
        >
          {state.kind === "busy" && state.mode === "TEST" ? "Testing…" : "Test Run"}
        </OutreachButton>

        {runInProgress ? (
          <OutreachButton
            type="button"
            tone="danger"
            disabled={busy || !canSend}
            onClick={stopRun}
          >
            ⏹ Stop Run
          </OutreachButton>
        ) : null}

        {runInProgress && !busy ? (
          <span className="text-xs text-accent">A run is already in progress for this campaign.</span>
        ) : null}
        {!canSend && !canManage ? <span className="text-xs text-muted">Requires an outreach permission.</span> : null}
      </div>

      <p className="text-xs leading-6 text-muted">
        Run Now processes the work that is already due, inside a bounded batch, and cannot exceed the campaign&apos;s
        existing daily discovery or send limits. Test Run uses the same pipeline but sending is impossible: any message
        it produces stays an internal draft and no send is ever queued.
      </p>

      {state.kind === "done" ? <RunResultBanner result={state.result} /> : null}
      {state.kind === "error" ? (
        <p role="alert" className="text-xs text-red-300">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

function RunResultBanner({ result }: { result: Extract<OutreachRunActionResult, { ok: true }> }) {
  const { run } = result;
  const tone = STATUS_TONE[run.status] ?? "text-muted";
  const seconds = (run.durationMs / 1000).toFixed(1);

  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2" role="status">
      <p className="text-xs">
        <span className="font-semibold capitalize text-primary">{run.trigger === "TEST" ? "Test run" : "Run"}</span>{" "}
        <span className={`font-semibold ${tone}`}>{STATUS_LABEL[run.status] ?? run.status.toLowerCase()}</span>{" "}
        <span className="text-muted">in {seconds}s</span>
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        <li>discovered: <span className="tabular-nums text-primary">{run.counts.discovered ?? 0}</span></li>
        <li>processed: <span className="tabular-nums text-primary">{run.counts.processed ?? 0}</span></li>
        <li>qualified: <span className="tabular-nums text-primary">{run.counts.qualified ?? 0}</span></li>
        <li>drafts: <span className="tabular-nums text-primary">{run.counts.draftsGenerated ?? 0}</span></li>
        <li>
          sent:{" "}
          <span className={`tabular-nums ${run.counts.emailsSent ? "text-emerald-300" : "text-muted"}`}>
            {run.counts.emailsSent ?? 0}
          </span>
        </li>
        {run.counts.failed ? (
          <li>failed: <span className="tabular-nums text-red-300">{run.counts.failed}</span></li>
        ) : null}
      </ul>
      <p className="mt-2 text-[11px] leading-5 text-muted">{run.summary}</p>
    </div>
  );
}
