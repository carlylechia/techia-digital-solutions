import type { ReactNode } from "react";
import { PremiumPageHero } from "@/components/ui/premium-page-hero";
import type { Locale } from "@/content/site";

export function CourseHero({
  locale,
  eyebrow,
  title,
  description,
  badges = [],
  actions = [],
  aside,
  imageUrl,
  imageAlt,
  headingSize,
}: {
  locale: Locale;
  eyebrow?: string;
  title: string;
  description: string;
  badges?: string[];
  actions?: {
    href: string;
    label: string;
    variant?: "primary" | "secondary";
  }[];
  aside?: ReactNode;
  imageUrl?: string | null;
  imageAlt?: string;
  headingSize?: "default" | "compact";
}) {
  return (
    <PremiumPageHero
      locale={locale}
      eyebrow={eyebrow}
      title={title}
      description={description}
      badges={badges}
      actions={actions}
      aside={aside}
      imageUrl={imageUrl}
      imageAlt={imageAlt}
      headingSize={headingSize}
    />
  );
}
