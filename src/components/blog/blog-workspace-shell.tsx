import Link from "next/link";
import { BarChart3, BookOpen, FileText, FolderKanban, Images, LogIn, Settings, Users } from "lucide-react";
import { hasPermission } from "@/lib/admin/permissions";
import type { BlogSessionUser } from "@/lib/blog/auth";
import type { BlogLocale } from "@/lib/blog/constants";
import { BlogSignOutButton } from "./blog-sign-out-button";

export function BlogWorkspaceShell({
  locale,
  user,
  children,
  title,
  description,
  mode,
}: {
  locale: BlogLocale;
  user: BlogSessionUser;
  children: React.ReactNode;
  title: string;
  description?: string;
  mode: "writer" | "admin";
}) {
  const canWriters = hasPermission(user.permissions, "blog.writers.manage");
  const canCategories = hasPermission(user.permissions, "blog.categories.manage");
  const canMedia = hasPermission(user.permissions, "blog.media.manage");
  const canAudit = hasPermission(user.permissions, "blog.audit.view");
  const base = mode === "admin" ? `/${locale}/admin/blog` : `/${locale}/writer`;
  const links = [
    { href: base, label: mode === "admin" ? "Overview" : "My workspace", icon: BarChart3 },
    { href: `${base}/posts`, label: "Posts", icon: FileText },
    ...(mode === "writer" ? [{ href: `${base}/profile`, label: "Author profile", icon: Users }] : []),
    ...(mode === "admin" && canWriters ? [{ href: `${base}/writers`, label: "Writers", icon: Users }] : []),
    ...(mode === "admin" && canCategories ? [{ href: `${base}/categories`, label: "Categories", icon: FolderKanban }] : []),
    ...(mode === "admin" && canCategories ? [{ href: `${base}/tags`, label: "Tags", icon: BookOpen }] : []),
    ...(mode === "admin" && canMedia ? [{ href: `${base}/media`, label: "Media", icon: Images }] : []),
    ...(mode === "admin" && canAudit ? [{ href: `${base}/audit`, label: "Audit log", icon: Settings }] : []),
  ];

  return (
    <main className="min-h-dvh bg-background text-primary">
      <div className="mx-auto flex max-w-[1600px] flex-col lg:flex-row">
        <aside className="border-b border-border bg-surface-strong/50 p-4 lg:min-h-dvh lg:w-64 lg:border-b-0 lg:border-r lg:p-6">
          <div className="flex items-center justify-between gap-3 lg:block"><Link href={base} className="flex items-center gap-2 text-lg font-semibold tracking-tight"><span className="grid size-9 place-items-center rounded-xl bg-cyan-400/10 text-accent"><BookOpen className="size-5" /></span>Editorial Studio</Link><div className="lg:hidden"><BlogSignOutButton callbackUrl="/writer" /></div></div>
          <p className="mt-3 hidden text-xs leading-5 text-muted lg:block">teChia Digital Solutions<br />Digitalize. Simplify. Grow.</p>
          <nav className="mt-5 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1" aria-label="Editorial navigation">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-accent/10 hover:text-primary"><Icon className="size-4" />{label}</Link>)}</nav>
          <div className="mt-6 hidden border-t border-border pt-5 lg:block"><p className="truncate text-sm font-semibold text-primary">{user.name}</p><p className="mt-1 truncate text-xs text-muted">{user.email}</p><p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-accent">{mode === "admin" ? "Editorial admin" : "Writer access"}</p><div className="mt-4"><BlogSignOutButton callbackUrl={mode === "admin" ? "/admin" : "/writer"} /></div></div>
          {mode === "admin" ? <Link href="/admin" className="mt-5 hidden items-center gap-2 text-xs text-muted hover:text-accent lg:inline-flex"><LogIn className="size-3.5" />Operations workspace</Link> : null}
        </aside>
        <section className="min-w-0 flex-1 px-4 py-7 sm:px-7 lg:px-10 lg:py-10"><div className="mx-auto max-w-7xl"><header className="mb-8"><p className="eyebrow">{mode === "admin" ? "Editorial control room" : "Writer workspace"}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>{description ? <p className="mt-3 max-w-3xl text-sm leading-7 text-muted sm:text-base">{description}</p> : null}</header>{children}</div></section>
      </div>
    </main>
  );
}
