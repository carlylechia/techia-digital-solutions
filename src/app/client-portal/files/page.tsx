import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPortalSession, getPortalLocale } from "@/lib/portal-auth";
import { getPortalDict } from "@/lib/portal-i18n";
import { loadPortalFiles } from "@/lib/portal-data";
import { ClientPortalShell } from "@/components/site/client-portal-shell";
import { PortalFilesView } from "@/components/site/portal-files-view";

export const metadata: Metadata = {
  title: "Files — Client Portal | teChia",
  robots: { index: false, follow: false },
};

export default async function ClientPortalFilesPage() {
  const session = await getPortalSession();
  if (!session) redirect("/client-portal/login");

  const [locale, files] = await Promise.all([
    getPortalLocale(),
    loadPortalFiles(session.clientId),
  ]);
  const t = getPortalDict(locale);

  return (
    <ClientPortalShell
      locale={locale}
      title={t.files.pageTitle}
      description={t.files.pageDescription}
      session={session}
    >
      <PortalFilesView files={files} />
    </ClientPortalShell>
  );
}
