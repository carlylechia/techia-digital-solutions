import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { CheckoutForm } from "@/components/courses/checkout/CheckoutForm";

describe("checkout country dropdown", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders a select of ISO alpha-2 codes with popular countries first", () => {
    render(
      <CheckoutForm
        locale="en"
        itemType="course"
        itemSlug="digital-marketing-basics"
        providers={[
          { id: "CHARIOW", label: "Chariow", description: "Card + mobile money" },
        ]}
      />,
    );

    const select = document.querySelector<HTMLSelectElement>(
      'select[name="countryCode"]',
    );
    expect(select).not.toBeNull();
    expect(select?.value).toBe("CM");
    // Required + no free-text country input anymore.
    expect(select?.required).toBe(true);
    expect(
      document.querySelector('input[name="countryCode"]'),
    ).toBeNull();

    const options = [...(select?.options ?? [])].map((option) => option.value);
    expect(options).toContain("CM");
    expect(options).toContain("CI");
    expect(options).toContain("SN");
    expect(options).toContain("FR");
    expect(options).toContain("US");
    // Every value is exactly two letters (Chariow's phone.country_code format).
    for (const value of options) {
      expect(value).toMatch(/^[A-Z]{2}$/);
    }
    // Unique values, no duplicates between the popular and full groups.
    expect(new Set(options).size).toBe(options.length);

    const optgroups = [...(select?.querySelectorAll("optgroup") ?? [])];
    expect(optgroups.length).toBe(2);
    expect(optgroups[0].getAttribute("label")).toBe("Popular");
    expect(optgroups[0].querySelector('option[value="CM"]')).not.toBeNull();
    expect(optgroups[1].getAttribute("label")).toBe("All countries");
    // Popular codes are excluded from the alphabetical group.
    expect(optgroups[1].querySelector('option[value="CM"]')).toBeNull();
  });

  it("uses localized labels in French", () => {
    render(
      <CheckoutForm
        locale="fr"
        itemType="pack"
        itemSlug="complete-digital-skills-pack"
        providers={[
          { id: "MONEROO", label: "Moneroo", description: "Mobile money" },
        ]}
      />,
    );

    const select = document.querySelector<HTMLSelectElement>(
      'select[name="countryCode"]',
    );
    const optgroups = [...(select?.querySelectorAll("optgroup") ?? [])];
    expect(optgroups[0].getAttribute("label")).toBe("Populaires");
    expect(optgroups[1].getAttribute("label")).toBe("Tous les pays");
    const cmOption = select?.querySelector('option[value="CM"]');
    expect(cmOption?.textContent).toContain("Cameroun");
  });
});
