import { describe, expect, it } from "vitest";
import { isSuperAdminUser } from "@/lib/blog/auth";

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
