"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createOutreachSuppression, deleteOutreachSuppression } from "@/app/[locale]/admin/outreach/actions";
import { OUTREACH_SUPPRESSION_REASONS } from "@/lib/outreach/constants";
import { OutreachButton, OutreachField, outreachInputClass } from "./outreach-ui";

/** Suppression management. Both server actions re-check authorization server-side. */
export function OutreachSuppressionForm({ canManage, canSend }: { canManage: boolean; canSend: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [reason, setReason] = useState<string>("MANUAL");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  function submit() {
    setFeedback(null);
    startTransition(async () => {
      const result = await createOutreachSuppression({ email, domain, reason, notes });
      setFeedback(result.ok ? result.message : result.error);
      if (result.ok) {
        setEmail("");
        setDomain("");
        setNotes("");
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <OutreachField label="Email address" hint="Exact address match.">
          <input className={outreachInputClass} value={email} onChange={(event) => setEmail(event.target.value)} maxLength={180} placeholder="hello@example.com" />
        </OutreachField>
        <OutreachField label="Domain" hint="Blocks every address on this domain.">
          <input className={outreachInputClass} value={domain} onChange={(event) => setDomain(event.target.value)} maxLength={120} placeholder="example.com" />
        </OutreachField>
      </div>
      <OutreachField label="Reason">
        <select className={outreachInputClass} value={reason} onChange={(event) => setReason(event.target.value)}>
          {OUTREACH_SUPPRESSION_REASONS.map((value) => (
            <option key={value} value={value}>
              {value.replace(/_/g, " ").toLowerCase()}
            </option>
          ))}
        </select>
      </OutreachField>
      <OutreachField label="Notes">
        <input className={outreachInputClass} value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} />
      </OutreachField>
      <div>
        <OutreachButton type="button" disabled={pending || !canManage} onClick={submit}>
          Add to suppression list
        </OutreachButton>
      </div>
      {feedback ? <p className="text-xs text-muted">{feedback}</p> : null}
      <p className="text-xs text-muted">
        Suppression is checked immediately before every send. Removing an entry requires the send permission, so only a
        senior operator can re-enable a suppressed address.
      </p>
      <span className="sr-only">{canSend ? "You can remove suppression entries." : "You cannot remove suppression entries."}</span>
    </div>
  );
}

export function OutreachSuppressionRemove({ id, canSend }: { id: string; canSend: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <OutreachButton
      type="button"
      tone="danger"
      disabled={pending || !canSend}
      onClick={() =>
        startTransition(async () => {
          await deleteOutreachSuppression({ id });
          router.refresh();
        })
      }
    >
      Remove
    </OutreachButton>
  );
}
