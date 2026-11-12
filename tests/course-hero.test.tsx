import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CourseHero } from "@/components/courses/CourseHero";

const COVER_URL =
  "https://res.cloudinary.com/djibtueaq/image/upload/v1794415355/techia/academy/kr3rufysiztdbfldhtrh.jpg";

function renderHero(props: { imageUrl?: string | null } = {}) {
  return render(
    <CourseHero
      locale="en"
      eyebrow="Digital Marketing & Online Business"
      title="Complete Training in Digital Marketing"
      description="Build practical marketing and community growth skills."
      imageUrl={props.imageUrl === undefined ? COVER_URL : props.imageUrl}
      headingSize="compact"
    />,
  );
}

describe("CourseHero", () => {
  afterEach(() => cleanup());

  it("uses the smaller course-detail heading scale", () => {
    renderHero();

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toContain("Complete Training in Digital Marketing");
    expect(heading.className).toContain("clamp(2.2rem,5.6vw,3.65rem)");
    expect(heading.className).not.toContain("clamp(2.9rem,10vw,5.4rem)");
  });

  it("renders the configured cover image in the hero", () => {
    renderHero();

    const cover = screen.getByRole("img", {
      name: "Complete Training in Digital Marketing cover image",
    });
    expect(cover.getAttribute("src")).toBe(COVER_URL);
    expect(cover.getAttribute("width")).toBe("960");
    expect(cover.getAttribute("height")).toBe("600");
  });

  it("renders the hero without a cover image when none is configured", () => {
    renderHero({ imageUrl: null });

    expect(screen.queryByRole("img")).toBeNull();
  });
});
