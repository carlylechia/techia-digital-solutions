import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getMetaConfigurationSummary,
  isMetaEnvPublishingEnabled,
  getMetaGraphVersion,
} from "@/lib/meta/config";

const ORIGINAL = {
  META_PUBLISHING_ENABLED: process.env.META_PUBLISHING_ENABLED,
  META_GRAPH_API_VERSION: process.env.META_GRAPH_API_VERSION,
  META_APP_ID: process.env.META_APP_ID,
  META_APP_SECRET: process.env.META_APP_SECRET,
  META_OAUTH_REDIRECT_URI: process.env.META_OAUTH_REDIRECT_URI,
  META_TOKEN_ENCRYPTION_KEY: process.env.META_TOKEN_ENCRYPTION_KEY,
};

function setEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

beforeEach(() => {
  setEnv("META_APP_ID", "1234567890");
  setEnv("META_APP_SECRET", "super-secret-value");
  setEnv("META_OAUTH_REDIRECT_URI", "https://techiadigital.com/api/meta/oauth/callback");
  setEnv("META_TOKEN_ENCRYPTION_KEY", "0".repeat(64));
});

afterEach(() => {
  for (const [name, value] of Object.entries(ORIGINAL)) setEnv(name, value);
});

describe("meta configuration and kill switch", () => {
  it("treats only the exact string true as an enabled environment switch", () => {
    for (const value of [undefined, "", "false", "False", "TRUE", "1", "yes", "on"]) {
      setEnv("META_PUBLISHING_ENABLED", value);
      expect(isMetaEnvPublishingEnabled()).toBe(false);
    }
    setEnv("META_PUBLISHING_ENABLED", "true");
    expect(isMetaEnvPublishingEnabled()).toBe(true);
  });

  it("pins a stable default Graph API version", () => {
    delete process.env.META_GRAPH_API_VERSION;
    expect(getMetaGraphVersion()).toBe("v27.0");
  });

  it("rejects a malformed Graph API version override", () => {
    setEnv("META_GRAPH_API_VERSION", "27.0");
    expect(() => getMetaGraphVersion()).toThrow();
  });

  it("reports configured only when every required value is present", () => {
    setEnv("META_PUBLISHING_ENABLED", "true");
    setEnv("META_TOKEN_ENCRYPTION_KEY", undefined);
    expect(getMetaConfigurationSummary().configured).toBe(false);
    setEnv("META_TOKEN_ENCRYPTION_KEY", "0".repeat(64));
    expect(getMetaConfigurationSummary().configured).toBe(true);
    expect(getMetaConfigurationSummary().envPublishingEnabled).toBe(true);
  });
});
