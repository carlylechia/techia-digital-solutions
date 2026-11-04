"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { draftAdminEmailAction } from "@/app/[locale]/admin/crm/actions";
import type { Locale } from "@/content/site";

export type AiEmailDraft = {
  subject: string;
  body: string;
  model: string;
  /** Present only for a reply draft, so the caller can log the received email. */
  inboundBody?: string;
};

/**
 * Shared AI drafting block.
 *
 * It takes plain context and hands the result back to the caller. The caller
 * owns the actual form fields, which keeps the assistant usable in the CRM, in
 * request drawers and in the AI lead form without duplicating state.
 */
export function AiEmailAssistant({
  locale,
  contactName,
  contactEmail,
  companyName,
  clientName,
  context,
  defaultInstruction,
  inboundSubject,
  history,
  onDraft,
  compact = false,
}: {
  locale: Locale;
  contactName?: string | null;
  contactEmail?: string | null;
  companyName?: string | null;
  clientName?: string | null;
  context?: string | null;
  defaultInstruction?: string;
  inboundSubject?: string;
  history?: Array<{ direction: string; subject?: string | null; body: string; sentAt?: string | null }>;
  onDraft: (draft: AiEmailDraft) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState(defaultInstruction ?? "");
  const [inbound, setInbound] = useState("");
  const [pendingMode, setPendingMode] = useState<"new" | "reply" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);

  async function generate(mode: "new" | "reply") {
    if (mode === "reply" && inbound.trim().length < 10 && !context?.trim()) {
      setError("Paste the received email first, then generate a reply.");
      return;
    }
    setPendingMode(mode);
    setError(null);
    try {
      const result = await draftAdminEmailAction({
        locale,
        mode,
        contactName: contactName ?? undefined,
        contactEmail: contactEmail ?? undefined,
        companyName: companyName ?? undefined,
        clientName: clientName ?? undefined,
        context: context ?? undefined,
        instruction: instruction || undefined,
        inboundBody: mode === "reply" ? inbound : undefined,
        inboundSubject: mode === "reply" ? inboundSubject : undefined,
        history,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setModel(result.model);
      onDraft({
        subject: result.subject,
        body: result.body,
        model: result.model,
        inboundBody: mode === "reply" ? inbound : undefined,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The AI draft could not be generated.");
    } finally {
      setPendingMode(null);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-fit items-center gap-2 rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent/20"
      >
        <Sparkles className="size-3.5" />
        Draft with AI
      </button>
    );
  }

  return (
    <div className="grid gap-2 rounded-xl border border-accent/20 bg-accent/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
          <Sparkles className="size-3.5" />
          AI email assistant
        </p>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted hover:text-primary">
          Hide
        </button>
      </div>

      <textarea
        value={inbound}
        onChange={(event) => setInbound(event.target.value)}
        rows={compact ? 3 : 4}
        className="form-input text-sm"
        placeholder="Optional: paste the email you received. The assistant will write a reply that answers it."
      />

      <input
        value={instruction}
        onChange={(event) => setInstruction(event.target.value)}
        className="form-input text-sm"
        placeholder="Optional instruction, e.g. suggest a discovery call next week"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void generate("new")}
          disabled={pendingMode !== null}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-primary transition hover:border-accent/40 disabled:opacity-60"
        >
          {pendingMode === "new" ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
          Draft message
        </button>
        <button
          type="button"
          onClick={() => void generate("reply")}
          disabled={pendingMode !== null || inbound.trim().length < 10}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-[#001018] transition hover:opacity-90 disabled:opacity-50"
        >
          {pendingMode === "reply" ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          Draft reply
        </button>
        {model ? <span className="text-[11px] text-muted">via {model}</span> : null}
      </div>

      <p className="text-[11px] leading-5 text-muted">
        AI drafts can be wrong. Review every fact, name and promise before sending.
      </p>

      {error ? <p className="rounded-lg bg-red-500/10 px-2.5 py-2 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
