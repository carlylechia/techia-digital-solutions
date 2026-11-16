"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, GraduationCap, Loader2, Mail, Phone } from "lucide-react";
import { graduateOutreachProspectToClientAction } from "@/app/[locale]/admin/crm/actions";
import type { CrmProspect } from "@/lib/crm/types";
import { OutreachPanel, OutreachPill } from "@/components/admin/outreach/outreach-ui";

/**
 * Prospects that were added to the CRM from the outreach console but are not
 * Clients yet. Graduation is the only action here that creates Client records,
 * and it always requires an explicit click.
 */
export function CrmProspectList({ prospects, locale }: { prospects: CrmProspect[]; locale: string }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  function graduate(prospect: CrmProspect) {
    setPendingId(prospect.id);
    setFeedback((current) => {
      const next = { ...current };
      delete next[prospect.id];
      return next;
    });
    startTransition(async () => {
      const result = await graduateOutreachProspectToClientAction({
        prospectId: prospect.id,
        locale: locale as "en" | "fr",
      });
      setPendingId(null);
      setFeedback((current) => ({
        ...current,
        [prospect.id]: result?.success ? result.message ?? "Graduated to a client." : result?.error ?? "Graduation failed.",
      }));
      if (result?.success) router.refresh();
    });
  }

  if (prospects.length === 0) return null;

  return (
    <OutreachPanel>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">CRM prospects</h2>
          <p className="mt-1 text-sm text-muted">
            These businesses were added from the outreach console. They are not clients yet — graduate one to create the
            client record, primary contact and CRM conversation.
          </p>
        </div>
        <OutreachPill tone="warn">{prospects.length} awaiting graduation</OutreachPill>
      </div>

      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {prospects.map((prospect) => {
          const pending = pendingId === prospect.id;
          const message = feedback[prospect.id];
          return (
            <li key={prospect.id} className="grid gap-3 rounded-xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-primary">{prospect.businessName}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {[prospect.city, prospect.country].filter(Boolean).join(", ") || "Location unknown"}
                    {prospect.industry ? ` · ${prospect.industry}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <OutreachPill tone="quiet">{prospect.status.replace(/_/g, " ")}</OutreachPill>
                  {prospect.qualificationStatus ? (
                    <OutreachPill
                      tone={
                        prospect.qualificationStatus === "QUALIFIED"
                          ? "good"
                          : prospect.qualificationStatus === "REVIEW"
                            ? "warn"
                            : "danger"
                      }
                    >
                      {prospect.qualificationStatus}
                    </OutreachPill>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                {prospect.publicEmail ? (
                  <a href={`mailto:${prospect.publicEmail}`} className="inline-flex items-center gap-1.5 text-accent hover:underline">
                    <Mail className="size-3.5" /> {prospect.publicEmail}
                  </a>
                ) : null}
                {prospect.publicPhone ? (
                  <a href={`tel:${prospect.publicPhone}`} className="inline-flex items-center gap-1.5 hover:text-primary">
                    <Phone className="size-3.5" /> {prospect.publicPhone}
                  </a>
                ) : null}
                {!prospect.publicEmail && !prospect.publicPhone ? (
                  <span className="text-amber-300">No contact information yet</span>
                ) : null}
                <Link
                  href={`/${locale}/admin/outreach/prospects/${prospect.id}`}
                  className="inline-flex items-center gap-1.5 text-accent hover:underline"
                >
                  <ExternalLink className="size-3.5" /> Outreach details
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => graduate(prospect)}
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-[#001018] transition hover:opacity-90 disabled:opacity-60"
                >
                  {pending ? <Loader2 className="size-3.5 animate-spin" /> : <GraduationCap className="size-3.5" />}
                  {pending ? "Graduating…" : "Graduate to client"}
                </button>
                <span className="text-[11px] text-muted">Imported {prospect.crmImportedAt.slice(0, 10)}</span>
              </div>

              {message ? (
                <p className={`text-xs ${message.toLowerCase().includes("failed") ? "text-red-300" : "text-emerald-300"}`}>{message}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </OutreachPanel>
  );
}
