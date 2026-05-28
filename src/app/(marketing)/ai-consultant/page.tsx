import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isLocale } from "@/content/site";

export default async function AIConsultantRedirectPage() {
  const cookieStore = await cookies();
  const preferredLocale =
    cookieStore.get("techia-locale")?.value ??
    cookieStore.get("techia-interface-locale")?.value ??
    "en";
  const locale = isLocale(preferredLocale) ? preferredLocale : "en";

  redirect(`/${locale}/ai-consultant`);
}
