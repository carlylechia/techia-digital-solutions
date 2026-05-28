import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPortalSession, getPortalLocale } from "@/lib/portal-auth";
import { getPortalDict } from "@/lib/portal-i18n";
import { loadPortalProjects } from "@/lib/portal-data";
import { ClientPortalShell } from "@/components/site/client-portal-shell";
import { PortalFeedbackForm } from "@/components/site/portal-feedback-form";

export const metadata: Metadata = {
  title: "Feedback — Client Portal | teChia",
  robots: { index: false, follow: false },
};

export default async function ClientPortalFeedbackPage() {
  const session = await getPortalSession();
  if (!session) redirect("/client-portal/login");

  const [locale, projects] = await Promise.all([
    getPortalLocale(),
    loadPortalProjects(session.clientId),
  ]);
  const t = getPortalDict(locale);
  const deliveredProjects = projects.filter((p) => p.status === "DELIVERED");

  return (
    <ClientPortalShell
      locale={locale}
      title={t.feedback.pageTitle}
      description={t.feedback.pageDescription}
      session={session}
    >
      <PortalFeedbackForm projects={deliveredProjects} session={session} />
    </ClientPortalShell>
  );
}
