import { describe, expect, it } from "vitest";
import { displayedLessonCount } from "@/lib/courses/lesson-count";

const lessons = [{}, {}, {}];

describe("displayedLessonCount", () => {
  it("prefers the lesson count recorded in the admin console", () => {
    expect(
      displayedLessonCount({ lessonCount: 12, lessons }),
    ).toBe(12);
  });

  it("falls back to the database lesson rows when no count is recorded", () => {
    expect(
      displayedLessonCount({ lessonCount: null, lessons }),
    ).toBe(3);
  });

  it("honours an explicit zero from the admin console", () => {
    expect(
      displayedLessonCount({ lessonCount: 0, lessons }),
    ).toBe(0);
  });
});
