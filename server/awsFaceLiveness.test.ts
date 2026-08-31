import { afterEach, describe, expect, it, vi } from "vitest";
import { createAwsFaceLivenessBrowserCredentials, createAwsFaceLivenessSession, getAwsFaceLivenessStatus } from "./awsFaceLiveness";

const envKeys = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_REGION",
  "AWS_FACE_LIVENESS_BROWSER_ROLE_ARN",
  "AWS_FACE_LIVENESS_ENABLED",
  "AWS_FACE_LIVENESS_BROWSER_FLOW_ENABLED",
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
    vi.stubEnv("AWS_FACE_LIVENESS_BROWSER_FLOW_ENABLED", "false");

    expect(getAwsFaceLivenessStatus()).toEqual({
      provider: "aws_face_liveness",
      region: "us-east-1",
      serverCredentialsConfigured: true,
      browserCredentialBrokerConfigured: false,
      browserFlowEnabled: false,
      enabled: true,
      configured: false,
      mode: "manual_review",
    });
  });

  it("reports ready only when explicit enablement, server credentials, a browser role, and browser-flow activation are all configured", () => {
    vi.stubEnv("AWS_ACCESS_KEY_ID", "dedicated-server-key");
    vi.stubEnv("AWS_SECRET_ACCESS_KEY", "dedicated-server-secret");
    vi.stubEnv("AWS_REGION", "us-east-1");
    vi.stubEnv("AWS_FACE_LIVENESS_ENABLED", "true");
    vi.stubEnv("AWS_FACE_LIVENESS_BROWSER_ROLE_ARN", "arn:aws:iam::322650755363:role/dreamcarz-face-liveness-browser");
    vi.stubEnv("AWS_FACE_LIVENESS_BROWSER_FLOW_ENABLED", "true");

    const status = getAwsFaceLivenessStatus();
    expect(status.configured).toBe(true);
    expect(status.mode).toBe("ready");
  });

  it("keeps browser credential issuance disabled until its separate flow flag is deliberately enabled", async () => {
    vi.stubEnv("AWS_ACCESS_KEY_ID", "dedicated-server-key");
    vi.stubEnv("AWS_SECRET_ACCESS_KEY", "dedicated-server-secret");
    vi.stubEnv("AWS_REGION", "us-east-1");
    vi.stubEnv("AWS_FACE_LIVENESS_ENABLED", "true");
    vi.stubEnv("AWS_FACE_LIVENESS_BROWSER_ROLE_ARN", "arn:aws:iam::322650755363:role/dreamcarz-face-liveness-browser");
    vi.stubEnv("AWS_FACE_LIVENESS_BROWSER_FLOW_ENABLED", "false");

    await expect(createAwsFaceLivenessBrowserCredentials()).resolves.toMatchObject({
      configured: false,
      provider: { browserCredentialBrokerConfigured: true, browserFlowEnabled: false, mode: "manual_review" },
    });
  });

  it("issues only temporary StartFaceLivenessSession credentials through an injected STS sender", async () => {
    vi.stubEnv("AWS_ACCESS_KEY_ID", "dedicated-server-key");
    vi.stubEnv("AWS_SECRET_ACCESS_KEY", "dedicated-server-secret");
    vi.stubEnv("AWS_REGION", "us-east-1");
    vi.stubEnv("AWS_FACE_LIVENESS_ENABLED", "true");
    vi.stubEnv("AWS_FACE_LIVENESS_BROWSER_ROLE_ARN", "arn:aws:iam::322650755363:role/dreamcarz-face-liveness-browser");
    vi.stubEnv("AWS_FACE_LIVENESS_BROWSER_FLOW_ENABLED", "true");

    const result = await createAwsFaceLivenessBrowserCredentials({
      sendAssumeRole: async command => {
        expect(command.input).toMatchObject({
          RoleArn: "arn:aws:iam::322650755363:role/dreamcarz-face-liveness-browser",
          DurationSeconds: 900,
        });
        expect(JSON.parse(command.input.Policy ?? "{}")).toEqual({
          Version: "2012-10-17",
          Statement: [{ Effect: "Allow", Action: "rekognition:StartFaceLivenessSession", Resource: "*" }],
        });
        return {
          Credentials: {
            AccessKeyId: "temporary-access-key",
            SecretAccessKey: "temporary-secret",
            SessionToken: "temporary-session-token",
            Expiration: new Date("2026-09-01T00:00:00.000Z"),
          },
        } as never;
      },
    });

    expect(result).toMatchObject({
      configured: true,
      credentials: { accessKeyId: "temporary-access-key", sessionToken: "temporary-session-token" },
    });
  });

  it("does not create a provider session while the browser credential path is intentionally unavailable", async () => {
    vi.stubEnv("AWS_ACCESS_KEY_ID", "dedicated-server-key");
    vi.stubEnv("AWS_SECRET_ACCESS_KEY", "dedicated-server-secret");
    vi.stubEnv("AWS_REGION", "us-east-1");
    vi.stubEnv("AWS_FACE_LIVENESS_ENABLED", "true");
    vi.stubEnv("AWS_FACE_LIVENESS_BROWSER_ROLE_ARN", "");
    vi.stubEnv("AWS_FACE_LIVENESS_BROWSER_FLOW_ENABLED", "false");

    await expect(createAwsFaceLivenessSession({ clientRequestToken: "test-request-token" })).resolves.toMatchObject({
      configured: false,
      provider: { mode: "manual_review" },
    });
  });

  it("does not issue short-lived browser credentials while the scoped browser role is unavailable", async () => {
    vi.stubEnv("AWS_ACCESS_KEY_ID", "dedicated-server-key");
    vi.stubEnv("AWS_SECRET_ACCESS_KEY", "dedicated-server-secret");
    vi.stubEnv("AWS_FACE_LIVENESS_ENABLED", "true");
    vi.stubEnv("AWS_FACE_LIVENESS_BROWSER_ROLE_ARN", "");
    vi.stubEnv("AWS_FACE_LIVENESS_BROWSER_FLOW_ENABLED", "false");

    await expect(createAwsFaceLivenessBrowserCredentials()).resolves.toMatchObject({
      configured: false,
      provider: { mode: "manual_review" },
    });
  });
});
