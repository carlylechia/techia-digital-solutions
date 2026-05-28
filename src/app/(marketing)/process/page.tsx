import type { Metadata } from "next";
import { ProcessTimeline } from "@/components/site/process-timeline";
import { AIConsultationSection } from "@/components/site/ai-consultation-section";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { processDetails, processRoadmap } from "@/content/nexus-site";
import type { Locale } from "@/content/site";
import { createMarketingMetadata } from "@/lib/marketing-seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "Process",
  description:
    "See teChia Digital Solutions process from discovery and strategy through design, development, testing, deployment, support, and optimization.",
  path: "/process"
});

export default function ProcessPage() {
  const publicLocale = "en" as Locale;
  return (
    <main id="main-content" className="container py-16 md:py-20">
      <Reveal>
        <SectionHeading
          as="h1"
          align="left"
          eyebrow="Process"
          title="A beautiful roadmap from idea clarity to confident launch."
          description="The process is designed to keep business context visible while the product becomes more concrete, more polished, and more useful."
        />
      </Reveal>

      <Reveal delay={0.06}>
        <ProcessTimeline steps={processRoadmap} />
      </Reveal>

      <section className="mt-16 grid gap-5 md:grid-cols-2">
        {processDetails.map((item, index) => (
          <Reveal key={item.title} delay={index * 0.04}>
            <div className="gradient-border rounded-[1.5rem]">
              <div className="surface-panel h-full p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-300/12 text-sm font-semibold text-accent dark:text-cyan-200">
                    {index + 1}
                  </span>
                  <h2 className="text-2xl font-semibold text-foreground">{item.title}</h2>
                </div>
                <p className="mt-4 text-sm leading-7 text-muted">{item.description}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </section>

      <AIConsultationSection
        locale={publicLocale}
        secondaryAction={{ href: "/request-quote", label: "Request a quote" }}
      />
    </main>
  );
}
