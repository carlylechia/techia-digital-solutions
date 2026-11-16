"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importOutreachProspectToCrmAction } from "@/app/[locale]/admin/crm/actions";
import { OutreachButton } from "./outreach-ui";

export function ImportProspectToCrmButton({
  prospectId,
  locale,
  alreadyImported = false,
  graduated = false,
}: {
  prospectId: string;
  locale: string;
  alreadyImported?: boolean;
  graduated?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [added, setAdded] = useState(alreadyImported);

  function handleImport() {
    setFeedback(null);
    startTransition(async () => {
      const result = await importOutreachProspectToCrmAction({ prospectId, locale: locale as "en" | "fr" });
      if (result?.success) {
        setFeedback(result.message ?? "Added to the CRM prospect list.");
        setAdded(true);
        router.refresh();
      } else {
        setFeedback(result?.error ?? "Failed to add the prospect to the CRM.");
      }
    });
  }

  return (
    <div className="grid gap-2">
      <OutreachButton
        type="button"
        tone={graduated || added ? "quiet" : "good"}
        disabled={pending || graduated || added}
        onClick={handleImport}
      >
        {pending ? "Adding…" : graduated ? "Already a client" : added ? "In CRM prospect list" : "Add to CRM"}
      </OutreachButton>
      {feedback ? <p className="text-xs text-emerald-300">{feedback}</p> : null}
      {graduated || added ? (
        <a href={`/${locale}/admin/crm`} className="text-xs font-semibold text-accent underline">
          Open CRM
        </a>
      ) : null}
    </div>
  );
}
