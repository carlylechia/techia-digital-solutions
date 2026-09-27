import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { isLocale } from "@/content/site";
import { getPrisma } from "@/lib/prisma";
import { getOutreachActor } from "@/lib/outreach/auth";
import { OutreachNavLinks } from "@/components/admin/outreach/outreach-nav-links";

/**
 * Outreach section layout.
 *
 * The guard is identical in shape to the editorial admin layout: locale
 * validation, admin session, then the `outreach.view` permission. There is no
 * second authentication system and no client-side-only protection — every server
 * action and API route re-checks independently.
 */

export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true } };
export const dynamic = "force-dynamic";

export default async function AdminOutreachLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const actor = await getOutreachActor();
  if (!actor) redirect(`/${locale}/admin`);
  if (!actor.canView && actor.roleLevel < 100) redirect(`/${locale}/admin`);

  const prisma = getPrisma();
  const reviewCount = prisma
    ? await prisma.outreachMessage.count({ where: { status: "PENDING_APPROVAL" } }).catch(() => 0)
    : 0;

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
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">SME outreach engine</p>
                <h1 className="mt-2 text-balance text-3xl font-semibold leading-tight sm:text-4xl">Outreach console</h1>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
                  Discover local businesses, score their digital opportunity from evidence, review every message before it
                  leaves, and track replies and meetings. Autonomous sending is off by default.
                </p>
              </div>
              <div className="text-right text-xs text-muted">
                <p className="font-semibold text-primary">{actor.email}</p>
                <p>
                  {actor.role} · {actor.canSend ? "can send" : "cannot send"}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <OutreachNavLinks reviewCount={reviewCount} />
            </div>
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}
