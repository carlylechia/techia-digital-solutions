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
    />
  );
}
