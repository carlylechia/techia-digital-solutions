import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { hasPermission } from "@/lib/admin/permissions";
import { getBlogSessionUser } from "@/lib/blog/auth";
import { isLocale } from "@/content/site";

export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true } };

export default async function AdminBlogLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await getBlogSessionUser();
  if (!user) redirect("/admin");
  if (!hasPermission(user.permissions, "blog.dashboard.view")) redirect(`/${locale}/writer`);
  return <>{children}</>;
}
