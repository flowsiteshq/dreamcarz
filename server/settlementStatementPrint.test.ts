import { describe, expect, it } from "vitest";
import { buildSettlementPrintHtml } from "../client/src/components/SettlementStatementPanel";

describe("buildSettlementPrintHtml", () => {
  it("labels the print view as non-collecting and escapes member-entered settlement text", () => {
    const html = buildSettlementPrintHtml({
      vehicleName: "2024 Chevrolet Malibu · Gray",
      status: "settled",
      currency: "USD",
      approvedSubtotalCents: 1200,
      depositAppliedCents: 0,
      adjustmentsCents: 1200,
      finalAmountCents: 1200,
      summary: "<script>unsafe</script>",
      finalizedAt: "2026-08-30T00:00:00.000Z",
      adjustments: [{ adjustmentType: "toll", description: "<img src=x>", amountCents: 1200, status: "approved", reviewedAt: "2026-08-30T00:00:00.000Z" }],
    });
    expect(html).toContain("not a receipt of payment");
    expect(html).toContain("an authorization to charge");
    expect(html).toContain("&lt;script&gt;unsafe&lt;/script&gt;");
    expect(html).not.toContain("<script>unsafe</script>");
    expect(html).not.toContain("<img src=x>");
  });
});
