import { notFound } from "next/navigation";
import { BlogWorkspaceShell } from "@/components/blog/blog-workspace-shell";
import { getBlogDashboard } from "@/lib/blog/admin-data";
import { getBlogSessionUser } from "@/lib/blog/auth";
import type { BlogLocale } from "@/lib/blog/constants";

export const dynamic = "force-dynamic";

export default async function AdminBlogAuditPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "en" && rawLocale !== "fr") notFound();
  const locale = rawLocale as BlogLocale;
  const user = await getBlogSessionUser();
  if (!user) notFound();
  const data = await getBlogDashboard(user, locale);
  return <BlogWorkspaceShell locale={locale} user={user} mode="admin" title="Editorial audit log" description="A durable trail of article changes, workflow decisions, publishing actions, and writer access events."><div className="premium-card overflow-hidden">{data.audit.length ? <div className="divide-y divide-border">{data.audit.map((entry) => <div key={entry.id} className="grid gap-2 p-5 sm:grid-cols-[1fr_auto]"><div><p className="font-semibold text-primary">{entry.action.replaceAll(".", " · ")}</p><p className="mt-1 text-xs text-muted">{entry.actor?.name || entry.actor?.email || "System"} · resource {entry.entityId || "—"}</p></div><time className="text-xs text-muted" dateTime={entry.createdAt.toISOString()}>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(entry.createdAt)}</time></div>)}</div> : <p className="p-10 text-sm text-muted">No editorial audit events yet.</p>}</div></BlogWorkspaceShell>;
}
