import { describe, expect, it } from "vitest";
import { isSuperAdminUser } from "@/lib/blog/auth";
import {
  evaluatePagePublishingEligibility,
  hasPagePublishingCapability,
} from "@/lib/meta/accounts";

describe("meta permissions", () => {
  it("recognises super_admin role and high role level as SuperAdmin", () => {
    expect(isSuperAdminUser({ role: "super_admin", roleLevel: 0 } as never)).toBe(true);
    expect(isSuperAdminUser({ role: "admin", roleLevel: 100 } as never)).toBe(true);
  });

  it("rejects non-super administrators", () => {
    expect(isSuperAdminUser({ role: "admin", roleLevel: 10 } as never)).toBe(false);
    expect(isSuperAdminUser({ role: "editor", roleLevel: 50 } as never)).toBe(false);
  });
});

describe("meta page publishing eligibility", () => {
  const scopes = ["pages_manage_posts", "pages_read_engagement", "pages_show_list"];

  it("accepts CREATE_CONTENT without MANAGE", () => {
    expect(
      evaluatePagePublishingEligibility({
        tasks: ["CREATE_CONTENT"],
        grantedScopes: scopes,
        hasPageToken: true,
      }).eligible,
    ).toBe(true);
  });

  it("accepts a legitimate editor task combination", () => {
    expect(
      evaluatePagePublishingEligibility({
        tasks: ["CREATE_CONTENT", "MODERATE", "ANALYZE"],
        grantedScopes: scopes,
        hasPageToken: true,
      }).eligible,
    ).toBe(true);
  });

  it("accepts MANAGE with applicable publishing capability", () => {
    expect(
      evaluatePagePublishingEligibility({
        tasks: ["MANAGE", "CREATE_CONTENT"],
        grantedScopes: scopes,
        hasPageToken: true,
      }).eligible,
    ).toBe(true);
    expect(hasPagePublishingCapability(["MANAGE"])).toBe(true);
  });

  it("rejects MODERATE alone", () => {
    const result = evaluatePagePublishingEligibility({
      tasks: ["MODERATE"],
      grantedScopes: scopes,
      hasPageToken: true,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/publishing task/i);
  });

  it("rejects missing required OAuth scopes", () => {
    const result = evaluatePagePublishingEligibility({
      tasks: ["CREATE_CONTENT"],
      grantedScopes: ["pages_show_list"],
      hasPageToken: true,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/Missing permissions/i);
  });

  it("rejects a Page without an access token", () => {
    const result = evaluatePagePublishingEligibility({
      tasks: ["CREATE_CONTENT"],
      grantedScopes: scopes,
      hasPageToken: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/access token/i);
  });
});
