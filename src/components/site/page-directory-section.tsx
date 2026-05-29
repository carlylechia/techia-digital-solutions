import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type DirectoryItem = {
  title: string;
  description: string;
  href: string;
  eyebrow?: string;
  tags?: string[];
};

export function PageDirectorySection({
  accentScript = "explore every destination",
  eyebrow,
  title,
  description,
  items,
  className,
}: {
  accentScript?: string;
  eyebrow: string;
  title: string;
  description: string;
  items: DirectoryItem[];
  className?: string;
}) {
  return (
    <section className={cn("container py-12 md:py-16", className)}>
      <div className="gradient-border rounded-[2rem]">
        <div className="elevated-panel relative overflow-hidden p-5 sm:p-7 md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.1),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(251,113,133,0.1),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(245,185,66,0.08),transparent_26%)]" />
          <div className="relative z-[1]">
            <p className="font-script text-3xl text-accent-3 md:text-4xl">
              {accentScript}
            </p>
            <p className="eyebrow mt-3">{eyebrow}</p>
            <h2 className="mt-4 max-w-4xl text-balance text-[clamp(2.5rem,8vw,4.7rem)] font-semibold">
              <span className="headline-gradient">{title}</span>
            </h2>
            <div className="headline-underline mt-6" aria-hidden="true" />
            <p className="mt-6 max-w-3xl text-base leading-8 text-muted md:text-lg">
              {description}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group gradient-border rounded-[1.6rem]"
                >
                  <article className="surface-panel h-full p-5 transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_28px_84px_rgba(8,20,36,0.12)] sm:p-6">
                    {item.eyebrow ? (
                      <p className="eyebrow mb-4">{item.eyebrow}</p>
                    ) : null}
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-2xl font-semibold text-primary">
                        {item.title}
                      </h3>
                      <ArrowUpRight className="mt-1 size-5 text-accent transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted">
                      {item.description}
                    </p>
                    {item.tags?.length ? (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="trust-pill">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
