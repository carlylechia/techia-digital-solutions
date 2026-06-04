import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CardItem, Locale } from "@/content/site";
import { getLocalizedHref } from "@/content/site";

export function FeatureCard({ item, locale, href, hrefBase, cta }: { item: CardItem; locale: Locale; href?: string; hrefBase?: string; cta?: string }) {
  const resolvedHref = href ? getLocalizedHref(locale, href) : hrefBase ? getLocalizedHref(locale, `${hrefBase}/${item.slug}`) : undefined;
  const card = (
    <article className="group premium-card panel-safe relative flex h-full flex-col justify-between rounded-[1.7rem] p-6 transition duration-500 hover:-translate-y-2 hover:border-cyan-300/40 hover:shadow-[0_30px_90px_rgba(8,20,36,0.12)]">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/55 to-transparent" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.1),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(251,113,133,0.08),transparent_24%)] opacity-0 transition duration-500 group-hover:opacity-100" aria-hidden="true" />
      <div className="panel-safe relative z-[1]">
        {item.eyebrow || item.badge ? <p className="eyebrow mb-4">{item.eyebrow || item.badge}</p> : null}
        <h3 className="break-safe text-2xl font-semibold text-primary">{item.title}</h3>
        <p className="break-safe mt-3 text-sm leading-7 text-muted">{item.description}</p>
        {item.features?.length ? (
          <ul className="mt-5 grid gap-2.5 text-sm text-muted">
            {item.features.slice(0, 4).map((feature) => (
              <li key={feature} className="break-safe flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-accent-2 to-accent-3" />
                {feature}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {resolvedHref ? (
        <span className="break-safe relative z-[1] mt-6 inline-flex max-w-full items-center gap-2 text-sm font-semibold text-accent">
          {cta || "Explore"} <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      ) : null}
    </article>
  );
  return resolvedHref ? <Link href={resolvedHref}>{card}</Link> : card;
}
