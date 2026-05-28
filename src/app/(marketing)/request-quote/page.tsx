import type { Metadata } from "next";
import { QuoteForm } from "@/components/site/forms";
import { Reveal } from "@/components/site/reveal";
import { createMarketingMetadata } from "@/lib/marketing-seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "Request Quote",
  description:
    "Request a premium digital solution quote from teChia Digital Solutions for websites, systems, dashboards, automation, AI tools, and consulting.",
  path: "/request-quote"
});

export default function RequestQuotePage() {
  return (
    <main id="main-content" className="container py-16 md:py-20">
      <Reveal>
        <p className="eyebrow">Request quote</p>
        <h1 className="mt-4 max-w-4xl text-balance text-4xl font-semibold text-foreground md:text-6xl">
          Build the right digital solution, not just the obvious one.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
          Share the business context, the friction, the ambition, and the preferred timeline. We will turn that into a cleaner solution path.
        </p>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="mt-10">
          <QuoteForm />
        </div>
      </Reveal>
    </main>
  );
}
