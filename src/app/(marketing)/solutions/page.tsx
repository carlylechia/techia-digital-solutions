import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { SolutionCard } from "@/components/site/cards";
import { buttonVariants } from "@/components/site/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { solutions } from "@/content/nexus-site";
import { createMarketingMetadata } from "@/lib/marketing-seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "Solutions",
  description:
    "See teChia Digital Solutions organized by business type, from local businesses and consultants to logistics companies, ecommerce teams, startups, and internal operations.",
  path: "/solutions"
});

export default function SolutionsPage() {
  return (
    <main id="main-content" className="container py-16 md:py-20">
      <Reveal>
        <SectionHeading
          as="h1"
          align="left"
          eyebrow="Solutions"
          title="Digital solution paths shaped around the business model."
          description="The best answer is rarely just a website. We design the right combination of systems, interfaces, automation, and client experience for the problem in front of you."
        />
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {solutions.map((solution, index) => (
          <Reveal key={solution.title} delay={index * 0.04}>
            <SolutionCard solution={solution} />
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.12}>
        <div className="dark-section mt-16 grid gap-6 rounded-[2rem] p-8 md:grid-cols-[1fr_0.9fr] md:p-10">
          <div>
            <p className="eyebrow">Solution design</p>
            <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold text-white md:text-5xl">
              If the business challenge is clear, we can help shape the right digital product around it.
            </h2>
          </div>
          <div>
            <p className="text-sm leading-7 text-slate-300">
              This is useful when the business knows there is a problem but is not yet sure whether the answer should be a website, dashboard, portal, workflow, or a more complete transformation roadmap.
            </p>
            <Link href="/request-quote" className={`${buttonVariants({ variant: "primary", size: "lg" })} mt-6 w-full sm:w-auto`}>
              Request a solution blueprint
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}
