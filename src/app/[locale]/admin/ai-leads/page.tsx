import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
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
    title: locale === "fr" ? "Leads IA · Admin · teChia" : "AI Leads · Admin · teChia",
    robots: { index: false, follow: false },
  };
}

const SCORE_COLORS: Record<string, string> = {
  HOT: "bg-red-500/10 text-red-400 border-red-500/20",
  WARM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  COLD: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-accent/10 text-accent border-accent/20",
  CONTACTED: "bg-green-500/10 text-green-400 border-green-500/20",
  QUALIFIED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  CLOSED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default async function AILeadsPage({
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
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl md:text-6xl">AI Leads</h1>
          <p className="mt-4 text-sm text-muted sm:text-base">
            Sign in to access the AI leads dashboard.
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
          <h1 className="mt-3 text-3xl font-semibold">AI Leads cannot load yet.</h1>
          <p className="mt-3 text-muted">
            Set DATABASE_URL and run Prisma migrations to enable this view.
          </p>
        </section>
      </main>
    );
  }

  const sp = await searchParams;
  const scoreFilter = sp.score ?? "";
  const statusFilter = sp.status ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (scoreFilter) where.leadScore = scoreFilter;
  if (statusFilter) where.status = statusFilter;

  const result = await (async () => {
    try {
      const data = await Promise.all([
        prisma.aILead.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.aILead.count({ where }),
      ]);

      return { data, error: null as unknown };
    } catch (error) {
      console.error("admin_ai_leads_load_failed", getErrorMessage(error));
      return { data: null, error };
    }
  })();

  if (!result.data) {
    const description = isPrismaSchemaDriftError(result.error, ["AILead"])
      ? "Run the latest Prisma migrations to create the AI agent tables for this dashboard."
      : "Check the database connection and latest AI agent migration, then reload this page.";

    return (
      <main className="grid min-h-dvh place-items-center bg-background p-4 text-primary">
        <section className="max-w-xl rounded-lg border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            AI data unavailable
          </p>
          <h1 className="mt-3 text-3xl font-semibold">AI Leads cannot load yet.</h1>
          <p className="mt-3 text-muted">{description}</p>
        </section>
      </main>
    );
  }

  const [leads, total] = result.data;

  const totalPages = Math.ceil(total / pageSize);
  const baseHref = `/${locale}/admin/ai-leads`;

  void redirect; // suppress unused import warning

  return (
    <main className="min-h-dvh bg-background px-3 py-8 text-primary sm:px-4 sm:py-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a
              href={`/${locale}/admin`}
              className="text-xs text-muted hover:text-primary transition-colors"
            >
              ← Admin
            </a>
            <h1 className="mt-1 text-2xl font-bold">AI Leads</h1>
            <p className="text-sm text-muted">{total} total</p>
          </div>
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {["", "HOT", "WARM", "COLD"].map((s) => (
              <a
                key={s || "all-score"}
                href={`${baseHref}?score=${s}&status=${statusFilter}&page=1`}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  scoreFilter === s
                    ? "bg-accent text-white border-accent"
                    : "border-border text-muted hover:border-accent hover:text-accent",
                ].join(" ")}
              >
                {s || "All scores"}
              </a>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted">Name</th>
                <th className="px-4 py-3 font-medium text-muted">Email</th>
                <th className="px-4 py-3 font-medium text-muted">Company</th>
                <th className="px-4 py-3 font-medium text-muted">Service</th>
                <th className="px-4 py-3 font-medium text-muted">Score</th>
                <th className="px-4 py-3 font-medium text-muted">Status</th>
                <th className="px-4 py-3 font-medium text-muted">Created</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    No AI leads found.
                  </td>
                </tr>
              )}
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-border/50 last:border-0 hover:bg-surface/50">
                  <td className="px-4 py-3 font-medium text-primary">{lead.name || "—"}</td>
                  <td className="px-4 py-3 text-muted">
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} className="hover:text-accent transition-colors">
                        {lead.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{lead.companyName || "—"}</td>
                  <td className="px-4 py-3 text-primary">{lead.serviceInterest}</td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase",
                        SCORE_COLORS[lead.leadScore] ?? "bg-muted/10 text-muted border-muted/20",
                      ].join(" ")}
                    >
                      {lead.leadScore}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        STATUS_COLORS[lead.status] ?? "bg-muted/10 text-muted border-muted/20",
                      ].join(" ")}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">
                    {lead.createdAt.toLocaleDateString()}
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
                  href={`${baseHref}?score=${scoreFilter}&status=${statusFilter}&page=${page - 1}`}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-primary hover:border-accent transition-colors"
                >
                  ← Previous
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`${baseHref}?score=${scoreFilter}&status=${statusFilter}&page=${page + 1}`}
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
