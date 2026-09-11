import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { services } from "@/content/nexus-site";
import { siteConfig } from "@/content/site";
import { toKebabCase } from "@/lib/utils";
import { buttonVariants } from "./button";

const footerGroups = [
  {
    title: "Services",
    links: services.map((item) => ({
      label: item.title,
      href: `/services#${toKebabCase(item.title)}`,
    })),
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Founder", href: "/founder" },
      { label: "Demo Lab", href: "/demo-lab" },
      { label: "AI Consultant", href: "/ai-consultant" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      className="footer-stage text-white"
      style={{ background: "linear-gradient(180deg, #06101D, #040812)" }}
    >
      <div className="container py-6">
        <div className="gradient-border rounded-[2rem] footer-callout">
          <div className="elevated-panel px-6 py-8 md:px-10 md:py-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="font-script text-3xl text-accent-3 md:text-4xl">
                  build the next growth layer
                </p>
                <p className="eyebrow mt-3">Next step</p>
                <h2 className="mt-4 max-w-3xl text-balance text-4xl font-semibold md:text-6xl">
                  <span className="headline-gradient">
                    Ready to grow your business with a more connected digital
                    strategy?
                  </span>
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
                  teChia combines marketing, branding, web, automation, AI,
                  and operational thinking so the business attracts better
                  opportunities and runs more smoothly.
                </p>
              </div>
              <div className="grid gap-4">
                {[
                  "Stronger visibility and clearer positioning",
                  "Systems that remove friction behind the scenes",
                  "Growth support designed for real business momentum",
                ].map((item) => (
                  <div
                    key={item}
                    className="subtle-tile-strong rounded-[1.4rem] p-4 text-sm leading-7 text-slate-200"
                  >
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
            teChia Digital Solutions helps businesses grow through social media
            management, digital marketing, branding, premium websites, SEO,
            automation, AI solutions, and custom software.
          </p>
          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
              Contact
            </p>
            <p className="mt-3 text-sm text-slate-200">{siteConfig.location}</p>
            <a
              href={`mailto:${siteConfig.email}`}
              className="mt-1 inline-block text-sm text-slate-300 transition hover:text-white"
            >
              {siteConfig.email}
            </a>
            <Link
              href="/contact"
              className={`${buttonVariants({ variant: "primary", size: "md" })} mt-5 w-full sm:w-auto`}
            >
              Book a Free Consultation
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
              Newsletter
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Join the teChia Growth Brief to make your business easier to
              find, easier to trust, easier to manage, and easier to grow.
            </p>
            <div className="mt-4">
              <NewsletterForm locale="en" />
            </div>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-white">
                {group.title}
              </h3>
              <div className="mt-5 grid gap-3">
                {group.links.map((link, index) => (
                  <Link
                    key={`${link.label}-${index}`}
                    href={link.href}
                    className="text-sm text-slate-300 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div>
            <h3 className="text-sm font-semibold text-white">Explore</h3>
            <div className="mt-5 grid gap-3">
              <Link
                href="/services"
                className="text-sm text-slate-300 transition hover:text-white"
              >
                Service catalog
              </Link>
              <Link
                href="/services"
                className="text-sm text-slate-300 transition hover:text-white"
              >
                Solution modules
              </Link>
              <Link
                href="/about"
                className="text-sm text-slate-300 transition hover:text-white"
              >
                Portfolio proof
              </Link>
              <Link
                href="/client-portal"
                className="text-sm text-slate-300 transition hover:text-white"
              >
                Client portal preview
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} teChia Digital Solutions. All rights
          reserved.
        </p>
        <p>Digitalize. Simplify. Grow.</p>
      </div>
    </footer>
  );
}
