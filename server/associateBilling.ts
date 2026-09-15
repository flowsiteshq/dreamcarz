export const ASSOCIATE_ENROLLMENT_SKU = "DREAMCARZ-ASSOCIATE-ENROLLMENT-149";
export const ASSOCIATE_ENROLLMENT_FEE_CENTS = 14_900;
export const ASSOCIATE_MONTHLY_FEE_CENTS = 4_900;

type GatewayResult = {
  response?: string;
  responsetext?: string;
  subscription_id?: string;
};

function paymentSecurityKey() {
  return process.env.COCARD_RECURRING_SECURITY_KEY || process.env.COCARD_QUERY_SECURITY_KEY || null;
}

function parseGatewayResult(payload: string): GatewayResult {
  return Object.fromEntries(new URLSearchParams(payload).entries()) as GatewayResult;
}

async function postGateway(params: Record<string, string>) {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 12_000);
  try {
    const response = await fetch("https://secure.cocardgateway.com/api/transact.php", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
      signal: abortController.signal,
    });
    if (!response.ok) return null;
    return parseGatewayResult(await response.text());
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Ensures the one-time enrollment item exists before provider-hosted checkout opens. */
export async function ensureAssociateEnrollmentProduct() {
  const securityKey = paymentSecurityKey();
  if (!securityKey) return { ready: false as const, reason: "Associate payment configuration is unavailable." };
  const result = await postGateway({
    security_key: securityKey,
    products: "add_product",
    product_sku: ASSOCIATE_ENROLLMENT_SKU,
    product_description: "DreamCarz Associate enrollment",
    product_cost: (ASSOCIATE_ENROLLMENT_FEE_CENTS / 100).toFixed(2),
    product_currency: "USD",
  });
  const text = result?.responsetext?.toLowerCase() ?? "";
  if (result?.response === "1" || /already.*(?:sku|product)|(?:sku|product).*already/.test(text)) {
    return { ready: true as const, sku: ASSOCIATE_ENROLLMENT_SKU };
  }
  return { ready: false as const, reason: "Associate checkout is awaiting gateway product setup." };
}

/**
 * Creates an ongoing $49/month subscription after the $149 hosted checkout is
 * verified. The source transaction is an opaque provider reference; no card
 * data is handled by DreamCarz.
 */
export async function createAssociateMonthlySubscription(input: { enrollmentReference: string; gatewayTransactionId: string; customerVaultId?: string }) {
  const securityKey = paymentSecurityKey();
  if (!securityKey) return { created: false as const, reason: "Recurring billing configuration is unavailable." };
  const firstRenewal = new Date();
  firstRenewal.setMonth(firstRenewal.getMonth() + 1);
  const startDate = `${firstRenewal.getUTCFullYear()}${String(firstRenewal.getUTCMonth() + 1).padStart(2, "0")}${String(firstRenewal.getUTCDate()).padStart(2, "0")}`;
  const result = await postGateway({
    security_key: securityKey,
    recurring: "add_subscription",
    payment: "creditcard",
    plan_payments: "0",
    plan_amount: (ASSOCIATE_MONTHLY_FEE_CENTS / 100).toFixed(2),
    month_frequency: "1",
    day_of_month: String(firstRenewal.getUTCDate()),
    start_date: startDate,
    source_transaction_id: input.gatewayTransactionId,
    ...(input.customerVaultId ? { customer_vault_id: input.customerVaultId } : {}),
    orderid: input.enrollmentReference,
    order_description: "DreamCarz Associate monthly subscription",
    customer_receipt: "true",
  });
  if (result?.response !== "1" || !result.subscription_id) {
    return { created: false as const, reason: "Recurring subscription could not be verified." };
  }
  return { created: true as const, subscriptionId: result.subscription_id, firstRenewal };
}
