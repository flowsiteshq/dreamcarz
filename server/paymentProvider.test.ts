import { afterEach, describe, expect, it } from "vitest";
import { cocardPaymentSetupBlocker, getPaymentProviderStatus, interpretCoCardQueryResponse } from "./paymentProvider";

const originalEnabled = process.env.COCARD_PAYMENTS_ENABLED;
const originalApproved = process.env.COCARD_INTEGRATION_APPROVED;
const originalCheckoutKey = process.env.VITE_COCARD_CHECKOUT_KEY;
const originalQuerySecurityKey = process.env.COCARD_QUERY_SECURITY_KEY;

afterEach(() => {
  process.env.COCARD_PAYMENTS_ENABLED = originalEnabled;
  process.env.COCARD_INTEGRATION_APPROVED = originalApproved;
  process.env.VITE_COCARD_CHECKOUT_KEY = originalCheckoutKey;
  process.env.COCARD_QUERY_SECURITY_KEY = originalQuerySecurityKey;
});

describe("CoCard payment provider configuration", () => {
  it("does not expose a CoCard payment flow until deliberately enabled", () => {
    process.env.COCARD_PAYMENTS_ENABLED = "false";
    process.env.VITE_COCARD_CHECKOUT_KEY = "checkout_public_example";
    process.env.COCARD_QUERY_SECURITY_KEY = "query-key";
    process.env.COCARD_INTEGRATION_APPROVED = "true";

    expect(getPaymentProviderStatus()).toMatchObject({ provider: "cocard_gateway", enabled: false, configured: false, mode: "manual_review" });
    expect(getPaymentProviderStatus().checkoutKey).toBeUndefined();
  });

  it("requires merchant-approved hosted-payment configuration before payment setup can be enabled", () => {
    process.env.COCARD_PAYMENTS_ENABLED = "true";
    process.env.VITE_COCARD_CHECKOUT_KEY = "checkout_public_example";
    process.env.COCARD_QUERY_SECURITY_KEY = "query-key";
    process.env.COCARD_INTEGRATION_APPROVED = "false";

    expect(getPaymentProviderStatus().configured).toBe(false);
    expect(getPaymentProviderStatus().mode).toBe("documentation_required");
    expect(cocardPaymentSetupBlocker()).toContain("cannot collect payment data");
  });

  it("requires a public checkout key and server-side Query API key before exposing a hosted checkout handoff", () => {
    process.env.COCARD_PAYMENTS_ENABLED = "true";
    process.env.COCARD_INTEGRATION_APPROVED = "true";
    delete process.env.VITE_COCARD_CHECKOUT_KEY;
    delete process.env.COCARD_QUERY_SECURITY_KEY;
    expect(getPaymentProviderStatus().configured).toBe(false);

    process.env.VITE_COCARD_CHECKOUT_KEY = "checkout_public_example";
    process.env.COCARD_QUERY_SECURITY_KEY = "query-key";
    expect(getPaymentProviderStatus()).toMatchObject({ configured: true, checkoutKey: "checkout_public_example", checkoutScriptUrl: "https://secure.networkmerchants.com/token/CollectCheckout.js" });
  });

  it("accepts only a matching gateway transaction with an approved authorization result", () => {
    const xml = "<nm_response><transaction><transaction_id>12345</transaction_id><action>auth</action><condition>pending</condition><customer_vault_id>vault_12</customer_vault_id><authorization_code>auth_3</authorization_code></transaction></nm_response>";
    expect(interpretCoCardQueryResponse(xml, "12345")).toMatchObject({ verified: true, paymentStatus: "authorized", customerVaultId: "vault_12" });
    expect(interpretCoCardQueryResponse(xml, "different")).toMatchObject({ verified: false, paymentStatus: "pending" });
  });
});
