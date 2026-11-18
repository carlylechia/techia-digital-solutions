import { notFound } from "next/navigation";
import { SocialShareKit } from "@/components/blog/social-share-kit";
import { getBlogSessionUser } from "@/lib/blog/auth";
import { isSuperAdminUser } from "@/lib/blog/auth";
import type { BlogLocale } from "@/lib/blog/constants";
import { PageBreadcrumbs } from "@/components/ui/page-breadcrumbs";

export const dynamic = "force-dynamic";

export default async function SocialShareKitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "en" && rawLocale !== "fr") notFound();
  const locale = rawLocale as BlogLocale;
  const user = await getBlogSessionUser();
  if (!user || !isSuperAdminUser(user)) notFound();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageBreadcrumbs items={[{ label: "Admin", href: `/${locale}/admin` }, { label: "Blog", href: `/${locale}/admin/blog` }, { label: "Social Share Kit" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-primary">Social Share Kit</h1>
        <p className="text-sm text-muted mt-1">
          Turn an article into platform-ready captions and branded graphics, then publish manually.
        </p>
      </div>
      <SocialShareKit locale={locale} />
    </div>
  );
}
