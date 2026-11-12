import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/content/site";
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { resolveCheckoutItem } from "@/lib/payments/checkout";
import { getAvailablePaymentProviders, internalCheckoutEnabled } from "@/lib/payments/providers";
import { formatMoney } from "@/lib/payments/money";
import { CheckoutForm } from "@/components/courses/checkout/CheckoutForm";
import { JsonLd } from "@/components/ui/json-ld";
import { PageBreadcrumbs } from "@/components/ui/page-breadcrumbs";
import {
  getCoursesSupportEmail,
  getCoursesWhatsappUrl,
} from "@/lib/courses/chariowLinks";
import { getPublicAppPath } from "@/lib/site-routes";

function parseItem(value: string | undefined) {
  if (!value) return null;
  const idx = value.indexOf(":");
  if (idx <= 0) return null;
  const type = value.slice(0, idx);
  const slug = value.slice(idx + 1);
  if ((type !== "course" && type !== "pack") || !slug) return null;
  return { type: type as "course" | "pack", slug };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return createMetadata({
    locale,
    title: locale === "fr" ? "Paiement sécurisé" : "Secure checkout",
    description:
      locale === "fr"
        ? "Finalisez votre achat teChia Digital Academy via un paiement sécurisé."
        : "Complete your teChia Digital Academy purchase through secure checkout.",
    path: "/courses/checkout",
  });
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ item?: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const { item: itemParam } = await searchParams;
  const parsed = parseItem(itemParam);
  if (!parsed) notFound();

  const item = await resolveCheckoutItem(locale, parsed.type, parsed.slug);
  if (!item) notFound();

  const enabled = internalCheckoutEnabled();
  const providers = (await getAvailablePaymentProviders()).filter((p) => p.configured);
  // Chariow can only serve items linked to a Chariow product; Moneroo can
  // serve any priced item. Hide providers that would fail at the last step.
  const usableProviders = providers.filter(
    (p) => p.id === "MONEROO" || Boolean(item.chariowProductId),
  );
  const copy =
    locale === "fr"
      ? {
          title: "Paiement sécurisé",
          unavailable:
            "Le paiement interne n’est pas encore disponible pour cet article. Veuillez réessayer plus tard ou contacter teChia pour assistance.",
          summary: "Résumé de commande",
          total: "Total",
          typeLabel: parsed.type === "pack" ? "Pack" : "Cours",
          back: parsed.type === "pack" ? "Retour au pack" : "Retour au cours",
          secureNote:
            "Paiement chiffré traité par le prestataire sélectionné. teChia ne stocke pas vos informations de carte.",
          support: "Contacter le support",
          whatsapp: "WhatsApp",
        }
      : {
          title: "Secure checkout",
          unavailable:
            "Internal checkout is not available for this item yet. Please try again later or contact teChia for assistance.",
          summary: "Order summary",
          total: "Total",
          typeLabel: parsed.type === "pack" ? "Pack" : "Course",
          back: parsed.type === "pack" ? "Back to pack" : "Back to course",
          secureNote:
            "Encrypted payment processed by the selected provider. teChia does not store your card details.",
          support: "Contact support",
          whatsapp: "WhatsApp",
        };

  const supportEmail = getCoursesSupportEmail();
  const whatsappUrl = getCoursesWhatsappUrl(
    locale === "fr"
      ? "Bonjour teChia, j'ai besoin d'aide pour finaliser mon paiement teChia Digital Academy."
      : "Hello teChia, I need help completing my teChia Digital Academy payment.",
  );

  return (
    <main className="container py-6 sm:py-10">
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: locale === "fr" ? "Accueil" : "Home", path: "" },
          { name: locale === "fr" ? "Cours" : "Courses", path: "/courses" },
          { name: copy.title, path: "/courses/checkout" },
        ])}
      />
      <PageBreadcrumbs
        className="mb-6"
        items={[
          {
            label: locale === "fr" ? "Accueil" : "Home",
            href: getPublicAppPath("/"),
          },
          {
            label: locale === "fr" ? "Cours" : "Courses",
            href: getPublicAppPath("/courses"),
          },
          { label: copy.title },
        ]}
      />

      <div className="mx-auto max-w-5xl">
        <Link
          href={item.path}
          className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {copy.back}
        </Link>
        <p className="eyebrow mt-6">{copy.title}</p>
        <h1 className="mt-4 text-3xl font-semibold text-primary sm:text-4xl">
          {item.title}
        </h1>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <section className="gradient-border rounded-[1.8rem]">
            <div className="elevated-panel p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                {copy.summary}
              </p>
              <p className="mt-3 text-sm text-muted">{copy.typeLabel}</p>
              <p className="mt-4 text-base leading-8 text-muted">{item.summary}</p>
              {item.financialDisclaimerRequired ? (
                <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-7 text-amber-900 dark:text-amber-100">
                  {locale === "fr"
                    ? "Ce contenu est fourni à des fins éducatives uniquement et ne constitue pas un conseil financier ou une garantie de résultats."
                    : "This content is provided for educational purposes only and does not constitute financial advice or a guarantee of results."}
                </p>
              ) : null}
              <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
                <span className="text-sm font-medium text-muted">{copy.total}</span>
                <span className="text-2xl font-semibold text-primary">
                  {formatMoney(item.priceMinor, item.currency, locale)}
                </span>
              </div>
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-background/70 p-4">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-500" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-primary">{copy.title}</p>
                  <p className="mt-1 text-xs leading-6 text-muted">{copy.secureNote}</p>
                </div>
              </div>
              {supportEmail || whatsappUrl ? (
                <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap">
                  {supportEmail ? (
                    <a
                      href={`mailto:${supportEmail}`}
                      className="inline-flex items-center gap-2 font-semibold text-accent hover:underline"
                    >
                      {copy.support}
                    </a>
                  ) : null}
                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 font-semibold text-accent hover:underline"
                    >
                      {copy.whatsapp}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          <section className="gradient-border rounded-[1.8rem]">
            <div className="elevated-panel p-6 sm:p-7">
              {enabled && usableProviders.length > 0 ? (
                <CheckoutForm
                  locale={locale}
                  itemType={parsed.type}
                  itemSlug={item.slug}
                  providers={usableProviders.map((p) => ({
                    id: p.id,
                    label: p.label,
                    description: p.description,
                  }))}
                />
              ) : (
                <p className="text-sm leading-7 text-muted">{copy.unavailable}</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
