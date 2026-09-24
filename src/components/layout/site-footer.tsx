import Link from "next/link";
import {
  getDictionary,
  getLocalizedHref,
  getLocalizedSectionHref,
  mergedPageAnchors,
  siteConfig,
  type Locale,
} from "@/content/site";
import { Logo } from "@/components/brand/Logo";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { getBlogIndexPath } from "@/lib/blog/slug";

export function SiteFooter({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const accentScript =
    locale === "fr"
      ? "construire la prochaine couche de croissance"
      : "build the next growth layer";
  const footerCallout =
    locale === "fr"
      ? {
          eyebrow: "Prêt pour la prochaine étape ?",
          title:
            "Faites grandir votre entreprise avec une stratégie digitale plus connectée.",
          body: "Quand les priorités deviennent plus claires, teChia peut prolonger la croissance avec campagnes, SEO, e-commerce, automatisation, IA et logiciels métier sans repartir de zéro.",
        }
      : {
          eyebrow: "Ready for the next step?",
          title:
            "Grow your business with a more connected digital strategy.",
          body: "When the priorities become clearer, teChia can extend growth with campaigns, SEO, e-commerce, automation, AI, and business software without forcing a restart.",
        };
  const groups = [
    {
      title: dict.nav.services,
      links: dict.services
        .slice(0, 5)
        .map((item) => [item.title, `/services/${item.slug}`]),
    },
    {
      title: dict.nav.industries,
      links: dict.industries
        .slice(0, 5)
        .map((item) => [item.title, `/industries/${item.slug}`]),
    },
    {
      title: dict.ui.company,
      links: [
        [dict.nav.about, "/about"],
        [dict.nav.founder, "/founder"],
        [
          dict.nav.portfolio,
          getLocalizedSectionHref(
            locale,
            "/about",
            mergedPageAnchors.about.portfolio,
          ),
        ],
        [dict.nav.demoLab, "/demo-lab"],
        [dict.nav.pricing, "/pricing"],
        [dict.nav.blog, "/blog"],
        [dict.nav.aiConsultant, "/ai-consultant"],
        [dict.nav.contact, "/contact"],
      ],
    },
    {
      title: dict.ui.legal,
      links: [
        [dict.legal.privacy, "/privacy"],
        [dict.legal.terms, "/terms"],
        [dict.legal.cookies, "/cookies"],
      ],
    },
  ];

  return (
    <footer className="footer-stage">
      <div className="container py-6">
        <div className="gradient-border rounded-[2rem] footer-callout">
          <div className="elevated-panel px-6 py-8 md:px-10 md:py-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="font-script text-3xl text-accent-3 md:text-4xl">
                  {accentScript}
                </p>
                <p className="eyebrow mt-3">{footerCallout.eyebrow}</p>
                <h2 className="mt-4 max-w-3xl text-balance text-4xl font-semibold md:text-6xl">
                  <span className="headline-gradient">
                    {footerCallout.title}
                  </span>
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-muted md:text-lg">
                  {footerCallout.body}
                </p>
              </div>
              <div className="grid gap-4">
                {[
                  dict.ui.footerDescription,
                  dict.pages.contact.location,
                  dict.ui.footerPromise,
                ].map((item) => (
                  <div
                    key={item}
                    className="subtle-tile-strong rounded-[1.4rem] p-4 text-sm leading-7 text-muted"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container grid gap-10 py-14 lg:grid-cols-[1.05fr_1.95fr]">
        <div>
          <Logo
            locale={locale}
            variant="horizontal"
            size="lg"
            theme="auto"
            interactive
          />
          <p className="mt-5 max-w-md text-sm leading-7 text-muted">
            {dict.ui.footerDescription}
          </p>
          <div className="mt-6 rounded-[1.5rem] border border-border bg-surface-strong p-5">
            <p className="eyebrow">Newsletter</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              {dict.pages.contact.location}
            </p>
            <div className="mt-4">
              <NewsletterForm locale={locale} />
            </div>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-primary">
                {group.title}
              </h3>
              <ul className="mt-4 grid gap-3 text-sm text-muted">
                {group.links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={
                        href.startsWith("/client-portal")
                          ? href
                          : href === "/blog"
                            ? getBlogIndexPath(locale)
                            : getLocalizedHref(locale, href)
                      }
                      className="footer-link inline-flex"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="container flex flex-col gap-3 border-t border-border py-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}.{" "}
          {dict.ui.allRightsReserved}
        </p>
        <p>{dict.ui.footerPromise}</p>
      </div>
    </footer>
  );
}
