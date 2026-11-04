import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Target } from "lucide-react";
import { isLocale } from "@/content/site";
import { getAdminSessionUser } from "@/lib/admin/session";
import { hasPermission } from "@/lib/admin/permissions";

export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true } };
export const dynamic = "force-dynamic";

export default async function AdminCrmLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const actor = await getAdminSessionUser();
  if (!actor) redirect(`/${locale}/admin`);
  if (!hasPermission(actor.permissions, "requests.manage")) redirect(`/${locale}/admin`);

  return (
    <main className="page-frame relative min-h-dvh overflow-hidden px-3 py-6 text-primary sm:px-4 sm:py-10">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute left-[8%] top-10 h-56 w-56 rounded-full bg-cyan-400/14 blur-3xl" />
        <div className="absolute right-[7%] top-24 h-72 w-72 rounded-full bg-emerald-400/12 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl" />
      </div>

      <section className="container relative grid gap-5">
        <header className="gradient-border rounded-[2rem]">
          <div className="elevated-panel p-5 sm:p-6 md:p-7">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:underline"
            >
              <ArrowLeft className="size-4" />
              Back to admin workspace
            </Link>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Back-office CRM</p>
                <h1 className="mt-2 text-balance text-3xl font-semibold leading-tight sm:text-4xl">Contacts and conversations</h1>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
                  Add contacts, keep every email in one thread, draft with AI and send a professional reply without leaving
                  the workspace.
                </p>
              </div>
              <div className="text-right text-xs text-muted">
                <p className="font-semibold text-primary">{actor.email}</p>
                <p>{actor.role}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-xs font-semibold text-accent">
                <Target className="size-3.5" /> CRM
              </span>
              <Link
                href="/admin/outreach"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-muted transition hover:text-primary"
              >
                Outreach console
              </Link>
            </div>
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}
