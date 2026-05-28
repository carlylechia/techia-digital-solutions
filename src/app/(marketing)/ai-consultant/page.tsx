import type { Metadata } from "next";
import {
  Bot,
  Sparkles,
  Zap,
  Target,
  MessageSquare,
  CheckCircle2,
  Building2,
  Rocket,
  Code2,
  TrendingUp,
} from "lucide-react";
import { AIChatCTA, AIChatBottomCTA } from "./chat-cta";
import { createMarketingMetadata } from "@/lib/marketing-seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "AI Growth Agent | teChia Digital Solutions",
  description:
    "Meet the teChia AI Growth Agent — your intelligent digital consultant. Get service recommendations, request demos, and prepare project briefs instantly.",
  path: "/ai-consultant",
});

const capabilities = [
  {
    icon: Target,
    label: "Service Recommender",
    desc: "Identifies the exact digital service you need based on your business goals",
  },
  {
    icon: MessageSquare,
    label: "Lead Qualifier",
    desc: "Understands your project scope, budget, and timeline intelligently",
  },
  {
    icon: Sparkles,
    label: "Project Brief Generator",
    desc: "Creates a clear internal brief from your conversation",
  },
  {
    icon: Zap,
    label: "Demo Connector",
    desc: "Connects you to the right demo experience instantly",
  },
];

const services = [
  { icon: Building2, name: "Business Website", desc: "Professional, conversion-optimised websites" },
  { icon: Rocket, name: "SaaS MVP", desc: "Rapid MVP development from concept to launch" },
  { icon: Bot, name: "AI Agent", desc: "Custom AI chatbots and automation" },
  { icon: Code2, name: "Admin Dashboard", desc: "Internal tools and business systems" },
  { icon: TrendingUp, name: "SEO & Growth", desc: "Visibility, traffic, and lead generation" },
];

export default function AIConsultantPage() {
  return (
    <main id="main-content">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-24 pb-16 sm:px-6 sm:pt-32 sm:pb-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20">
            <Bot className="h-8 w-8 text-accent" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-2">
            AI Growth Agent
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-primary sm:text-5xl md:text-6xl">
            Your Digital Solutions
            <br />
            <span className="text-accent">Consultant</span>
          </h1>
          <p className="mt-6 text-base text-muted sm:text-lg max-w-2xl mx-auto leading-relaxed">
            The teChia AI Growth Agent helps founders, SMEs, and business owners choose the right
            digital solution — and move from idea to proposal in minutes.
          </p>
          <div className="mt-8">
            <AIChatCTA />
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-accent-2 mb-3">
            What it does
          </p>
          <h2 className="text-center text-2xl font-bold text-primary sm:text-3xl mb-12">
            More than a chatbot — a growth consultant
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {capabilities.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-2xl border border-border bg-surface p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-semibold text-primary mb-1.5">{label}</h3>
                <p className="text-sm text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services it understands */}
      <section className="px-4 py-16 sm:px-6 bg-surface/50">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-accent-2 mb-3">
            Services covered
          </p>
          <h2 className="text-center text-2xl font-bold text-primary sm:text-3xl mb-10">
            Every teChia service, explained and recommended
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {services.map(({ icon: Icon, name }) => (
              <div
                key={name}
                className="flex items-center gap-2.5 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-primary"
              >
                <Icon className="h-4 w-4 text-accent flex-shrink-0" />
                <span className="font-medium">{name}</span>
              </div>
            ))}
            <div className="flex items-center gap-2.5 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-muted">
              + branding, SEO, redesign, maintenance…
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-accent-2 mb-3">
            How it works
          </p>
          <h2 className="text-center text-2xl font-bold text-primary sm:text-3xl mb-10">
            From conversation to proposal in minutes
          </h2>
          <div className="space-y-4">
            {[
              {
                step: "01",
                title: "Describe your goal",
                desc: "Tell the agent what you want to build or improve.",
              },
              {
                step: "02",
                title: "Answer a few questions",
                desc: "Business type, timeline, budget, key features — asked naturally.",
              },
              {
                step: "03",
                title: "Get a recommendation",
                desc: "The agent identifies the right teChia service and next steps.",
              },
              {
                step: "04",
                title: "Request a demo or quote",
                desc: "Share your details and the team follows up with a tailored proposal.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4 rounded-2xl border border-border bg-surface p-5">
                <span className="text-2xl font-bold text-accent/30 flex-shrink-0 w-8">{step}</span>
                <div>
                  <h3 className="font-semibold text-primary mb-1">{title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For who */}
      <section className="px-4 py-16 sm:px-6 bg-surface/50">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-2 mb-3">
            Recommended for
          </p>
          <h2 className="text-2xl font-bold text-primary sm:text-3xl mb-8">
            Built for ambitious businesses
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Founders & Startups",
              "SMEs",
              "Agencies",
              "E-commerce businesses",
              "Service businesses",
              "SaaS builders",
            ].map((type) => (
              <span
                key={type}
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm text-primary"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 sm:py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-primary sm:text-4xl">
            Ready to find your solution?
          </h2>
          <p className="mt-4 text-muted text-base sm:text-lg">
            The AI agent is live right now. No sign-up needed.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <AIChatBottomCTA />
          </div>
        </div>
      </section>
    </main>
  );
}
