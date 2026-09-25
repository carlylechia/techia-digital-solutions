import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { BlogActionResult } from "@/lib/blog/actions";

const saveHomepageBlogPicksAction = vi.fn(
  async (formData: FormData): Promise<BlogActionResult> => ({ ok: true, message: `Saved ${formData.getAll("pickIds").length} picks` }),
);
vi.mock("@/lib/blog/actions", () => ({ saveHomepageBlogPicksAction }));

const { HomepagePicksManager } = await import("@/components/blog/homepage-picks-manager");

const options = [
  { id: "post-1", title: "First article", slug: "first-article", publishedAt: null, readingTime: 4, categoryName: "SEO" },
  { id: "post-2", title: "Second article", slug: "second-article", publishedAt: null, readingTime: 6, categoryName: "Automation" },
  { id: "post-3", title: "Third article", slug: "third-article", publishedAt: null, readingTime: 3, categoryName: "Web" },
];

function submittedIds() {
  return [...document.querySelectorAll<HTMLInputElement>('input[name="pickIds"]')].map((input) => input.value);
}

function lineup() {
  return [...document.querySelectorAll("section:first-of-type p.font-semibold")].map((node) => node.textContent);
}

describe("homepage lineup manager", () => {
  beforeEach(() => {
    cleanup();
    saveHomepageBlogPicksAction.mockClear();
  });

  it("starts from the saved lineup and keeps the editor's order", () => {
    render(<HomepagePicksManager locale="en" options={options} limit={3} initialPicks={["post-3", "post-1"]} />);
    expect(lineup()).toEqual(["Third article", "First article"]);
    expect(submittedIds()).toEqual(["post-3", "post-1"]);
    expect(screen.getByText("Current lineup (2/3)")).toBeTruthy();
  });

  it("adds an article to the end of the lineup", () => {
    render(<HomepagePicksManager locale="en" options={options} limit={3} initialPicks={["post-1"]} />);
    fireEvent.click(screen.getByLabelText("Add Second article to the homepage"));
    expect(lineup()).toEqual(["First article", "Second article"]);
    expect(submittedIds()).toEqual(["post-1", "post-2"]);
  });

  it("moves an article up and down without losing the rest of the lineup", () => {
    render(<HomepagePicksManager locale="en" options={options} limit={3} initialPicks={["post-1", "post-2", "post-3"]} />);
    fireEvent.click(screen.getByLabelText("Move Third article up"));
    expect(lineup()).toEqual(["First article", "Third article", "Second article"]);
    fireEvent.click(screen.getByLabelText("Move First article down"));
    expect(lineup()).toEqual(["Third article", "First article", "Second article"]);
    expect(submittedIds()).toEqual(["post-3", "post-1", "post-2"]);
  });

  it("removes an article and reports when the lineup is empty", () => {
    render(<HomepagePicksManager locale="en" options={options} limit={3} initialPicks={["post-2"]} />);
    fireEvent.click(screen.getByLabelText("Remove Second article from the homepage"));
    expect(lineup()).toEqual([]);
    expect(screen.getByText(/No article is promoted yet/)).toBeTruthy();
    expect(submittedIds()).toEqual([]);
  });

  it("blocks extra picks once the lineup is full and saves the submitted order", async () => {
    render(<HomepagePicksManager locale="en" options={options} limit={2} initialPicks={["post-1", "post-2"]} />);
    expect(screen.getByText(/The lineup is full/)).toBeTruthy();
    expect((screen.getByLabelText("Add Third article to the homepage") as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByLabelText("Move Second article up"));
    fireEvent.submit(screen.getByRole("button", { name: "Save homepage lineup" }).closest("form") as HTMLFormElement);
    await waitFor(() => expect(saveHomepageBlogPicksAction).toHaveBeenCalledTimes(1));
    const formData = saveHomepageBlogPicksAction.mock.calls[0][0] as FormData;
    expect(formData.get("locale")).toBe("en");
    expect(formData.getAll("pickIds")).toEqual(["post-2", "post-1"]);
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Saved 2 picks"));
  });

  it("surfaces a rejected save from the server", async () => {
    saveHomepageBlogPicksAction.mockResolvedValueOnce({ ok: false, error: "Editorial database is unavailable." });
    render(<HomepagePicksManager locale="fr" options={options} limit={3} initialPicks={["post-1"]} />);
    fireEvent.submit(screen.getByRole("button", { name: "Save homepage lineup" }).closest("form") as HTMLFormElement);
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Editorial database is unavailable."));
  });
});
