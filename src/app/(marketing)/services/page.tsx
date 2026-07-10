import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AIConsultationSection } from "@/components/site/ai-consultation-section";
import { buttonVariants } from "@/components/site/button";
import { Reveal } from "@/components/site/reveal";
import { ServiceCard } from "@/components/site/cards";
import { SectionHeading } from "@/components/ui/section-heading";
import { services } from "@/content/nexus-site";
import type { Locale } from "@/content/site";
import { createMarketingMetadata } from "@/lib/marketing-seo";
import { toKebabCase } from "@/lib/utils";

export const metadata: Metadata = createMarketingMetadata({
  title: "Services",
  description:
    "Explore teChia Digital Solutions services across social media management, digital marketing, branding, websites, e-commerce, SEO, automation, AI, custom software, and digital transformation consulting.",
  path: "/services"
});

export default function ServicesPage() {
  const publicLocale = "en" as Locale;
  return (
    <main id="main-content" className="container py-16 md:py-20">
      <Reveal>
        <SectionHeading
          as="h1"
          align="left"
          eyebrow="Services"
          title="Growth services built to solve business problems with clarity."
          description="From social media and digital marketing to websites, automation, AI, and software, teChia delivers connected solutions that move the business forward."
        />
      </Reveal>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service, index) => (
          <Reveal key={service.title} delay={index * 0.04}>
            <div id={toKebabCase(service.title)} className="scroll-mt-28">
              <ServiceCard service={service} />
            </div>
          </Reveal>
        ))}
      </div>

      <section className="mt-16 grid gap-5 lg:grid-cols-3">
        {[
          "Every engagement begins with the business goal, not just a deliverable request.",
          "Strategy, design, and engineering stay aligned so the final system feels cohesive.",
          "We build for visibility, clarity, customer experience, and future operational improvement."
        ].map((item, index) => (
          <Reveal key={item} delay={index * 0.05}>
            <div className="gradient-border rounded-[1.5rem]">
              <div className="surface-panel h-full p-6 text-sm leading-7 text-muted">{item}</div>
            </div>
          </Reveal>
        ))}
      </section>

      <AIConsultationSection
        locale={publicLocale}
        secondaryAction={{ href: "/contact", label: "Book a consultation" }}
      />

      <Reveal delay={0.12}>
        <div className="dark-section mt-16 rounded-[2rem] p-8 md:p-10">
          <p className="eyebrow">Next step</p>
          <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold text-white md:text-5xl">
            Need help choosing the right growth path for your business?
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            We can shape the right mix of marketing, branding, web, automation, AI, and software before execution begins.
          </p>
          <Link href="/contact" className={`${buttonVariants({ variant: "primary", size: "lg" })} mt-8 w-full sm:w-auto`}>
            Book a Free Consultation
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </Reveal>
    </main>
  );
}
