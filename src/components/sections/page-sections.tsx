import Image from "next/image";
import Link from "next/link";
import { AnimatedGridBackground } from "@/components/site/animated-grid-background";
import { SectionHeading } from "@/components/ui/section-heading";
import { getLocalizedHref, type Locale } from "@/content/site";
import { parseSections, type PageSection } from "@/types/sections";

function resolveHref(href: string, locale: Locale): string {
  return href.startsWith("/") ? getLocalizedHref(locale, href) : href;
}

export function PageSections({ sections, locale }: { sections: unknown; locale: Locale }) {
  const items = parseSections(sections);
  if (!items.length) return null;
  return (
    <div className="grid gap-6 md:gap-8">
      {items.map((section) => (
        <SectionBlock key={section.id} section={section} locale={locale} />
      ))}
    </div>
  );
}

function SectionBlock({ section, locale }: { section: PageSection; locale: Locale }) {
  switch (section.type) {
    case "hero":
      return <HeroSection section={section} locale={locale} />;
    case "stats":
      return <StatsSection section={section} />;
    case "cards":
    case "cards_images":
      return <CardsSection section={section} />;
    case "text":
      return <TextSection section={section} />;
    case "cta":
      return <CtaSection section={section} locale={locale} />;
    default:
      return null;
  }
}

function HeroSection({ section, locale }: { section: Extract<PageSection, { type: "hero" }>; locale: Locale }) {
  return (
    <section className="container">
      <div className="gradient-border rounded-[2rem]">
        <div className="elevated-panel relative overflow-hidden px-6 py-8 md:px-10 md:py-12">
          <AnimatedGridBackground className="opacity-65 [mask-image:radial-gradient(circle_at_top_right,black,transparent_78%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.1),transparent_28%),radial-gradient(circle_at_85%_22%,rgba(139,92,246,0.12),transparent_30%)]" />

          <div className={`relative z-10 grid gap-8 ${section.imageUrl ? "lg:grid-cols-[1.05fr_0.95fr] lg:items-center" : ""}`}>
            <div className="max-w-4xl">
              {section.heading ? (
                <h1 className="text-balance text-4xl font-semibold leading-[1.04] text-foreground md:text-6xl">
                  {section.heading}
                </h1>
              ) : null}
              {section.body ? <p className="mt-5 max-w-3xl text-base leading-8 text-muted md:text-lg">{section.body}</p> : null}
              {(section.ctaLabel || section.cta2Label) && (
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {section.ctaLabel && section.ctaHref ? (
                    <Link href={resolveHref(section.ctaHref, locale)} className="btn-primary w-full justify-center px-5 py-3 sm:w-auto">
                      {section.ctaLabel}
                    </Link>
                  ) : null}
                  {section.cta2Label && section.cta2Href ? (
                    <Link href={resolveHref(section.cta2Href, locale)} className="btn-secondary w-full justify-center px-5 py-3 sm:w-auto">
                      {section.cta2Label}
                    </Link>
                  ) : null}
                </div>
              )}
            </div>

            {section.imageUrl ? (
              <div className="gradient-border rounded-[1.75rem]">
                <div className="elevated-panel relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={section.imageUrl}
                    alt={section.heading}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 48vw"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsSection({ section }: { section: Extract<PageSection, { type: "stats" }> }) {
  return (
    <section className="container">
      {section.heading ? <SectionHeading title={section.heading} /> : null}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {section.items.map((item, idx) => (
          <article key={idx} className="gradient-border rounded-[1.5rem]">
            <div className="elevated-panel h-full p-6 text-center">
              <p className="text-3xl font-semibold text-accent-2 md:text-4xl">{item.value}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{item.label}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CardsSection({ section }: { section: Extract<PageSection, { type: "cards" | "cards_images" }> }) {
  return (
    <section className="container">
      {section.heading ? <SectionHeading eyebrow={section.eyebrow} title={section.heading} /> : section.eyebrow ? <p className="eyebrow mx-auto mb-8 justify-center">{section.eyebrow}</p> : null}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {section.items.map((item, idx) => (
          <article key={idx} className="gradient-border rounded-[1.75rem]">
            <div className="elevated-panel h-full p-6">
              {section.type === "cards_images" && item.imageUrl ? (
                <div className="relative mb-5 aspect-video overflow-hidden rounded-[1.25rem] border border-border/80">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                </div>
              ) : null}
              <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TextSection({ section }: { section: Extract<PageSection, { type: "text" }> }) {
  return (
    <section className="container">
      <div className="mx-auto max-w-4xl gradient-border rounded-[1.75rem]">
        <div className="elevated-panel p-8 md:p-10">
          {section.heading ? <SectionHeading title={section.heading} align="left" className="mb-0" /> : null}
          <div className={`prose prose-neutral dark:prose-invert max-w-none ${section.heading ? "mt-6" : ""}`}>
            {section.body.split("\n").filter(Boolean).map((paragraph, idx) => (
              <p key={idx} className="mb-4 leading-8 text-muted">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSection({ section, locale }: { section: Extract<PageSection, { type: "cta" }>; locale: Locale }) {
  return (
    <section className="container">
      <div className="gradient-border rounded-[1.9rem]">
        <div className="elevated-panel relative overflow-hidden px-8 py-12 text-center md:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.12),transparent_24%)]" />
          <div className="relative z-10">
            <h2 className="text-balance text-3xl font-semibold text-foreground md:text-5xl">{section.heading}</h2>
            {section.body ? <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted md:text-lg">{section.body}</p> : null}
            <Link href={resolveHref(section.ctaHref, locale)} className="btn-primary mt-8 justify-center px-5 py-3.5">
              {section.ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
