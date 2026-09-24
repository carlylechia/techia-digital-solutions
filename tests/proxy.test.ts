import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

describe("locale proxy boundaries", () => {
  it("keeps localized editorial workspace paths intact", () => {
    const response = proxy(new NextRequest("https://techiadigital.com/en/admin/blog/categories"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("keeps localized writer paths intact", () => {
    const response = proxy(new NextRequest("https://techiadigital.com/fr/writer/posts"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("still canonicalizes ordinary localized public pages", () => {
    const response = proxy(new NextRequest("https://techiadigital.com/en/services"));
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://techiadigital.com/services");
  });

  it("keeps localized public blog pages crawlable", () => {
    const response = proxy(new NextRequest("https://techiadigital.com/en/blog/example"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
