import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalSession, getPortalLocale } from "@/lib/portal-auth";
import { getPortalDict } from "@/lib/portal-i18n";
import { PortalLoginForm } from "@/components/site/portal-login-form";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Client Portal — Sign In | teChia Digital Solutions",
  description: "Access your teChia client workspace to track projects, view files, and communicate with your team.",
  robots: { index: false, follow: false },
};

export default async function PortalLoginPage() {
  const session = await getPortalSession();
  if (session) redirect("/client-portal");

  const locale = await getPortalLocale();
  const t = getPortalDict(locale);

  return (
    <div className="dark min-h-screen bg-[#030b16] text-white">
      <div className="flex min-h-screen flex-col items-center justify-center px-3 py-8 sm:px-4 sm:py-12">
        {/* Background glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/[0.06] blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-600/[0.05] blur-[80px]" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Logo */}
          <div className="mb-6 flex justify-center sm:mb-8">
            <Logo variant="horizontal" size="sm" theme="dark" />
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#040d1c] shadow-2xl">
            <div className="p-5 sm:p-8">
              <div className="mb-6 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-cyan-400/80">
                  {t.login.badge}
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-white">
                  {t.login.heading}
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  {t.login.subheading}
                </p>
              </div>

              <PortalLoginForm locale={locale} />
            </div>

            <div className="border-t border-white/[0.06] px-5 py-4 text-center sm:px-8">
              <p className="text-xs text-slate-600">
                {t.login.noCode}{" "}
                <Link href="/contact" className="text-cyan-400 transition-colors hover:text-cyan-300">
                  {t.login.contactUs}
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-700">
            {t.login.copyright(new Date().getFullYear())}
          </p>
        </div>
      </div>
    </div>
  );
}
