import crypto from "node:crypto";
import express, { type Express } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { associateEnrollmentEvents, associateEnrollments, transactionEvents, vehicleTransactions } from "../drizzle/schema";

type CoCardWebhookPayload = {
  event_id?: unknown;
  event_type?: unknown;
  event_body?: {
    transaction_id?: unknown;
    transaction_type?: unknown;
    condition?: unknown;
    order_id?: unknown;
    customer_vault_id?: unknown;
    authorization_code?: unknown;
    subscription_id?: unknown;
  };
};

function stringField(value: unknown, maxLength = 160) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim().slice(0, maxLength) : null;
}

/** Verifies CoCard's documented `nonce,signature` HMAC-SHA256 header. */
export function verifyCoCardWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined, signingKey: string | undefined) {
  if (!signatureHeader || !signingKey) return false;
  const separator = signatureHeader.lastIndexOf(",");
  if (separator < 1 || separator === signatureHeader.length - 1) return false;
  const nonce = signatureHeader.slice(0, separator);
  const received = signatureHeader.slice(separator + 1).trim().toLowerCase();
  const expected = crypto.createHmac("sha256", signingKey).update(`${nonce}${rawBody.toString("utf8")}`).digest("hex");
  if (received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(received, "utf8"), Buffer.from(expected, "utf8"));
}

function paymentOutcome(eventType: string) {
  if (eventType === "transaction.auth.success") return { paymentStatus: "authorized" as const, status: "agreement_pending" as const, currentStep: "review" };
  if (eventType === "transaction.sale.success" || eventType === "transaction.capture.success") return { paymentStatus: "paid" as const, status: "agreement_pending" as const, currentStep: "review" };
  if (eventType.endsWith(".failed")) return { paymentStatus: "failed" as const, status: "payment_pending" as const, currentStep: "payment" };
  if (eventType === "transaction.void.success" || eventType === "transaction.refund.success" || eventType.includes("chargeback")) return { paymentStatus: "manual_review" as const, status: "manual_review" as const, currentStep: "payment" };
  return null;
}

export function associateSubscriptionOutcome(eventType: string) {
  const normalized = eventType.toLowerCase();
  if (!normalized.includes("subscription") && !normalized.includes("recurring")) return null;
  if (normalized.includes("cancel") || normalized.includes("delete")) return "cancelled" as const;
  if (normalized.includes("fail") || normalized.includes("declin") || normalized.includes("past_due")) return "past_due" as const;
  if (normalized.includes("success") || normalized.includes("paid") || normalized.includes("renew")) return "active" as const;
  return null;
}

function isAssociateEnrollmentReference(value: string | null) {
  return Boolean(value && /^DCA-\d{4}-[A-Z0-9]{10}$/.test(value));
}

export function registerCoCardWebhook(app: Express) {
  app.post("/api/cocard/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const signingKey = process.env.COCARD_WEBHOOK_SIGNING_KEY;
    const signature = req.headers["webhook-signature"];
    if (!signingKey || typeof signature !== "string") return res.status(503).json({ received: false, code: "cocard_webhook_not_configured" });
    if (!Buffer.isBuffer(req.body) || !verifyCoCardWebhookSignature(req.body, signature, signingKey)) {
      return res.status(400).json({ received: false, code: "invalid_cocard_signature" });
    }

    let payload: CoCardWebhookPayload;
    try {
      payload = JSON.parse(req.body.toString("utf8")) as CoCardWebhookPayload;
    } catch {
      return res.status(400).json({ received: false, code: "invalid_cocard_payload" });
    }
    const eventId = stringField(payload.event_id);
    const eventType = stringField(payload.event_type, 96);
    const reference = stringField(payload.event_body?.order_id, 32);
    const outcome = eventType ? paymentOutcome(eventType) : null;
    const associateOutcome = eventType ? associateSubscriptionOutcome(eventType) : null;
    if (!eventId || !eventType || !reference || (!outcome && !associateOutcome)) return res.status(200).json({ received: true, ignored: true });

    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ received: false, code: "database_unavailable" });
      const providerEventId = `cocard:${eventId}`;
      const duplicate = await db.select({ id: transactionEvents.id }).from(transactionEvents).where(eq(transactionEvents.providerEventId, providerEventId)).limit(1);
      if (duplicate[0]) return res.status(200).json({ received: true, duplicate: true });
      if (associateOutcome && isAssociateEnrollmentReference(reference)) {
        const enrollment = (await db.select().from(associateEnrollments).where(eq(associateEnrollments.reference, reference)).limit(1))[0];
        if (!enrollment) return res.status(200).json({ received: true, unmatched: true });
        const existingEvent = (await db.select({ id: associateEnrollmentEvents.id }).from(associateEnrollmentEvents).where(eq(associateEnrollmentEvents.providerReference, providerEventId)).limit(1))[0];
        if (existingEvent) return res.status(200).json({ received: true, duplicate: true });
        const subscriptionId = stringField(payload.event_body?.subscription_id);
        const nextBillingAt = associateOutcome === "active" ? new Date(Date.now() + 30 * 24 * 60 * 60_000) : enrollment.nextBillingAt;
        await db.update(associateEnrollments).set({
          status: associateOutcome,
          gatewaySubscriptionId: subscriptionId ?? enrollment.gatewaySubscriptionId,
          nextBillingAt,
          cancelledAt: associateOutcome === "cancelled" ? new Date() : enrollment.cancelledAt,
          providerVerifiedAt: new Date(),
          manualReviewReason: associateOutcome === "past_due" ? "Provider reported a recurring payment issue." : null,
        }).where(eq(associateEnrollments.id, enrollment.id));
        await db.insert(associateEnrollmentEvents).values({
          enrollmentId: enrollment.id,
          userId: enrollment.userId,
          eventType: associateOutcome === "active" ? "subscription_created" : associateOutcome === "past_due" ? "past_due" : "cancelled",
          providerReference: providerEventId,
          detail: `Provider subscription event: ${eventType}.`,
        });
        return res.status(200).json({ received: true, associateStatus: associateOutcome });
      }
      if (!outcome) return res.status(200).json({ received: true, ignored: true });
      const transactions = await db.select().from(vehicleTransactions).where(eq(vehicleTransactions.reference, reference)).limit(1);
      const transaction = transactions[0];
      if (!transaction) return res.status(200).json({ received: true, unmatched: true });

      const transactionId = stringField(payload.event_body?.transaction_id);
      const authorizationId = stringField(payload.event_body?.authorization_code);
      const vaultId = stringField(payload.event_body?.customer_vault_id);
      await db.update(vehicleTransactions).set({
        paymentProvider: "cocard_gateway",
        paymentProviderTransactionId: transactionId,
        paymentProviderAuthorizationId: authorizationId,
        paymentProviderCustomerVaultId: vaultId,
        paymentStatus: outcome.paymentStatus,
        status: outcome.status,
        currentStep: outcome.currentStep,
      }).where(eq(vehicleTransactions.id, transaction.id));
      await db.insert(transactionEvents).values({
        transactionId: transaction.id,
        actorType: "provider",
        eventType,
        fromStatus: transaction.status,
        toStatus: outcome.status,
        providerEventId,
        metadata: JSON.stringify({ provider: "cocard_gateway", gatewayTransactionId: transactionId, outcome: outcome.paymentStatus }),
      });
      return res.status(200).json({ received: true });
    } catch (error) {
      console.error("CoCard webhook processing error", error instanceof Error ? error.message : "unknown error");
      return res.status(500).json({ received: false, code: "webhook_processing_error" });
    }
  });
}
