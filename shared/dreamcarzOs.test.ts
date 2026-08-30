import { describe, expect, it } from "vitest";
import { summarizeWalletLedger } from "./dreamcarzOs";

describe("summarizeWalletLedger", () => {
  it("shows only posted credits and debits as available value while tracking holds separately", () => {
    expect(summarizeWalletLedger([
      { entryType: "membership_credit", status: "posted", amountCents: 1500 },
      { entryType: "debit", status: "posted", amountCents: 500 },
      { entryType: "deposit_hold", status: "posted", amountCents: 20000 },
      { entryType: "refund", status: "pending", amountCents: 700 },
    ])).toEqual({ availableCreditCents: 1000, activeHoldCents: 20000 });
  });
});
