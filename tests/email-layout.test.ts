import { describe, expect, it } from "vitest";
import {
  escapeEmailHtml,
  renderEmailLayout,
  renderEmailText,
  safeEmailHref,
  sanitizeEmailHeader,
} from "@/lib/email-layout";

describe("shared email layout", () => {
  it("escapes every html-significant character", () => {
    expect(escapeEmailHtml(`<a href="x">'&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;"
    );
  });

  it("accepts only absolute http(s) links", () => {
    expect(safeEmailHref("https://techiadigital.com/path?q=1")).toBe("https://techiadigital.com/path?q=1");
    expect(safeEmailHref("http://techiadigital.com")).toBe("http://techiadigital.com/");
    expect(safeEmailHref("javascript:alert(1)")).toBeNull();
    expect(safeEmailHref("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeEmailHref("/relative")).toBeNull();
    expect(safeEmailHref(null)).toBeNull();
  });

  it("flattens header values so a newline cannot start a new header", () => {
    expect(sanitizeEmailHeader("Hello\r\nBcc: victim@example.com")).toBe("Hello Bcc: victim@example.com");
    expect(sanitizeEmailHeader("A\u0000B\u001fC")).toBe("ABC");
  });

  it("renders plain text as escaped paragraphs and line breaks", () => {
    const html = renderEmailText("Line one\nLine two\n\n<script>alert(1)</script>");
    expect(html).toContain("Line one<br />Line two");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html.match(/<p style=/g)?.length).toBe(2);
  });

  it("builds a complete document with a preheader, title and footer", () => {
    const html = renderEmailLayout({
      subject: "Hello",
      preheader: "A short preview",
      bodyText: "Body copy",
      footerHtml: "<p>Footer</p>",
    });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>Hello</title>");
    expect(html).toContain("A short preview");
    expect(html).toContain("Body copy");
    expect(html).toContain("<p>Footer</p>");
  });

  it("escapes the subject used as the visible heading", () => {
    const html = renderEmailLayout({ subject: "<script>alert(1)</script>", bodyText: "Body" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
