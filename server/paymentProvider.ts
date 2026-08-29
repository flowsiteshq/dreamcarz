export type CoCardPaymentProviderStatus = {
  provider: "cocard_gateway";
  enabled: boolean;
  configured: boolean;
  checkoutKey?: string;
  checkoutScriptUrl: string;
  mode: "manual_review" | "documentation_required" | "ready";
};

export type CoCardCheckoutVerification = {
  verified: boolean;
  paymentStatus: "authorized" | "paid" | "failed" | "pending";
  gatewayTransactionId?: string;
  customerVaultId?: string;
  authorizationCode?: string;
};

function readXmlTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, "i"));
  return match?.[1]?.trim() || undefined;
}

export function interpretCoCardQueryResponse(xml: string, expectedTransactionId: string): CoCardCheckoutVerification {
  const gatewayTransactionId = readXmlTag(xml, "transaction_id");
  if (!gatewayTransactionId || gatewayTransactionId !== expectedTransactionId) return { verified: false, paymentStatus: "pending" };
  const action = readXmlTag(xml, "action")?.toLowerCase();
  const condition = readXmlTag(xml, "condition")?.toLowerCase();
  const customerVaultId = readXmlTag(xml, "customer_vault_id");
  const authorizationCode = readXmlTag(xml, "authorization_code");

  if (condition === "pending" && action === "auth") {
    return { verified: true, paymentStatus: "authorized", gatewayTransactionId, customerVaultId, authorizationCode };
  }
  if (condition === "complete" && ["sale", "capture"].includes(action || "")) {
    return { verified: true, paymentStatus: "paid", gatewayTransactionId, customerVaultId, authorizationCode };
  }
  if (["failed", "abandoned", "canceled", "unknown"].includes(condition || "")) {
    return { verified: true, paymentStatus: "failed", gatewayTransactionId, customerVaultId, authorizationCode };
  }
  return { verified: false, paymentStatus: "pending" };
}

/**
 * Performs a read-only CoCard Query API lookup. This never creates, captures,
 * refunds, or otherwise changes a gateway transaction.
 */
export async function verifyCoCardCheckoutReturn(gatewayTransactionId: string): Promise<CoCardCheckoutVerification> {
  const securityKey = process.env.COCARD_QUERY_SECURITY_KEY;
  if (!securityKey) return { verified: false, paymentStatus: "pending" };
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 12_000);
  try {
    const response = await fetch("https://secure.cocardgateway.com/api/query.php", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ security_key: securityKey, transaction_id: gatewayTransactionId }),
      signal: abortController.signal,
    });
    if (!response.ok) return { verified: false, paymentStatus: "pending" };
    return interpretCoCardQueryResponse(await response.text(), gatewayTransactionId);
  } catch {
    return { verified: false, paymentStatus: "pending" };
  } finally {
    clearTimeout(timeout);
  }
}

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
  const querySecurityKey = process.env.COCARD_QUERY_SECURITY_KEY;
  const configured = enabled && gatewayIntegrationApproved && Boolean(checkoutKey) && Boolean(querySecurityKey);
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
  return "CoCard Collect Checkout is not configured. DreamCarz cannot collect payment data or create an authorization until the approved checkout key, server-side Query API verification key, and merchant gateway configuration are in place.";
}
