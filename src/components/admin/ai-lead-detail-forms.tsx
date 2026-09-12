"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  convertAILeadToClientAction,
  sendAILeadEmailAction,
  updateAILeadStatusAction,
} from "@/app/[locale]/admin/actions";
import type { Locale } from "@/content/site";

const AI_LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED", "CONVERTED"] as const;
type AILeadStatus = (typeof AI_LEAD_STATUSES)[number];

const STATUS_LABELS: Record<AILeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  CLOSED: "Closed",
  CONVERTED: "Converted to Client",
};

// ── Status Form ───────────────────────────────────────────────────────────────

export function AILeadStatusForm({
  leadId,
  currentStatus,
  locale,
}: {
  leadId: string;
  currentStatus: string;
  locale: Locale;
}) {
  const [state, action, pending] = useActionState(updateAILeadStatusAction, null);
  const [selected, setSelected] = useState(currentStatus);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="id" value={leadId} />

      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
        Status
        <select
          name="status"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none"
        >
          {AI_LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={pending || selected === currentStatus}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
      >
        {pending ? "Saving…" : "Update Status"}
      </button>

      {state?.success === false && (
        <p className="w-full rounded-lg bg-red-500/10 p-2 text-xs text-red-400">{state.error}</p>
      )}
      {state?.success === true && (
        <p className="w-full rounded-lg bg-green-500/10 p-2 text-xs text-green-400">
          Status updated.
        </p>
      )}
    </form>
  );
}

// ── Email Form ────────────────────────────────────────────────────────────────

export function AILeadEmailForm({
  leadId,
  toEmail,
  leadName,
  locale,
}: {
  leadId: string;
  toEmail: string;
  leadName?: string | null;
  locale: Locale;
}) {
  const [state, action, pending] = useActionState(sendAILeadEmailAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  const defaultSubject = leadName
    ? `Following up — ${leadName}`
    : "Following up on your AI consultation";

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="leadId" value={leadId} />

      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
        To
        <input
          name="to"
          type="email"
          defaultValue={toEmail}
          required
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
        Subject
        <input
          name="subject"
          type="text"
          defaultValue={defaultSubject}
          required
          maxLength={180}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
        Message
        <textarea
          name="body"
          required
          rows={6}
          maxLength={10_000}
          placeholder={`Hi ${leadName ?? "there"},\n\nThank you for your interest in our services…`}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none resize-y"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50 self-start"
      >
        {pending ? "Sending…" : "Send Email"}
      </button>

      {state?.success === false && (
        <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{state.error}</p>
      )}
      {state?.success === true && (
        <p className="rounded-lg bg-green-500/10 p-3 text-sm text-green-400">
          Email sent successfully. Lead status set to Contacted.
        </p>
      )}
    </form>
  );
}

// ── Convert to Client Form ────────────────────────────────────────────────────

export function AILeadConvertForm({
  lead,
  locale,
}: {
  lead: {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    companyName?: string | null;
    status: string;
  };
  locale: Locale;
}) {
  const [state, action, pending] = useActionState(convertAILeadToClientAction, null);
  const [open, setOpen] = useState(false);

  const alreadyConverted = lead.status === "CONVERTED" || state?.success;

  if (alreadyConverted) {
    return (
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
        <p className="text-sm font-semibold text-green-400">
          ✓ This lead has been converted to a client.
        </p>
        {state?.clientId && (
          <Link
            href="/admin"
            className="mt-2 inline-block text-xs text-accent hover:underline"
          >
            View in Admin →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/20"
        >
          Convert to Client
        </button>
      ) : (
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="leadId" value={lead.id} />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Full Name *
              <input
                name="name"
                type="text"
                defaultValue={lead.name ?? ""}
                required
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Email
              <input
                name="email"
                type="email"
                defaultValue={lead.email ?? ""}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Phone
              <input
                name="phone"
                type="text"
                defaultValue={lead.phone ?? ""}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
              WhatsApp
              <input
                name="whatsapp"
                type="text"
                placeholder="+1234567890"
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Company
              <input
                name="company"
                type="text"
                defaultValue={lead.companyName ?? ""}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Country
              <input
                name="country"
                type="text"
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Internal Notes
            <textarea
              name="notes"
              rows={3}
              placeholder="Add any notes about this client…"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none resize-y"
            />
          </label>

          {state?.success === false && (
            <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{state.error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            >
              {pending ? "Converting…" : "Confirm & Convert"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
