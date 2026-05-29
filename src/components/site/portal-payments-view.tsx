"use client";

import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  FolderOpen,
  Hourglass,
  Receipt,
  Upload,
  Wallet,
  XCircle,
} from "lucide-react";
import { useRef, useState, useTransition } from "react";
import type { PortalPayment } from "@/lib/portal-data";
import { usePortalLocale } from "@/lib/portal-locale-context";
import { formatPortalCurrency, formatPortalDate } from "@/lib/portal-i18n";
import { markInvoiceAsPaidAction } from "@/app/client-portal/actions";

// ─── Invoice status config ────────────────────────────────────────────────────

type StatusConfig = { label: string; color: string; bg: string; Icon: typeof Receipt };

function useInvoiceStatusConfig(): Record<string, StatusConfig> {
  const { t } = usePortalLocale();
  const labels = t.invoices.status;
  return {
    PAID:                  { label: labels.PAID,                  color: "text-emerald-400", bg: "bg-emerald-400/10 ring-emerald-400/25", Icon: CheckCircle2 },
    SENT:                  { label: labels.SENT,                  color: "text-cyan-400",    bg: "bg-cyan-400/10 ring-cyan-400/25",        Icon: Clock        },
    AWAITING_CONFIRMATION: { label: labels.AWAITING_CONFIRMATION, color: "text-amber-400",   bg: "bg-amber-400/10 ring-amber-400/25",      Icon: Hourglass    },
    OVERDUE:               { label: labels.OVERDUE,               color: "text-red-400",     bg: "bg-red-400/10 ring-red-400/25",          Icon: AlertTriangle },
    DRAFT:                 { label: labels.DRAFT,                 color: "text-slate-400",   bg: "bg-slate-400/10 ring-slate-400/20",      Icon: Receipt      },
    CANCELLED:             { label: labels.CANCELLED,             color: "text-slate-500",   bg: "bg-slate-500/10 ring-slate-500/20",      Icon: XCircle      },
  };
}

// ─── Mark as Paid form (with optional/required proof upload) ─────────────────

type InvoiceForForm = {
  id: string;
  proofRequired: boolean;
  proofOfPaymentUrl?: string | null;
  proofOfPaymentName?: string | null;
};

function MarkAsPaidForm({ invoice }: { invoice: InvoiceForForm }) {
  const { t } = usePortalLocale();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const proofRequired = invoice.proofRequired;
  const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  function handleFile(f: File) {
    setFile(f);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (proofRequired && !file) {
      setError(t.invoices.proofRequired + " — " + t.invoices.proofFileTypes);
      return;
    }
    const fd = new FormData(e.currentTarget);
    if (file) fd.set("proofFile", file);
    startTransition(async () => {
      const res = await markInvoiceAsPaidAction(fd);
      if (res?.success) setDone(true);
      else setError(res?.error ?? "Something went wrong.");
    });
  }

  if (done) {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-amber-400">
        <Hourglass className="size-4 shrink-0" />
        {t.invoices.markPaidSuccess}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="invoiceId" value={invoice.id} />

      {/* Required-proof warning banner */}
      {proofRequired && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3.5 py-3">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
          <p className="text-xs leading-relaxed text-amber-300/90">{t.invoices.proofRequiredNote}</p>
        </div>
      )}

      {/* File drop zone */}
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {proofRequired ? t.invoices.proofRequired : t.invoices.proofOptional}
          {proofRequired && <span className="ml-1 text-amber-400">*</span>}
        </p>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
            dragging
              ? "border-cyan-500/60 bg-cyan-500/5"
              : file
              ? "border-emerald-500/40 bg-emerald-500/[0.04]"
              : proofRequired
              ? "border-amber-500/30 bg-amber-500/[0.04] hover:border-amber-500/50"
              : "border-white/[0.1] bg-white/[0.02] hover:border-white/[0.18]"
          }`}
        >
          {file ? (
            <>
              <CheckCircle2 className="size-5 text-emerald-400" />
              <span className="max-w-full truncate text-xs font-semibold text-emerald-300">{file.name}</span>
              <span className="text-[11px] text-slate-500">{(file.size / 1024).toFixed(0)} KB · {t.invoices.proofUploaded}</span>
            </>
          ) : (
            <>
              <Upload className="size-5 text-slate-500" />
              <span className="text-xs text-slate-400">{t.invoices.proofPlaceholder}</span>
              <span className="text-[11px] text-slate-600">{t.invoices.proofFileTypes}</span>
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2">
          <AlertTriangle className="mt-0.5 size-3 shrink-0 text-red-400" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        title={t.invoices.markAsPaidNote}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500/15 px-4 py-2.5 text-sm font-semibold text-cyan-300 ring-1 ring-cyan-500/30 transition hover:bg-cyan-500/25 hover:ring-cyan-500/40 disabled:opacity-50"
      >
        {isPending ? (
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <CreditCard className="size-4" />
        )}
        {isPending ? t.invoices.markingPaid : t.invoices.markAsPaid}
      </button>
    </form>
  );
}

// ─── Invoice row (inside a payment plan) ─────────────────────────────────────

type InvoiceItem = PortalPayment["invoices"][number];

function InvoiceRow({ invoice }: { invoice: InvoiceItem }) {
  const { locale, t } = usePortalLocale();
  const [open, setOpen] = useState(false);
  const statusMap = useInvoiceStatusConfig();
  const cfg = statusMap[invoice.status] ?? {
    label: invoice.status, color: "text-slate-400", bg: "bg-slate-400/10 ring-slate-400/20", Icon: Receipt,
  };
  const lineItems = invoice.lineItems as Array<{ description: string; quantity: number; unitPrice: number }> | null;
  const canMarkPaid = invoice.status === "SENT" || invoice.status === "OVERDUE";

  // Extract query note from the notes field
  const queryNoteMatch = invoice.notes?.match(/⚠️ Payment query[^\n]*\n([\s\S]*)$/);
  const queryNote = queryNoteMatch?.[1]?.trim();

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.015] transition hover:border-white/[0.1]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${cfg.color} ${cfg.bg}`}>
              <cfg.Icon className="size-3" />
              {cfg.label}
            </span>
            <span className="text-[11px] text-slate-500">{invoice.invoiceNumber}</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-white">{invoice.title}</p>
          {invoice.dueDate && invoice.status !== "PAID" && (
            <p className="mt-0.5 text-xs text-slate-500">{t.invoices.due(formatPortalDate(invoice.dueDate, locale) ?? "")}</p>
          )}
          {invoice.status === "PAID" && invoice.paidAt && (
            <p className="mt-0.5 text-xs text-emerald-500">{t.invoices.paid(formatPortalDate(invoice.paidAt, locale) ?? "")}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-bold text-white">
            {formatPortalCurrency(invoice.amount, invoice.currency, locale)}
          </span>
          {open ? <ChevronUp className="size-3.5 text-slate-500" /> : <ChevronDown className="size-3.5 text-slate-500" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/[0.05] px-4 py-3 space-y-3">
          {/* Query note — shown when status is SENT and a query was sent */}
          {queryNote && invoice.status === "SENT" && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3.5 py-3">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Payment query from teChia</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-300/90">{queryNote}</p>
              </div>
            </div>
          )}

          {/* Awaiting confirmation state */}
          {invoice.status === "AWAITING_CONFIRMATION" && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-3.5 py-3">
              <Hourglass className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
              <div className="min-w-0 space-y-1">
                <p className="text-xs text-amber-300">{t.invoices.status.AWAITING_CONFIRMATION} — teChia will confirm your payment shortly.</p>
                {invoice.proofOfPaymentUrl && (
                  <a
                    href={invoice.proofOfPaymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400/80 hover:text-amber-300 transition"
                  >
                    <FileText className="size-3" />
                    {t.invoices.viewProof}
                    <ExternalLink className="size-2.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Line items table */}
          {lineItems && lineItems.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-white/[0.06]">
              <div className="hidden overflow-x-auto sm:block">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                      <th className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-500">{t.invoices.tableDescription}</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 whitespace-nowrap">{t.invoices.tableQty}</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 whitespace-nowrap">{t.invoices.tableUnitPrice}</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 whitespace-nowrap">{t.invoices.tableTotal}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {lineItems.map((item, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5 text-slate-300">{item.description}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{item.quantity}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{formatPortalCurrency(item.unitPrice, invoice.currency, locale)}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-white">{formatPortalCurrency(item.quantity * item.unitPrice, invoice.currency, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/[0.08] bg-white/[0.03]">
                      <td colSpan={3} className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">{t.invoices.tableTotal}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-bold text-white">{formatPortalCurrency(invoice.amount, invoice.currency, locale)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="grid gap-2 p-3 sm:hidden">
                {lineItems.map((item, i) => (
                  <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                    <p className="text-sm font-medium text-white">{item.description}</p>
                    <div className="mt-2 space-y-1.5 text-xs text-slate-400">
                      <div className="flex justify-between"><span>{t.invoices.tableQty}</span><span className="font-medium text-slate-200">{item.quantity}</span></div>
                      <div className="flex justify-between"><span>{t.invoices.tableUnitPrice}</span><span className="font-medium text-slate-200">{formatPortalCurrency(item.unitPrice, invoice.currency, locale)}</span></div>
                      <div className="flex justify-between border-t border-white/[0.06] pt-1.5"><span>{t.invoices.tableTotal}</span><span className="font-semibold text-white">{formatPortalCurrency(item.quantity * item.unitPrice, invoice.currency, locale)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {canMarkPaid && <MarkAsPaidForm invoice={invoice} />}
        </div>
      )}
    </div>
  );
}

// ─── Payment plan card ────────────────────────────────────────────────────────

function PaymentCard({ payment }: { payment: PortalPayment }) {
  const { locale, t } = usePortalLocale();
  const [expanded, setExpanded] = useState(true);

  const pct = payment.totalAmount > 0 ? Math.min(100, Math.round((payment.paidAmount / payment.totalAmount) * 100)) : 0;
  const isCompleted = payment.status === "COMPLETED";
  const isCancelled = payment.status === "CANCELLED";
  const pendingConfirmation = payment.invoices.filter((inv) => inv.status === "AWAITING_CONFIRMATION").length;

  return (
    <article className={`overflow-hidden rounded-2xl border transition ${
      isCompleted ? "border-emerald-500/30 bg-emerald-500/[0.04]"
      : isCancelled ? "border-slate-600/30 bg-slate-800/20 opacity-70"
      : "border-white/[0.08] bg-white/[0.02]"
    }`}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                  <BadgeCheck className="size-3" />{t.payments.status.COMPLETED}
                </span>
              ) : isCancelled ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2.5 py-1 text-xs font-semibold text-slate-400 ring-1 ring-slate-500/25">
                  <XCircle className="size-3" />{t.payments.status.CANCELLED}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-400 ring-1 ring-cyan-500/25">
                  <Wallet className="size-3" />{t.payments.status.ACTIVE}
                </span>
              )}
              {pendingConfirmation > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400 ring-1 ring-amber-500/25">
                  <Hourglass className="size-3" />{pendingConfirmation} awaiting confirmation
                </span>
              )}
            </div>
            <h3 className="mt-2 text-base font-semibold text-white sm:text-lg">{payment.title}</h3>
            {payment.description && <p className="mt-1 text-sm text-slate-400">{payment.description}</p>}
            {payment.projects.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <FolderOpen className="size-3.5 shrink-0 text-slate-500" />
                {payment.projects.map((proj) => (
                  <span key={proj.id} className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[11px] text-slate-400">
                    {proj.title}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 rounded-lg border border-white/[0.07] p-1.5 text-slate-500 transition hover:border-white/[0.12] hover:text-slate-300"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>

        {/* Amount breakdown */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: t.payments.totalAgreed,    value: formatPortalCurrency(payment.totalAmount,    payment.currency, locale), cls: "text-white"      },
            { label: t.payments.initialDeposit, value: formatPortalCurrency(payment.initialPayment, payment.currency, locale), cls: "text-violet-400" },
            { label: t.payments.paidToDate,     value: formatPortalCurrency(payment.paidAmount,     payment.currency, locale), cls: "text-emerald-400"},
            {
              label: t.payments.remaining,
              value: isCompleted ? "—" : formatPortalCurrency(payment.remainingAmount, payment.currency, locale),
              cls: isCompleted ? "text-emerald-400" : payment.remainingAmount > 0 ? "text-amber-400" : "text-white",
            },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{s.label}</p>
              <p className={`mt-1 text-base font-bold sm:text-lg ${s.cls}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{t.payments.progress}</p>
            <p className="text-xs font-semibold text-white">{pct}%</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${isCompleted ? "bg-emerald-500" : pct >= 75 ? "bg-cyan-500" : pct >= 40 ? "bg-cyan-500/80" : "bg-violet-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Invoices */}
      {expanded && (
        <div className="border-t border-white/[0.06] px-5 py-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {t.payments.invoices(payment.invoices.length)}
          </p>
          {payment.invoices.length === 0 ? (
            <p className="rounded-xl border border-white/[0.05] bg-white/[0.01] px-4 py-3 text-sm text-slate-500">{t.payments.noInvoices}</p>
          ) : (
            <div className="space-y-2">
              {payment.invoices.map((inv) => <InvoiceRow key={inv.id} invoice={inv} />)}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

// ─── Standalone invoice card ──────────────────────────────────────────────────

type StandaloneInvoice = PortalPayment["invoices"][number] & {
  payment?: { id: string; title: string; currency: string } | null;
};

function StandaloneInvoiceCard({ invoice }: { invoice: StandaloneInvoice }) {
  const { locale, t } = usePortalLocale();
  const [open, setOpen] = useState(false);
  const statusMap = useInvoiceStatusConfig();
  const cfg = statusMap[invoice.status] ?? {
    label: invoice.status, color: "text-slate-400", bg: "bg-slate-400/10 ring-slate-400/20", Icon: Receipt,
  };
  const lineItems = invoice.lineItems as Array<{ description: string; quantity: number; unitPrice: number }> | null;
  const canMarkPaid = invoice.status === "SENT" || invoice.status === "OVERDUE";
  const queryNoteMatch = invoice.notes?.match(/⚠️ Payment query[^\n]*\n([\s\S]*)$/);
  const queryNote = queryNoteMatch?.[1]?.trim();

  return (
    <article className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] transition hover:border-white/[0.1]">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left sm:px-5"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cfg.color} ${cfg.bg}`}>
              <cfg.Icon className="size-3" />{cfg.label}
            </span>
            <span className="text-xs text-slate-500">{invoice.invoiceNumber}</span>
          </div>
          <p className="mt-2 text-base font-semibold text-white">{invoice.title}</p>
          {invoice.dueDate && invoice.status !== "PAID" && (
            <p className="mt-1 text-xs text-slate-500">{t.invoices.due(formatPortalDate(invoice.dueDate, locale) ?? "")}</p>
          )}
          {invoice.status === "PAID" && invoice.paidAt && (
            <p className="mt-1 text-xs text-emerald-500">{t.invoices.paid(formatPortalDate(invoice.paidAt, locale) ?? "")}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p className="text-lg font-bold text-white sm:text-xl">{formatPortalCurrency(invoice.amount, invoice.currency, locale)}</p>
          {open ? <ChevronUp className="size-4 text-slate-500" /> : <ChevronDown className="size-4 text-slate-500" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/[0.06] px-4 py-4 sm:px-5 space-y-3">
          {/* Query note */}
          {queryNote && invoice.status === "SENT" && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3.5 py-3">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Payment query from teChia</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-300/90">{queryNote}</p>
              </div>
            </div>
          )}

          {/* Awaiting confirmation */}
          {invoice.status === "AWAITING_CONFIRMATION" && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-3.5 py-3">
              <Hourglass className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
              <div className="min-w-0 space-y-1">
                <p className="text-xs text-amber-300">Your payment claim is being reviewed by teChia.</p>
                {invoice.proofOfPaymentUrl && (
                  <a
                    href={invoice.proofOfPaymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400/80 hover:text-amber-300 transition"
                  >
                    <FileText className="size-3" />{t.invoices.viewProof}<ExternalLink className="size-2.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Line items */}
          {lineItems && lineItems.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-white/[0.07]">
              <div className="hidden overflow-x-auto sm:block">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                      <th className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-500">{t.invoices.tableDescription}</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 whitespace-nowrap">{t.invoices.tableQty}</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 whitespace-nowrap">{t.invoices.tableUnitPrice}</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 whitespace-nowrap">{t.invoices.tableTotal}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {lineItems.map((item, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-slate-300">{item.description}</td>
                        <td className="px-4 py-3 text-right text-slate-400">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-400">{formatPortalCurrency(item.unitPrice, invoice.currency, locale)}</td>
                        <td className="px-4 py-3 text-right font-medium text-white">{formatPortalCurrency(item.quantity * item.unitPrice, invoice.currency, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/[0.08] bg-white/[0.03]">
                      <td colSpan={3} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">{t.invoices.tableTotal}</td>
                      <td className="px-4 py-3 text-right text-base font-bold text-white">{formatPortalCurrency(invoice.amount, invoice.currency, locale)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="grid gap-2 p-3 sm:hidden">
                {lineItems.map((item, i) => (
                  <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                    <p className="text-sm font-medium text-white">{item.description}</p>
                    <div className="mt-2 space-y-1.5 text-xs text-slate-400">
                      <div className="flex justify-between"><span>{t.invoices.tableQty}</span><span className="font-medium text-slate-200">{item.quantity}</span></div>
                      <div className="flex justify-between"><span>{t.invoices.tableUnitPrice}</span><span className="font-medium text-slate-200">{formatPortalCurrency(item.unitPrice, invoice.currency, locale)}</span></div>
                      <div className="flex justify-between border-t border-white/[0.06] pt-1.5"><span>{t.invoices.tableTotal}</span><span className="font-semibold text-white">{formatPortalCurrency(item.quantity * item.unitPrice, invoice.currency, locale)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {canMarkPaid && <MarkAsPaidForm invoice={invoice} />}
        </div>
      )}
    </article>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function PortalPaymentsView({
  payments,
  standaloneInvoices,
}: {
  payments: PortalPayment[];
  standaloneInvoices: StandaloneInvoice[];
}) {
  const { locale, t } = usePortalLocale();

  // ── Correct totals: payment plans expose pre-computed fields that include
  //    initialPayment, so we must NOT just sum invoice amounts.
  const planTotalValue  = payments.reduce((s, p) => s + p.totalAmount,    0);
  const planPaid        = payments.reduce((s, p) => s + p.paidAmount,     0); // initialPayment + paid invoices
  const planRemaining   = payments.reduce((s, p) => s + p.remainingAmount, 0);

  const standalonePaid        = standaloneInvoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
  const standaloneOutstanding = standaloneInvoices.filter((i) => ["SENT", "OVERDUE", "AWAITING_CONFIRMATION"].includes(i.status)).reduce((s, i) => s + i.amount, 0);
  const standaloneTotal       = standaloneInvoices.reduce((s, i) => s + i.amount, 0);

  const grandTotal       = planTotalValue + standaloneTotal;
  const grandPaid        = planPaid        + standalonePaid;
  const grandOutstanding = planRemaining   + standaloneOutstanding;
  const invoiceCount     = payments.flatMap((p) => p.invoices).length + standaloneInvoices.length;

  const currency     = standaloneInvoices[0]?.currency ?? payments[0]?.currency ?? "USD";
  const awaitingCount = [
    ...payments.flatMap((p) => p.invoices),
    ...standaloneInvoices,
  ].filter((i) => i.status === "AWAITING_CONFIRMATION").length;

  if (payments.length === 0 && standaloneInvoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.02] py-20">
        <Wallet className="size-12 text-slate-600" />
        <p className="mt-4 text-sm font-medium text-slate-400">{t.payments.empty}</p>
        <p className="mt-1 text-xs text-slate-600">{t.payments.emptyNote}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t.invoices.summaryTotalInvoiced, value: formatPortalCurrency(grandTotal,       currency, locale), cls: "text-white"       },
          { label: t.invoices.summaryPaid,          value: formatPortalCurrency(grandPaid,        currency, locale), cls: "text-emerald-400"  },
          { label: t.invoices.summaryOutstanding,   value: formatPortalCurrency(grandOutstanding, currency, locale), cls: grandOutstanding > 0 ? "text-amber-400" : "text-slate-300" },
          { label: t.invoices.summaryCount,         value: String(invoiceCount),                                      cls: "text-slate-300"  },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Awaiting confirmation alert */}
      {awaitingCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3.5">
          <Hourglass className="mt-0.5 size-4 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-300">
              {awaitingCount} payment{awaitingCount !== 1 ? "s" : ""} awaiting confirmation
            </p>
            <p className="mt-0.5 text-xs text-amber-400/70">
              teChia is reviewing your claimed payment{awaitingCount !== 1 ? "s" : ""}. You will be notified once confirmed.
            </p>
          </div>
        </div>
      )}

      {/* Payment plans */}
      {payments.length > 0 && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Wallet className="size-3.5" />{t.payments.sectionTitle}
          </h2>
          <div className="space-y-4">
            {payments.map((p) => <PaymentCard key={p.id} payment={p} />)}
          </div>
        </div>
      )}

      {/* Standalone invoices */}
      {standaloneInvoices.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Receipt className="size-3.5" />{t.invoices.summaryCount}
          </h2>
          <div className="space-y-2.5">
            {standaloneInvoices.map((inv) => <StandaloneInvoiceCard key={inv.id} invoice={inv} />)}
          </div>
        </div>
      )}
    </div>
  );
}
