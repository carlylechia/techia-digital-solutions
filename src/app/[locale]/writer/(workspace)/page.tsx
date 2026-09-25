import Link from "next/link";
import { ArrowRight, FilePlus2, MessageSquareText } from "lucide-react";
import { notFound } from "next/navigation";
import { BlogWorkspaceShell } from "@/components/blog/blog-workspace-shell";
import { getBlogDashboard } from "@/lib/blog/admin-data";
import { getBlogSessionUser } from "@/lib/blog/auth";
import { BLOG_STATUS_LABELS, type BlogLocale } from "@/lib/blog/constants";

export const dynamic = "force-dynamic";

function date(value: Date | string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function dateTime(value: Date | string, locale: BlogLocale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function WriterDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "en" && rawLocale !== "fr") notFound();
  const locale = rawLocale as BlogLocale;
  const user = await getBlogSessionUser();
  if (!user) notFound();
  const data = await getBlogDashboard(user, locale);
  return <BlogWorkspaceShell locale={locale} user={user} mode="writer" title="Your writing desk" description="Draft, review, and publish your own articles without access to the rest of the teChia operations workspace."><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Stat label="Drafts" value={data.counts.DRAFT} /><Stat label="In review" value={data.counts.IN_REVIEW} /><Stat label="Changes requested" value={data.counts.CHANGES_REQUESTED} /><Stat label="Scheduled" value={data.counts.SCHEDULED} /><Stat label="Published" value={data.counts.PUBLISHED} /></div><div className="mt-8 grid gap-6 xl:grid-cols-[1fr_20rem]"><section className="premium-card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5 sm:p-6"><div><p className="eyebrow">Your articles</p><h2 className="mt-2 text-xl font-semibold text-primary">Recent work</h2></div><Link href={`/${locale}/writer/posts/new`} className="btn-primary"><FilePlus2 className="size-4" />New article</Link></div>{data.recentPosts.length ? <div className="divide-y divide-border">{data.recentPosts.map((post) => <Link key={post.id} href={`/${locale}/writer/posts/${post.id}`} className="flex flex-wrap items-center justify-between gap-3 p-5 transition hover:bg-surface-strong/60"><div><p className="font-semibold text-primary">{post.title}</p><p className="mt-1 text-xs text-muted">{post.category?.name || "Uncategorised"} · Updated {date(post.updatedAt)}{post.status === "SCHEDULED" && post.scheduledAt ? <> · Scheduled for {dateTime(post.scheduledAt, locale)}</> : null}</p></div><span className="status-pill">{BLOG_STATUS_LABELS[locale][post.status as keyof typeof BLOG_STATUS_LABELS[BlogLocale]]}</span></Link>)}</div> : <div className="p-10 text-center"><p className="font-semibold text-primary">Your desk is ready.</p><p className="mt-2 text-sm text-muted">Start with a useful idea for your audience.</p></div>}</section><aside className="grid content-start gap-5"><div className="premium-card p-5"><MessageSquareText className="size-5 text-accent" /><h2 className="mt-4 font-semibold text-primary">How review works</h2><ol className="mt-3 grid gap-3 text-sm leading-6 text-muted"><li>1. Save a complete draft.</li><li>2. Submit it for administrator review.</li><li>3. Read the review note and make requested changes.</li><li>4. Your administrator publishes when it is ready.</li></ol></div><div className="premium-card p-5"><p className="eyebrow">Need a starting point?</p><p className="mt-3 text-sm leading-6 text-muted">Choose a focused topic, answer a real business question, and link readers to the right teChia service or resource.</p><Link href={`/${locale}/writer/profile`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">Complete your author profile <ArrowRight className="size-4" /></Link></div></aside></div></BlogWorkspaceShell>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="premium-card p-5"><p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">{label}</p><p className="mt-3 text-3xl font-semibold text-primary">{value}</p></div>; }
