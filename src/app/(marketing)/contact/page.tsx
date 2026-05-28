import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/site/forms";
import { Reveal } from "@/components/site/reveal";
import { buttonVariants } from "@/components/site/button";
import { faqPreview } from "@/content/nexus-site";
import { siteConfig } from "@/content/site";
import { createMarketingMetadata } from "@/lib/marketing-seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "Contact",
  description:
    "Contact teChia Digital Solutions for websites, dashboards, business systems, automation tools, AI-powered products, and digital transformation consulting.",
  path: "/contact"
});

export default function ContactPage() {
  const whatsappHref = `https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}`;

  return (
    <main id="main-content" className="container py-16 md:py-20">
      <Reveal>
        <p className="eyebrow">Contact</p>
        <h1 className="mt-4 max-w-4xl text-balance text-4xl font-semibold text-foreground md:text-6xl">
          Reach out for a digital product, a system challenge, or a serious next move.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
          teChia works with local and international businesses that need premium execution, smart product thinking, and better operational technology.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.78fr]">
        <Reveal>
          <ContactForm />
        </Reveal>

        <div className="grid gap-5">
          <Reveal delay={0.05}>
            <div className="gradient-border rounded-[1.5rem]">
              <div className="surface-panel p-6">
                <p className="eyebrow">Direct channels</p>
                <div className="mt-5 grid gap-3">
                  <a href={whatsappHref} target="_blank" rel="noreferrer" className={`${buttonVariants({ variant: "primary", size: "lg" })} w-full`}>
                    <MessageCircle className="size-4" />
                    Chat on WhatsApp
                  </a>
                  <a href={`mailto:${siteConfig.email}`} className={`${buttonVariants({ variant: "secondary", size: "lg" })} w-full`}>
                    <Mail className="size-4" />
                    Email teChia
                  </a>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="gradient-border rounded-[1.5rem]">
              <div className="surface-panel p-6">
                <p className="eyebrow">Global service note</p>
                <p className="mt-4 text-sm leading-7 text-muted">
                  teChia supports clients across Africa, Europe, and remote-first teams internationally.
                </p>
                <p className="mt-3 text-sm leading-7 text-muted">{siteConfig.location}</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.11}>
            <div className="gradient-border rounded-[1.5rem]">
              <div className="surface-panel p-6">
                <p className="eyebrow">FAQ preview</p>
                <div className="mt-4 grid gap-3">
                  {faqPreview.map((faq) => (
                    <details key={faq.question} className="subtle-tile rounded-2xl p-4">
                      <summary className="cursor-pointer font-semibold text-foreground">{faq.question}</summary>
                      <p className="mt-3 text-sm leading-7 text-muted">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
