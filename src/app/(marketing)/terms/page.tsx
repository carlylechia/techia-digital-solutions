import type { Metadata } from "next";
import { Reveal } from "@/components/site/reveal";
import { legalContent } from "@/content/nexus-site";
import { createMarketingMetadata } from "@/lib/marketing-seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "Terms",
  description: "Read the teChia Digital Solutions terms overview for website use, project engagement, and client portal preview expectations.",
  path: "/terms"
});

export default function TermsPage() {
  return (
    <main id="main-content" className="container py-16 md:py-20">
      <Reveal>
        <p className="eyebrow">Terms</p>
        <h1 className="mt-4 max-w-4xl text-balance text-4xl font-semibold text-foreground md:text-6xl">Terms and engagement overview.</h1>
      </Reveal>

      <Reveal delay={0.06}>
        <section className="surface-panel mt-10 rounded-[1.8rem] p-8">
          <div className="grid gap-5">
            {legalContent.terms.map((item) => (
              <p key={item} className="text-base leading-8 text-muted">
                {item}
              </p>
            ))}
          </div>
        </section>
      </Reveal>
    </main>
  );
}
