import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

const adminContext = {
  user: { id: 1, name: "Administrator", email: "admin@example.com", role: "admin" },
  req: { headers: {}, ip: "203.0.113.10" },
  res: {},
};

describe("AWS Face Liveness guarded configuration", () => {
  it("reports the configured browser flow through the protected status procedure without starting a session", async () => {
    expect(process.env.AWS_FACE_LIVENESS_ENABLED).toBe("true");
    expect(process.env.AWS_FACE_LIVENESS_BROWSER_FLOW_ENABLED).toBe("true");
    expect(process.env.AWS_FACE_LIVENESS_BROWSER_ROLE_ARN).toMatch(/^arn:aws:iam::\d{12}:role\/dreamcarz-face-liveness-browser$/);

    const status = await appRouter.createCaller(adminContext as never).transactions.awsFaceLivenessStatus();

    expect(status).toMatchObject({
      provider: "aws_face_liveness",
      serverCredentialsConfigured: true,
      browserCredentialBrokerConfigured: true,
      browserFlowEnabled: true,
      enabled: true,
      configured: true,
      mode: "ready",
    });
  });
});
