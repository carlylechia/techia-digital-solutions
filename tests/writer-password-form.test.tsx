import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { BlogActionResult } from "@/lib/blog/actions";

const changeWriterPasswordAction = vi.fn(
  async (formData: FormData): Promise<BlogActionResult> => ({ ok: true, message: `Changed ${formData.get("newPassword") ? "ok" : "nothing"}` }),
);
vi.mock("@/lib/blog/actions", () => ({ changeWriterPasswordAction }));

const { WriterPasswordForm } = await import("@/components/blog/writer-password-form");

function field(name: string) {
  return document.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
}

describe("writer password visibility toggle", () => {
  beforeEach(() => {
    cleanup();
    changeWriterPasswordAction.mockClear();
  });

  it("starts masked and reveals what the writer typed", () => {
    render(<WriterPasswordForm />);
    expect(field("currentPassword").type).toBe("password");
    expect(field("newPassword").type).toBe("password");

    fireEvent.click(screen.getByLabelText("Show current password"));
    expect(field("currentPassword").type).toBe("text");
    expect(field("newPassword").type).toBe("password");
  });

  it("hides the password again on a second click", () => {
    render(<WriterPasswordForm />);
    const toggle = screen.getByLabelText("Show new password");
    fireEvent.click(toggle);
    expect(screen.getByLabelText("Hide new password")).toBeTruthy();
    expect(field("newPassword").type).toBe("text");
    fireEvent.click(screen.getByLabelText("Hide new password"));
    expect(field("newPassword").type).toBe("password");
  });

  it("toggles each password field independently", () => {
    render(<WriterPasswordForm />);
    fireEvent.click(screen.getByLabelText("Show current password"));
    expect(field("currentPassword").type).toBe("text");
    expect(field("newPassword").type).toBe("password");
  });

  it("keeps the typed value when the mask is toggled", () => {
    render(<WriterPasswordForm />);
    const input = field("newPassword");
    fireEvent.change(input, { target: { value: "correct horse battery" } });
    fireEvent.click(screen.getByLabelText("Show new password"));
    expect((field("newPassword") as HTMLInputElement).value).toBe("correct horse battery");
    fireEvent.click(screen.getByLabelText("Hide new password"));
    expect((field("newPassword") as HTMLInputElement).value).toBe("correct horse battery");
  });

  it("exposes the pressed state and does not submit the form when toggled", () => {
    render(<WriterPasswordForm />);
    const toggle = screen.getByLabelText("Show current password") as HTMLButtonElement;
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(toggle.type).toBe("button");
    fireEvent.click(toggle);
    expect(screen.getByLabelText("Hide current password").getAttribute("aria-pressed")).toBe("true");
    expect(changeWriterPasswordAction).not.toHaveBeenCalled();
  });

  it("returns focus to the field so typing can continue", () => {
    render(<WriterPasswordForm />);
    fireEvent.click(screen.getByLabelText("Show new password"));
    expect(document.activeElement).toBe(field("newPassword"));
  });

  it("submits the real password values, not the mask state", async () => {
    render(<WriterPasswordForm />);
    fireEvent.change(field("currentPassword"), { target: { value: "old-secret-value" } });
    fireEvent.change(field("newPassword"), { target: { value: "new-secret-value" } });
    fireEvent.click(screen.getByLabelText("Show new password"));
    fireEvent.submit(screen.getByRole("button", { name: "Update password" }).closest("form") as HTMLFormElement);
    await waitFor(() => expect(changeWriterPasswordAction).toHaveBeenCalledTimes(1));
    const formData = changeWriterPasswordAction.mock.calls[0][0] as FormData;
    expect(formData.get("currentPassword")).toBe("old-secret-value");
    expect(formData.get("newPassword")).toBe("new-secret-value");
  });
});
