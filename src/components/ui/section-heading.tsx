import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  as = "h2",
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  as?: "h1" | "h2";
  className?: string;
}) {
  const centered = align === "center";
  const HeadingTag = as;

  return (
    <div className={cn("panel-safe mb-10 max-w-3xl", centered ? "mx-auto text-center" : "text-left", className)}>
      {eyebrow ? (
        <div className={cn("mb-3 flex items-center gap-3", centered ? "justify-center" : "justify-start")}>
          <p className="eyebrow">{eyebrow}</p>
          <span className="font-script text-2xl text-accent-3 md:text-3xl">teChia</span>
        </div>
      ) : null}
      <HeadingTag className="break-safe text-balance text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
        <span className="headline-gradient">{title}</span>
      </HeadingTag>
      <div className={cn("headline-underline mt-5", centered && "mx-auto")} aria-hidden="true" />
      {description ? <p className="break-safe mt-5 text-pretty text-base leading-7 text-muted md:text-lg">{description}</p> : null}
    </div>
  );
}
