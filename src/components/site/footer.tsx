import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { services, socialLinks } from "@/content/nexus-site";
import { siteConfig } from "@/content/site";
import { toKebabCase } from "@/lib/utils";
import { buttonVariants } from "./button";

const footerGroups = [
  {
    title: "Services",
    links: services.map((item) => ({ label: item.title, href: `/services#${toKebabCase(item.title)}` }))
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Process", href: "/process" },
      { label: "Work", href: "/work" },
      { label: "Resources", href: "/resources" },
      { label: "AI Consultant", href: "/ai-consultant" }
    ]
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" }
    ]
  }
];

export function Footer() {
  return (
    <footer className="footer-stage text-white" style={{ background: "linear-gradient(180deg, #06101D, #040812)" }}>
      <div className="container py-6">
        <div className="gradient-border rounded-[2rem] footer-callout">
          <div className="elevated-panel px-6 py-8 md:px-10 md:py-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="font-script text-3xl text-accent-3 md:text-4xl">shape a digital flagship</p>
                <p className="eyebrow mt-3">Closing scene</p>
                <h2 className="mt-4 max-w-3xl text-balance text-4xl font-semibold md:text-6xl">
                  <span className="headline-gradient">Ready for a website and system layer that feels unmistakably premium?</span>
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
                  We combine storytelling, interface choreography, and operational thinking so the business looks sharper and runs smoother.
                </p>
              </div>
              <div className="grid gap-4">
                {[
                  "Positioning with stronger first impressions",
                  "Systems that remove friction behind the scenes",
                  "Launch support designed for real business momentum"
                ].map((item) => (
                  <div key={item} className="subtle-tile-strong rounded-[1.4rem] p-4 text-sm leading-7 text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container grid gap-10 py-16 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <Logo variant="horizontal" size="lg" theme="dark" interactive />
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
            Digital homes for modern businesses. teChia Digital Solutions builds premium websites, systems, dashboards, automation tools, and AI-powered solutions for serious growth.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="trust-pill border-white/10 bg-white/[0.06] text-slate-200"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">Contact</p>
            <p className="mt-3 text-sm text-slate-200">{siteConfig.location}</p>
            <a href={`mailto:${siteConfig.email}`} className="mt-1 inline-block text-sm text-slate-300 transition hover:text-white">
              {siteConfig.email}
            </a>
            <Link href="/request-quote" className={`${buttonVariants({ variant: "primary", size: "md" })} mt-5 w-full sm:w-auto`}>
              Start a Project
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-white">{group.title}</h3>
              <div className="mt-5 grid gap-3">
                {group.links.map((link, index) => (
                  <Link key={`${link.label}-${index}`} href={link.href} className="text-sm text-slate-300 transition hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div>
            <h3 className="text-sm font-semibold text-white">Solutions</h3>
            <div className="mt-5 grid gap-3">
              <Link href="/solutions" className="text-sm text-slate-300 transition hover:text-white">
                Local businesses
              </Link>
              <Link href="/solutions" className="text-sm text-slate-300 transition hover:text-white">
                Travel and logistics
              </Link>
              <Link href="/solutions" className="text-sm text-slate-300 transition hover:text-white">
                Startups and SaaS ideas
              </Link>
              <Link href="/client-portal" className="text-sm text-slate-300 transition hover:text-white">
                Client portal preview
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} teChia Digital Solutions. All rights reserved.</p>
        <p>Simple problems. Smart tech solutions.</p>
      </div>
    </footer>
  );
}
