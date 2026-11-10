import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/site/button";
import { getLocalizedHref, type Locale } from "@/content/site";
import { cn } from "@/lib/utils";

const HERO_MIN_HEIGHT = "max(720px, calc(100svh - 5rem))";

type HeroCopy = {
  eyebrow: string;
  headingLead: string;
  headingHighlight: string;
  headingEnd: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
  supportLine: string;
  helperLead: string;
  helperLinkLabel: string;
};

const heroContent = {
  en: {
    eyebrow: "Digitalize. Simplify. Grow.",
    headingLead: "Grow your business with ",
    headingHighlight: "Techia Digital web and business solutions",
    headingEnd: ".",
    description:
      "From social media management and digital marketing to branding, AI, premium websites, automation, and business software, teChia helps ambitious companies attract customers, improve operations, and scale with confidence.",
    primaryLabel: "Book a Free Consultation",
    secondaryLabel: "Explore Our Services",
    supportLine:
      "Helping businesses grow through marketing, branding, AI and technology.",
    helperLead: "Want a faster recommendation before we talk?",
    helperLinkLabel: "Chat with the AI Consultant",
  },
  fr: {
    eyebrow: "Digitaliser. Simplifier. Grandir.",
    headingLead: "Faites grandir votre entreprise avec des ",
    headingHighlight: "solutions web et business Techia Digital",
    headingEnd: ".",
    description:
      "De la gestion des réseaux sociaux et du marketing digital au branding, à l’IA, aux sites premium, à l’automatisation et aux logiciels métier, teChia aide les entreprises ambitieuses à attirer des clients, mieux opérer et passer à l’échelle.",
    primaryLabel: "Réserver une consultation gratuite",
    secondaryLabel: "Explorer nos services",
    supportLine:
      "Nous aidons les entreprises à grandir grâce au marketing, au branding, à l’IA et à la technologie.",
    helperLead: "Vous voulez une recommandation plus rapide avant d’échanger ?",
    helperLinkLabel: "Parler à l’agent IA",
  },
} as const satisfies Record<Locale, HeroCopy>;

const heroSlides = [
  {
    src: "/images/homepage/01-hero-graphics/hero-slide-starting-small-story.webp",
    imagePositionClassName: "object-[70%_center] md:object-[74%_center]",
    quality: 84,
    imageClassName:
      "object-cover brightness-[1.08] saturate-[1.04] contrast-[1.04]",
    scrimClassName:
      "bg-[linear-gradient(180deg,rgba(4,8,18,0.22)_0%,rgba(4,8,18,0.02)_34%,rgba(4,8,18,0.12)_100%),linear-gradient(90deg,rgba(4,8,18,0.48)_0%,rgba(4,8,18,0.28)_28%,rgba(4,8,18,0.08)_56%,rgba(4,8,18,0.02)_100%)] md:bg-[linear-gradient(180deg,rgba(4,8,18,0.16)_0%,rgba(4,8,18,0)_34%,rgba(4,8,18,0.06)_100%),linear-gradient(90deg,rgba(4,8,18,0.4)_0%,rgba(4,8,18,0.22)_26%,rgba(4,8,18,0.06)_54%,rgba(4,8,18,0.01)_100%)]",
  },
  {
    src: "/images/homepage/01-hero-graphics/hero-slide-going-digital-story.webp",
    imagePositionClassName: "object-[72%_center] md:object-[76%_center]",
    quality: 84,
    imageClassName:
      "object-cover brightness-[1.08] saturate-[1.08] contrast-[1.04]",
    scrimClassName:
      "bg-[linear-gradient(180deg,rgba(4,8,18,0.2)_0%,rgba(4,8,18,0.03)_34%,rgba(4,8,18,0.08)_100%),linear-gradient(90deg,rgba(4,8,18,0.44)_0%,rgba(4,8,18,0.24)_26%,rgba(4,8,18,0.08)_56%,rgba(4,8,18,0.02)_100%)] md:bg-[linear-gradient(180deg,rgba(4,8,18,0.14)_0%,rgba(4,8,18,0)_34%,rgba(4,8,18,0.04)_100%),linear-gradient(90deg,rgba(4,8,18,0.36)_0%,rgba(4,8,18,0.18)_24%,rgba(4,8,18,0.04)_52%,rgba(4,8,18,0.01)_100%)]",
  },
  {
    src: "/images/homepage/01-hero-graphics/hero-slide-growing-global-story.webp",
    imagePositionClassName: "object-[68%_center] md:object-[72%_center]",
    quality: 84,
    imageClassName:
      "object-cover brightness-[1.1] saturate-[1.1] contrast-[1.04]",
    scrimClassName:
      "bg-[linear-gradient(180deg,rgba(4,8,18,0.2)_0%,rgba(4,8,18,0.02)_30%,rgba(4,8,18,0.06)_100%),linear-gradient(90deg,rgba(4,8,18,0.42)_0%,rgba(4,8,18,0.22)_24%,rgba(4,8,18,0.06)_54%,rgba(4,8,18,0.01)_100%)] md:bg-[linear-gradient(180deg,rgba(4,8,18,0.14)_0%,rgba(4,8,18,0)_30%,rgba(4,8,18,0.03)_100%),linear-gradient(90deg,rgba(4,8,18,0.34)_0%,rgba(4,8,18,0.16)_22%,rgba(4,8,18,0.03)_50%,rgba(4,8,18,0.01)_100%)]",
  },
  {
    src: "/images/homepage/01-hero-graphics/hero-slide-leading-team-story.webp",
    imagePositionClassName: "object-[68%_center] md:object-[73%_center]",
    quality: 84,
    imageClassName:
      "object-cover brightness-[1.08] saturate-[1.08] contrast-[1.04]",
    scrimClassName:
      "bg-[linear-gradient(180deg,rgba(4,8,18,0.2)_0%,rgba(4,8,18,0.02)_30%,rgba(4,8,18,0.06)_100%),linear-gradient(90deg,rgba(4,8,18,0.44)_0%,rgba(4,8,18,0.24)_24%,rgba(4,8,18,0.06)_54%,rgba(4,8,18,0.01)_100%)] md:bg-[linear-gradient(180deg,rgba(4,8,18,0.14)_0%,rgba(4,8,18,0)_30%,rgba(4,8,18,0.03)_100%),linear-gradient(90deg,rgba(4,8,18,0.34)_0%,rgba(4,8,18,0.16)_22%,rgba(4,8,18,0.03)_50%,rgba(4,8,18,0.01)_100%)]",
  },
] as const;

export function HeroSection({ locale = "en" }: { locale?: Locale }) {
  const copy = heroContent[locale];

  return (
    <section
      aria-labelledby="homepage-hero-heading"
      className="relative isolate -mt-[7.25rem] overflow-hidden bg-[#040812] pt-[7.25rem] sm:-mt-[7.5rem] sm:pt-[7.5rem]"
      style={{ minHeight: HERO_MIN_HEIGHT }}
    >
      <div className="absolute inset-x-0 bottom-0 -top-8 overflow-hidden sm:-top-8">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.src}
            className={cn("hero-slide absolute inset-0", index === 0 && "hero-slide--first")}
            style={{ animationDelay: `${index * 5.6}s` }}
          >
              <Image
                src={slide.src}
                alt=""
                aria-hidden="true"
                width={1672}
                height={941}
                priority={index === 0}
                sizes="100vw"
                quality={slide.quality}
                className={cn("absolute inset-0 h-full w-full", slide.imageClassName, slide.imagePositionClassName)}
              />

              {slide.scrimClassName ? (
                <div
                  className={cn("absolute inset-0", slide.scrimClassName)}
                />
              ) : null}
            </div>
          ))}
      </div>

      <div className="absolute inset-x-0 bottom-0 -top-8 bg-[rgba(4,8,18,0.18)] md:bg-[rgba(4,8,18,0.1)]" />
      <div className="absolute inset-x-0 bottom-0 -top-8 bg-[linear-gradient(90deg,rgba(4,8,18,0.95)_0%,rgba(4,8,18,0.8)_30%,rgba(4,8,18,0.28)_58%,rgba(4,8,18,0.05)_100%)] md:bg-[linear-gradient(90deg,rgba(4,8,18,0.92)_0%,rgba(4,8,18,0.68)_32%,rgba(4,8,18,0.16)_58%,rgba(4,8,18,0.01)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -top-8 bg-[linear-gradient(180deg,rgba(4,8,18,0.9)_0%,rgba(4,8,18,0.24)_22%,rgba(4,8,18,0.1)_66%,#040812_100%)] md:bg-[linear-gradient(180deg,rgba(4,8,18,0.78)_0%,rgba(4,8,18,0.06)_26%,rgba(4,8,18,0.08)_72%,rgba(4,8,18,0.88)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -top-8 bg-[radial-gradient(circle_at_16%_18%,rgba(34,211,238,0.14),transparent_26%),radial-gradient(circle_at_82%_20%,rgba(251,113,133,0.1),transparent_22%),radial-gradient(circle_at_52%_100%,rgba(245,185,66,0.1),transparent_23%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[54%] bg-[radial-gradient(circle_at_58%_48%,rgba(255,255,255,0.14),transparent_16%),radial-gradient(circle_at_58%_48%,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_82%_34%,rgba(59,130,246,0.09),transparent_20%)] lg:block" />
      <div className="absolute inset-x-0 bottom-0 -top-8 sm:hidden bg-[linear-gradient(180deg,rgba(4,8,18,0.94)_0%,rgba(4,8,18,0.52)_34%,rgba(4,8,18,0.72)_100%),linear-gradient(90deg,rgba(4,8,18,0.96)_0%,rgba(4,8,18,0.88)_62%,rgba(4,8,18,0.44)_100%)]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -top-8 hidden opacity-35 sm:block [background-image:linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <div
        className="container relative flex items-center pb-20 pt-2 sm:pb-24 sm:pt-3 lg:pb-28 lg:pt-5 xl:pb-32"
        style={{ minHeight: HERO_MIN_HEIGHT }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-6 z-0 h-[calc(100%-4rem)] w-full max-w-[48rem] rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(4,8,18,0.62),rgba(4,8,18,0.24))] shadow-[0_40px_120px_rgba(4,8,18,0.28)] sm:top-8 sm:max-w-[50rem] sm:rounded-[2.35rem] lg:top-10 lg:max-w-[52rem] lg:bg-[linear-gradient(180deg,rgba(4,8,18,0.42),rgba(4,8,18,0.06))]"
        />
        <div
          className="relative z-[1] w-full max-w-[58rem] text-center md:text-left"
        >
          <div
            className="inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.09] px-3 py-2 text-center text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[#CFFAFE] shadow-[0_18px_50px_rgba(5,7,13,0.18)] sm:px-4 sm:text-[0.69rem] md:justify-start"
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-[#22D3EE] shadow-[0_0_18px_rgba(34,211,238,0.7)]"
            />
            {copy.eyebrow}
</div>

          <h1
            id="homepage-hero-heading"
            className="mx-auto mt-4 max-w-[min(92vw,20ch)] text-balance text-[clamp(2.15rem,5.6vw,4rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-white sm:max-w-[min(84vw,19ch)] md:mx-0 md:max-w-[min(66vw,18ch)] lg:max-w-[min(48vw,18ch)] xl:max-w-[min(44vw,18ch)]"
          >
            <span>{copy.headingLead}</span>
            <span className="headline-gradient">
              {copy.headingHighlight}
            </span>
            <span>{copy.headingEnd}</span>
</h1>

          <div
            className="headline-underline mx-auto mt-6 lg:mx-0"
            aria-hidden="true"
          />

          <p
            className="mx-auto mt-5 max-w-[37rem] text-pretty text-[0.98rem] leading-7 text-[#D7E3F1] sm:text-[1.02rem] sm:leading-8 md:mx-0 md:max-w-[39rem] md:text-[1.06rem] lg:text-[1.09rem]"
          >
            {copy.description}
</p>

          <div
            className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap md:justify-start"
          >
            <Link
              href={getLocalizedHref(locale, "/contact")}
              className={cn(
                buttonVariants({ variant: "primary", size: "lg" }),
                "group relative w-full justify-center overflow-hidden border border-white/18 px-6 py-4 text-[0.98rem] text-white shadow-[0_24px_64px_rgba(37,99,235,0.24)] sm:w-auto",
                "bg-[linear-gradient(135deg,#2563EB_0%,#22D3EE_42%,#FB7185_72%,#F5B942_100%)]",
                "before:absolute before:inset-y-0 before:left-[-35%] before:w-[42%] before:skew-x-[-22deg] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)] before:opacity-0 before:transition before:duration-500",
                "hover:border-white/28 hover:shadow-[0_28px_70px_rgba(34,211,238,0.28)] hover:before:left-[118%] hover:before:opacity-100 focus-visible:border-white/30 focus-visible:before:left-[118%] focus-visible:before:opacity-100",
              )}
            >
              <span className="relative z-[1] inline-flex items-center gap-2">
                {copy.primaryLabel}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href={getLocalizedHref(locale, "/services")}
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "w-full justify-center border border-white/16 bg-white/[0.08] px-6 py-4 text-[0.98rem] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:w-auto",
                "hover:border-cyan-300/50 hover:bg-white/[0.12] hover:text-white focus-visible:border-cyan-300/60 focus-visible:bg-white/[0.12]",
              )}
            >
              {copy.secondaryLabel}
            </Link>
</div>

          <p
            className="mx-auto mt-5 max-w-[38rem] text-balance text-[0.92rem] font-medium leading-7 text-[#D7E3F1] sm:text-[0.96rem] md:mx-0"
          >
            {copy.supportLine}
</p>

          <p
            className="mx-auto mt-3.5 max-w-[35rem] text-[0.92rem] leading-7 text-[#B7C6D8] md:mx-0"
          >
            {copy.helperLead}{" "}
            <Link
              href={getLocalizedHref(locale, "/ai-consultant")}
              className="font-semibold text-cyan-200 underline decoration-cyan-300/45 underline-offset-4 transition hover:text-white hover:decoration-white"
            >
              {copy.helperLinkLabel}
            </Link>
</p>
</div>
      </div>
    </section>
  );
}
