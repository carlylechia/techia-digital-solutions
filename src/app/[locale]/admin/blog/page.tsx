import Link from "next/link";
import { ArrowRight, FilePlus2, FolderKanban, Images, Settings, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { BlogWorkspaceShell } from "@/components/blog/blog-workspace-shell";
import { getBlogDashboard } from "@/lib/blog/admin-data";
import { getBlogSessionUser } from "@/lib/blog/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { BLOG_STATUS_LABELS, type BlogLocale } from "@/lib/blog/constants";

export const dynamic = "force-dynamic";

export default async function AdminBlogDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "en" && rawLocale !== "fr") notFound();
  const locale = rawLocale as BlogLocale;
  const user = await getBlogSessionUser();
  if (!user) notFound();
  const data = await getBlogDashboard(user, locale);
  const canWriters = hasPermission(user.permissions, "blog.writers.manage");
  const canCategories = hasPermission(user.permissions, "blog.categories.manage");
  const canMedia = hasPermission(user.permissions, "blog.media.manage");
  const canAudit = hasPermission(user.permissions, "blog.audit.view");
  const isBlogOnly = !hasPermission(user.permissions, "dashboard.view");

  return (
    <BlogWorkspaceShell
      locale={locale}
      user={user}
      mode="admin"
      title={isBlogOnly ? "Blog editor workspace" : "Editorial command center"}
      description="Review submissions, publish useful work, and keep the teChia knowledge base aligned with real business needs."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Total" value={data.counts.total} />
        <Stat label="Drafts" value={data.counts.DRAFT} />
        <Stat label="In review" value={data.counts.IN_REVIEW} />
        <Stat label="Scheduled" value={data.counts.SCHEDULED} />
        <Stat label="Published" value={data.counts.PUBLISHED} />
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_20rem]">
        <section className="premium-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5 sm:p-6">
            <div>
              <p className="eyebrow">Editorial activity</p>
              <h2 className="mt-2 text-xl font-semibold text-primary">Recent articles</h2>
            </div>
            {hasPermission(user.permissions, "blog.posts.create") ? (
              <Link href={`/${locale}/admin/blog/posts/new`} className="btn-primary">
                <FilePlus2 className="size-4" />New article
              </Link>
            ) : null}
          </div>
          {data.recentPosts.length ? (
            <div className="divide-y divide-border">
              {data.recentPosts.map((post) => (
                <Link key={post.id} href={`/${locale}/admin/blog/posts/${post.id}`} className="flex flex-wrap items-center justify-between gap-3 p-5 transition hover:bg-surface-strong/60">
                  <div>
                    <p className="font-semibold text-primary">{post.title}</p>
                    <p className="mt-1 text-xs text-muted">{post.author?.displayName || "Unassigned"} · {post.category?.name || "Uncategorised"}{post.status === "SCHEDULED" && post.scheduledAt ? <> · Scheduled for {new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(post.scheduledAt))}</> : null}</p>
                  </div>
                  <span className="status-pill">{BLOG_STATUS_LABELS[locale][post.status as keyof typeof BLOG_STATUS_LABELS[BlogLocale]]}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-muted">No articles in this language yet.</div>
          )}
        </section>
        <aside className="grid content-start gap-4">
          <QuickLink href={`/${locale}/admin/blog/posts`} icon={FilePlus2} title="Review queue" body="Open drafts, submissions, and scheduled work." />
          {canWriters ? <QuickLink href={`/${locale}/admin/blog/writers`} icon={Users} title="Writer access" body="Invite writers, review activity, and revoke access." /> : null}
          {canCategories ? <QuickLink href={`/${locale}/admin/blog/categories`} icon={FolderKanban} title="Taxonomy" body="Keep categories focused and useful." /> : null}
          {canMedia ? <QuickLink href={`/${locale}/admin/blog/media`} icon={Images} title="Media library" body="Manage alt text and editorial images." /> : null}
          {canAudit ? <QuickLink href={`/${locale}/admin/blog/audit`} icon={Settings} title="Editorial audit" body="Review changes across the blog workspace." /> : null}
        </aside>
      </div>
      {data.writers.length ? (
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="eyebrow">Team</p>
              <h2 className="mt-2 text-2xl font-semibold text-primary">Writers</h2>
            </div>
            {canWriters ? <Link href={`/${locale}/admin/blog/writers`} className="text-sm font-semibold text-accent hover:underline">Manage writers <ArrowRight className="inline size-4" /></Link> : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.writers.slice(0, 6).map((writer) => (
              <div key={writer.id} className="premium-card p-5">
                <p className="font-semibold text-primary">{writer.blogAuthor?.displayName || writer.name || writer.email}</p>
                <p className="mt-1 truncate text-xs text-muted">{writer.email}</p>
                <p className="mt-4 text-xs text-muted">{writer._count.blogPostsCreated} articles · {writer.status.toLowerCase()}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </BlogWorkspaceShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="premium-card p-5"><p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">{label}</p><p className="mt-3 text-3xl font-semibold text-primary">{value}</p></div>;
}

function QuickLink({ href, icon: Icon, title, body }: { href: string; icon: typeof FilePlus2; title: string; body: string }) {
  return <Link href={href} className="premium-card group flex gap-3 p-5 transition hover:border-accent"><Icon className="size-5 shrink-0 text-accent" /><span><strong className="block text-primary">{title}</strong><span className="mt-1 block text-xs leading-5 text-muted">{body}</span></span><ArrowRight className="ml-auto size-4 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-accent" /></Link>;
}
