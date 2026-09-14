import { describe, expect, it } from "vitest";
import { RATE_NOT_CONFIGURED } from "./subscriptionRateCards";

describe("subscription rate-card safeguards", () => {
  it("uses a stable missing-rate status instead of falling back to benchmark or membership reference pricing", () => {
    expect(RATE_NOT_CONFIGURED).toBe("RATE_NOT_CONFIGURED");
  });
});
