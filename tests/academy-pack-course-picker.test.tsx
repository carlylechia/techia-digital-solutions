import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { AcademyPackCoursePicker } from "@/components/courses/AcademyPackCoursePicker";

const courses = [
  { id: "course-1", title: "First course", slug: "first-course", status: "PUBLISHED" },
  { id: "course-2", title: "Second course", slug: "second-course", status: "PUBLISHED" },
  { id: "course-3", title: "Draft course", slug: "draft-course", status: "DRAFT" },
];

function submittedIds() {
  return [...document.querySelectorAll<HTMLInputElement>('input[name="courseIds"]')].map(
    (input) => input.value,
  );
}

afterEach(cleanup);

describe("AcademyPackCoursePicker", () => {
  it("only offers published courses in the dropdown", () => {
    render(
      <AcademyPackCoursePicker courses={courses} initialCourseIds={[]} />,
    );

    const select = screen.getByLabelText("Published course") as HTMLSelectElement;
    const values = [...select.options].map((option) => option.value);

    expect(values).toContain("course-1");
    expect(values).toContain("course-2");
    expect(values).not.toContain("course-3");
  });

  it("keeps an already-included unpublished course visible and removable", () => {
    render(
      <AcademyPackCoursePicker courses={courses} initialCourseIds={["course-3"]} />,
    );

    expect(screen.getByText("Draft course")).toBeTruthy();
    expect(submittedIds()).toEqual(["course-3"]);

    fireEvent.click(
      screen.getByRole("button", { name: /Remove Draft course from this pack/i }),
    );

    expect(submittedIds()).toEqual([]);
  });

  it("adds courses in the chosen order and reorders them", () => {
    render(
      <AcademyPackCoursePicker courses={courses} initialCourseIds={["course-1"]} />,
    );

    const select = screen.getByLabelText("Published course") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "course-2" } });
    fireEvent.click(screen.getByRole("button", { name: /^Add course$/i }));

    expect(submittedIds()).toEqual(["course-1", "course-2"]);

    fireEvent.click(
      screen.getByRole("button", { name: /Move First course down/i }),
    );

    expect(submittedIds()).toEqual(["course-2", "course-1"]);
  });
});
