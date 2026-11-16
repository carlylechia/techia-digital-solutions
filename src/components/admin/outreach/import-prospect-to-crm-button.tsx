"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importOutreachProspectToCrmAction } from "@/app/[locale]/admin/crm/actions";
import { OutreachButton } from "./outreach-ui";

export function ImportProspectToCrmButton({
  prospectId,
  locale,
}: {
  prospectId: string;
  locale: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [importedContactId, setImportedContactId] = useState<string | null>(null);

  function handleImport() {
    setFeedback(null);
    startTransition(async () => {
      const result = await importOutreachProspectToCrmAction({ prospectId, locale: locale as "en" | "fr" });
      if (result?.success) {
        setFeedback("Prospect imported into the CRM.");
        setImportedContactId(result.contactId ?? null);
        router.refresh();
      } else {
        setFeedback(result?.error ?? "Import failed.");
      }
    });
  }

  return (
    <div className="grid gap-2">
      <OutreachButton
        type="button"
        tone="good"
        disabled={pending}
        onClick={handleImport}
      >
        {pending ? "Importing…" : "Import to CRM"}
      </OutreachButton>
      {feedback ? (
        <p className={`text-xs ${importedContactId ? "text-emerald-300" : "text-red-300"}`}>
          {feedback}
          {importedContactId ? (
            <>
              {" "}
              <a href={`/${locale}/admin/crm`} className="font-semibold underline">
                Open CRM
              </a>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}