import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WriterLoginForm } from "@/components/blog/writer-login-form";
import { isLocale, type Locale } from "@/content/site";

export const metadata: Metadata = { title: "Writer sign in", robots: { index: false, follow: false } };

export default async function WriterLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  return <main className="grid min-h-dvh place-items-center bg-background px-4 py-10 text-primary"><div className="w-full max-w-5xl"><div className="mb-6 text-center"><Link href="/" className="text-sm font-semibold text-accent hover:underline">teChia Digital Solutions</Link></div><WriterLoginForm locale={locale} /><p className="mt-5 text-center text-xs text-muted"><Link href="/admin" className="hover:text-accent">{locale === "fr" ? "Accès admin" : "Administrator access"}</Link></p></div></main>;
}
