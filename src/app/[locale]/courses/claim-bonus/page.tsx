import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseBonusClaimForm } from "@/components/courses/CourseBonusClaimForm";
import { CourseHero } from "@/components/courses/CourseHero";
import { JsonLd } from "@/components/ui/json-ld";
import { isLocale, type Locale } from "@/content/site";
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { getBuyerBonusItems } from "@/lib/courses/bonusPacks";
import { getEligibleDeliverableBonusIds } from "@/lib/courses/bonusClaims";
import { getCoursePacks } from "@/lib/courses/coursePacks";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";

  return createMetadata({
    locale,
    title: "Claim Your Official teChia Buyer Bonus | teChia Digital Academy",
    description:
      "Submit your verified purchase details to claim your Official teChia Buyer Bonus from teChia Digital Academy.",
    path: "/courses/claim-bonus",
  });
}

export default async function CourseBonusClaimPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;

  const packs = getCoursePacks(locale);
  const allBonusItems = getBuyerBonusItems(locale);
  const bonusOptionsByPack = Object.fromEntries(
    packs.map((pack) => {
      const eligibleBonusIds = new Set<string>(
        getEligibleDeliverableBonusIds(pack.id),
      );

      return [
        pack.id,
        allBonusItems
          .filter((item) => eligibleBonusIds.has(item.id))
          .map((item) => ({
            id: item.id,
            title: item.title,
            summary: item.summary,
          })),
      ];
    }),
  );

  const copy =
    locale === "fr"
      ? {
          title: "Reclamer votre Official teChia Buyer Bonus",
          description:
            "Envoyez votre preuve d'achat Chariow, choisissez vos documents bonus, et l'equipe teChia verifiera votre demande avant livraison.",
          eyebrow: "teChia Digital Academy",
          badges: [
            "Verification manuelle",
            "Preuve Chariow requise",
            "Livraison securisee des bonus",
          ],
        }
      : {
          title: "Claim Your Official teChia Buyer Bonus",
          description:
            "Submit your Chariow purchase proof, choose your requested bonus files, and the teChia team will verify your claim before delivery.",
          eyebrow: "teChia Digital Academy",
          badges: [
            "Manual verification",
            "Chariow proof required",
            "Secure bonus delivery",
          ],
        };

  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: locale === "fr" ? "Accueil" : "Home", path: "" },
          { name: locale === "fr" ? "Cours" : "Courses", path: "/courses" },
          {
            name:
              locale === "fr"
                ? "Reclamer le bonus"
                : "Claim bonus",
            path: "/courses/claim-bonus",
          },
        ])}
      />
      <CourseHero
        locale={locale}
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        badges={copy.badges}
      />

      <section className="container pb-20">
        <div className="gradient-border rounded-[1.95rem] p-px">
          <div className="elevated-panel rounded-[1.9rem] p-6 sm:p-7 md:p-8">
            <CourseBonusClaimForm
              locale={locale}
              packs={packs.map((pack) => ({
                id: pack.id,
                title: pack.title,
                recommended: pack.recommended,
              }))}
              bonusOptionsByPack={bonusOptionsByPack}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
