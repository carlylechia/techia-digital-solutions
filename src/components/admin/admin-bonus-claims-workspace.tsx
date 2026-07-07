"use client";

import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  prepareCourseBonusClaimWhatsappAction,
  saveCourseBonusClaimReviewAction,
  sendCourseBonusClaimEmailAction,
  verifyCourseBonusClaimAction,
} from "@/app/[locale]/admin/actions";
import type { Locale } from "@/content/site";
import { formatFileSize } from "@/lib/cloudinary";
import type { AdminCourseBonusClaim } from "@/lib/admin/courseBonusClaims";

const statusOptions = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "VERIFIED",
  "FULFILLED",
  "REJECTED",
] as const;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusTone(status: (typeof statusOptions)[number]) {
  if (status === "FULFILLED") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }
  if (status === "REJECTED") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }
  if (status === "VERIFIED") {
    return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
  }
  if (status === "UNDER_REVIEW") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }
  return "border-border bg-background text-muted";
}

function statusLabel(status: (typeof statusOptions)[number]) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-border bg-background/80 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-primary">{value}</p>
      <p className="mt-2 text-sm text-muted">{detail}</p>
    </div>
  );
}

type FeedbackState =
  | { tone: "success"; text: string }
  | { tone: "error"; text: string }
  | null;

function ClaimCard({
  claim,
  locale,
}: {
  claim: AdminCourseBonusClaim;
  locale: Locale;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "SUBMITTED" | "UNDER_REVIEW" | "VERIFIED" | "FULFILLED" | "REJECTED"
  >(claim.status as (typeof statusOptions)[number]);
  const [notes, setNotes] = useState(claim.adminNotes || "");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [pending, startTransition] = useTransition();

  const requestedLabel = useMemo(
    () =>
      claim.requestedBonusItems.length
        ? claim.requestedBonusItems.map((item) => item.title).join(", ")
        : "No deliverable bonus files selected",
    [claim.requestedBonusItems],
  );

  function runAction(
    action: () => Promise<{ success: boolean; error?: string }>,
    successText: string,
  ) {
    startTransition(async () => {
      setFeedback(null);
      const result = await action();
      if (!result.success) {
        setFeedback({
          tone: "error",
          text: result.error || "The action could not be completed.",
        });
        return;
      }

      setFeedback({ tone: "success", text: successText });
      router.refresh();
    });
  }

  function handleWhatsappDelivery() {
    const popup = typeof window !== "undefined" ? window.open("", "_blank") : null;

    startTransition(async () => {
      setFeedback(null);
      const result = await prepareCourseBonusClaimWhatsappAction({
        locale,
        claimId: claim.id,
      });

      if (!result.success || !result.url) {
        popup?.close();
        setFeedback({
          tone: "error",
          text: result.error || "Could not prepare the WhatsApp delivery draft.",
        });
        return;
      }

      if (popup) {
        popup.location.href = result.url;
      } else {
        window.location.assign(result.url);
      }

      setFeedback({
        tone: "success",
        text: "WhatsApp delivery draft opened with all secure bonus links.",
      });
      router.refresh();
    });
  }

  return (
    <article className="rounded-[1.6rem] border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                statusTone(status),
              )}
            >
              {statusLabel(status)}
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted">
              {claim.preferredDelivery}
            </span>
          </div>

          <h2 className="mt-4 text-xl font-semibold text-primary">
            {claim.name}
          </h2>
          <p className="mt-1 text-sm text-muted">{claim.coursePackTitle}</p>

          <div className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
            <p>
              <span className="text-primary">Submitted:</span>{" "}
              {formatDate(claim.createdAt)}
            </p>
            <p>
              <span className="text-primary">Order ref:</span>{" "}
              {claim.orderReference}
            </p>
            <p>
              <span className="text-primary">Email:</span> {claim.email}
            </p>
            <p>
              <span className="text-primary">WhatsApp:</span>{" "}
              {claim.whatsapp || "-"}
            </p>
            <p>
              <span className="text-primary">Purchase date:</span>{" "}
              {formatDate(claim.purchaseDate)}
            </p>
            <p>
              <span className="text-primary">Source:</span>{" "}
              {claim.sourcePage || "-"}
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:w-[23rem]">
          <button
            type="button"
            onClick={() =>
              runAction(
                () =>
                  verifyCourseBonusClaimAction({
                    locale,
                    claimId: claim.id,
                    adminNotes: notes,
                  }),
                "Claim verified and ready for delivery.",
              )
            }
            disabled={pending || status === "FULFILLED"}
            className="btn-primary justify-center gap-2 rounded-xl px-4 py-3 text-sm disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            Verify claim
          </button>

          <button
            type="button"
            onClick={() =>
              runAction(
                () =>
                  sendCourseBonusClaimEmailAction({
                    locale,
                    claimId: claim.id,
                  }),
                "All requested bonus files were emailed to the buyer.",
              )
            }
            disabled={pending || status === "REJECTED"}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/[0.08] px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/[0.16] disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Mail className="size-4" />
            )}
            Send all by email
          </button>

          <button
            type="button"
            onClick={handleWhatsappDelivery}
            disabled={pending || !claim.whatsapp || status === "REJECTED"}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/[0.16] disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MessageCircle className="size-4" />
            )}
            Open WhatsApp bundle
          </button>

          <button
            type="button"
            onClick={() =>
              runAction(
                () =>
                  saveCourseBonusClaimReviewAction({
                    locale,
                    claimId: claim.id,
                    status,
                    adminNotes: notes,
                  }),
                "Review status and notes updated.",
              )
            }
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-primary transition hover:bg-white/[0.04] disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Save review
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-5">
          <section className="rounded-[1.25rem] border border-border bg-background/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Requested bonus files
            </p>
            <p className="mt-3 text-sm leading-7 text-primary">
              {requestedLabel}
            </p>
          </section>

          <section className="rounded-[1.25rem] border border-border bg-background/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Proof and buyer notes
            </p>
            <div className="mt-3 grid gap-3 text-sm text-muted">
              <p>{claim.proofNotes || "No proof notes were added."}</p>
              {claim.proofUrl ? (
                <a
                  href={`/api/admin/course-bonus-claims/proof?claimId=${claim.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 font-semibold text-primary transition hover:bg-white/[0.04]"
                >
                  <ExternalLink className="size-4" />
                  View uploaded proof
                  {claim.proofFileName ? ` (${claim.proofFileName})` : ""}
                </a>
              ) : null}
              {claim.proofFileSize ? (
                <p className="text-xs text-muted">
                  File size: {formatFileSize(claim.proofFileSize)}
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-[1.25rem] border border-border bg-background/70 p-4">
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Review status
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as (typeof statusOptions)[number],
                  )
                }
                className="form-input rounded-xl text-sm font-medium text-primary"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {statusLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Internal review notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="form-input min-h-32 rounded-xl text-sm text-primary"
                placeholder="Verification notes, follow-up context, or delivery reminders"
              />
            </label>
          </section>
        </div>

        <div className="grid gap-5">
          <section className="rounded-[1.25rem] border border-border bg-background/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Verification timeline
            </p>
            <div className="mt-3 grid gap-2 text-sm text-muted">
              <p>
                <span className="text-primary">Verified:</span>{" "}
                {claim.verifiedAt
                  ? `${formatDate(claim.verifiedAt)} by ${
                      claim.verifiedBy?.name || claim.verifiedBy?.email
                    }`
                  : "Not yet verified"}
              </p>
              <p>
                <span className="text-primary">Fulfilled:</span>{" "}
                {claim.fulfilledAt
                  ? `${formatDate(claim.fulfilledAt)} by ${
                      claim.fulfilledBy?.name || claim.fulfilledBy?.email
                    }`
                  : "Not yet marked fulfilled"}
              </p>
            </div>
          </section>

          <section className="rounded-[1.25rem] border border-border bg-background/70 p-4">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-cyan-300" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Delivery activity
              </p>
            </div>

            <div className="mt-4 grid gap-3">
              {claim.deliveries.length ? (
                claim.deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="rounded-xl border border-border bg-background p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-primary">
                        {delivery.channel}
                      </span>
                      <span className="text-xs text-muted">
                        {formatDate(delivery.sentAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-primary">
                      {delivery.sentTo}
                    </p>
                    {delivery.sentBy ? (
                      <p className="mt-1 text-xs text-muted">
                        by {delivery.sentBy.name || delivery.sentBy.email}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs leading-6 text-muted">
                      {delivery.bonusIds.length} bonus file(s)
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">
                  No delivery activity has been logged yet.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[1.25rem] border border-border bg-background/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Workflow note
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              Email delivery is fully automatic and attaches every requested
              bonus file. The WhatsApp button opens a ready-to-send delivery
              draft containing secure file links for the buyer.
            </p>
          </section>
        </div>
      </div>

      {feedback ? (
        <div
          className={cn(
            "mt-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm",
            feedback.tone === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/20 bg-red-500/10 text-red-300",
          )}
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      ) : null}
    </article>
  );
}

export function AdminBonusClaimsWorkspace({
  locale,
  claims,
  summary,
}: {
  locale: Locale;
  claims: AdminCourseBonusClaim[];
  summary: {
    total: number;
    submitted: number;
    underReview: number;
    verified: number;
    fulfilled: number;
    rejected: number;
    actionable: number;
  };
}) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard
          label="Total claims"
          value={summary.total}
          detail="Every academy buyer claim received"
        />
        <SummaryCard
          label="Actionable"
          value={summary.actionable}
          detail="Submitted, in review, or verified"
        />
        <SummaryCard
          label="Submitted"
          value={summary.submitted}
          detail="Waiting for first admin review"
        />
        <SummaryCard
          label="In review"
          value={summary.underReview}
          detail="Proof is being checked"
        />
        <SummaryCard
          label="Verified"
          value={summary.verified}
          detail="Ready for delivery"
        />
        <SummaryCard
          label="Fulfilled"
          value={summary.fulfilled}
          detail="Delivered bonus bundle"
        />
      </div>

      {claims.length ? (
        <div className="grid gap-5">
          {claims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} locale={locale} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.6rem] border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-lg font-semibold text-primary">
            No academy bonus claims yet.
          </p>
          <p className="mt-3 text-sm leading-7 text-muted">
            New buyer proof submissions will appear here once the public claim
            form is used.
          </p>
        </div>
      )}
    </div>
  );
}
