import { notFound } from "next/navigation";
import { BlogWorkspaceShell } from "@/components/blog/blog-workspace-shell";
import { WriterProfileForm } from "@/components/blog/writer-profile-form";
import { WriterPasswordForm } from "@/components/blog/writer-password-form";
import { getBlogSessionUser } from "@/lib/blog/auth";
import { getWriterProfile } from "@/lib/blog/admin-data";
import type { BlogLocale } from "@/lib/blog/constants";

export const dynamic = "force-dynamic";

export default async function WriterProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "en" && rawLocale !== "fr") notFound();
  const locale = rawLocale as BlogLocale;
  const user = await getBlogSessionUser();
  if (!user) notFound();
  const profile = await getWriterProfile(user);
  if (!profile) return <BlogWorkspaceShell locale={locale} user={user} mode="writer" title="Author profile" description="Your administrator needs to link your writer account to an author profile before you can publish."><div className="premium-card p-8 text-sm text-muted">Ask an administrator to create or link your author profile.</div></BlogWorkspaceShell>;
  return <BlogWorkspaceShell locale={locale} user={user} mode="writer" title="Author profile" description="Keep your public byline accurate and useful. This information appears on published articles and your author page."><div className="grid gap-6"><div className="premium-card p-5 sm:p-8"><WriterProfileForm profile={{ displayName: profile.displayName, bio: profile.bio, jobTitle: profile.jobTitle || "", imageUrl: profile.imageUrl || "", imagePublicId: profile.imagePublicId || "", websiteUrl: profile.websiteUrl || "", linkedinUrl: profile.linkedinUrl || "", xUrl: profile.xUrl || "" }} /></div><div className="premium-card p-5 sm:p-8"><WriterPasswordForm /></div></div></BlogWorkspaceShell>;
}
