import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { Logo } from "@/components/brand/Logo";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { isLocale, type Locale } from "@/content/site";
import { authOptions } from "@/lib/auth";
import { getAdminSessionUser } from "@/lib/admin/session";
import { hasPermission } from "@/lib/admin/permissions";
import { loadAdminDashboardData } from "@/lib/admin/dashboard";
import { getPrisma } from "@/lib/prisma";
import { createMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const adminPageCopy = {
  en: {
    metaTitle: "Admin workspace",
    metaDescription:
      "Secure teChia Digital Solutions admin dashboard for clients, content, workflows, and access control.",
    eyebrow: "Secure access",
    title: "Admin workspace",
    description:
      "Manage client delivery, requests, content operations, workflows, roles, and internal controls from one secure console.",
    highlights: [
      "Client operations",
      "Delivery workflow",
      "Access governance",
      "Audit visibility",
    ],
    databaseEyebrow: "Database unavailable",
    databaseTitle: "Admin services are temporarily unavailable.",
    databaseDescription:
      "The workspace cannot reach its data services right now. Restore database connectivity and try again.",
    errorEyebrow: "Workspace load issue",
    errorTitle: "The admin workspace could not load.",
    errorDescription:
      "Refresh the page or review the latest platform logs and data changes before retrying.",
  },
  fr: {
    metaTitle: "Espace admin",
    metaDescription:
      "Tableau de bord admin sécurisé de teChia Digital Solutions pour les clients, contenus, workflows et contrôles d’accès.",
    eyebrow: "Accès sécurisé",
    title: "Espace admin",
    description:
      "Pilotez la livraison client, les demandes, le contenu, les workflows, les rôles et les contrôles internes depuis une console sécurisée.",
    highlights: [
      "Opérations clients",
      "Workflow de livraison",
      "Gouvernance des accès",
      "Visibilité d’audit",
    ],
    databaseEyebrow: "Base de données indisponible",
    databaseTitle: "Les services admin sont temporairement indisponibles.",
    databaseDescription:
      "L’espace ne peut pas joindre ses services de données pour le moment. Rétablissez la connexion base de données puis réessayez.",
    errorEyebrow: "Problème de chargement",
    errorTitle: "L’espace admin n’a pas pu se charger.",
    errorDescription:
      "Actualisez la page ou vérifiez les derniers journaux de la plateforme et les changements de données avant de réessayer.",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const copy = adminPageCopy[locale];
  return {
    ...createMetadata({
      locale,
      title: copy.metaTitle,
      description: copy.metaDescription,
      path: "/admin",
    }),
    robots: { index: false, follow: false },
  };
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const copy = adminPageCopy[locale];
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <main className="page-frame relative min-h-dvh overflow-hidden px-3 py-6 text-primary sm:px-4 sm:py-10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[8%] top-10 h-56 w-56 rounded-full bg-cyan-400/14 blur-3xl" />
          <div className="absolute right-[7%] top-24 h-72 w-72 rounded-full bg-rose-400/12 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl" />
        </div>

        <section className="container relative">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
            <div className="gradient-border rounded-[2rem]">
              <div className="elevated-panel px-6 py-7 sm:px-8 sm:py-9 md:px-10 md:py-10">
                <div className="flex flex-wrap items-center gap-4">
                  <Logo
                    locale={locale}
                    variant="horizontal"
                    size="md"
                    theme="auto"
                  />
                  <span className="status-pill inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                    <span className="inline-flex size-2 rounded-full bg-cyan-300" />
                    {copy.eyebrow}
                  </span>
                </div>

                <h1 className="mt-8 max-w-3xl text-balance text-[clamp(2.8rem,8vw,4.9rem)] font-semibold leading-[0.94] text-primary">
                  {copy.title}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-muted md:text-lg">
                  {copy.description}
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {copy.highlights.map((item) => (
                    <div
                      key={item}
                      className="subtle-tile rounded-[1.25rem] px-4 py-4 text-sm font-medium text-primary"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <AdminLoginForm locale={locale} />
          </div>
        </section>
      </main>
    );
  }

  const currentAdmin = await getAdminSessionUser();
  if (!currentAdmin) {
    redirect(`/${locale}/writer`);
  }
  if (!hasPermission(currentAdmin.permissions, "dashboard.view")) {
    redirect(hasPermission(currentAdmin.permissions, "blog.posts.manage") ? `/${locale}/admin/blog` : `/${locale}/writer`);
  }

  const prisma = getPrisma();
  if (!prisma) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background p-4 text-primary">
        <section className="gradient-border max-w-xl rounded-[1.75rem]">
          <div className="elevated-panel p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              {copy.databaseEyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold">
              {copy.databaseTitle}
            </h1>
            <p className="mt-3 text-muted">{copy.databaseDescription}</p>
          </div>
        </section>
      </main>
    );
  }

  const data = await loadAdminDashboardData(prisma).catch((error) => {
    console.error("admin_dashboard_load_failed", error);
    return null;
  });

  if (!data) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background p-4 text-primary">
        <section className="gradient-border max-w-xl rounded-[1.75rem]">
          <div className="elevated-panel p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              {copy.errorEyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold">{copy.errorTitle}</h1>
            <p className="mt-3 text-muted">{copy.errorDescription}</p>
          </div>
        </section>
      </main>
    );
  }

  const currentUser = {
    id: currentAdmin.id,
    email: currentAdmin.email,
    name: currentAdmin.name,
    role: currentAdmin.role,
    roleLevel: currentAdmin.roleLevel,
    permissions: currentAdmin.permissions,
  };

  return (
    <AdminWorkspace locale={locale} data={data} currentUser={currentUser} />
  );
}
