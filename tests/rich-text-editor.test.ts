import { describe, expect, it } from "vitest";
import { cleanClientHtml } from "@/components/blog/rich-text-editor";

describe("rich text client cleanup", () => {
  it("normalizes external headings and removes unsafe descendants", () => {
    const clean = cleanClientHtml(`<div><h1 onclick="alert(1)">Gemini heading</h1><p><strong>Safe</strong><span style="color:red">text</span></p><img src="https://example.com/image.jpg" alt="External" onerror="alert(1)"></div>`);
    expect(clean).toContain("<h2>Gemini heading</h2>");
    expect(clean).toContain("<strong>Safe</strong>");
    expect(clean).toContain("text");
    expect(clean).not.toContain("onclick");
    expect(clean).not.toContain("style=");
    expect(clean).not.toContain("onerror");
    expect(clean).not.toContain("example.com");
  });

  it("keeps safe semantic formatting and approved images", () => {
    const clean = cleanClientHtml(`<h2>Section</h2><ul><li>One</li></ul><blockquote>Quote</blockquote><a href="https://example.com" target="_blank">Read more</a><img src="https://res.cloudinary.com/demo/image/upload/a.jpg" alt="Chart">`);
    expect(clean).toContain("<h2>Section</h2>");
    expect(clean).toContain("<ul><li>One</li></ul>");
    expect(clean).toContain("<blockquote>Quote</blockquote>");
    expect(clean).toContain('rel="noopener noreferrer"');
    expect(clean).toContain('src="https://res.cloudinary.com/demo/image/upload/a.jpg"');
  });
});
