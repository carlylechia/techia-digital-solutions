type LessonCountSource = {
  /** Administrator-entered override; null means "not recorded". */
  lessonCount: number | null;
  /** Lesson rows currently stored for the course. */
  lessons: readonly unknown[];
};

/**
 * The lesson number shown to visitors.
 *
 * Administrators can record an explicit lesson count in the academy console.
 * When that field is blank, the storefront falls back to the number of lesson
 * rows in the database — the same "auto count" the admin list displays.
 */
export function displayedLessonCount(course: LessonCountSource): number {
  return course.lessonCount ?? course.lessons.length;
}
