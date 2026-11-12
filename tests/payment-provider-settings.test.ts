import { describe, expect, it } from "vitest";
import { applyProviderEnablement } from "@/lib/payments/providers";

// applyProviderEnablement is the pure core of the /admin/academy "Payment
// methods" switches: a provider is offered only when its environment key is
// present (configured) AND the admin has not hidden it (enabled).
describe("applyProviderEnablement", () => {
  it("shows a provider only when configured AND enabled", () => {
    expect(applyProviderEnablement(true, true)).toBe(true);
    expect(applyProviderEnablement(false, true)).toBe(false);
    expect(applyProviderEnablement(true, false)).toBe(false);
    expect(applyProviderEnablement(false, false)).toBe(false);
  });

  it("never advertises an unconfigured provider even when enabled", () => {
    // Key missing in env — toggling the admin switch on cannot invent a provider.
    expect(applyProviderEnablement(false, true)).toBe(false);
  });

  it("hides a configured provider when the admin disabled it", () => {
    // e.g. Moneroo hidden from checkout while its dashboard is being configured.
    expect(applyProviderEnablement(true, false)).toBe(false);
  });
});
