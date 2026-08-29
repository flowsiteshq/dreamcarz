export type CoCardPaymentProviderStatus = {
  provider: "cocard_gateway";
  enabled: boolean;
  configured: boolean;
  checkoutKey?: string;
  checkoutScriptUrl: string;
  mode: "manual_review" | "documentation_required" | "ready";
};

/**
 * CoCard Collect Checkout keeps customer card entry on the gateway page.
 * DreamCarz only exposes its public checkout key after the merchant has
 * intentionally configured a signed gateway callback; this module never
 * accepts, logs, or stores payment card data.
 */
export function getPaymentProviderStatus(): CoCardPaymentProviderStatus {
  const enabled = process.env.COCARD_PAYMENTS_ENABLED === "true";
  const gatewayIntegrationApproved = process.env.COCARD_INTEGRATION_APPROVED === "true";
  const checkoutKey = process.env.VITE_COCARD_CHECKOUT_KEY;
  const webhookSigningKey = process.env.COCARD_WEBHOOK_SIGNING_KEY;
  const configured = enabled && gatewayIntegrationApproved && Boolean(checkoutKey) && Boolean(webhookSigningKey);
  return {
    provider: "cocard_gateway",
    enabled,
    configured,
    checkoutKey: configured ? checkoutKey : undefined,
    checkoutScriptUrl: "https://secure.networkmerchants.com/token/CollectCheckout.js",
    mode: configured ? "ready" : enabled ? "documentation_required" : "manual_review",
  };
}

export function cocardPaymentSetupBlocker() {
  const provider = getPaymentProviderStatus();
  if (provider.configured) return null;
  return "CoCard Collect Checkout is not configured. DreamCarz cannot collect payment data or create an authorization until the approved checkout key, signed webhook, and merchant gateway configuration are in place.";
}
