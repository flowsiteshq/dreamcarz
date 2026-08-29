import { afterEach, describe, expect, it } from "vitest";
import { cocardPaymentSetupBlocker, getPaymentProviderStatus } from "./paymentProvider";

const originalEnabled = process.env.COCARD_PAYMENTS_ENABLED;
const originalApproved = process.env.COCARD_INTEGRATION_APPROVED;
const originalCheckoutKey = process.env.VITE_COCARD_CHECKOUT_KEY;
const originalWebhookSigningKey = process.env.COCARD_WEBHOOK_SIGNING_KEY;

afterEach(() => {
  process.env.COCARD_PAYMENTS_ENABLED = originalEnabled;
  process.env.COCARD_INTEGRATION_APPROVED = originalApproved;
  process.env.VITE_COCARD_CHECKOUT_KEY = originalCheckoutKey;
  process.env.COCARD_WEBHOOK_SIGNING_KEY = originalWebhookSigningKey;
});

describe("payment provider configuration", () => {
  it("does not expose a CoCard payment flow until deliberately enabled", () => {
    process.env.COCARD_PAYMENTS_ENABLED = "false";
    process.env.VITE_COCARD_CHECKOUT_KEY = "checkout_public_example";
    process.env.COCARD_WEBHOOK_SIGNING_KEY = "signing-key";
    process.env.COCARD_INTEGRATION_APPROVED = "true";

    expect(getPaymentProviderStatus()).toMatchObject({ provider: "cocard_gateway", enabled: false, configured: false, mode: "manual_review" });
    expect(getPaymentProviderStatus().checkoutKey).toBeUndefined();
  });

  it("requires merchant-approved hosted-payment documentation before payment setup can be enabled", () => {
    process.env.COCARD_PAYMENTS_ENABLED = "true";
    process.env.VITE_COCARD_CHECKOUT_KEY = "checkout_public_example";
    process.env.COCARD_WEBHOOK_SIGNING_KEY = "signing-key";
    process.env.COCARD_INTEGRATION_APPROVED = "false";

    expect(getPaymentProviderStatus().configured).toBe(false);
    expect(getPaymentProviderStatus().mode).toBe("documentation_required");
    expect(cocardPaymentSetupBlocker()).toContain("cannot collect payment data");
  });

  it("requires a public checkout key and signed webhook secret before exposing a hosted checkout handoff", () => {
    process.env.COCARD_PAYMENTS_ENABLED = "true";
    process.env.COCARD_INTEGRATION_APPROVED = "true";
    delete process.env.VITE_COCARD_CHECKOUT_KEY;
    delete process.env.COCARD_WEBHOOK_SIGNING_KEY;
    expect(getPaymentProviderStatus().configured).toBe(false);

    process.env.VITE_COCARD_CHECKOUT_KEY = "checkout_public_example";
    process.env.COCARD_WEBHOOK_SIGNING_KEY = "signing-key";
    expect(getPaymentProviderStatus()).toMatchObject({ configured: true, checkoutKey: "checkout_public_example", checkoutScriptUrl: "https://secure.networkmerchants.com/token/CollectCheckout.js" });
  });
});
