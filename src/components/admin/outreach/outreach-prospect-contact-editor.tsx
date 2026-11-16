"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOutreachProspect } from "@/app/[locale]/admin/outreach/actions";
import { OutreachButton, OutreachField, outreachInputClass } from "./outreach-ui";

export function OutreachProspectContactEditor({
  prospectId,
  initial,
}: {
  prospectId: string;
  initial: {
    publicEmail: string | null;
    publicPhone: string | null;
    contactName: string | null;
    contactRole: string | null;
    websiteUrl: string | null;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [publicEmail, setPublicEmail] = useState(initial.publicEmail ?? "");
  const [publicPhone, setPublicPhone] = useState(initial.publicPhone ?? "");
  const [contactName, setContactName] = useState(initial.contactName ?? "");
  const [contactRole, setContactRole] = useState(initial.contactRole ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initial.websiteUrl ?? "");

  function save() {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateOutreachProspect({
        id: prospectId,
        publicEmail,
        publicPhone,
        contactName,
        contactRole,
        websiteUrl,
      });
      setFeedback(result.ok ? result.message : result.error);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-background p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Contact information</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <OutreachField label="Contact name">
          <input className={outreachInputClass} value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </OutreachField>
        <OutreachField label="Contact role">
          <input className={outreachInputClass} value={contactRole} onChange={(e) => setContactRole(e.target.value)} />
        </OutreachField>
        <OutreachField label="Email">
          <input type="email" className={outreachInputClass} value={publicEmail} onChange={(e) => setPublicEmail(e.target.value)} />
        </OutreachField>
        <OutreachField label="Phone / WhatsApp">
          <input className={outreachInputClass} value={publicPhone} onChange={(e) => setPublicPhone(e.target.value)} />
        </OutreachField>
        <OutreachField label="Website">
          <input type="url" className={outreachInputClass} value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
        </OutreachField>
      </div>
      <OutreachButton type="button" tone="good" disabled={pending} onClick={save}>
        {pending ? "Saving…" : "Save contact info"}
      </OutreachButton>
      {feedback ? <p className="text-xs text-muted">{feedback}</p> : null}
    </div>
  );
}