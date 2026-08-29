import { afterEach, describe, expect, it } from "vitest";
import { getIdentityProviderStatus } from "./identityProvider";

const originalEnabled = process.env.STRIPE_IDENTITY_ENABLED;
const originalKey = process.env.STRIPE_SECRET_KEY;
const originalReturnUrl = process.env.STRIPE_IDENTITY_RETURN_URL;

afterEach(() => {
  process.env.STRIPE_IDENTITY_ENABLED = originalEnabled;
  process.env.STRIPE_SECRET_KEY = originalKey;
  process.env.STRIPE_IDENTITY_RETURN_URL = originalReturnUrl;
});

describe("identity provider configuration", () => {
  it("keeps provider verification in manual-review mode until it is intentionally enabled", () => {
    process.env.STRIPE_IDENTITY_ENABLED = "false";
    process.env.STRIPE_SECRET_KEY = "test_key_present";
    process.env.STRIPE_IDENTITY_RETURN_URL = "https://example.test/identity-return";

    expect(getIdentityProviderStatus()).toEqual({
      provider: "stripe_identity",
      enabled: false,
      configured: false,
      mode: "manual_review",
    });
  });

  it("requires a secure return URL in addition to an enabled provider and Stripe key", () => {
    process.env.STRIPE_IDENTITY_ENABLED = "true";
    process.env.STRIPE_SECRET_KEY = "test_key_present";
    process.env.STRIPE_IDENTITY_RETURN_URL = "http://localhost:3000/identity-return";

    expect(getIdentityProviderStatus().configured).toBe(false);
  });
});
