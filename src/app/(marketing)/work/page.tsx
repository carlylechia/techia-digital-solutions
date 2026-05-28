import type { Metadata } from "next";
import { CaseStudyCard } from "@/components/site/cards";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { caseStudies } from "@/content/nexus-site";
import { createMarketingMetadata } from "@/lib/marketing-seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "Work",
  description:
    "Explore teChia Digital Solutions case studies for corporate websites, travel inquiry experiences, career technology products, and premium automotive presentation.",
  path: "/work"
});

export default function WorkPage() {
  return (
    <main id="main-content" className="container py-16 md:py-20">
      <Reveal>
        <SectionHeading
          as="h1"
          align="left"
          eyebrow="Work"
          title="Polished case studies that show how strategy, UX, and systems thinking meet."
          description="These featured projects highlight how teChia helps businesses look more credible, organize better, and deliver a more serious digital experience."
        />
      </Reveal>

      <div className="grid gap-5 md:grid-cols-2">
        {caseStudies.map((study, index) => (
          <Reveal key={study.slug} delay={index * 0.04}>
            <CaseStudyCard study={study} href={`/work#${study.slug}`} />
          </Reveal>
        ))}
      </div>

      <section className="mt-16 grid gap-6">
        {caseStudies.map((study, index) => (
          <Reveal key={study.slug} delay={index * 0.04}>
            <article id={study.slug} className="elevated-panel scroll-mt-24 rounded-[2rem] p-8">
              <p className="eyebrow">{study.industry}</p>
              <h2 className="mt-4 text-3xl font-semibold text-foreground md:text-4xl">{study.title}</h2>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{study.summary}</p>
              <div className="mt-8 grid gap-4 md:grid-cols-4">
                <div className="subtle-tile rounded-[1.4rem] p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-accent-2">Industry</p>
                  <p className="mt-3 text-sm leading-7 text-muted">{study.industry}</p>
                </div>
                <div className="subtle-tile rounded-[1.4rem] p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-accent-2">Services delivered</p>
                  <p className="mt-3 text-sm leading-7 text-muted">{study.services.join(", ")}</p>
                </div>
                <div className="subtle-tile rounded-[1.4rem] p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-accent-2">Project type</p>
                  <p className="mt-3 text-sm leading-7 text-muted">{study.projectType}</p>
                </div>
                <div className="subtle-tile rounded-[1.4rem] p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-accent-2">Result</p>
                  <p className="mt-3 text-sm leading-7 text-muted">{study.outcome}</p>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </section>
    </main>
  );
}
