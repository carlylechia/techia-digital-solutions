import Link from "next/link";
import { FilePlus2, Search } from "lucide-react";
import { notFound } from "next/navigation";
import { hasPermission } from "@/lib/admin/permissions";
import { BlogWorkspaceShell } from "@/components/blog/blog-workspace-shell";
import { getBlogPostsForList } from "@/lib/blog/admin-data";
import { getBlogSessionUser } from "@/lib/blog/auth";
import { BLOG_STATUS_LABELS, type BlogLocale } from "@/lib/blog/constants";

export const dynamic = "force-dynamic";
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] || "" : value || ""; }
function formatSchedule(value: Date | string, locale: BlogLocale) { return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

export default async function AdminBlogPostsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SearchParams }) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "en" && rawLocale !== "fr") notFound();
  const locale = rawLocale as BlogLocale;
  const user = await getBlogSessionUser();
  if (!user || !hasPermission(user.permissions, "blog.posts.manage")) notFound();
  const canCreate = hasPermission(user.permissions, "blog.posts.create");
  const query = await searchParams;
  const status = first(query.status);
  const search = first(query.q).toLowerCase();
  const list = await getBlogPostsForList(user, locale, { query: search, status, page: Number(first(query.page) || 1) });
  const posts = list.posts;
  return <BlogWorkspaceShell locale={locale} user={user} mode="admin" title="Articles" description="Review every language, author assignment, workflow state, and publication setting from one queue."><div className="flex flex-wrap items-center justify-between gap-4"><form className="flex gap-2" method="get"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><input name="q" defaultValue={first(query.q)} className="form-input pl-10" placeholder="Search titles" /></div><button className="btn-secondary" type="submit">Search</button></form>{canCreate ? <Link href={`/${locale}/admin/blog/posts/new`} className="btn-primary"><FilePlus2 className="size-4" />New article</Link> : null}</div><div className="mt-6 flex flex-wrap gap-2">{["", ...Object.keys(BLOG_STATUS_LABELS[locale])].map((value) => <Link key={value || "all"} href={value ? `?status=${value}` : "."} className={`rounded-full border px-3 py-2 text-xs font-semibold ${status === value ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:border-accent"}`}>{value ? BLOG_STATUS_LABELS[locale][value as keyof typeof BLOG_STATUS_LABELS[BlogLocale]] : "All"}</Link>)}</div><div className="premium-card mt-6 overflow-hidden">{posts.length ? <div className="divide-y divide-border">{posts.map((post) => <Link key={post.id} href={`/${locale}/admin/blog/posts/${post.id}`} className="flex flex-wrap items-center justify-between gap-4 p-5 transition hover:bg-surface-strong/60 sm:p-6"><div><p className="font-semibold text-primary">{post.title}</p><p className="mt-1 text-xs text-muted">{post.author?.displayName || "Unassigned"} · {post.category?.name || "Uncategorised"} · Updated {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(post.updatedAt))}{post.status === "SCHEDULED" && post.scheduledAt ? <> · Scheduled for {formatSchedule(post.scheduledAt, locale)}</> : null}</p></div><span className="status-pill">{BLOG_STATUS_LABELS[locale][post.status as keyof typeof BLOG_STATUS_LABELS[BlogLocale]]}</span></Link>)}</div> : <div className="p-12 text-center text-sm text-muted">No articles match this view.</div>}</div></BlogWorkspaceShell>;
}
