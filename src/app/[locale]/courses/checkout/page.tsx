import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/content/site";
import { createMetadata } from "@/lib/seo";
import { resolveCheckoutItem } from "@/lib/payments/checkout";
import { getAvailablePaymentProviders, internalCheckoutEnabled } from "@/lib/payments/providers";
import { formatMoney } from "@/lib/payments/money";
import { CheckoutForm } from "@/components/courses/checkout/CheckoutForm";

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
  const providers = getAvailablePaymentProviders().filter((p) => p.configured);
  const copy =
    locale === "fr"
      ? {
          title: "Paiement sécurisé",
          unavailable:
            "Le paiement interne n’est pas encore disponible pour cet article. Veuillez réessayer plus tard ou contacter teChia pour assistance.",
          summary: "Résumé de commande",
          total: "Total",
          typeLabel: parsed.type === "pack" ? "Pack" : "Cours",
        }
      : {
          title: "Secure checkout",
          unavailable:
            "Internal checkout is not available for this item yet. Please try again later or contact teChia for assistance.",
          summary: "Order summary",
          total: "Total",
          typeLabel: parsed.type === "pack" ? "Pack" : "Course",
        };

  return (
    <main className="container py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <p className="eyebrow">{copy.title}</p>
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
            </div>
          </section>

          <section className="gradient-border rounded-[1.8rem]">
            <div className="elevated-panel p-6 sm:p-7">
              {enabled && providers.length > 0 ? (
                <CheckoutForm
                  locale={locale}
                  itemType={parsed.type}
                  itemSlug={item.slug}
                  providers={providers.map((p) => ({
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
