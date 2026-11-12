import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const replace = vi.fn();
const searchParams = new URLSearchParams("q=marketing&category=creative&sort=title&view=courses");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/en/courses",
  useSearchParams: () => searchParams,
}));

const { CourseCatalogFilters } = await import(
  "@/components/courses/CourseCatalogFilters"
);

describe("CourseCatalogFilters", () => {
  afterEach(() => {
    cleanup();
    replace.mockClear();
  });

  it("clears every search filter and preserves the active view", () => {
    render(<CourseCatalogFilters locale="en" categories={[]} mode="courses" />);

    fireEvent.click(screen.getByRole("button", { name: /Clear search and all filters/i }));

    expect(replace).toHaveBeenCalledWith(
      "/en/courses?view=courses#catalog",
      { scroll: false },
    );

    const input = screen.getByRole("searchbox") as HTMLInputElement;
    expect(input.value).toBe("");
  });

});
