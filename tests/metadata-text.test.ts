import { describe, expect, it } from "vitest";
import { fitDescription, fitTitle } from "@/lib/metadata-text";
import { createMetadata } from "@/lib/seo";

describe("metadata text normalization", () => {
  it("expands a short title with a brand suffix that fits the limit", () => {
    expect(fitTitle("Websites for Clinics — teChia")).toBe(
      "Websites for Clinics | teChia Digital Solutions",
    );
  });

  it("keeps an already compliant title unchanged", () => {
    const title = "SEO Services in Cameroon | teChia";
    expect(fitTitle(title)).toBe(title);
  });

  it("drops a redundant brand suffix before truncating", () => {
    expect(
      fitTitle("Customer Relationship Management Software — teChia Digital Solutions"),
    ).toBe("Customer Relationship Management Software");
  });

  it("truncates long titles at a word boundary inside the limit", () => {
    const title = fitTitle(
      "The Complete Guide to Building a Digital Growth System for Service Businesses in Africa",
    );
    expect(title.length).toBeGreaterThanOrEqual(30);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.endsWith("…")).toBe(false);
  });

  it("caps descriptions at 155 characters including the ellipsis", () => {
    const description = `${"Practical guidance for growing businesses. ".repeat(5)}Read more.`;
    const fitted = fitDescription(description);
    expect(fitted.length).toBeLessThanOrEqual(155);
    expect(fitted.endsWith("…")).toBe(true);
  });

  it("uses the normalized title and description in page metadata", () => {
    const metadata = createMetadata({
      locale: "en",
      title: "Websites for Clinics — teChia",
      description: `${"Practical guidance for growing businesses. ".repeat(5)}Read more.`,
      path: "/industries/clinics",
    });
    expect(metadata.title).toBe(
      "Websites for Clinics | teChia Digital Solutions",
    );
    expect(String(metadata.description).length).toBeLessThanOrEqual(155);
  });
});
