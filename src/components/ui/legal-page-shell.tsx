import Link from "next/link";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import { getDictionary, getLocalizedHref, type Locale } from "@/content/site";

const legalPagePaths = {
  privacy: "/privacy",
  terms: "/terms",
  cookies: "/cookies"
} as const;

const legalShellCopy = {
  en: {
    relatedTitle: "Related legal pages",
    relatedDescription: "Browse the key teChia policies in the same bilingual flow.",
    cardPrefix: "Point",
    ctaEyebrow: "Need clarification?",
    ctaTitle: "Questions about privacy, cookies, or project terms?",
    ctaDescription: "Contact teChia if you need a commercial clarification, data request, or project-specific conversation."
  },
  fr: {
    relatedTitle: "Pages légales liées",
    relatedDescription: "Consultez les politiques essentielles de teChia dans le même parcours bilingue.",
    cardPrefix: "Point",
    ctaEyebrow: "Besoin d’une précision ?",
    ctaTitle: "Une question sur la confidentialité, les cookies ou les conditions de projet ?",
    ctaDescription: "Contactez teChia pour une précision commerciale, une demande liée aux données ou un échange spécifique à votre projet."
  }
} as const;

type LegalPageKey = keyof typeof legalPagePaths;

export function LegalPageShell({
  locale,
  page,
  title,
  paragraphs
}: {
  locale: Locale;
  page: LegalPageKey;
  title: string;
  paragraphs: string[];
}) {
  const dict = getDictionary(locale);
  const copy = legalShellCopy[locale];
  const description = paragraphs[0] ?? dict.legal.metaDescription;
  const detailParagraphs = paragraphs.length > 1 ? paragraphs.slice(1) : paragraphs;
  const relatedPages = [
    { key: "privacy" as const, label: dict.legal.privacy, href: legalPagePaths.privacy },
    { key: "terms" as const, label: dict.legal.terms, href: legalPagePaths.terms },
    { key: "cookies" as const, label: dict.legal.cookies, href: legalPagePaths.cookies }
  ].filter((item) => item.key !== page);

  return (
    <main>
      <PremiumPageHero
        locale={locale}
        eyebrow={dict.legal.eyebrow}
        title={title}
        description={description}
        actions={[
          { href: "/start-project", label: dict.common.startProject },
          { href: "/contact", label: dict.nav.contact, variant: "secondary" }
        ]}
        aside={
          <div className="grid gap-4">
            <article className="gradient-border rounded-[1.5rem]">
              <div className="elevated-panel p-6">
                <p className="eyebrow mb-3">{copy.relatedTitle}</p>
                <p className="text-sm leading-6 text-muted">{copy.relatedDescription}</p>
                <div className="mt-5 flex flex-col gap-3">
                  {relatedPages.map((item) => (
                    <Link
                      key={item.key}
                      href={getLocalizedHref(locale, item.href)}
                      className="rounded-3xl border border-border bg-background/75 px-4 py-3 text-sm font-medium text-foreground transition hover:border-accent-2/40 hover:bg-background"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </article>
            <article className="gradient-border rounded-[1.5rem]">
              <div className="elevated-panel p-6">
                <p className="eyebrow mb-3">{copy.ctaEyebrow}</p>
                <p className="text-lg font-semibold text-foreground">{copy.ctaTitle}</p>
                <p className="mt-3 text-sm leading-6 text-muted">{copy.ctaDescription}</p>
              </div>
            </article>
          </div>
        }
      />

      <section className="container py-6 md:py-8">
        <div className="grid gap-5 md:grid-cols-2">
          {detailParagraphs.map((paragraph, index) => (
            <article key={`${page}-${index}`} className="gradient-border rounded-[1.75rem]">
              <div className="elevated-panel h-full p-6 md:p-7">
                <p className="eyebrow mb-3">
                  {copy.cardPrefix} {String(index + 1).padStart(2, "0")}
                </p>
                <p className="text-base leading-8 text-muted">{paragraph}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <PremiumPageCta
        locale={locale}
        eyebrow={copy.ctaEyebrow}
        title={copy.ctaTitle}
        description={copy.ctaDescription}
        primaryAction={{ href: "/contact", label: dict.nav.contact }}
        secondaryAction={{ href: "/start-project", label: dict.common.startProject }}
      />
    </main>
  );
}
