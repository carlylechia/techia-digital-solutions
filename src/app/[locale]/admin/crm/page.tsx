import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/content/site";
import { getAdminSessionUser } from "@/lib/admin/session";
import { hasPermission } from "@/lib/admin/permissions";
import { loadCrmWorkspace } from "@/lib/crm/workspace";
import { getPrisma } from "@/lib/prisma";
import { createMetadata } from "@/lib/seo";
import { CrmWorkspace } from "@/components/admin/crm/crm-workspace";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return {
    ...createMetadata({
      locale,
      title: "CRM contacts",
      description: "Back-office CRM for contacts, conversations, AI drafting and professional email.",
      path: "/admin/crm",
    }),
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AdminCrmPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale;

  const actor = await getAdminSessionUser();
  if (!actor) redirect(`/${locale}/admin`);
  if (!hasPermission(actor.permissions, "requests.manage")) redirect(`/${locale}/admin`);

  const prisma = getPrisma();
  if (!prisma) {
    return (
      <section className="gradient-border rounded-[2rem]">
        <div className="elevated-panel p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Database unavailable</p>
          <h2 className="mt-3 text-2xl font-semibold">The CRM cannot load yet.</h2>
          <p className="mt-2 text-sm text-muted">Set DATABASE_URL and run the Prisma migration before using contacts.</p>
        </div>
      </section>
    );
  }

  const data = await loadCrmWorkspace(prisma).catch((error) => {
    console.error("[crm] workspace load failed", error);
    return null;
  });

  if (!data) {
    return (
      <section className="gradient-border rounded-[2rem]">
        <div className="elevated-panel p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">CRM data unavailable</p>
          <h2 className="mt-3 text-2xl font-semibold">The contact list could not be loaded.</h2>
          <p className="mt-2 text-sm text-muted">Check the database connection, then reload this page.</p>
        </div>
      </section>
    );
  }

  return <CrmWorkspace locale={locale} data={data} />;
}
