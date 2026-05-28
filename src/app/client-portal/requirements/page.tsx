import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPortalSession, getPortalLocale } from "@/lib/portal-auth";
import { getPortalDict } from "@/lib/portal-i18n";
import { loadPortalRequirements } from "@/lib/portal-data";
import { ClientPortalShell } from "@/components/site/client-portal-shell";
import { PortalRequirementsView } from "@/components/site/portal-requirements-view";

export const metadata: Metadata = {
  title: "Requests — Client Portal | teChia",
  robots: { index: false, follow: false },
};

export default async function ClientPortalRequirementsPage() {
  const session = await getPortalSession();
  if (!session) redirect("/client-portal/login");

  const [locale, requirements] = await Promise.all([
    getPortalLocale(),
    loadPortalRequirements(session.clientId),
  ]);
  const t = getPortalDict(locale);

  return (
    <ClientPortalShell
      locale={locale}
      title={t.requests.pageTitle}
      description={t.requests.pageDescription}
      session={session}
    >
      <PortalRequirementsView requirements={requirements} />
    </ClientPortalShell>
  );
}
