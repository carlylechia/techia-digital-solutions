import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPortalSession, getPortalLocale } from "@/lib/portal-auth";
import { getPortalDict } from "@/lib/portal-i18n";
import { loadPortalProjects } from "@/lib/portal-data";
import { ClientPortalShell } from "@/components/site/client-portal-shell";
import { PortalProjectsView } from "@/components/site/portal-projects-view";

export const metadata: Metadata = {
  title: "Projects — Client Portal | teChia",
  robots: { index: false, follow: false },
};

export default async function ClientPortalProjectsPage() {
  const session = await getPortalSession();
  if (!session) redirect("/client-portal/login");

  const [locale, projects] = await Promise.all([
    getPortalLocale(),
    loadPortalProjects(session.clientId),
  ]);
  const t = getPortalDict(locale);

  return (
    <ClientPortalShell
      locale={locale}
      title={t.projects.pageTitle}
      description={t.projects.pageDescription}
      session={session}
    >
      <PortalProjectsView projects={projects} />
    </ClientPortalShell>
  );
}

