import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { Logo } from "@/components/brand/Logo";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { isLocale, type Locale } from "@/content/site";
import { authOptions } from "@/lib/auth";
import { loadAdminDashboardData } from "@/lib/admin/dashboard";
import { getPrisma } from "@/lib/prisma";
import { createMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const adminPageCopy = {
  en: {
    metaTitle: "Admin management system",
    metaDescription: "Secure teChia Digital Solutions admin dashboard for clients, content, workflows, and access control.",
    eyebrow: "Secure admin",
    title: "Admin management system",
    description: "Sign in to manage clients, requests, content, workflows, admins, roles, and operational history.",
    databaseEyebrow: "Database unavailable",
    databaseTitle: "Admin data cannot load yet.",
    databaseDescription: "Set DATABASE_URL, run the Prisma migrations, and seed the first admin through ADMIN_EMAIL and ADMIN_PASSWORD_SEED.",
    errorEyebrow: "Admin load failed",
    errorTitle: "The management system hit a data error.",
    errorDescription: "Check the latest migration and database connection, then reload the admin workspace."
  },
  fr: {
    metaTitle: "Système de gestion admin",
    metaDescription: "Tableau de bord admin sécurisé de teChia Digital Solutions pour les clients, contenus, workflows et contrôles d’accès.",
    eyebrow: "Admin sécurisé",
    title: "Système de gestion admin",
    description: "Connectez-vous pour gérer clients, demandes, contenus, workflows, administrateurs, rôles et historique opérationnel.",
    databaseEyebrow: "Base de données indisponible",
    databaseTitle: "Les données admin ne peuvent pas encore se charger.",
    databaseDescription: "Définissez DATABASE_URL, exécutez les migrations Prisma et initialisez le premier admin via ADMIN_EMAIL et ADMIN_PASSWORD_SEED.",
    errorEyebrow: "Chargement admin échoué",
    errorTitle: "Le système de gestion a rencontré une erreur de données.",
    errorDescription: "Vérifiez la dernière migration et la connexion base de données, puis rechargez l’espace admin."
  }
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const copy = adminPageCopy[locale];
  return {
    ...createMetadata({
      locale,
      title: copy.metaTitle,
      description: copy.metaDescription,
      path: "/admin"
    }),
    robots: { index: false, follow: false }
  };
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const copy = adminPageCopy[locale];
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <main className="min-h-dvh bg-background px-3 py-8 text-primary sm:px-4 sm:py-12">
        <section className="mx-auto mb-8 max-w-3xl text-center">
          <div className="mb-6 flex justify-center sm:mb-8">
            <Logo locale={locale} variant="horizontal" size="md" theme="auto" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{copy.eyebrow}</p>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl md:text-6xl">{copy.title}</h1>
          <p className="mt-4 text-sm text-muted sm:text-base">{copy.description}</p>
        </section>
        <AdminLoginForm locale={locale} />
      </main>
    );
  }

  const prisma = getPrisma();
  if (!prisma) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background p-4 text-primary">
        <section className="max-w-xl rounded-lg border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{copy.databaseEyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold">{copy.databaseTitle}</h1>
          <p className="mt-3 text-muted">{copy.databaseDescription}</p>
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
        <section className="max-w-xl rounded-lg border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{copy.errorEyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold">{copy.errorTitle}</h1>
          <p className="mt-3 text-muted">{copy.errorDescription}</p>
        </section>
      </main>
    );
  }

  const currentUser = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    roleLevel: session.user.roleLevel,
    permissions: session.user.permissions
  };

  return <AdminWorkspace locale={locale} data={data} currentUser={currentUser} />;
}
