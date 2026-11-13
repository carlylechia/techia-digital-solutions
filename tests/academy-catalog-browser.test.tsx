import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import {
  AcademyCatalogBrowser,
  type AcademyCatalogItem,
} from "@/components/courses/AcademyCatalogBrowser";

const courses: AcademyCatalogItem[] = [
  {
    id: "course-1",
    title: "SEO foundations",
    slug: "seo-foundations",
    status: "PUBLISHED",
    position: 0,
    effectivePriceMinor: 2000,
    courseCount: 0,
    updatedAt: "2026-01-02T00:00:00.000Z",
    searchText: "SEO foundations seo-foundations marketing",
    content: <p>SEO course card</p>,
  },
  {
    id: "course-2",
    title: "Draft analytics",
    slug: "draft-analytics",
    status: "DRAFT",
    position: 1,
    effectivePriceMinor: 2000,
    courseCount: 0,
    updatedAt: "2026-01-01T00:00:00.000Z",
    searchText: "Draft analytics draft-analytics data",
    content: <p>Analytics course card</p>,
  },
];

const packs: AcademyCatalogItem[] = [
  {
    id: "pack-1",
    title: "Growth pack",
    slug: "growth-pack",
    status: "PUBLISHED",
    position: 0,
    effectivePriceMinor: 5000,
    courseCount: 3,
    updatedAt: "2026-01-03T00:00:00.000Z",
    searchText: "Growth pack growth-pack SEO foundations",
    content: <p>Growth pack card</p>,
  },
];

function resultCount() {
  return document.querySelector('[aria-live="polite"]')?.textContent ?? "";
}

afterEach(cleanup);

describe("AcademyCatalogBrowser", () => {
  it("switches between course and pack views", () => {
    render(<AcademyCatalogBrowser courses={courses} packs={packs} />);

    expect(
      screen
        .getByRole("tab", { name: /Courses/i })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(resultCount()).toContain("of 2 courses");

    fireEvent.click(screen.getByRole("tab", { name: /Packs/i }));

    expect(
      screen
        .getByRole("tab", { name: /Packs/i })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(resultCount()).toContain("of 1 pack");
  });

  it("searches the active view and clears the filters", () => {
    render(<AcademyCatalogBrowser courses={courses} packs={packs} />);

    const search = screen.getByLabelText("Search courses");
    fireEvent.change(search, { target: { value: "draft" } });

    expect(resultCount()).toContain("Showing 1 of 2 courses");

    fireEvent.click(screen.getByRole("button", { name: /^Clear$/i }));

    expect(resultCount()).toContain("Showing 2 of 2 courses");

    fireEvent.click(screen.getByRole("tab", { name: /Packs/i }));
    fireEvent.change(screen.getByLabelText("Search packs"), {
      target: { value: "missing" },
    });

    expect(resultCount()).toContain("Showing 0 of 1 pack");
    expect(screen.getByText("No packs match these filters.")).toBeTruthy();
  });
});
