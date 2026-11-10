import type { Metadata } from "next";
import Link from "next/link";
import { isLocale, type Locale } from "@/content/site";
import { createMetadata } from "@/lib/seo";
import { getPublicAppPath } from "@/lib/site-routes";
import { isProviderId } from "@/lib/payments/providers";
import { verifyOrderReturn } from "@/lib/payments/fulfillment";
import { formatMoney } from "@/lib/payments/money";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return createMetadata({
    locale,
    title: locale === "fr" ? "Statut du paiement" : "Payment status",
    description:
      locale === "fr"
        ? "Vérification du statut de votre paiement teChia Digital Academy."
        : "Verification of your teChia Digital Academy payment status.",
    path: "/courses/checkout/return",
  });
}

export default async function CheckoutReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string; provider?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const { order: reference, provider: providerParam } = await searchParams;

  const provider = providerParam && isProviderId(providerParam) ? providerParam : null;
  const result =
    reference && provider
      ? await verifyOrderReturn({ reference, provider })
      : { status: "not_found" as const, order: null };

  const copy = {
    en: {
      title: "Payment status",
      paid: "Payment confirmed",
      paidBody:
        "Your payment has been verified successfully. If your purchase includes a teChia Buyer Bonus, you can claim it using your order reference.",
      pending: "Payment pending",
      pendingBody:
        "We have not received a final confirmation yet. This can take a short time depending on the payment method. Refresh this page in a moment or wait for confirmation.",
      failed: "Payment not completed",
      failedBody:
        "The payment was not completed. No access has been granted for this order. You can return to the course page and try again.",
      cancelled: "Payment cancelled",
      cancelledBody:
        "The payment was cancelled. No access has been granted for this order.",
      review: "Payment requires review",
      reviewBody:
        "We received a payment signal, but it needs manual review before access can be granted. Please contact teChia support with your order reference.",
      notFound: "Order not found",
      notFoundBody:
        "We could not verify this order. Please check the link or contact support with your payment details.",
      ref: "Order reference",
      total: "Total",
      claim: "Claim buyer bonus",
      browse: "Back to courses",
      refresh: "Refresh status",
    },
    fr: {
      title: "Statut du paiement",
      paid: "Paiement confirmé",
      paidBody:
        "Votre paiement a été vérifié avec succès. Si votre achat inclut un bonus acheteur teChia, vous pouvez le réclamer avec votre référence de commande.",
      pending: "Paiement en attente",
      pendingBody:
        "Nous n'avons pas encore reçu de confirmation finale. Cela peut prendre un court instant selon le moyen de paiement. Actualisez cette page dans un moment.",
      failed: "Paiement non finalisé",
      failedBody:
        "Le paiement n'a pas été finalisé. Aucun accès n'a été accordé pour cette commande. Vous pouvez revenir à la page du cours et réessayer.",
      cancelled: "Paiement annulé",
      cancelledBody:
        "Le paiement a été annulé. Aucun accès n'a été accordé pour cette commande.",
      review: "Paiement à vérifier",
      reviewBody:
        "Nous avons reçu un signal de paiement, mais une vérification manuelle est nécessaire avant d'accorder l'accès. Contactez le support teChia avec votre référence de commande.",
      notFound: "Commande introuvable",
      notFoundBody:
        "Nous n'avons pas pu vérifier cette commande. Vérifiez le lien ou contactez le support avec vos informations de paiement.",
      ref: "Référence de commande",
      total: "Total",
      claim: "Réclamer le bonus acheteur",
      browse: "Retour aux cours",
      refresh: "Actualiser le statut",
    },
  }[locale];

  const tone =
    result.status === "paid"
      ? "border-emerald-500/30 bg-emerald-500/10"
      : result.status === "pending"
        ? "border-cyan-500/30 bg-cyan-500/10"
        : result.status === "review"
          ? "border-amber-500/30 bg-amber-500/10"
          : "border-rose-500/30 bg-rose-500/10";

  const heading =
    result.status === "paid"
      ? copy.paid
      : result.status === "pending"
        ? copy.pending
        : result.status === "failed"
          ? copy.failed
          : result.status === "cancelled"
            ? copy.cancelled
            : result.status === "review"
              ? copy.review
              : copy.notFound;

  const body =
    result.status === "paid"
      ? copy.paidBody
      : result.status === "pending"
        ? copy.pendingBody
        : result.status === "failed"
          ? copy.failedBody
          : result.status === "cancelled"
            ? copy.cancelledBody
            : result.status === "review"
              ? copy.reviewBody
              : copy.notFoundBody;

  return (
    <main className="container py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">{copy.title}</p>
        <div className={`mt-6 rounded-[1.8rem] border p-6 sm:p-8 ${tone}`}>
          <h1 className="text-3xl font-semibold text-primary">{heading}</h1>
          <p className="mt-4 text-base leading-8 text-muted">{body}</p>
          {result.order ? (
            <div className="mt-6 grid gap-2 text-sm text-primary">
              <p>
                <span className="font-medium">{copy.ref}:</span>{" "}
                <span className="font-mono">{result.order.reference}</span>
              </p>
              <p>
                <span className="font-medium">{copy.total}:</span>{" "}
                {formatMoney(result.order.totalMinor, result.order.currency, locale)}
              </p>
            </div>
          ) : null}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {result.status === "paid" ? (
              <Link
                href={getPublicAppPath("/courses/claim-bonus")}
                className="btn-primary justify-center px-5 py-3"
              >
                {copy.claim}
              </Link>
            ) : null}
            {result.status === "pending" && reference && provider ? (
              <Link
                href={`${getPublicAppPath("/courses/checkout/return")}?order=${encodeURIComponent(reference)}&provider=${provider}`}
                className="btn-secondary justify-center px-5 py-3"
              >
                {copy.refresh}
              </Link>
            ) : null}
            <Link
              href={getPublicAppPath("/courses")}
              className="btn-secondary justify-center px-5 py-3"
            >
              {copy.browse}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
