import { afterEach, describe, expect, it } from "vitest";
import { getPaymentProviderStatus } from "./paymentProvider";

const originalEnabled = process.env.STRIPE_PAYMENTS_ENABLED;
const originalKey = process.env.STRIPE_SECRET_KEY;
const originalReturnUrl = process.env.STRIPE_PAYMENT_RETURN_URL;

afterEach(() => {
  process.env.STRIPE_PAYMENTS_ENABLED = originalEnabled;
  process.env.STRIPE_SECRET_KEY = originalKey;
  process.env.STRIPE_PAYMENT_RETURN_URL = originalReturnUrl;
});

describe("payment provider configuration", () => {
  it("does not open a payment collection flow until deliberately enabled", () => {
    process.env.STRIPE_PAYMENTS_ENABLED = "false";
    process.env.STRIPE_SECRET_KEY = "test_key_present";
    process.env.STRIPE_PAYMENT_RETURN_URL = "https://example.test/payment-return";

    expect(getPaymentProviderStatus()).toEqual({
      provider: "stripe_checkout",
      enabled: false,
      configured: false,
      mode: "manual_review",
    });
  });

  it("requires an HTTPS return URL before a provider setup flow is ready", () => {
    process.env.STRIPE_PAYMENTS_ENABLED = "true";
    process.env.STRIPE_SECRET_KEY = "test_key_present";
    process.env.STRIPE_PAYMENT_RETURN_URL = "http://localhost:3000/payment-return";

    expect(getPaymentProviderStatus().configured).toBe(false);
  });
});
