import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verifyCronAuthorization } from "@/lib/outreach/cron-auth";

/**
 * Cron endpoints must be unreachable without the shared secret, must not answer
 * to a method a link or prefetch can trigger, and must refuse to run at all when
 * the secret is not configured.
 */

const ORIGINAL_SECRET = process.env.CRON_SECRET;

function request(init: { method?: string; authorization?: string } = {}) {
  return new Request("https://techiadigital.com/api/cron/outreach/process", {
    method: init.method ?? "GET",
    headers: init.authorization ? { authorization: init.authorization } : {},
  });
}

beforeEach(() => {
  process.env.CRON_SECRET = "test-cron-secret";
});

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = ORIGINAL_SECRET;
});

describe("cron authorization", () => {
  it("accepts the exact bearer secret", () => {
    const result = verifyCronAuthorization(request({ authorization: "Bearer test-cron-secret" }));
    expect(result.ok).toBe(true);
  });

  it("rejects a missing, malformed or wrong secret", () => {
    expect(verifyCronAuthorization(request())).toMatchObject({ ok: false, status: 401 });
    expect(verifyCronAuthorization(request({ authorization: "test-cron-secret" }))).toMatchObject({ ok: false, status: 401 });
    expect(verifyCronAuthorization(request({ authorization: "Basic test-cron-secret" }))).toMatchObject({ ok: false, status: 401 });
    expect(verifyCronAuthorization(request({ authorization: "Bearer wrong-secret" }))).toMatchObject({ ok: false, status: 401 });
    expect(verifyCronAuthorization(request({ authorization: "Bearer test-cron-secre" }))).toMatchObject({ ok: false, status: 401 });
    expect(verifyCronAuthorization(request({ authorization: "Bearer test-cron-secretX" }))).toMatchObject({ ok: false, status: 401 });
  });

  it("refuses to run when CRON_SECRET is not configured at all", () => {
    delete process.env.CRON_SECRET;
    const result = verifyCronAuthorization(request({ authorization: "Bearer anything" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(503);
  });

  it("rejects methods a link, prefetch or image tag could trigger", () => {
    for (const method of ["HEAD", "PUT", "DELETE", "PATCH", "OPTIONS"]) {
      const result = verifyCronAuthorization(request({ method, authorization: "Bearer test-cron-secret" }));
      expect(result.ok, method).toBe(false);
      if (!result.ok) expect(result.status).toBe(405);
    }
  });

  it("accepts GET and POST only", () => {
    expect(verifyCronAuthorization(request({ method: "GET", authorization: "Bearer test-cron-secret" })).ok).toBe(true);
    expect(verifyCronAuthorization(request({ method: "POST", authorization: "Bearer test-cron-secret" })).ok).toBe(true);
  });
});
