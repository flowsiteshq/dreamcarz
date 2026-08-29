import express, { type Express } from "express";
import Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { customerProfiles, transactionEvents, vehicleTransactions } from "../drizzle/schema";

const identityEvents = new Set([
  "identity.verification_session.verified",
  "identity.verification_session.requires_input",
  "identity.verification_session.redacted",
]);

export function registerStripeWebhook(app: Express) {
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const signature = req.headers["stripe-signature"];
    if (!signingSecret || !secretKey || typeof signature !== "string") {
      return res.status(503).json({ received: false, code: "stripe_webhook_not_configured" });
    }

    let event: Stripe.Event;
    let stripe: Stripe;
    try {
      stripe = new Stripe(secretKey);
      event = stripe.webhooks.constructEvent(req.body, signature, signingSecret);
    } catch {
      return res.status(400).json({ received: false, code: "invalid_stripe_signature" });
    }
    if (!identityEvents.has(event.type)) {
      return res.status(200).json({ received: true, ignored: true });
    }

    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ received: false, code: "database_unavailable" });
      const priorEvents = await db.select({ id: transactionEvents.id })
        .from(transactionEvents)
        .where(eq(transactionEvents.providerEventId, event.id))
        .limit(1);
      if (priorEvents[0]) return res.status(200).json({ received: true, duplicate: true });

      if (identityEvents.has(event.type)) {
        const session = event.data.object as Stripe.Identity.VerificationSession;
        const transactions = await db.select().from(vehicleTransactions)
          .where(and(eq(vehicleTransactions.identityProvider, "stripe_identity"), eq(vehicleTransactions.identitySessionId, session.id)))
          .limit(1);
        const transaction = transactions[0];
        if (!transaction) return res.status(200).json({ received: true, unmatched: true });

        const verified = event.type === "identity.verification_session.verified";
        const redacted = event.type === "identity.verification_session.redacted";
        const nextStatus = verified ? "eligibility_review" as const : "manual_review" as const;
        const identityStatus = verified ? "verified" as const : redacted ? "redacted" as const : "requires_input" as const;
        const licenseStatus = verified ? "verified" as const : "manual_review" as const;
        await db.update(vehicleTransactions).set({ status: nextStatus, currentStep: verified ? "eligibility" : "identity", identityStatus, licenseStatus }).where(eq(vehicleTransactions.id, transaction.id));
        await db.update(customerProfiles).set({ profileStatus: verified ? "verified" : "manual_review", identityStatus, licenseStatus, identityProvider: "stripe_identity", identityProviderSessionId: session.id }).where(eq(customerProfiles.userId, transaction.userId));
        await db.insert(transactionEvents).values({
          transactionId: transaction.id,
          actorType: "provider",
          eventType: event.type,
          fromStatus: transaction.status,
          toStatus: nextStatus,
          providerEventId: event.id,
          metadata: JSON.stringify({ provider: "stripe_identity", sessionId: session.id, outcome: verified ? "verified" : redacted ? "redacted" : "requires_input" }),
        });
        return res.status(200).json({ received: true });
      }

    } catch (error) {
      console.error("Stripe webhook processing error", error instanceof Error ? error.message : "unknown error");
      return res.status(500).json({ received: false, code: "webhook_processing_error" });
    }
  });
}
