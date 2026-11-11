"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AcademyActionState = { ok: boolean; message: string; ts: number } | null;

/**
 * Form shell for the academy admin server-action forms. Wraps the server-rendered
 * fields in a client form so saving gets real UX feedback:
 *
 * - the submit button reacts immediately (spinner + disabled while pending),
 * - a success banner confirms the save (and remounts the fields so uncontrolled
 *   inputs pick up the freshly saved server values — the create form clears),
 * - failures render a readable error banner instead of a thrown runtime error,
 *   and keep every value the admin typed so it can be corrected and retried.
 */
export function AcademyActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Saving…",
  helper,
}: {
  action: (state: AcademyActionState, formData: FormData) => Promise<AcademyActionState>;
  children: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  helper?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="elevated-panel grid gap-5 border-t border-border p-5 sm:p-6">
      {/* Remount on success so uncontrolled inputs refresh/clear; never remount
          on failure so the admin's corrections survive. */}
      <div key={state?.ok ? `saved-${state.ts}` : "editing"} className="grid gap-5">
        {children}
      </div>

      <div className="grid gap-3" aria-live="polite">
        {state ? (
          <div
            role="status"
            className={cn(
              "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium",
              state.ok
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/25 bg-red-500/10 text-red-300",
            )}
          >
            {state.ok ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
            )}
            <span>{state.message}</span>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className={cn(
              "btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 transition",
              pending && "cursor-not-allowed opacity-75",
            )}
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {pending ? pendingLabel : submitLabel}
          </button>
          {helper ? <p className="text-xs text-muted">{helper}</p> : null}
        </div>
      </div>
    </form>
  );
}
