export type StatItem = { value: string; label: string };
export type SectionCardItem = { title: string; description: string; imageUrl?: string };

export type PageSection =
  | { id: string; type: "hero"; heading: string; body: string; imageUrl?: string; ctaLabel?: string; ctaHref?: string; cta2Label?: string; cta2Href?: string }
  | { id: string; type: "stats"; heading?: string; items: StatItem[] }
  | { id: string; type: "cards"; heading?: string; eyebrow?: string; items: SectionCardItem[] }
  | { id: string; type: "cards_images"; heading?: string; eyebrow?: string; items: SectionCardItem[] }
  | { id: string; type: "text"; heading?: string; body: string }
  | { id: string; type: "cta"; heading: string; body?: string; ctaLabel: string; ctaHref: string };

export type SectionType = PageSection["type"];

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Hero (image + text + CTAs)",
  stats: "Statistics",
  cards: "Cards (no images)",
  cards_images: "Cards with Images",
  text: "Text Block",
  cta: "CTA Banner"
};

export function createDefaultSection(type: SectionType): PageSection {
  const id = Math.random().toString(36).slice(2, 10);
  switch (type) {
    case "hero":
      return { id, type, heading: "", body: "", imageUrl: "", ctaLabel: "", ctaHref: "", cta2Label: "", cta2Href: "" };
    case "stats":
      return { id, type, heading: "", items: [{ value: "", label: "" }] };
    case "cards":
      return { id, type, heading: "", eyebrow: "", items: [{ title: "", description: "" }] };
    case "cards_images":
      return { id, type, heading: "", eyebrow: "", items: [{ title: "", description: "", imageUrl: "" }] };
    case "text":
      return { id, type, heading: "", body: "" };
    case "cta":
      return { id, type, heading: "", body: "", ctaLabel: "Get started", ctaHref: "/start-project" };
  }
}

export function parseSections(raw: unknown): PageSection[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is PageSection => !!item && typeof item === "object" && "type" in item);
}
