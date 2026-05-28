import type { Metadata } from "next";
import { Mail, MessageCircle, Phone, MapPin } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { PremiumPageCta } from "@/components/ui/premium-page-cta";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import { getDictionary, isLocale, siteConfig, type Locale } from "@/content/site";
import { createMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const dict = getDictionary(locale);
  return createMetadata({ locale, title: dict.pages.contact.metaTitle, description: dict.pages.contact.metaDescription, path: "/contact" });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const c = dict.pages.contact;

  return (
    <main>
      <PremiumPageHero
        locale={locale}
        eyebrow={dict.nav.contact}
        title={c.title}
        description={c.description}
        badges={[c.emailLabel, c.whatsappLabel, c.callLabel]}
      />
      <section className="container py-6">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">

        {/* Left column — contact details */}
        <div className="premium-card flex flex-col gap-6 p-6">
          <div>
            <h2 className="text-2xl font-semibold text-primary">{c.detailsTitle}</h2>
            <p className="mt-1.5 flex items-start gap-2 text-sm text-muted">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
              {c.location}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Email */}
            <a
              href={`mailto:${siteConfig.email}`}
              className="group flex items-start gap-4 rounded-xl border border-border bg-background/50 p-4 transition hover:border-accent/40 hover:bg-surface"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Mail className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-primary transition group-hover:text-accent">{c.emailLabel}</p>
                <p className="mt-0.5 truncate text-sm text-accent">{siteConfig.email}</p>
                <p className="mt-1 text-xs text-muted">{c.emailDesc}</p>
              </div>
            </a>

            {/* WhatsApp */}
            {siteConfig.whatsapp ? (
              <a
                href={`https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 rounded-xl border border-border bg-background/50 p-4 transition hover:border-[#25D366]/40 hover:bg-surface"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366]">
                  <MessageCircle className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-primary">{c.whatsappLabel}</p>
                  <p className="mt-0.5 text-sm text-[#25D366]">+{siteConfig.whatsapp}</p>
                  <p className="mt-1 text-xs text-muted">{c.whatsappDesc}</p>
                </div>
              </a>
            ) : null}

            {/* Phone */}
            {siteConfig.phone ? (
              <a
                href={`tel:+${siteConfig.phone.replace(/\D/g, "")}`}
                className="group flex items-start gap-4 rounded-xl border border-border bg-background/50 p-4 transition hover:border-accent/40 hover:bg-surface"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Phone className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-primary transition group-hover:text-accent">{c.callLabel}</p>
                  <p className="mt-0.5 text-sm text-accent">+{siteConfig.phone}</p>
                  <p className="mt-1 text-xs text-muted">{c.callDesc}</p>
                </div>
              </a>
            ) : null}
          </div>
        </div>

        {/* Right column — form */}
        <ContactForm locale={locale} />
      </div>
      </section>
      <PremiumPageCta
        locale={locale}
        title={dict.home.finalCtaTitle}
        description={c.description}
        primaryAction={{ href: "/start-project", label: dict.common.startProject }}
        secondaryAction={{ href: "/portfolio", label: dict.nav.portfolio }}
      />
    </main>
  );
}
