import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LockKeyhole } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";

const signIn = vi.fn<(provider: string, options?: Record<string, unknown>) => Promise<{ ok: boolean; url: string }>>(
  async (provider) => ({ ok: true, url: `/${provider}` }),
);
vi.mock("next-auth/react", () => ({ signIn }));

const { WriterLoginForm } = await import("@/components/blog/writer-login-form");
const { AdminLoginForm } = await import("@/components/admin/admin-login-form");

function field(name: string) {
  return document.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
}

describe("password input modes", () => {
  beforeEach(() => {
    cleanup();
    signIn.mockClear();
  });

  it("labels the field and links the toggle to it", () => {
    render(<PasswordInput name="password" label="Current password" />);
    const input = field("password");
    const toggle = screen.getByLabelText("Show current password");
    expect(input.getAttribute("aria-labelledby")).toBeTruthy();
    expect(document.getElementById(input.getAttribute("aria-labelledby")!)?.textContent).toBe("Current password");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(toggle);
    expect(input.type).toBe("text");
  });

  it("renders no nested label when an enclosing label already names the field", () => {
    // Mirrors the admin workspace Field wrapper used for the temporary password.
    render(
      <label className="grid min-w-0 gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
        Temporary password
        <PasswordInput name="password" minLength={10} required inputClassName="min-w-0 w-full rounded-lg text-sm" />
      </label>,
    );
    expect(field("password").type).toBe("password");
    expect(field("password").minLength).toBe(10);
    expect(field("password").required).toBe(true);
    expect(field("password").className).toContain("rounded-lg");
    // Without a label prop there is no aria-labelledby, so the enclosing
    // label is the accessible name and the markup stays valid.
    expect(field("password").getAttribute("aria-labelledby")).toBeNull();
    expect(document.querySelectorAll("label").length).toBe(1);
    expect(document.querySelector("label")?.contains(field("password"))).toBe(true);

    fireEvent.click(screen.getByLabelText("Show password"));
    expect(field("password").type).toBe("text");
  });

  it("keeps a leading icon without covering the typed text", () => {
    render(<PasswordInput name="password" label="Password" icon={<LockKeyhole className="absolute" data-testid="lock" />} />);
    expect(screen.getByTestId("lock")).toBeTruthy();
    expect(field("password").className).toContain("pl-10");
    expect(field("password").className).toContain("pr-11");
  });

  it("omits the icon padding when there is no icon", () => {
    render(<PasswordInput name="password" label="Password" />);
    expect(field("password").className).not.toContain("pl-10");
  });

  it("uses translated toggle labels when supplied", () => {
    render(<PasswordInput name="password" label="Mot de passe" toggleLabels={{ show: "Afficher le mot de passe", hide: "Masquer le mot de passe" }} />);
    expect(screen.getByLabelText("Afficher le mot de passe")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Afficher le mot de passe"));
    expect(screen.getByLabelText("Masquer le mot de passe")).toBeTruthy();
  });

  it("forwards placeholder, maxLength, and disabled state", () => {
    render(<PasswordInput name="password" label="Password" placeholder="Enter your password" maxLength={72} disabled />);
    expect(field("password").placeholder).toBe("Enter your password");
    expect(field("password").maxLength).toBe(72);
    expect(field("password").disabled).toBe(true);
    expect((screen.getByLabelText("Show password") as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("login forms share the password toggle", () => {
  beforeEach(() => {
    cleanup();
    signIn.mockClear();
  });

  it("lets a writer reveal the password on the writer sign-in page", async () => {
    render(<WriterLoginForm locale="en" />);
    expect(field("password").type).toBe("password");
    fireEvent.change(field("password"), { target: { value: "my-secret-passphrase" } });
    fireEvent.click(screen.getByLabelText("Show password"));
    expect(field("password").type).toBe("text");
    expect((field("password") as HTMLInputElement).value).toBe("my-secret-passphrase");

    fireEvent.submit(screen.getByRole("button", { name: "Continue" }).closest("form") as HTMLFormElement);
    await waitFor(() => expect(signIn).toHaveBeenCalledTimes(1));
    expect(signIn.mock.calls[0][1]).toMatchObject({ password: "my-secret-passphrase" });
  });

  it("translates the writer toggle into French", () => {
    render(<WriterLoginForm locale="fr" />);
    expect(screen.getByLabelText("Afficher le mot de passe")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Afficher le mot de passe"));
    expect(screen.getByLabelText("Masquer le mot de passe")).toBeTruthy();
  });

  it("adds the toggle to the admin sign-in page in both languages", () => {
    const { unmount } = render(<AdminLoginForm locale="en" />);
    expect(field("password").type).toBe("password");
    fireEvent.click(screen.getByLabelText("Show password"));
    expect(field("password").type).toBe("text");
    unmount();

    render(<AdminLoginForm locale="fr" />);
    expect(screen.getByLabelText("Afficher le mot de passe")).toBeTruthy();
  });

  it("submits the admin password regardless of the mask state", async () => {
    render(<AdminLoginForm locale="en" />);
    fireEvent.change(field("email"), { target: { value: "owner@techiadigital.com" } });
    fireEvent.change(field("password"), { target: { value: "admin-secret-passphrase" } });
    fireEvent.click(screen.getByLabelText("Show password"));
    fireEvent.submit(screen.getByRole("button", { name: "Continue" }).closest("form") as HTMLFormElement);
    await waitFor(() => expect(signIn).toHaveBeenCalledTimes(1));
    expect(signIn.mock.calls[0][1]).toMatchObject({ email: "owner@techiadigital.com", password: "admin-secret-passphrase" });
  });
});
