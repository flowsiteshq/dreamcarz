import Stripe from "stripe";

export function getPaymentProviderStatus() {
  const enabled = process.env.STRIPE_PAYMENTS_ENABLED === "true";
  const returnUrl = process.env.STRIPE_PAYMENT_RETURN_URL;
  const configured = enabled && Boolean(process.env.STRIPE_SECRET_KEY) && Boolean(returnUrl?.startsWith("https://"));
  return { provider: "stripe_checkout" as const, enabled, configured, mode: configured ? "ready" as const : "manual_review" as const };
}

export async function createStripePaymentMethodSetup(input: {
  transactionReference: string;
  customerId?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  successUrl: string;
  cancelUrl: string;
}) {
  const provider = getPaymentProviderStatus();
  if (!provider.configured) return { configured: false as const, provider };
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const customerId = input.customerId ?? (await stripe.customers.create({
    email: input.customerEmail ?? undefined,
    name: input.customerName ?? undefined,
    metadata: { dreamcarz_transaction_reference: input.transactionReference },
  }, { idempotencyKey: `dreamcarz-customer-${input.transactionReference}` })).id;
  const session = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    payment_method_types: ["card"],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: { dreamcarz_transaction_reference: input.transactionReference },
  }, { idempotencyKey: `dreamcarz-payment-setup-${input.transactionReference}` });
  if (!session.url) throw new Error("The payment provider returned an incomplete checkout session.");
  return { configured: true as const, provider, customerId, checkoutSessionId: session.id, url: session.url };
}
