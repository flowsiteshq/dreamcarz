type StripeIdentitySession = {
  id: string;
  client_secret: string;
  status: string;
};

export function getIdentityProviderStatus() {
  const enabled = process.env.STRIPE_IDENTITY_ENABLED === "true";
  const returnUrl = process.env.STRIPE_IDENTITY_RETURN_URL;
  const configured = enabled && Boolean(process.env.STRIPE_SECRET_KEY) && Boolean(returnUrl?.startsWith("https://"));
  return {
    provider: "stripe_identity" as const,
    enabled,
    configured,
    mode: configured ? "ready" as const : "manual_review" as const,
  };
}

export async function createStripeIdentityVerificationSession(input: {
  transactionReference: string;
  userId: number;
  returnUrl: string;
}) {
  const provider = getIdentityProviderStatus();
  if (!provider.configured) {
    return { configured: false as const, provider };
  }

  const form = new URLSearchParams({
    type: "document",
    "options[document][require_matching_selfie]": "true",
    return_url: input.returnUrl,
    "metadata[transaction_reference]": input.transactionReference,
    "metadata[dreamcarz_user_id]": String(input.userId),
  });
  const response = await fetch("https://api.stripe.com/v1/identity/verification_sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": `dreamcarz-identity-${input.transactionReference}`,
    },
    body: form.toString(),
  });
  if (!response.ok) {
    throw new Error("DreamCarz could not create the identity-verification session. Please use manual review or try again later.");
  }
  const session = await response.json() as StripeIdentitySession;
  if (!session.id || !session.client_secret) {
    throw new Error("The identity provider returned an incomplete verification session.");
  }
  return {
    configured: true as const,
    provider,
    sessionId: session.id,
    clientSecret: session.client_secret,
    status: session.status,
  };
}
