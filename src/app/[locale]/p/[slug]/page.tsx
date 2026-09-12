import { redirect } from "next/navigation";

// Legacy redirect: /[locale]/p/[slug] → /[slug]
export default async function LegacyContentPageRedirect({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  redirect(`/${slug}`);
}
