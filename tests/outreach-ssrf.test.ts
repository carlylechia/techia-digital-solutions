import { afterEach, describe, expect, it, vi } from "vitest";

// The engine resolves DNS and rejects private answers before it opens a socket.
// Tests mock resolution so transport-level behaviour can be exercised without
// real network access; the private-address logic itself is tested directly above.
vi.mock("node:dns/promises", () => ({
  default: { lookup: vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]) },
  lookup: vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]),
}));

const { assertSafeUrl, isPrivateAddress, SafeFetchError, safeFetch } = await import("../src/lib/outreach/safe-fetch");

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("private address detection", () => {
  it("blocks loopback, RFC1918, link-local, CGNAT and metadata addresses", () => {
    for (const address of [
      "127.0.0.1",
      "127.1.2.3",
      "10.0.0.1",
      "10.255.255.254",
      "172.16.0.1",
      "172.31.255.254",
      "192.168.1.1",
      "169.254.169.254", // cloud metadata
      "100.64.0.1", // CGNAT
      "0.0.0.0",
      "224.0.0.1",
      "255.255.255.255",
      "198.18.0.1",
      "192.0.2.5", // TEST-NET
    ]) {
      expect(isPrivateAddress(address), `${address} must be blocked`).toBe(true);
    }
  });

  it("allows ordinary public addresses", () => {
    for (const address of ["8.8.8.8", "1.1.1.1", "93.184.216.34", "172.32.0.1", "100.63.255.255"]) {
      expect(isPrivateAddress(address), `${address} must be allowed`).toBe(false);
    }
  });

  it("blocks IPv6 loopback, link-local, unique-local and mapped IPv4", () => {
    for (const address of ["::1", "::", "fe80::1", "fc00::1", "fd12::1", "ff02::1", "::ffff:127.0.0.1", "::ffff:169.254.169.254"]) {
      expect(isPrivateAddress(address), `${address} must be blocked`).toBe(true);
    }
    expect(isPrivateAddress("2606:4700:4700::1111")).toBe(false);
  });

  it("treats an unparseable address as unsafe", () => {
    expect(isPrivateAddress("not-an-ip")).toBe(true);
  });
});

describe("URL safety", () => {
  it("rejects non-http protocols", () => {
    for (const url of [
      "file:///etc/passwd",
      "gopher://example.com/",
      "data:text/html,<script>alert(1)</script>",
      "ftp://example.com/file",
      "javascript:alert(1)",
    ]) {
      expect(() => assertSafeUrl(url), url).toThrow(SafeFetchError);
    }
  });

  it("rejects embedded credentials", () => {
    expect(() => assertSafeUrl("https://user:pass@example.com")).toThrow(SafeFetchError);
  });

  it("rejects local hostnames and private literals", () => {
    for (const url of [
      "http://localhost/",
      "http://localhost:3000/admin",
      "http://app.localhost/",
      "http://db.internal/",
      "http://printer.local/",
      "http://127.0.0.1/",
      "http://169.254.169.254/latest/meta-data/",
      "http://[::1]/",
    ]) {
      expect(() => assertSafeUrl(url), url).toThrow(SafeFetchError);
    }
  });

  it("accepts a normal business https URL", () => {
    const url = assertSafeUrl("https://restaurant-douala.cm/menu");
    expect(url.hostname).toBe("restaurant-douala.cm");
    expect(url.protocol).toBe("https:");
  });

  it("reports a clear category for each rejection", () => {
    try {
      assertSafeUrl("http://169.254.169.254/");
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(SafeFetchError);
      expect((error as InstanceType<typeof SafeFetchError>).category).toBe("private_network");
    }
  });
});

describe("safeFetch", () => {
  it("refuses to make a request at all when the URL is unsafe", async () => {
    await expect(safeFetch("http://169.254.169.254/latest/meta-data/iam/security-credentials/")).rejects.toMatchObject({
      category: "private_network",
    });
    await expect(safeFetch("http://localhost:5432")).rejects.toMatchObject({ category: "blocked_host" });
    await expect(safeFetch("file:///etc/passwd")).rejects.toMatchObject({ category: "blocked_protocol" });
  });

  it("refuses a redirect target that leaves the public internet", async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "https://redirector.example/") {
        return new Response(null, { status: 302, headers: { location: "http://169.254.169.254/latest/" } });
      }
      throw new Error(`unexpected fetch to ${url}`);
    }) as typeof fetch;

    await expect(safeFetch("https://redirector.example/")).rejects.toBeInstanceOf(SafeFetchError);
  });

  it("enforces a byte ceiling while streaming and never exceeds it", async () => {
    globalThis.fetch = (async () => {
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          for (let index = 0; index < 200; index += 1) {
            controller.enqueue(new TextEncoder().encode("A".repeat(1024)));
          }
          controller.close();
        },
      });
      return new Response(body, { status: 200, headers: { "content-type": "text/html" } });
    }) as typeof fetch;

    const result = await safeFetch("https://big-page.example/", { maxBytes: 8_000 });
    expect(result.truncated).toBe(true);
    expect(result.body.length).toBeLessThanOrEqual(8_000);
  });

  it("refuses an oversized body announced by content-length before reading it", async () => {
    globalThis.fetch = (async () =>
      new Response("small", { status: 200, headers: { "content-type": "text/html", "content-length": "999999999" } })) as typeof fetch;

    await expect(safeFetch("https://huge.example/", { maxBytes: 1_000 })).rejects.toMatchObject({ category: "too_large" });
  });

  it("returns a non-2xx response for the caller to inspect instead of throwing", async () => {
    globalThis.fetch = (async () => new Response("nope", { status: 404, headers: { "content-type": "text/html" } })) as typeof fetch;

    const result = await safeFetch("https://missing.example/");
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
  });
});
