import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { CourseCheckoutButton } from "@/components/courses/CourseCheckoutButton";
import type { CheckoutHints } from "@/lib/payments/providers";

const basePack = {
  id: "course-1",
  slug: "digital-marketing-basics",
  title: "Digital Marketing Basics",
  checkoutUrl: null as string | null,
  priceMinor: 2000,
  priceCurrency: "XAF",
};

function renderButton(overrides: {
  pack?: { priceMinor?: number | null; checkoutUrl?: string | null };
  hints?: CheckoutHints;
  chariowProductId?: string | null;
}) {
  const { pack, ...rest } = overrides;
  return render(
    <CourseCheckoutButton
      pack={{ ...basePack, ...pack }}
      label="Buy now"
      sourcePage="test"
      itemType="course"
      {...rest}
    />,
  );
}

function anchor() {
  return document.querySelector<HTMLAnchorElement>("a[href]");
}

describe("checkout button availability", () => {
  beforeEach(() => {
    cleanup();
  });

  it("links to internal checkout when Chariow is configured and the item has a product ID", () => {
    renderButton({
      hints: { internalEnabled: true, chariowConfigured: true, monerooConfigured: false },
      chariowProductId: "prd_abc123",
    });
    expect(anchor()?.getAttribute("href")).toBe(
      "/courses/checkout?item=course:digital-marketing-basics",
    );
    expect(anchor()?.getAttribute("target")).toBeNull();
  });

  it("links to internal checkout via Moneroo even without a Chariow product ID", () => {
    renderButton({
      hints: { internalEnabled: true, chariowConfigured: false, monerooConfigured: true },
    });
    expect(anchor()?.getAttribute("href")).toBe(
      "/courses/checkout?item=course:digital-marketing-basics",
    );
  });

  it("falls back to the legacy hosted link when internal checkout is disabled", () => {
    renderButton({
      pack: { checkoutUrl: "https://chariow.com/checkout/prd_abc123" },
      hints: { internalEnabled: false, chariowConfigured: true, monerooConfigured: false },
      chariowProductId: "prd_abc123",
    });
    expect(anchor()?.getAttribute("href")).toBe(
      "https://chariow.com/checkout/prd_abc123",
    );
    expect(anchor()?.getAttribute("target")).toBe("_blank");
  });

  it("shows the disabled pill when no provider can serve a priced item", () => {
    renderButton({
      hints: { internalEnabled: true, chariowConfigured: true, monerooConfigured: false },
    });
    expect(anchor()).toBeNull();
    expect(document.body.textContent).toContain(
      "Price and checkout coming soon",
    );
  });

  it("shows the disabled pill when internal checkout is enabled but no provider is configured", () => {
    renderButton({
      hints: { internalEnabled: true, chariowConfigured: false, monerooConfigured: false },
    });
    expect(anchor()).toBeNull();
  });

  it("uses the legacy hosted link for unpriced items that have one", () => {
    renderButton({
      pack: { priceMinor: null, checkoutUrl: "https://chariow.com/checkout/prd_xyz" },
      hints: { internalEnabled: true, chariowConfigured: true, monerooConfigured: true },
    });
    expect(anchor()?.getAttribute("href")).toBe(
      "https://chariow.com/checkout/prd_xyz",
    );
  });

  it("shows the disabled pill when there is no price and no hosted link", () => {
    renderButton({
      pack: { priceMinor: null },
      hints: { internalEnabled: true, chariowConfigured: true, monerooConfigured: true },
    });
    expect(anchor()).toBeNull();
  });
});
