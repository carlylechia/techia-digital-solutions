import type { CSSProperties } from "react";
import { Star } from "lucide-react";
import { getDictionary, type Locale } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * Full-width, continuously moving band of the core service catalogue.
 * Items are duplicated so the CSS marquee can loop without a visible seam.
 */
export function ServicesMarqueeSection({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const services = getDictionary(locale).services;
  const repeatedServices = [...services, ...services];
  const duration = Math.max(44, services.length * 5);

  return (
    <section
      aria-labelledby="core-services-marquee-heading"
      className={cn("services-marquee-section", className)}
    >
      <div className="container flex items-center justify-center pb-4">
        <h2 id="core-services-marquee-heading" className="eyebrow">
          {locale === "fr" ? "Services cœur" : "Core services"}
        </h2>
      </div>

      <div className="marquee-shell services-marquee-shell">
        <div
          className="marquee-track services-marquee-track"
          data-mode="auto"
          style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
        >
          {repeatedServices.map((service, index) => (
            <span
              key={`${service.slug}-${index}`}
              className="marquee-item services-marquee-item"
              style={{ display: "inline-flex", flexWrap: "nowrap", whiteSpace: "nowrap" }}
              aria-hidden={index >= services.length || undefined}
            >
              <span>{service.title}</span>
              <Star className="services-marquee-star" aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
