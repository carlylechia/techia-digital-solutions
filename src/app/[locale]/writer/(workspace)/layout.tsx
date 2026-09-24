import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { isLocale } from "@/content/site";
import { getBlogSessionUser } from "@/lib/blog/auth";
import { hasPermission } from "@/lib/admin/permissions";

export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true } };

export default async function WriterWorkspaceLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await getBlogSessionUser();
  if (!user) redirect(`/${locale}/writer/login`);
  if (hasPermission(user.permissions, "blog.posts.manage")) redirect(`/${locale}/admin/blog`);
  if (!hasPermission(user.permissions, "blog.dashboard.view")) redirect(`/${locale}/writer/login`);
  return <>{children}</>;
}
