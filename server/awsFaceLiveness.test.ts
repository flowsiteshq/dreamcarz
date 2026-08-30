import { afterEach, describe, expect, it, vi } from "vitest";
import { createAwsFaceLivenessSession, getAwsFaceLivenessStatus } from "./awsFaceLiveness";

const envKeys = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_REGION",
  "AWS_FACE_LIVENESS_BROWSER_ROLE_ARN",
  "AWS_FACE_LIVENESS_ENABLED",
] as const;

const originalEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));

afterEach(() => {
  for (const key of envKeys) {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  vi.unstubAllEnvs();
});

describe("AWS Face Liveness provider state", () => {
  it("keeps the provider in manual-review mode until browser credential brokering is intentionally enabled", () => {
    vi.stubEnv("AWS_ACCESS_KEY_ID", "dedicated-server-key");
    vi.stubEnv("AWS_SECRET_ACCESS_KEY", "dedicated-server-secret");
    vi.stubEnv("AWS_REGION", "us-east-1");
    vi.stubEnv("AWS_FACE_LIVENESS_ENABLED", "true");
    vi.stubEnv("AWS_FACE_LIVENESS_BROWSER_ROLE_ARN", "");

    expect(getAwsFaceLivenessStatus()).toEqual({
      provider: "aws_face_liveness",
      region: "us-east-1",
      serverCredentialsConfigured: true,
      browserCredentialBrokerConfigured: false,
      enabled: true,
      configured: false,
      mode: "manual_review",
    });
  });

  it("reports ready only when explicit enablement, server credentials, and a browser role are all configured", () => {
    vi.stubEnv("AWS_ACCESS_KEY_ID", "dedicated-server-key");
    vi.stubEnv("AWS_SECRET_ACCESS_KEY", "dedicated-server-secret");
    vi.stubEnv("AWS_REGION", "us-east-1");
    vi.stubEnv("AWS_FACE_LIVENESS_ENABLED", "true");
    vi.stubEnv("AWS_FACE_LIVENESS_BROWSER_ROLE_ARN", "arn:aws:iam::322650755363:role/dreamcarz-face-liveness-browser");

    const status = getAwsFaceLivenessStatus();
    expect(status.configured).toBe(true);
    expect(status.mode).toBe("ready");
  });

  it("does not create a provider session while the browser credential path is intentionally unavailable", async () => {
    vi.stubEnv("AWS_ACCESS_KEY_ID", "dedicated-server-key");
    vi.stubEnv("AWS_SECRET_ACCESS_KEY", "dedicated-server-secret");
    vi.stubEnv("AWS_REGION", "us-east-1");
    vi.stubEnv("AWS_FACE_LIVENESS_ENABLED", "true");
    vi.stubEnv("AWS_FACE_LIVENESS_BROWSER_ROLE_ARN", "");

    await expect(createAwsFaceLivenessSession({ clientRequestToken: "test-request-token" })).resolves.toMatchObject({
      configured: false,
      provider: { mode: "manual_review" },
    });
  });
});
