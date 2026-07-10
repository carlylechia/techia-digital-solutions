import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroSection } from "@/components/sections/HeroSection";
import { Reveal } from "@/components/site/reveal";
import { buttonVariants } from "@/components/site/button";
import { AIConsultationSection } from "@/components/site/ai-consultation-section";
import { InfiniteMarquee } from "@/components/site/infinite-marquee";
import { PageDirectorySection } from "@/components/site/page-directory-section";
import {
  MetricCard,
  PricingCard,
  ServiceCard,
  SolutionCard,
  TestimonialCard,
} from "@/components/site/cards";
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
  trustStrip,
} from "@/content/nexus-site";
import type { Locale } from "@/content/site";
import { createMarketingMetadata } from "@/lib/marketing-seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "teChia Digital Solutions | Digitalize. Simplify. Grow.",
  description:
    "teChia Digital Solutions helps businesses grow through social media management, digital marketing, branding, websites, SEO, automation, AI solutions, custom software, and digital transformation consulting.",
});

export default function HomePage() {
  const pageDirectoryItems = [
    {
      title: "About",
      description:
        "See the company story, team capability, founder context, and portfolio proof in one stronger narrative.",
      href: "/about",
      eyebrow: "Vision",
      tags: ["Team", "Founder", "Portfolio"],
    },
    {
      title: "Services",
      description:
        "Explore the merged service, solution, and industry flow across marketing, branding, web, automation, AI, and consulting.",
      href: "/services",
      eyebrow: "Offers",
      tags: services.slice(0, 3).map((item) => item.title),
    },
    {
      title: "Founder",
      description:
        "Meet the founder behind teChia’s delivery philosophy, technical depth, and product thinking.",
      href: "/founder",
      eyebrow: "Profile",
      tags: ["Execution", "Product", "Credibility"],
    },
    {
      title: "Process",
      description:
        "Walk through the full journey from discovery and scope to launch and optimization.",
      href: "/process",
      eyebrow: "Method",
      tags: processRoadmap,
    },
    {
      title: "Demo Lab",
      description:
        "Preview interactive teChia demos that make system thinking and interface quality tangible before a project starts.",
      href: "/demo-lab",
      eyebrow: "Preview",
      tags: ["Dashboards", "Flows", "Prototypes"],
    },
    {
      title: "Pricing",
      description:
        "Understand the commercial pathways from visibility and brand foundations to deeper transformation.",
      href: "/pricing",
      eyebrow: "Commercial",
      tags: pricingPlans.map((item) => item.title),
    },
    {
      title: "Resources",
      description:
        "Read practical strategy guidance before choosing the right digital path.",
      href: "/resources",
      eyebrow: "Insights",
      tags: ["Digital homes", "AI readiness", "Systems thinking"],
    },
    {
      title: "Contact",
      description:
        "Reach teChia through the direct channels and start a more concrete conversation.",
      href: "/contact",
      eyebrow: "Connect",
      tags: ["WhatsApp", "Email", "FAQ"],
    },
    {
      title: "Request Quote",
      description:
        "Share the business context and get pointed toward the right architecture and scope.",
      href: "/request-quote",
      eyebrow: "Conversion",
      tags: ["Discovery", "Scope", "Launch"],
    },
    {
      title: "Trust & legal",
      description:
        "Review the privacy and terms pages from a single trust-focused orientation point.",
      href: "/privacy",
      eyebrow: "Compliance",
      tags: ["Privacy", "Terms", "Trust"],
    },
    {
      title: "Client portal",
      description:
        "Preview the logged-in experience for projects, files, invoices, and communication.",
      href: "/client-portal",
      eyebrow: "Portal",
      tags: ["Projects", "Files", "Invoices"],
    },
    {
      title: "AI consultant",
      description:
        "Chat with the teChia AI Growth Agent to map the right marketing, web, automation, AI, or software direction before you commit.",
      href: "/ai-consultant",
      eyebrow: "AI",
      tags: ["Chat", "Brief", "Recommendation"],
    },
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
                <p className="font-script text-3xl text-accent-3 md:text-4xl">
                  a connected showcase of growth capability
                </p>
                <p className="eyebrow mt-3">Growth signals</p>
                <div className="mt-5 space-y-4">
                  <InfiniteMarquee
                    items={[
                      ...trustStrip,
                      ...services.slice(0, 3).map((item) => item.title),
                      ...processRoadmap,
                    ]}
                  />
                  <InfiniteMarquee
                    items={[
                      ...solutions.slice(0, 4).map((item) => item.title),
                      ...pricingPlans.map((item) => item.title),
                      ...caseStudies.map((item) => item.title),
                    ]}
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
                <p className="eyebrow">Business friction</p>
                <h2 className="mt-4 text-balance text-3xl font-semibold text-foreground md:text-5xl">
                  Most businesses do not need more digital noise. They need a
                  clearer growth system.
                </h2>
                <p className="mt-5 text-lg leading-8 text-muted">
                  When your brand, campaigns, website, customer communication,
                  files, and team processes live in different places, growth
                  becomes harder than it should be.
                </p>
              </div>
            </div>
            <div className="gradient-border rounded-[1.75rem]">
              <div className="elevated-panel h-full p-7 md:p-8">
                <p className="eyebrow">Growth system</p>
                <h2 className="mt-4 text-balance text-3xl font-semibold text-foreground md:text-5xl">
                  teChia designs the connected digital layer that helps the
                  business attract customers and run better.
                </h2>
                <p className="mt-5 text-lg leading-8 text-muted">
                  Growth is stronger when branding, marketing, web, customer
                  experience, dashboards, and automation work as one system.
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
            title="Growth services built for businesses that want more customers, clearer branding, and better operations."
            description="Every service is designed to support a real business outcome, not just a deliverable."
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
        secondaryAction={{ href: "/contact", label: "Book a consultation" }}
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
                <p className="font-script text-3xl text-accent-3 md:text-4xl">
                  strategy connected to execution
                </p>
                <p className="eyebrow mt-3">Growth architecture</p>
                <h2 className="mt-4 text-balance text-4xl font-semibold md:text-6xl">
                  <span className="headline-gradient">
                    Strong growth systems work best when brand, campaigns, and
                    operations move together.
                  </span>
                </h2>
                <div className="headline-underline mt-6" aria-hidden="true" />
                <p className="mt-6 text-base leading-8 text-muted md:text-lg">
                  Our strongest work blends positioning, marketing, web
                  experiences, lead systems, and operational clarity into one
                  memorable digital layer.
                </p>
              </div>
            </div>
            <div className="grid gap-4">
              {[
                {
                  title: "Signature presence",
                  description:
                    "High-trust branding, campaigns, and digital storytelling that make the company feel established from the first visit.",
                  items: services.slice(0, 3).map((item) => item.title),
                },
                {
                  title: "Operational intelligence",
                  description:
                    "Dashboards, portals, and automation flows that reduce noise while keeping teams informed.",
                  items: processRoadmap,
                },
                {
                  title: "Growth choreography",
                  description:
                    "Conversion paths, strategic follow-up, and scalable systems designed to build momentum.",
                  items: pricingPlans.map((item) => item.title),
                },
              ].map((suite) => (
                <article
                  key={suite.title}
                  className="gradient-border rounded-[1.6rem]"
                >
                  <div className="surface-panel h-full p-6">
                    <h3 className="text-2xl font-semibold text-primary">
                      {suite.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted">
                      {suite.description}
                    </p>
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
          title="The homepage now points toward every major destination in the wider teChia growth experience."
          description="This gives visitors a clear orientation layer into vision, services, solutions, proof, trust, resources, and conversion moments across the full site."
          items={pageDirectoryItems}
        />
      </Reveal>

      <section className="container py-16">
        <Reveal>
          <SectionHeading
            eyebrow="Process"
            title="A premium process that moves from business clarity to growth-ready execution."
            description="We stay close to the real business goal, reduce avoidable complexity, and build toward something trustworthy from day one."
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
            title="A clearer growth system changes how seriously a business is taken."
            description="These concepts and case studies show how branding, systems thinking, and product clarity come together."
          />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2">
          {caseStudies.map((study, index) => (
            <Reveal key={study.slug} delay={index * 0.05}>
              <div className="gradient-border rounded-[1.75rem]">
                <div className="elevated-panel h-full p-6">
                  <p className="eyebrow">{study.industry}</p>
                  <h3 className="mt-4 text-2xl font-semibold text-foreground">
                    {study.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    {study.summary}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {study.metrics.map((metric) => (
                      <span key={metric} className="trust-pill">
                        {metric}
                      </span>
                    ))}
                  </div>
                  <Link
                    href="/about"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent-2"
                  >
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
                    Not sure whether you need marketing, branding, web,
                    automation, or software?
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
                    Tell us the business context and we will recommend the
                    smartest growth path, from discovery to launch support.
                </p>
                  <Link
                    href="/request-quote"
                    className={`${buttonVariants({ variant: "primary", size: "lg" })} mt-8 w-full sm:w-auto`}
                  >
                    Request a tailored solution
                  </Link>
                </div>
                <div className="grid gap-4">
                  {[
                    "Map the problem and current friction",
                    "Recommend the right marketing and digital architecture",
                    "Prioritize delivery around business impact",
                  ].map((item) => (
                    <div
                      key={item}
                      className="subtle-tile rounded-[1.35rem] p-4 text-sm text-muted"
                    >
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
            title="The work should feel premium, thoughtful, and easier to grow with."
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
            <MetricCard
              value="Africa + Europe"
              label="Positioning built to feel credible across local and international markets."
            />
            <MetricCard
              value="Systems + UX"
              label="User experience and business operations are designed together, not separately."
            />
            <MetricCard
              value="Premium by default"
              label="High-trust visuals, clear structure, and practical delivery for serious businesses."
            />
          </div>
        </Reveal>
      </section>

      <section className="container pb-20">
        <Reveal>
          <div className="gradient-border rounded-[2rem]">
            <div className="elevated-panel p-8 text-center md:p-12">
              <p className="eyebrow mx-auto justify-center">
                Final call to action
              </p>
              <h2 className="mx-auto mt-4 max-w-4xl text-balance text-4xl font-semibold text-foreground md:text-6xl">
                Ready to grow your business with a smarter digital strategy?
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted">
                Start with a conversation. We will help shape the right service
                mix before we build or launch anything.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className={`${buttonVariants({ variant: "primary", size: "lg" })} w-full sm:w-auto`}
                >
                  Book a Free Consultation
                </Link>
                <Link
                  href="/services"
                  className={`${buttonVariants({ variant: "secondary", size: "lg" })} w-full sm:w-auto`}
                >
                  Explore Our Services
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
