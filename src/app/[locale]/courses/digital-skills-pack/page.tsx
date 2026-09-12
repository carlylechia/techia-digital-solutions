import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/content/site";
import { getPublicAppPath } from "@/lib/site-routes";

export default async function LegacyDigitalSkillsPackPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  redirect(
    getPublicAppPath("/courses/complete-digital-skills-pack"),
  );
}
