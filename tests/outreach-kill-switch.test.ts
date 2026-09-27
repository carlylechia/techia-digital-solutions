import { afterEach, describe, expect, it } from "vitest";
import { getOutreachSendingState, isOutreachSendingEnabled } from "@/lib/outreach/config";

/**
 * The kill switch is the single authority consulted before any provider call.
 * These tests pin the rule that development can never send, no matter how the
 * flag is set.
 */

const ORIGINAL_ENV = process.env.NODE_ENV;
const ORIGINAL_FLAG = process.env.OUTREACH_EMAIL_SEND_ENABLED;

type MutableEnv = Record<string, string | undefined>;

/** `process.env.NODE_ENV` is typed read-only; the tests need to vary it. */
const env = process.env as unknown as MutableEnv;

function setEnv(environment: string | undefined, flag: string | undefined) {
  if (environment === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = environment;

  if (flag === undefined) delete env.OUTREACH_EMAIL_SEND_ENABLED;
  else env.OUTREACH_EMAIL_SEND_ENABLED = flag;
}

afterEach(() => {
  setEnv(ORIGINAL_ENV, ORIGINAL_FLAG);
});

describe("outreach kill switch", () => {
  it("is disabled in development even when the flag is true", () => {
    setEnv("development", "true");
    expect(isOutreachSendingEnabled()).toBe(false);
    const state = getOutreachSendingState();
    expect(state.enabled).toBe(false);
    expect(state.reason).toMatch(/outside production/i);
  });

  it("is disabled in test even when the flag is true", () => {
    setEnv("test", "true");
    expect(isOutreachSendingEnabled()).toBe(false);
  });

  it("is disabled in production unless the flag is exactly true", () => {
    for (const flag of ["false", "1", "TRUE", "yes", "on", ""]) {
      setEnv("production", flag);
      expect(isOutreachSendingEnabled(), String(flag)).toBe(false);
    }
  });

  it("is disabled in production when the flag is unset", () => {
    setEnv("production", undefined);
    expect(isOutreachSendingEnabled()).toBe(false);
    expect(getOutreachSendingState().reason).toMatch(/OUTREACH_EMAIL_SEND_ENABLED/);
  });

  it("is enabled only in production with the flag set to true", () => {
    setEnv("production", "true");
    expect(isOutreachSendingEnabled()).toBe(true);
    const state = getOutreachSendingState();
    expect(state.enabled).toBe(true);
    expect(state.reason).toMatch(/still passes all safety checks/i);
  });

  it("reports the environment and flag so the dashboard and the send path agree", () => {
    setEnv("production", "false");
    const state = getOutreachSendingState();
    expect(state.environment).toBe("production");
    expect(state.flag).toBe("false");
    expect(state.enabled).toBe(false);
  });
});
