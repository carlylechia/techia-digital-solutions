import type { Metadata } from "next";
import { Reveal } from "@/components/site/reveal";
import { PricingCard } from "@/components/site/cards";
import { SectionHeading } from "@/components/ui/section-heading";
import { pricingPlans } from "@/content/nexus-site";
import { createMarketingMetadata } from "@/lib/marketing-seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "Pricing",
  description:
    "Review teChia Digital Solutions pricing tiers for digital presence, business growth systems, and custom digital transformation engagements.",
  path: "/pricing"
});

export default function PricingPage() {
  return (
    <main id="main-content" className="container py-16 md:py-20">
      <Reveal>
        <SectionHeading
          as="h1"
          align="left"
          eyebrow="Pricing"
          title="Flexible commercial paths without forcing every business into the same box."
          description="We keep pricing clear where it should be clear, and custom where the business problem deserves a more tailored scope."
        />
      </Reveal>

      <div className="grid gap-5 xl:grid-cols-3">
        {pricingPlans.map((plan, index) => (
          <Reveal key={plan.title} delay={index * 0.05}>
            <PricingCard plan={plan} />
          </Reveal>
        ))}
      </div>

      <section className="mt-16 grid gap-5 lg:grid-cols-3">
        {[
          "Starting from pricing is useful when scope is straightforward and the business already knows what it needs.",
          "Custom quote engagements are better for multi-stage delivery, system design, or deeper operational complexity.",
          "Book a consultation if you want help deciding between a website-only project and a broader digital system."
        ].map((item, index) => (
          <Reveal key={item} delay={index * 0.04}>
            <div className="gradient-border rounded-[1.5rem]">
              <div className="surface-panel h-full p-6 text-sm leading-7 text-muted">{item}</div>
            </div>
          </Reveal>
        ))}
      </section>
    </main>
  );
}
