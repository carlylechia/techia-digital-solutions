import { notFound } from "next/navigation";
import { BlogWorkspaceShell } from "@/components/blog/blog-workspace-shell";
import { MediaLibrary } from "@/components/blog/media-library";
import { getBlogMedia } from "@/lib/blog/admin-data";
import { getBlogSessionUser } from "@/lib/blog/auth";
import type { BlogLocale } from "@/lib/blog/constants";

export const dynamic = "force-dynamic";

export default async function AdminBlogMediaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "en" && rawLocale !== "fr") notFound();
  const locale = rawLocale as BlogLocale;
  const user = await getBlogSessionUser();
  if (!user) notFound();
  const media = await getBlogMedia();
  return <BlogWorkspaceShell locale={locale} user={user} mode="admin" title="Media library" description="Keep article images organized, optimized, and accessible without exposing arbitrary upload URLs."><MediaLibrary initialMedia={media.map((item) => ({ id: item.id, publicId: item.publicId, url: item.url, format: item.format, mimeType: item.mimeType, width: item.width, height: item.height, bytes: item.bytes, altText: item.altText, createdAt: item.createdAt.toISOString(), uploadedBy: item.uploadedBy?.name || null }))} /></BlogWorkspaceShell>;
}
