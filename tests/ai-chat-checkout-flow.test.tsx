import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

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

const { AIChatPanel } = await import("@/components/ai/AIChatPanel");

const recommendation: AcademyRecommendation = {
  type: "pack",
  slug: "digital-skills-pack",
  title: "Digital Skills Pack",
  productPath: "/courses/digital-skills-pack",
  checkoutPath: "/courses/checkout?item=pack:digital-skills-pack",
  priceLabel: "FCFA 5,000",
};

function response(payload: unknown) {
  return {
    ok: true,
    json: async () => payload,
  } as Response;
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("AIChatPanel course purchase flow", () => {
  it("shows the structured recommendation, then the details form, then the checkout link", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === "PUT") {
          return response({
            ok: true,
            recommendation: {
              ...recommendation,
              checkoutPath:
                "/courses/checkout?item=pack:digital-skills-pack&validated=1",
            },
          });
        }

        const body = JSON.parse(String(init?.body)) as { message: string };
        if (/^yes\b/i.test(body.message)) {
          return response({
            message: "Great — your details will unlock the checkout.",
            conversationId: "conversation-1",
            recommendation,
          });
        }

        return response({
          message: "The Digital Skills Pack is the best value for you.",
          conversationId: "conversation-1",
          recommendation,
        });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<AIChatPanel onClose={() => {}} />);

    const input = screen.getByPlaceholderText(
      /Ask me anything about teChia's services/i,
    ) as HTMLTextAreaElement;
    fireEvent.change(input, {
      target: { value: "Which pack gives the best value?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send message/i }));

    await screen.findByText("Digital Skills Pack");
    expect(
      screen
        .getByRole("link", { name: /Continue to secure checkout/i })
        .getAttribute("href"),
    ).toBe(recommendation.checkoutPath);

    fireEvent.change(
      screen.getByPlaceholderText(/Ask me anything about teChia's services/i),
      {
        target: { value: "yes" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: /Send message/i }));

    await screen.findByText(/Share your details/i);
    await screen.findByPlaceholderText("Your name *");

    fireEvent.change(screen.getByPlaceholderText("Your name *"), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email address *"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save my details/i }));

    await screen.findByText(/your request has been saved/i);
    expect(
      screen
        .getByRole("link", {
          name: /Continue to checkout for Digital Skills Pack/i,
        })
        .getAttribute("href"),
    ).toBe("/courses/checkout?item=pack:digital-skills-pack&validated=1");

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});
