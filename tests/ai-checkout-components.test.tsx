import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { AIMessageContent } from "@/components/ai/AIMessageContent";
import { LeadCaptureCard } from "@/components/ai/LeadCaptureCard";
import { RecommendationCard } from "@/components/ai/RecommendationCard";
import type { AcademyRecommendation } from "@/lib/ai/recommendation";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/courses",
}));

const recommendation: AcademyRecommendation = {
  type: "pack",
  slug: "digital-skills-pack",
  title: "Digital Skills Pack",
  productPath: "/courses/digital-skills-pack",
  checkoutPath: "/courses/checkout?item=pack:digital-skills-pack",
  priceLabel: "FCFA 5,000",
};

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("AIMessageContent", () => {
  it("renders Markdown links as real clickable anchors", () => {
    render(
      <AIMessageContent content="Continue: [Secure checkout](/courses/checkout?item=pack:digital-skills-pack)" />,
    );

    const link = screen.getByRole("link", { name: /Secure checkout/i });
    expect(link.getAttribute("href")).toBe(
      "/courses/checkout?item=pack:digital-skills-pack",
    );
  });

  it("renders bare product URLs as clickable links", () => {
    render(
      <AIMessageContent content="See /courses/digital-skills-pack now." />,
    );

    expect(
      screen
        .getByRole("link", { name: "/courses/digital-skills-pack" })
        .getAttribute("href"),
    ).toBe("/courses/digital-skills-pack");
  });

  it("trims surrounding punctuation from bare external links", () => {
    const { container } = render(
      <AIMessageContent content="Read (https://techia.com/courses/digital-skills-pack)." />,
    );

    expect(
      screen
        .getByRole("link", {
          name: "https://techia.com/courses/digital-skills-pack",
        })
        .getAttribute("href"),
    ).toBe("https://techia.com/courses/digital-skills-pack");
    expect(container.textContent).toContain(").");
  });
});

describe("RecommendationCard", () => {
  it("always offers the checkout path for a priced recommendation", () => {
    render(<RecommendationCard recommendation={recommendation} />);

    expect(
      screen
        .getByRole("link", { name: /Continue to secure checkout/i })
        .getAttribute("href"),
    ).toBe(recommendation.checkoutPath);
    expect(
      screen
        .getByRole("link", { name: /View full course details/i })
        .getAttribute("href"),
    ).toBe(recommendation.productPath);
  });
});

describe("LeadCaptureCard", () => {
  it("saves the lead then exposes the checkout link validated by the server", async () => {
    const serverRecommendation: AcademyRecommendation = {
      ...recommendation,
      title: "Digital Skills Pack (confirmed)",
      checkoutPath:
        "/courses/checkout?item=pack:digital-skills-pack&validated=1",
    };
    const fetchMock = vi.fn(async () => ({
      json: async () => ({ ok: true, recommendation: serverRecommendation }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LeadCaptureCard
        conversationId="conversation-1"
        recommendedItem={recommendation}
        checkoutUrl={recommendation.checkoutPath ?? undefined}
        checkoutLabel="Continue to checkout for Digital Skills Pack"
        autoRedirectMs={0}
        onSuccess={() => {}}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Your name *"), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email address *"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save my details/i }));

    await screen.findByText(/your request has been saved/i);

    const calls = fetchMock.mock.calls as unknown as Array<
      [RequestInfo | URL, RequestInit | undefined]
    >;
    const payload = JSON.parse(calls[0][1]?.body as string) as {
      action: string;
      locale: string;
      recommendation: { type: string; slug: string };
      data: { serviceInterest: string; projectSummary: string };
    };

    expect(payload.action).toBe("save_lead");
    expect(payload.locale).toBe("en");
    expect(payload.recommendation).toEqual({
      type: "pack",
      slug: "digital-skills-pack",
    });
    expect(payload.data.serviceInterest).toContain("Digital Skills Pack");
    expect(payload.data.projectSummary).toContain("digital-skills-pack");

    expect(
      screen
        .getByRole("link", {
          name: /Continue to checkout for Digital Skills Pack/i,
        })
        .getAttribute("href"),
    ).toBe(serverRecommendation.checkoutPath);
  });

  it("does not redirect to a stale client checkout URL when the server rejects the item", async () => {
    const originalLocation = window.location;
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign },
    });
    const fetchMock = vi.fn(async () => ({
      json: async () => ({ ok: true, recommendation: null }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    try {
      render(
        <LeadCaptureCard
          conversationId="conversation-1"
          recommendedItem={recommendation}
          checkoutUrl={recommendation.checkoutPath ?? undefined}
          checkoutLabel="Continue to checkout for Digital Skills Pack"
          autoRedirectMs={10}
          onSuccess={() => {}}
        />,
      );

      fireEvent.change(screen.getByPlaceholderText("Your name *"), {
        target: { value: "Ada Lovelace" },
      });
      fireEvent.change(screen.getByPlaceholderText("Email address *"), {
        target: { value: "ada@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Save my details/i }));

      await screen.findByText(/your request has been saved/i);
      // Give the auto-redirect effect more than enough time to fire if it could.
      await new Promise((resolve) => setTimeout(resolve, 40));

      expect(screen.queryByRole("link", { name: /checkout/i })).toBeNull();
      expect(assign).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: originalLocation,
      });
    }
  });
});
