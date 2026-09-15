import { describe, expect, it, vi } from "vitest";

describe("Google OAuth safeguards", () => {
  it("imports the direct-account helper required for verified Google identity linking", async () => {
    const directAuth = await import("./directAuth.ts");
    expect(typeof directAuth.findOrCreateGoogleAccount).toBe("function");
  });

  it("keeps return paths internal and only enables OAuth when all server secrets are present", async () => {
    vi.stubEnv("GOOGLE_OAUTH_CLIENT_ID", "client-id");
    vi.stubEnv("GOOGLE_OAUTH_CLIENT_SECRET", "client-secret");
    vi.stubEnv("GOOGLE_OAUTH_REDIRECT_URI", "https://www.dreamcarz.io/api/auth/google/callback");
    const { getGoogleOAuthConfig, safeGoogleReturnTo } = await import("./googleOAuth");
    expect(getGoogleOAuthConfig()).toMatchObject({ clientId: "client-id", redirectUri: "https://www.dreamcarz.io/api/auth/google/callback" });
    expect(safeGoogleReturnTo("/dashboard")).toBe("/dashboard");
    expect(safeGoogleReturnTo("//outside.example")).toBe("/dashboard");
    expect(safeGoogleReturnTo("https://outside.example")).toBe("/dashboard");
  });
});
