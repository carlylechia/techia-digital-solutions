import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type PageBreadcrumb = {
  label: string;
  href?: string;
};

/**
 * Small, consistent breadcrumb trail for content pages. The final item is
 * marked as the current page for assistive technology.
 */
export function PageBreadcrumbs({
  items,
  className = "",
}: {
  items: PageBreadcrumb[];
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="inline-flex min-w-0 items-center gap-1">
            {index > 0 ? (
              <ChevronRight className="size-3.5 shrink-0 text-muted/60" aria-hidden="true" />
            ) : null}
            {item.href ? (
              <Link
                href={item.href}
                className="truncate transition hover:text-accent"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current="page"
                className="truncate font-medium text-primary"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
