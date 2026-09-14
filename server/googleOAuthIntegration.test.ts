import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve(import.meta.dirname, "..");

describe("DreamCarz Google OAuth integration", () => {
  it("uses authorization-code verification, a CSRF state cookie, and the direct DreamCarz session cookie", () => {
    const source = fs.readFileSync(path.join(sourceRoot, "server", "googleOAuth.ts"), "utf8");
    expect(source).toContain("verifyIdToken");
    expect(source).toContain("GOOGLE_STATE_COOKIE");
    expect(source).toContain("DIRECT_SESSION_COOKIE");
    expect(source).toContain("email_verified !== true");
    expect(source).toContain("openid email profile");
  });

  it("renders an explicit Google sign-in control without putting a credential in client code", () => {
    const loginSource = fs.readFileSync(path.join(sourceRoot, "client", "src", "pages", "Login.tsx"), "utf8");
    expect(loginSource).toContain("Continue with Google");
    expect(loginSource).toContain("/api/auth/google?next=");
    expect(loginSource).not.toContain("GOOGLE_OAUTH_CLIENT_SECRET");
  });
});
