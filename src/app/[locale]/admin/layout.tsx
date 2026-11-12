import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/content/site";
import { AdminMobileToolbar } from "@/components/admin/AdminMobileToolbar";
import { AdminPwaRegistration } from "@/components/admin/admin-pwa-registration";

export const metadata: Metadata = {
  manifest: "/admin/manifest.json",
  robots: { index: false, follow: false, nocache: true },
  themeColor: "#ef4444",
  appleWebApp: {
    capable: true,
    title: "teChia Admin",
    statusBarStyle: "black-translucent",
  },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="admin-portal">
      <AdminPwaRegistration />
      {children}
      <AdminMobileToolbar locale={locale} />
    </div>
  );
}