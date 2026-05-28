import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPortalSession, getPortalLocale } from "@/lib/portal-auth";
import { getPortalDict } from "@/lib/portal-i18n";
import { loadPortalMessages } from "@/lib/portal-data";
import { ClientPortalShell } from "@/components/site/client-portal-shell";
import { PortalMessagesView } from "@/components/site/portal-messages-view";

export const metadata: Metadata = {
  title: "Messages — Client Portal | teChia",
  robots: { index: false, follow: false },
};

export default async function ClientPortalMessagesPage() {
  const session = await getPortalSession();
  if (!session) redirect("/client-portal/login");

  const [locale, messages] = await Promise.all([
    getPortalLocale(),
    loadPortalMessages(session.clientId),
  ]);
  const t = getPortalDict(locale);
  const unreadMessages = messages.filter((m) => !m.readAt && m.fromAdmin).length;

  return (
    <ClientPortalShell
      locale={locale}
      title={t.messages.pageTitle}
      description={t.messages.pageDescription}
      session={session}
      unreadMessages={unreadMessages}
    >
      <PortalMessagesView messages={messages} session={session} />
    </ClientPortalShell>
  );
}

