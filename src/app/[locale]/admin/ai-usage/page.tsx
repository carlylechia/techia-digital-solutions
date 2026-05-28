import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { Logo } from "@/components/brand/Logo";
import { isLocale, type Locale } from "@/content/site";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage, isPrismaSchemaDriftError } from "@/lib/prisma-errors";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return {
    title: locale === "fr" ? "Usage IA · Admin · teChia" : "AI Usage · Admin · teChia",
    robots: { index: false, follow: false },
  };
}

export default async function AIUsagePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <main className="min-h-dvh bg-background px-3 py-8 text-primary sm:px-4 sm:py-12">
        <section className="mx-auto mb-8 max-w-3xl text-center">
          <div className="mb-6 flex justify-center sm:mb-8">
            <Logo locale={locale} variant="horizontal" size="md" theme="auto" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Secure admin</p>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl md:text-6xl">AI Usage</h1>
          <p className="mt-4 text-sm text-muted sm:text-base">
            Sign in to access the AI usage dashboard.
          </p>
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
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Database unavailable
          </p>
          <h1 className="mt-3 text-3xl font-semibold">AI Usage cannot load yet.</h1>
          <p className="mt-3 text-muted">
            Set DATABASE_URL and run Prisma migrations to enable this view.
          </p>
        </section>
      </main>
    );
  }

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const pageSize = 20;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const result = await (async () => {
    try {
      const data = await Promise.all([
        prisma.aIUsage.aggregate({
          _sum: { totalTokens: true, estimatedCost: true, inputTokens: true, outputTokens: true },
          _count: { id: true },
          where: { requestType: "PUBLIC_AGENT", createdAt: { gte: startOfDay } },
        }),
        prisma.aIUsage.aggregate({
          _sum: { totalTokens: true, estimatedCost: true },
          _count: { id: true },
          where: { requestType: "PUBLIC_AGENT", createdAt: { gte: startOfMonth } },
        }),
        prisma.aIUsage.findMany({
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            sessionId: true,
            model: true,
            inputTokens: true,
            outputTokens: true,
            totalTokens: true,
            estimatedCost: true,
            requestType: true,
            createdAt: true,
          },
        }),
        prisma.aIUsage.count(),
      ]);

      return { data, error: null as unknown };
    } catch (error) {
      console.error("admin_ai_usage_load_failed", getErrorMessage(error));
      return { data: null, error };
    }
  })();

  if (!result.data) {
    const description = isPrismaSchemaDriftError(result.error, ["AIUsage"])
      ? "Run the latest Prisma migrations to create the AI agent tables for this dashboard."
      : "Check the database connection and latest AI agent migration, then reload this page.";

    return (
      <main className="grid min-h-dvh place-items-center bg-background p-4 text-primary">
        <section className="max-w-xl rounded-lg border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            AI data unavailable
          </p>
          <h1 className="mt-3 text-3xl font-semibold">AI Usage cannot load yet.</h1>
          <p className="mt-3 text-muted">{description}</p>
        </section>
      </main>
    );
  }

  const [todayStats, monthStats, recentRecords, total] = result.data;

  const totalPages = Math.ceil(total / pageSize);
  const baseHref = `/${locale}/admin/ai-usage`;

  return (
    <main className="min-h-dvh bg-background px-3 py-8 text-primary sm:px-4 sm:py-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <a
            href={`/${locale}/admin`}
            className="text-xs text-muted hover:text-primary transition-colors"
          >
            ← Admin
          </a>
          <h1 className="mt-1 text-2xl font-bold">AI Usage</h1>
          <p className="text-sm text-muted">{total} total records</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Today requests
            </p>
            <p className="mt-2 text-3xl font-bold text-primary">
              {todayStats._count.id.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Today tokens</p>
            <p className="mt-2 text-3xl font-bold text-primary">
              {(todayStats._sum.totalTokens ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Month requests
            </p>
            <p className="mt-2 text-3xl font-bold text-primary">
              {monthStats._count.id.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Est. month cost
            </p>
            <p className="mt-2 text-3xl font-bold text-primary">
              ${(monthStats._sum.estimatedCost ?? 0).toFixed(4)}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted">Session</th>
                <th className="px-4 py-3 font-medium text-muted">Model</th>
                <th className="px-4 py-3 font-medium text-muted">In</th>
                <th className="px-4 py-3 font-medium text-muted">Out</th>
                <th className="px-4 py-3 font-medium text-muted">Total</th>
                <th className="px-4 py-3 font-medium text-muted">Est. cost</th>
                <th className="px-4 py-3 font-medium text-muted">Type</th>
                <th className="px-4 py-3 font-medium text-muted">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    No usage records found.
                  </td>
                </tr>
              )}
              {recentRecords.map((rec) => (
                <tr
                  key={rec.id}
                  className="border-b border-border/50 last:border-0 hover:bg-surface/50"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {rec.sessionId ? `${rec.sessionId.slice(0, 10)}…` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">{rec.model}</td>
                  <td className="px-4 py-3 text-muted">{rec.inputTokens}</td>
                  <td className="px-4 py-3 text-muted">{rec.outputTokens}</td>
                  <td className="px-4 py-3 font-medium text-primary">{rec.totalTokens}</td>
                  <td className="px-4 py-3 text-muted text-xs">${rec.estimatedCost.toFixed(6)}</td>
                  <td className="px-4 py-3 text-xs text-muted">{rec.requestType}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {rec.createdAt.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={`${baseHref}?page=${page - 1}`}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-primary hover:border-accent transition-colors"
                >
                  ← Previous
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`${baseHref}?page=${page + 1}`}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-primary hover:border-accent transition-colors"
                >
                  Next →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
