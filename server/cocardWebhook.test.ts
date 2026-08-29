import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyCoCardWebhookSignature } from "./cocardWebhook";

describe("CoCard webhook signature verification", () => {
  const signingKey = "test-cocard-signing-key";
  const body = Buffer.from('{"event_id":"evt-123","event_type":"transaction.auth.success"}', "utf8");
  const nonce = "1712345678";
  const signature = crypto.createHmac("sha256", signingKey).update(`${nonce}${body.toString("utf8")}`).digest("hex");

  it("accepts the documented nonce-and-HMAC-SHA256 signature format", () => {
    expect(verifyCoCardWebhookSignature(body, `${nonce},${signature}`, signingKey)).toBe(true);
  });

  it("rejects a modified body, malformed header, or missing signing key", () => {
    expect(verifyCoCardWebhookSignature(Buffer.from("{}"), `${nonce},${signature}`, signingKey)).toBe(false);
    expect(verifyCoCardWebhookSignature(body, signature, signingKey)).toBe(false);
    expect(verifyCoCardWebhookSignature(body, `${nonce},${signature}`, undefined)).toBe(false);
  });
});
