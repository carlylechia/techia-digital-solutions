import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroSection } from "@/components/sections/HeroSection";
import { Reveal } from "@/components/site/reveal";
import { buttonVariants } from "@/components/site/button";
import { AIConsultationSection } from "@/components/site/ai-consultation-section";
import { InfiniteMarquee } from "@/components/site/infinite-marquee";
import { PageDirectorySection } from "@/components/site/page-directory-section";
import { MetricCard, PricingCard, ServiceCard, SolutionCard, TestimonialCard } from "@/components/site/cards";
import { ProcessTimeline } from "@/components/site/process-timeline";
import { AnimatedGridBackground } from "@/components/site/animated-grid-background";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  caseStudies,
  pricingPlans,
  processRoadmap,
  services,
  solutions,
  testimonials,
  trustStrip
} from "@/content/nexus-site";
import type { Locale } from "@/content/site";
import { createMarketingMetadata } from "@/lib/marketing-seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "teChia Digital Solutions | Premium Websites, Automation & Digital Systems",
  description:
    "teChia Digital Solutions builds premium websites, business management systems, dashboards, automation tools, and AI-powered digital solutions for modern businesses."
});

export default function HomePage() {
  const pageDirectoryItems = [
    {
      title: "About",
      description: "See the philosophy, positioning, and company story driving teChia’s premium digital work.",
      href: "/about",
      eyebrow: "Vision",
      tags: ["Story", "Positioning", "Values"]
    },
    {
      title: "Services",
      description: "Explore websites, systems, dashboards, automation, AI tools, and consulting offers.",
      href: "/services",
      eyebrow: "Offers",
      tags: services.slice(0, 3).map((item) => item.title)
    },
    {
      title: "Solutions",
      description: "Browse solution paths shaped around business models, friction points, and outcomes.",
      href: "/solutions",
      eyebrow: "Modules",
      tags: solutions.slice(0, 3).map((item) => item.title)
    },
    {
      title: "Process",
      description: "Walk through the full journey from discovery and scope to launch and optimization.",
      href: "/process",
      eyebrow: "Method",
      tags: processRoadmap
    },
    {
      title: "Work",
      description: "Review case studies and concept projects that show how strategy and execution meet.",
      href: "/work",
      eyebrow: "Proof",
      tags: caseStudies.slice(0, 3).map((item) => item.title)
    },
    {
      title: "Pricing",
      description: "Understand the commercial pathways from focused web presence to full transformation.",
      href: "/pricing",
      eyebrow: "Commercial",
      tags: pricingPlans.map((item) => item.title)
    },
    {
      title: "Resources",
      description: "Read practical strategy guidance before choosing the right digital path.",
      href: "/resources",
      eyebrow: "Insights",
      tags: ["Digital homes", "AI readiness", "Systems thinking"]
    },
    {
      title: "Contact",
      description: "Reach teChia through the direct channels and start a more concrete conversation.",
      href: "/contact",
      eyebrow: "Connect",
      tags: ["WhatsApp", "Email", "FAQ"]
    },
    {
      title: "Request Quote",
      description: "Share the business context and get pointed toward the right architecture and scope.",
      href: "/request-quote",
      eyebrow: "Conversion",
      tags: ["Discovery", "Scope", "Launch"]
    },
    {
      title: "Trust & legal",
      description: "Review the privacy and terms pages from a single trust-focused orientation point.",
      href: "/privacy",
      eyebrow: "Compliance",
      tags: ["Privacy", "Terms", "Trust"]
    },
    {
      title: "Client portal",
      description: "Preview the logged-in experience for projects, files, invoices, and communication.",
      href: "/client-portal",
      eyebrow: "Portal",
      tags: ["Projects", "Files", "Invoices"]
    },
    {
      title: "AI consultant",
      description: "Chat with the teChia AI Growth Agent to map the right website, system, automation, or AI direction before you commit.",
      href: "/ai-consultant",
      eyebrow: "AI",
      tags: ["Chat", "Brief", "Recommendation"]
    }
  ];
  const publicLocale = "en" as Locale;

  return (
    <main id="main-content">
      <HeroSection />

      <section id="homepage-trust-strip" className="container pb-6">
        <div className="gradient-border rounded-[1.75rem]">
          <div className="surface-panel relative overflow-hidden px-5 py-5 md:px-8">
            <AnimatedGridBackground />
            <div className="relative z-10 flex flex-wrap gap-3">
              {trustStrip.map((item) => (
                <span key={item} className="trust-pill">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container py-10">
        <Reveal>
          <div className="gradient-border rounded-[2rem]">
            <div className="surface-panel relative overflow-hidden p-5 md:p-6">
              <AnimatedGridBackground className="opacity-60" />
              <div className="relative z-10">
                <p className="font-script text-3xl text-accent-3 md:text-4xl">a kinetic showcase of capability</p>
                <p className="eyebrow mt-3">Infinite motion</p>
                <div className="mt-5 space-y-4">
                  <InfiniteMarquee items={[...trustStrip, ...services.slice(0, 3).map((item) => item.title), ...processRoadmap]} />
                  <InfiniteMarquee
                    items={[...solutions.slice(0, 4).map((item) => item.title), ...pricingPlans.map((item) => item.title), ...caseStudies.map((item) => item.title)]}
                    direction="right"
                    speed="36s"
                  />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="container py-16">
        <Reveal>
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="gradient-border rounded-[1.75rem]">
              <div className="elevated-panel h-full p-7 md:p-8">
                <p className="eyebrow">Simple problems</p>
                <h2 className="mt-4 text-balance text-3xl font-semibold text-foreground md:text-5xl">
                  Most businesses do not need more complexity. They need better systems.
                </h2>
                <p className="mt-5 text-lg leading-8 text-muted">
                  When your website, proposals, customer communication, files, and team processes live in different places, growth becomes harder than it should be.
                </p>
              </div>
            </div>
            <div className="gradient-border rounded-[1.75rem]">
              <div className="elevated-panel h-full p-7 md:p-8">
                <p className="eyebrow">Smart tech solutions</p>
                <h2 className="mt-4 text-balance text-3xl font-semibold text-foreground md:text-5xl">
                  teChia designs the digital layer that makes the business easier to understand and easier to run.
                </h2>
                <p className="mt-5 text-lg leading-8 text-muted">
                  A digital home is more than a website. It is your public brand, your lead engine, your client experience, your dashboard, and your automation foundation working together.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="container py-16">
        <Reveal>
          <SectionHeading
            eyebrow="Services"
            title="Premium digital delivery for businesses that want more than a brochure website."
            description="Every service is designed to look polished, move clearly, and support real operational outcomes."
          />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service, index) => (
            <Reveal key={service.title} delay={index * 0.04}>
              <ServiceCard service={service} />
            </Reveal>
          ))}
        </div>
      </section>

      <AIConsultationSection
        locale={publicLocale}
        secondaryAction={{ href: "/request-quote", label: "Request a quote" }}
      />

      <section className="container py-16">
        <Reveal>
          <SectionHeading
            eyebrow="Solutions"
            title="The right solution depends on the business model, not a template."
            description="We organize solutions around the kinds of businesses and internal challenges we actually help."
          />
        </Reveal>
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {solutions.map((solution, index) => (
            <Reveal key={solution.title} delay={index * 0.04}>
              <SolutionCard solution={solution} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container py-16">
        <Reveal>
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="gradient-border rounded-[2rem]">
              <div className="elevated-panel h-full p-8 md:p-10">
                <p className="font-script text-3xl text-accent-3 md:text-4xl">systems with theatre built in</p>
                <p className="eyebrow mt-3">Experience architecture</p>
                <h2 className="mt-4 text-balance text-4xl font-semibold md:text-6xl">
                  <span className="headline-gradient">Beautiful interfaces are stronger when they also organize how the business moves.</span>
                </h2>
                <div className="headline-underline mt-6" aria-hidden="true" />
                <p className="mt-6 text-base leading-8 text-muted md:text-lg">
                  Our strongest work blends positioning, UX choreography, lead systems, and back-office clarity into one memorable digital layer.
                </p>
              </div>
            </div>
            <div className="grid gap-4">
              {[
                {
                  title: "Signature presence",
                  description: "High-trust branding, landing pages, and storytelling that make the company feel established from the first visit.",
                  items: services.slice(0, 3).map((item) => item.title)
                },
                {
                  title: "Operational intelligence",
                  description: "Dashboards, portals, and automation flows that reduce noise while keeping teams informed.",
                  items: processRoadmap
                },
                {
                  title: "Growth choreography",
                  description: "Conversion paths, strategic follow-up, and scalable systems designed for momentum.",
                  items: pricingPlans.map((item) => item.title)
                }
              ].map((suite) => (
                <article key={suite.title} className="gradient-border rounded-[1.6rem]">
                  <div className="surface-panel h-full p-6">
                    <h3 className="text-2xl font-semibold text-primary">{suite.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted">{suite.description}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {suite.items.map((item) => (
                        <span key={item} className="trust-pill">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <Reveal>
        <PageDirectorySection
          accentScript="browse the full constellation"
          eyebrow="Full map"
          title="The homepage now points toward every major destination in the wider teChia experience."
          description="This gives visitors a premium orientation layer into vision, services, solutions, proof, legal trust, portal previews, resources, and conversion moments across the full site."
          items={pageDirectoryItems}
        />
      </Reveal>

      <section className="container py-16">
        <Reveal>
          <SectionHeading
            eyebrow="Process"
            title="A premium process that moves from business clarity to launch-ready execution."
            description="We stay close to the business problem, reduce avoidable complexity, and build toward something that feels trustworthy on day one."
          />
        </Reveal>
        <Reveal delay={0.06}>
          <ProcessTimeline steps={processRoadmap} />
        </Reveal>
      </section>

      <section className="container py-16">
        <Reveal>
          <SectionHeading
            eyebrow="Selected work"
            title="A clearer digital presence changes how seriously a business is taken."
            description="These concepts and case studies show how premium design, systems thinking, and product clarity come together."
          />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2">
          {caseStudies.map((study, index) => (
            <Reveal key={study.slug} delay={index * 0.05}>
              <div className="gradient-border rounded-[1.75rem]">
                <div className="elevated-panel h-full p-6">
                  <p className="eyebrow">{study.industry}</p>
                  <h3 className="mt-4 text-2xl font-semibold text-foreground">{study.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">{study.summary}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {study.metrics.map((metric) => (
                      <span key={metric} className="trust-pill">
                        {metric}
                      </span>
                    ))}
                  </div>
                  <Link href={`/work#${study.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent-2">
                    View Case Study
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container py-16">
        <Reveal>
          <div className="gradient-border rounded-[2rem]">
            <div className="elevated-panel relative overflow-hidden p-8 md:p-12">
              <AnimatedGridBackground />
              <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
                <div>
                  <p className="eyebrow">Interactive quote</p>
                  <h2 className="mt-4 text-balance text-4xl font-semibold text-foreground md:text-5xl">
                    Not sure whether you need a website, a system, a dashboard, or an automation layer?
                  </h2>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
                    Tell us the business context and we will recommend the smartest solution path, from discovery to launch support.
                  </p>
                  <Link href="/request-quote" className={`${buttonVariants({ variant: "primary", size: "lg" })} mt-8 w-full sm:w-auto`}>
                    Request a tailored solution
                  </Link>
                </div>
                <div className="grid gap-4">
                  {[
                    "Map the problem and current friction",
                    "Recommend the right digital architecture",
                    "Prioritize delivery around business impact"
                  ].map((item) => (
                    <div key={item} className="subtle-tile rounded-[1.35rem] p-4 text-sm text-muted">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="container py-16">
        <Reveal>
          <SectionHeading
            eyebrow="Testimonials"
            title="The work should feel premium, thoughtful, and easier to move forward with."
            description="That is the standard teChia is designed around."
          />
        </Reveal>
        <div className="grid gap-5 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <Reveal key={item.name} delay={index * 0.04}>
              <TestimonialCard item={item} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container py-16">
        <Reveal>
          <SectionHeading
            eyebrow="Pricing"
            title="Flexible engagement paths for different stages of digital growth."
            description="We keep the commercial framing clear while leaving room for custom solution design."
          />
        </Reveal>
        <div className="grid gap-5 xl:grid-cols-3">
          {pricingPlans.map((plan, index) => (
            <Reveal key={plan.title} delay={index * 0.05}>
              <PricingCard plan={plan} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container py-20">
        <Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            <MetricCard value="Africa + Europe" label="Positioning built to feel credible across local and international markets." />
            <MetricCard value="Systems + UX" label="User experience and business operations are designed together, not separately." />
            <MetricCard value="Premium by default" label="High-trust visuals, clear structure, and practical delivery for serious businesses." />
          </div>
        </Reveal>
      </section>

      <section className="container pb-20">
        <Reveal>
          <div className="gradient-border rounded-[2rem]">
            <div className="elevated-panel p-8 text-center md:p-12">
              <p className="eyebrow mx-auto justify-center">Final call to action</p>
              <h2 className="mx-auto mt-4 max-w-4xl text-balance text-4xl font-semibold text-foreground md:text-6xl">
                Ready to build a digital home that looks serious and works hard for the business?
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted">
                Start with a conversation. We will help shape the right solution before we build anything.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/request-quote" className={`${buttonVariants({ variant: "primary", size: "lg" })} w-full sm:w-auto`}>
                  Start a Project
                </Link>
                <Link href="/contact" className={`${buttonVariants({ variant: "secondary", size: "lg" })} w-full sm:w-auto`}>
                  Contact teChia
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
