import { describe, expect, it } from "vitest";

const credentialsAreConfigured = Boolean(
  process.env.GOOGLE_OAUTH_CLIENT_ID
  && process.env.GOOGLE_OAUTH_CLIENT_SECRET
  && process.env.GOOGLE_OAUTH_REDIRECT_URI,
);

describe.runIf(credentialsAreConfigured)("DreamCarz Google OAuth credentials", () => {
  it("is accepted by Google before a customer authorization code is exchanged", async () => {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI!,
        grant_type: "authorization_code",
        code: "dreamcarz-credential-validation-no-user-code",
      }),
    });
    const body = await response.json() as { error?: string };

    // A deliberately invalid authorization code must reach the grant check.
    // Invalid app credentials instead produce invalid_client / 401.
    expect(response.status).toBe(400);
    expect(body.error).toBe("invalid_grant");
  }, 20_000);
});
