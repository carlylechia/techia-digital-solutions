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
    title:
      locale === "fr"
        ? "Conversations IA · Admin · teChia"
        : "AI Conversations · Admin · teChia",
    robots: { index: false, follow: false },
  };
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-400 border-green-500/20",
  CLOSED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  ABANDONED: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default async function AIConversationsPage({
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
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl md:text-6xl">AI Conversations</h1>
          <p className="mt-4 text-sm text-muted sm:text-base">
            Sign in to access the AI conversations dashboard.
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
          <h1 className="mt-3 text-3xl font-semibold">AI Conversations cannot load yet.</h1>
          <p className="mt-3 text-muted">
            Set DATABASE_URL and run Prisma migrations to enable this view.
          </p>
        </section>
      </main>
    );
  }

  const sp = await searchParams;
  const statusFilter = sp.status ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (statusFilter) where.status = statusFilter;

  const result = await (async () => {
    try {
      const data = await Promise.all([
        prisma.aIConversation.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            sessionId: true,
            visitorName: true,
            visitorEmail: true,
            status: true,
            messageCount: true,
            totalTokens: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.aIConversation.count({ where }),
      ]);

      return { data, error: null as unknown };
    } catch (error) {
      console.error("admin_ai_conversations_load_failed", getErrorMessage(error));
      return { data: null, error };
    }
  })();

  if (!result.data) {
    const description = isPrismaSchemaDriftError(result.error, ["AIConversation"])
      ? "Run the latest Prisma migrations to create the AI agent tables for this dashboard."
      : "Check the database connection and latest AI agent migration, then reload this page.";

    return (
      <main className="grid min-h-dvh place-items-center bg-background p-4 text-primary">
        <section className="max-w-xl rounded-lg border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            AI data unavailable
          </p>
          <h1 className="mt-3 text-3xl font-semibold">AI Conversations cannot load yet.</h1>
          <p className="mt-3 text-muted">{description}</p>
        </section>
      </main>
    );
  }

  const [conversations, total] = result.data;

  const totalPages = Math.ceil(total / pageSize);
  const baseHref = `/${locale}/admin/ai-conversations`;

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
            <h1 className="mt-1 text-2xl font-bold">AI Conversations</h1>
            <p className="text-sm text-muted">{total} total</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["", "ACTIVE", "CLOSED", "ABANDONED"].map((s) => (
              <a
                key={s || "all"}
                href={`${baseHref}?status=${s}&page=1`}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  statusFilter === s
                    ? "bg-accent text-white border-accent"
                    : "border-border text-muted hover:border-accent hover:text-accent",
                ].join(" ")}
              >
                {s || "All"}
              </a>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted">Session</th>
                <th className="px-4 py-3 font-medium text-muted">Visitor</th>
                <th className="px-4 py-3 font-medium text-muted">Email</th>
                <th className="px-4 py-3 font-medium text-muted">Status</th>
                <th className="px-4 py-3 font-medium text-muted">Messages</th>
                <th className="px-4 py-3 font-medium text-muted">Tokens</th>
                <th className="px-4 py-3 font-medium text-muted">Created</th>
              </tr>
            </thead>
            <tbody>
              {conversations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    No conversations found.
                  </td>
                </tr>
              )}
              {conversations.map((conv) => (
                <tr
                  key={conv.id}
                  className="border-b border-border/50 last:border-0 hover:bg-surface/50"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {conv.sessionId.slice(0, 12)}…
                  </td>
                  <td className="px-4 py-3 text-primary">{conv.visitorName || "—"}</td>
                  <td className="px-4 py-3 text-muted">
                    {conv.visitorEmail ? (
                      <a
                        href={`mailto:${conv.visitorEmail}`}
                        className="hover:text-accent transition-colors"
                      >
                        {conv.visitorEmail}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        STATUS_COLORS[conv.status] ?? "bg-muted/10 text-muted border-muted/20",
                      ].join(" ")}
                    >
                      {conv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-muted">{conv.messageCount}</td>
                  <td className="px-4 py-3 text-center text-muted">
                    {conv.totalTokens.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {conv.createdAt.toLocaleDateString()}
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
                  href={`${baseHref}?status=${statusFilter}&page=${page - 1}`}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-primary hover:border-accent transition-colors"
                >
                  ← Previous
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`${baseHref}?status=${statusFilter}&page=${page + 1}`}
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
