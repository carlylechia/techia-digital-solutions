import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPortalSession, getPortalLocale } from "@/lib/portal-auth";
import { getPortalDict } from "@/lib/portal-i18n";
import { loadPortalInvoices, loadPortalPayments } from "@/lib/portal-data";
import { ClientPortalShell } from "@/components/site/client-portal-shell";
import { PortalPaymentsView } from "@/components/site/portal-payments-view";

export const metadata: Metadata = {
  title: "Invoices & Payments — Client Portal | teChia",
  robots: { index: false, follow: false },
};

export default async function ClientPortalInvoicesPage() {
  const session = await getPortalSession();
  if (!session) redirect("/client-portal/login");

  const [locale, payments, allInvoices] = await Promise.all([
    getPortalLocale(),
    loadPortalPayments(session.clientId),
    loadPortalInvoices(session.clientId),
  ]);
  const t = getPortalDict(locale);

  // Invoices not linked to any payment plan
  const linkedInvoiceIds = new Set(payments.flatMap((p) => p.invoices.map((i) => i.id)));
  const standaloneInvoices = allInvoices.filter((inv) => !linkedInvoiceIds.has(inv.id));

  return (
    <ClientPortalShell
      locale={locale}
      title={t.invoices.pageTitle}
      description={t.invoices.pageDescription}
      session={session}
    >
      <PortalPaymentsView payments={payments} standaloneInvoices={standaloneInvoices} />
    </ClientPortalShell>
  );
}

