import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPortalSession, getPortalLocale } from "@/lib/portal-auth";
import { getPortalDict } from "@/lib/portal-i18n";
import { loadPortalInvoices } from "@/lib/portal-data";
import { ClientPortalShell } from "@/components/site/client-portal-shell";
import { PortalInvoicesView } from "@/components/site/portal-invoices-view";

export const metadata: Metadata = {
  title: "Invoices — Client Portal | teChia",
  robots: { index: false, follow: false },
};

export default async function ClientPortalInvoicesPage() {
  const session = await getPortalSession();
  if (!session) redirect("/client-portal/login");

  const [locale, invoices] = await Promise.all([
    getPortalLocale(),
    loadPortalInvoices(session.clientId),
  ]);
  const t = getPortalDict(locale);

  return (
    <ClientPortalShell
      locale={locale}
      title={t.invoices.pageTitle}
      description={t.invoices.pageDescription}
      session={session}
    >
      <PortalInvoicesView invoices={invoices} />
    </ClientPortalShell>
  );
}

