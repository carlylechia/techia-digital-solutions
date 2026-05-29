"use client";

// This component is kept for backward compatibility.
// The main invoices/payments page now uses PortalPaymentsView from portal-payments-view.tsx.
// This file still exports PortalInvoicesView for any callers that reference it (e.g., overview page),
// but renders via the consolidated payments view internally.

import {
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Hourglass,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import type { PortalInvoice } from "@/lib/portal-data";
import { usePortalLocale } from "@/lib/portal-locale-context";
import { formatPortalDate, formatPortalCurrency } from "@/lib/portal-i18n";

function InvoiceCard({ invoice }: { invoice: PortalInvoice }) {
  const { locale, t } = usePortalLocale();
  const [open, setOpen] = useState(false);
  const statusLabels = t.invoices.status;
  const statusMap: Record<string, { label: string; color: string; Icon: typeof Receipt }> = {
    PAID:    { label: statusLabels.PAID,    color: "text-emerald-400 bg-emerald-400/10 ring-emerald-400/20", Icon: CheckCircle2 },
    SENT:    { label: statusLabels.SENT,    color: "text-cyan-400 bg-cyan-400/10 ring-cyan-400/20",         Icon: Clock },
    OVERDUE: { label: statusLabels.OVERDUE, color: "text-red-400 bg-red-400/10 ring-red-400/20",           Icon: AlertTriangle },
    DRAFT:   { label: statusLabels.DRAFT,   color: "text-slate-400 bg-slate-400/10 ring-slate-400/20",     Icon: Receipt },
    AWAITING_CONFIRMATION: { label: statusLabels.AWAITING_CONFIRMATION, color: "text-amber-400 bg-amber-400/10 ring-amber-400/20", Icon: Hourglass },
    CANCELLED: { label: statusLabels.CANCELLED, color: "text-slate-500 bg-slate-500/10 ring-slate-500/20", Icon: XCircle },
  };
  const { label, color, Icon } = statusMap[invoice.status] ?? { label: invoice.status, color: "text-slate-400 bg-slate-400/10 ring-slate-400/20", Icon: Receipt };
  const lineItems = invoice.lineItems as Array<{ description: string; quantity: number; unitPrice: number }> | null;

  return (
    <article className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden transition hover:border-white/[0.1]">
      <button
        type="button"
        className="flex w-full flex-wrap items-start justify-between gap-4 px-4 py-4 text-left sm:px-5 sm:py-5"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${color}`}>
              <Icon className="size-3" />
              {label}
            </span>
            <span className="text-xs text-slate-500">{invoice.invoiceNumber}</span>
          </div>
          <p className="mt-2 text-base font-semibold text-white">{invoice.title}</p>
          {invoice.dueDate && (
            <p className="mt-1 text-xs text-slate-500">
              {invoice.status === "PAID"
                ? t.invoices.paid(formatPortalDate(invoice.paidAt, locale) ?? "")
                : t.invoices.due(formatPortalDate(invoice.dueDate, locale) ?? "")}
            </p>
          )}
          {invoice.payment && (
            <p className="mt-1 text-xs text-slate-500">
              {t.invoices.linkedPayment}: <span className="text-slate-400">{invoice.payment.title}</span>
            </p>
          )}
        </div>

        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
          <p className="text-lg font-bold text-white sm:text-xl">
            {formatPortalCurrency(invoice.amount, invoice.currency, locale)}
          </p>
          {open ? <ChevronUp className="size-4 text-slate-500" /> : <ChevronDown className="size-4 text-slate-500" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/[0.06] px-4 py-4 sm:px-5">
          {invoice.notes && (
            <p className="mb-4 break-words text-sm text-slate-400">{invoice.notes}</p>
          )}

          {lineItems && lineItems.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-white/[0.07]">
              <div className="grid gap-3 p-3 sm:hidden">
                {lineItems.map((item, i) => (
                  <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                    <p className="break-words text-sm font-medium text-white">{item.description}</p>
                    <div className="mt-3 grid gap-2 text-xs text-slate-400">
                      <div className="flex items-center justify-between gap-3">
                        <span>{t.invoices.tableQty}</span>
                        <span className="font-medium text-slate-200">{item.quantity}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>{t.invoices.tableUnitPrice}</span>
                        <span className="font-medium text-slate-200">
                          {formatPortalCurrency(item.unitPrice, invoice.currency, locale)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-2">
                        <span>{t.invoices.tableTotal}</span>
                        <span className="font-semibold text-white">
                          {formatPortalCurrency(item.quantity * item.unitPrice, invoice.currency, locale)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t.invoices.tableTotal}</span>
                  <span className="text-base font-bold text-white">
                    {formatPortalCurrency(invoice.amount, invoice.currency, locale)}
                  </span>
                </div>
              </div>

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
                      <tr key={i} className="group">
                        <td className="break-words px-4 py-3 text-slate-300">{item.description}</td>
                        <td className="px-4 py-3 text-right text-slate-400">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-400">
                          {formatPortalCurrency(item.unitPrice, invoice.currency, locale)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-white">
                          {formatPortalCurrency(item.quantity * item.unitPrice, invoice.currency, locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/[0.08] bg-white/[0.03]">
                      <td colSpan={3} className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {t.invoices.tableTotal}
                      </td>
                      <td className="px-4 py-3 text-right text-base font-bold text-white">
                        {formatPortalCurrency(invoice.amount, invoice.currency, locale)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function PortalInvoicesView({ invoices }: { invoices: PortalInvoice[] }) {
  const { locale, t } = usePortalLocale();

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] py-16">
        <Receipt className="size-10 text-slate-600" />
        <p className="mt-3 text-sm font-medium text-slate-400">{t.invoices.empty}</p>
        <p className="mt-1 text-xs text-slate-600">{t.invoices.emptyNote}</p>
      </div>
    );
  }

  const totals = {
    paid: invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0),
    due: invoices.filter((i) => ["SENT", "OVERDUE", "AWAITING_CONFIRMATION"].includes(i.status)).reduce((s, i) => s + i.amount, 0),
  };
  const currency = invoices[0]?.currency || "USD";

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t.invoices.summaryTotalInvoiced, value: formatPortalCurrency(invoices.reduce((s, i) => s + i.amount, 0), currency, locale), color: "text-white" },
          { label: t.invoices.summaryPaid, value: formatPortalCurrency(totals.paid, currency, locale), color: "text-emerald-400" },
          { label: t.invoices.summaryOutstanding, value: formatPortalCurrency(totals.due, currency, locale), color: "text-amber-400" },
          { label: t.invoices.summaryCount, value: String(invoices.length), color: "text-slate-300" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3">
        {invoices.map((invoice) => (
          <InvoiceCard key={invoice.id} invoice={invoice} />
        ))}
      </div>
    </div>
  );
}
