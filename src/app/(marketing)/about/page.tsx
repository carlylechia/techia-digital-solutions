import type { Metadata } from "next";
import { Lightbulb, Rocket, ShieldCheck, Sparkles, Users, Wrench } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { aboutCopy, companyValues } from "@/content/nexus-site";
import { createMarketingMetadata } from "@/lib/marketing-seo";

const icons = [Sparkles, Wrench, ShieldCheck, Rocket, Lightbulb, Users];

export const metadata: Metadata = createMarketingMetadata({
  title: "About",
  description:
    "Learn why teChia Digital Solutions exists, how the company approaches business growth through marketing and technology, and the values behind its execution.",
  path: "/about"
});

export default function AboutPage() {
  return (
    <main id="main-content" className="container py-16 md:py-20">
      <Reveal>
        <p className="eyebrow">About teChia</p>
        <h1 className="mt-4 max-w-4xl text-balance text-4xl font-semibold text-foreground md:text-6xl">
          A business growth partner built around clearer digital systems for serious companies.
        </h1>
      </Reveal>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {[["Who we are", aboutCopy.whoWeAre], ["Why teChia exists", aboutCopy.whyWeExist], ["Our philosophy", aboutCopy.philosophy]].map(([title, copy], index) => (
          <Reveal key={title} delay={index * 0.04}>
            <div className="gradient-border rounded-[1.6rem]">
              <div className="surface-panel h-full p-6">
                <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
                <p className="mt-4 text-sm leading-7 text-muted">{copy}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.12}>
        <section className="dark-section mt-16 rounded-[2rem] p-8 md:p-10">
          <p className="eyebrow">Founder story</p>
          <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold text-white md:text-5xl">Why the work is shaped this way.</h2>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">{aboutCopy.founderStory}</p>
        </section>
      </Reveal>

      <section className="mt-16">
        <Reveal>
          <p className="eyebrow">Values</p>
          <h2 className="mt-4 text-3xl font-semibold text-foreground md:text-5xl">The values guiding how teChia strategizes, designs, and builds.</h2>
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {companyValues.map((value, index) => {
            const Icon = icons[index];
            return (
              <Reveal key={value.title} delay={index * 0.04}>
                <div className="gradient-border rounded-[1.6rem]">
                  <div className="elevated-panel h-full p-6">
                    <span className="icon-chip inline-flex rounded-2xl p-3">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-5 text-2xl font-semibold text-foreground">{value.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted">{value.description}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
    </main>
  );
}
