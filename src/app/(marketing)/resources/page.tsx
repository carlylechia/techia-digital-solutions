import type { Metadata } from "next";
import { ResourceCard } from "@/components/site/cards";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { resources } from "@/content/nexus-site";
import { createMarketingMetadata } from "@/lib/marketing-seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "Resources",
  description:
    "Explore teChia Digital Solutions resources on digital homes, AI readiness, operational systems, and practical digital transformation planning.",
  path: "/resources"
});

export default function ResourcesPage() {
  return (
    <main id="main-content" className="container py-16 md:py-20">
      <Reveal>
        <SectionHeading
          as="h1"
          align="left"
          eyebrow="Resources"
          title="Helpful thinking for businesses planning their next digital move."
          description="These resources are designed to make strategy clearer before a build begins."
        />
      </Reveal>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((item, index) => (
          <Reveal key={item.title} delay={index * 0.05}>
            <ResourceCard item={item} />
          </Reveal>
        ))}
      </div>

      <section className="mt-16 grid gap-5 lg:grid-cols-3">
        {[
          "How to think about a website as part of a larger operating system.",
          "Where AI tools create leverage inside a workflow and where they just add noise.",
          "Why premium design and operational clarity should be designed together."
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
