import { notFound } from "next/navigation";
import { SocialShareKit } from "@/components/blog/social-share-kit";
import { getBlogSessionUser } from "@/lib/blog/auth";
import { isSuperAdminUser } from "@/lib/blog/auth";
import type { BlogLocale } from "@/lib/blog/constants";
import { PageBreadcrumbs } from "@/components/ui/page-breadcrumbs";

export const dynamic = "force-dynamic";

export default async function SocialShareKitPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "en" && rawLocale !== "fr") notFound();
  const locale = rawLocale as BlogLocale;
  const user = await getBlogSessionUser();
  if (!user || !isSuperAdminUser(user)) notFound();
  const query = await searchParams;
  const metaNotice = typeof query.meta === "string" ? query.meta : null;
  const metaReason = typeof query.reason === "string" ? query.reason : null;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageBreadcrumbs
        items={[
          { label: "Admin", href: `/${locale}/admin` },
          { label: "Blog", href: `/${locale}/admin/blog` },
          { label: "Social Share Kit" },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-primary">
          Social Share Kit
        </h1>
        <p className="text-sm text-muted mt-1">
          Turn an article into platform-ready captions and branded graphics,
          then publish manually or — with explicit approval — directly to a
          connected Facebook Page or Instagram account.
        </p>
      </div>
      <SocialShareKit
        locale={locale}
        metaNotice={metaNotice}
        metaReason={metaReason}
      />
    </div>
  );
}
