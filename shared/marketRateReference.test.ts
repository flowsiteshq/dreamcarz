import { describe, expect, it } from "vitest";
import { formatPricelineDailyBenchmark, formatUsdFromCents, getBwiMarketRentalEstimate, PRICELINE_DAILY_MARKET_BENCHMARKS } from "./marketRateReference";

describe("BWI market rental reference", () => {
  it("calculates the recorded seven-day Ford Fusion comparison without presenting it as a final DreamCarz quote", () => {
    expect(getBwiMarketRentalEstimate("2024-ford-fusion-gray", 7)).toMatchObject({
      pickupMarket: "BWI",
      capturedOn: "2026-09-04",
      dailyLowCents: 6233,
      totalLowCents: 43631,
      isRange: false,
      comparator: "mid-size car",
    });
    expect(formatUsdFromCents(43631)).toBe("$436.31");
  });

  it("keeps the Traverse comparison as a range because the snapshot was not an exact vehicle match", () => {
    expect(getBwiMarketRentalEstimate("2022-chevrolet-traverse-white", 7)).toMatchObject({
      dailyLowCents: 6566,
      dailyHighCents: 9133,
      totalLowCents: 45962,
      totalHighCents: 63931,
      isRange: true,
    });
  });
});

describe("Priceline daily market benchmarks", () => {
  it("keeps BWI and DCA comparisons transparent without collapsing the unmatched Traverse range", () => {
    expect(formatPricelineDailyBenchmark(PRICELINE_DAILY_MARKET_BENCHMARKS["2024-ford-fusion-gray"], "BWI")).toBe("$62.33/day");
    expect(formatPricelineDailyBenchmark(PRICELINE_DAILY_MARKET_BENCHMARKS["2020-chevrolet-equinox-gray"], "DCA")).toBe("$64.66/day");
    expect(formatPricelineDailyBenchmark(PRICELINE_DAILY_MARKET_BENCHMARKS["2022-chevrolet-traverse-white"], "BWI")).toBe("$65.66–$91.33/day");
    expect(formatPricelineDailyBenchmark(PRICELINE_DAILY_MARKET_BENCHMARKS["2022-chevrolet-traverse-white"], "DCA")).toBe("Not recorded");
  });
});
