"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Trash2 } from "lucide-react";
import type { AcademyActionState } from "@/components/courses/AcademyActionForm";
import { cn } from "@/lib/utils";

/**
 * Removal is a separate form on purpose: it must never become the browser's
 * default submit button when an administrator presses Enter inside the preview
 * URL/title fields.
 */
export function AcademyRemovePreviewForm({
  action,
  courseId,
}: {
  action: (state: AcademyActionState, formData: FormData) => Promise<AcademyActionState>;
  courseId: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-4 sm:px-5"
    >
      <input type="hidden" name="id" value={courseId} />
      <p className="max-w-2xl text-xs leading-6 text-muted">
        Removing the preview clears the video, title, duration, and custom poster. The course
        itself is not deleted.
      </p>
      <div className="flex flex-wrap items-center gap-3" aria-live="polite">
        {state ? (
          <span
            role="status"
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-semibold",
              state.ok ? "text-emerald-500" : "text-rose-400",
            )}
          >
            {state.ok ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <AlertCircle className="size-3.5" />
            )}
            {state.message}
          </span>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-muted transition hover:border-rose-400/50 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none"
        >
          {pending ? (
            <LoaderCircle className="size-3.5 motion-safe:animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
          {pending ? "Removing…" : "Remove preview"}
        </button>
      </div>
    </form>
  );
}
