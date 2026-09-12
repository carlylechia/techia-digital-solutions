import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { AdminBonusClaimsWorkspace } from "@/components/admin/admin-bonus-claims-workspace";
import { isLocale, type Locale } from "@/content/site";
import { loadAdminCourseBonusClaims, loadAdminCourseBonusClaimSummary } from "@/lib/admin/courseBonusClaims";
import { hasPermission } from "@/lib/admin/permissions";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { createMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";

  return {
    ...createMetadata({
      locale,
      title: "Academy Bonus Claims Admin",
      description:
        "Review academy buyer bonus claims, verify proof, and deliver requested bonus files.",
      path: "/admin/bonus-claims",
    }),
    robots: { index: false, follow: false },
  };
}

export default async function AdminBonusClaimsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/admin");
  }

  if (!hasPermission(session.user.permissions, "requests.manage")) {
    redirect("/admin");
  }

  const prisma = getPrisma();
  if (!prisma) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background p-4 text-primary">
        <section className="gradient-border max-w-xl rounded-[1.75rem]">
          <div className="elevated-panel p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Database unavailable
            </p>
            <h1 className="mt-3 text-3xl font-semibold">
              Academy bonus claims are temporarily unavailable.
            </h1>
            <p className="mt-3 text-muted">
              Restore database connectivity to review buyer proof and deliver
              bonus resources.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const [claims, summary] = await Promise.all([
    loadAdminCourseBonusClaims(prisma),
    loadAdminCourseBonusClaimSummary(prisma),
  ]);

  return (
    <main className="page-frame relative min-h-dvh overflow-hidden px-3 py-6 text-primary sm:px-4 sm:py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[8%] top-10 h-56 w-56 rounded-full bg-cyan-400/14 blur-3xl" />
        <div className="absolute right-[7%] top-24 h-72 w-72 rounded-full bg-emerald-400/12 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl" />
      </div>

      <section className="container relative grid gap-6">
        <div className="gradient-border rounded-[2rem]">
          <div className="elevated-panel p-6 sm:p-7 md:p-8">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
            >
              <ArrowLeft className="size-4" />
              Back to admin workspace
            </Link>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  teChia Digital Academy
                </p>
                <h1 className="mt-3 text-balance text-4xl font-semibold leading-tight sm:text-5xl">
                  Buyer bonus claims inbox
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
                  Every buyer proof submission lands here for manual
                  verification. From this screen you can review the order proof,
                  confirm the request, email all requested bonus files, and open
                  a WhatsApp delivery bundle with secure access links.
                </p>
              </div>

              <div className="rounded-[1.45rem] border border-cyan-500/20 bg-cyan-500/[0.08] p-5 text-sm leading-7 text-cyan-100">
                Email delivery is fully automated from this panel. WhatsApp
                delivery opens a ready-to-send message containing the secure
                buyer-specific bonus links.
              </div>
            </div>
          </div>
        </div>

        <AdminBonusClaimsWorkspace
          locale={locale}
          claims={claims}
          summary={summary}
        />
      </section>
    </main>
  );
}
