import { type ApprovedTransactionVehicleId } from "./transactionLifecycle";

export type MarketRentalEstimate = {
  vehicleId: ApprovedTransactionVehicleId;
  pickupMarket: "BWI";
  capturedOn: "2026-09-04";
  days: number;
  dailyLowCents: number;
  dailyHighCents: number;
  totalLowCents: number;
  totalHighCents: number;
  isRange: boolean;
  comparator: string;
};

type MarketRateReference = {
  dailyLowCents: number;
  dailyHighCents?: number;
  comparator: string;
};

export type PricelineDailyMarketBenchmark = {
  vehicleId: ApprovedTransactionVehicleId;
  comparator: string;
  bwiDailyLowCents: number;
  bwiDailyHighCents?: number;
  dcaDailyLowCents: number | null;
  dcaDailyHighCents?: number | null;
};

// BWI Priceline comparable-rental snapshot, captured September 4, 2026.
// This is a market estimate only—not a DreamCarz rate card, reservation quote,
// deposit, tax, fee, availability, or payment authorization.
export const BWI_MARKET_RATE_REFERENCE: Record<ApprovedTransactionVehicleId, MarketRateReference> = {
  "2024-chevrolet-malibu-gray": { dailyLowCents: 6333, comparator: "full-size car" },
  "2019-chevrolet-malibu-black": { dailyLowCents: 6333, comparator: "full-size car" },
  "2024-ford-fusion-gray": { dailyLowCents: 6233, comparator: "mid-size car" },
  "2015-ford-taurus-gray": { dailyLowCents: 6333, comparator: "full-size car" },
  "2020-chevrolet-equinox-gray": { dailyLowCents: 6566, comparator: "mid-size SUV" },
  "2020-chevrolet-equinox-black": { dailyLowCents: 6566, comparator: "mid-size SUV" },
  "2022-chevrolet-traverse-white": { dailyLowCents: 6566, dailyHighCents: 9133, comparator: "SUV comparison range" },
  "2020-chevrolet-traverse-gray": { dailyLowCents: 6566, dailyHighCents: 9133, comparator: "SUV comparison range" },
  "2022-chevrolet-traverse-white-unit-2": { dailyLowCents: 6566, dailyHighCents: 9133, comparator: "SUV comparison range" },
  "2017-ford-fusion-silver": { dailyLowCents: 6233, comparator: "mid-size car" },
  "2020-chevrolet-traverse-silver-unit-2": { dailyLowCents: 6566, dailyHighCents: 9133, comparator: "SUV comparison range" },
  "2017-buick-lacrosse-white": { dailyLowCents: 6333, comparator: "full-size car" },
  "2021-nissan-rogue-white": { dailyLowCents: 6566, comparator: "mid-size SUV" },
  "2017-gmc-acadia-silver": { dailyLowCents: 6566, comparator: "mid-size SUV" },
  "2020-buick-enclave-black": { dailyLowCents: 6566, dailyHighCents: 9133, comparator: "SUV comparison range" },
  "2017-chevrolet-tahoe-gray": { dailyLowCents: 9133, comparator: "seven-passenger SUV" },
  "2019-chevrolet-impala-silver": { dailyLowCents: 6333, comparator: "full-size car" },
};

/**
 * Priceline comparable-rental snapshot captured September 4, 2026 for Sep. 18–21.
 * It is a transparent market benchmark only, not a DreamCarz rate card, subscription
 * quote, availability statement, tax, fee, deposit, protection product, or charge.
 */
export const PRICELINE_DAILY_MARKET_BENCHMARKS: Record<ApprovedTransactionVehicleId, PricelineDailyMarketBenchmark> = {
  "2024-chevrolet-malibu-gray": { vehicleId: "2024-chevrolet-malibu-gray", comparator: "Toyota Camry or similar · full-size car", bwiDailyLowCents: 6333, dcaDailyLowCents: 6333 },
  "2019-chevrolet-malibu-black": { vehicleId: "2019-chevrolet-malibu-black", comparator: "Toyota Camry or similar · full-size car", bwiDailyLowCents: 6333, dcaDailyLowCents: 6333 },
  "2024-ford-fusion-gray": { vehicleId: "2024-ford-fusion-gray", comparator: "Toyota Corolla or similar · mid-size car", bwiDailyLowCents: 6233, dcaDailyLowCents: 6233 },
  "2015-ford-taurus-gray": { vehicleId: "2015-ford-taurus-gray", comparator: "Toyota Camry or similar · full-size car", bwiDailyLowCents: 6333, dcaDailyLowCents: 6333 },
  "2020-chevrolet-equinox-gray": { vehicleId: "2020-chevrolet-equinox-gray", comparator: "Mazda CX-50 or similar · mid-size SUV", bwiDailyLowCents: 6566, dcaDailyLowCents: 6466 },
  "2020-chevrolet-equinox-black": { vehicleId: "2020-chevrolet-equinox-black", comparator: "Mazda CX-50 or similar · mid-size SUV", bwiDailyLowCents: 6566, dcaDailyLowCents: 6466 },
  "2022-chevrolet-traverse-white": { vehicleId: "2022-chevrolet-traverse-white", comparator: "SUV comparison range · mid-size SUV to seven-passenger SUV", bwiDailyLowCents: 6566, bwiDailyHighCents: 9133, dcaDailyLowCents: null },
  "2020-chevrolet-traverse-gray": { vehicleId: "2020-chevrolet-traverse-gray", comparator: "SUV comparison range · mid-size SUV to seven-passenger SUV", bwiDailyLowCents: 6566, bwiDailyHighCents: 9133, dcaDailyLowCents: null },
  "2022-chevrolet-traverse-white-unit-2": { vehicleId: "2022-chevrolet-traverse-white-unit-2", comparator: "SUV comparison range · mid-size SUV to seven-passenger SUV", bwiDailyLowCents: 6566, bwiDailyHighCents: 9133, dcaDailyLowCents: null },
  "2017-ford-fusion-silver": { vehicleId: "2017-ford-fusion-silver", comparator: "Toyota Corolla or similar · mid-size car", bwiDailyLowCents: 6233, dcaDailyLowCents: 6233 },
  "2020-chevrolet-traverse-silver-unit-2": { vehicleId: "2020-chevrolet-traverse-silver-unit-2", comparator: "SUV comparison range · mid-size SUV to seven-passenger SUV", bwiDailyLowCents: 6566, bwiDailyHighCents: 9133, dcaDailyLowCents: null },
  "2017-buick-lacrosse-white": { vehicleId: "2017-buick-lacrosse-white", comparator: "Toyota Camry or similar · full-size car", bwiDailyLowCents: 6333, dcaDailyLowCents: 6333 },
  "2021-nissan-rogue-white": { vehicleId: "2021-nissan-rogue-white", comparator: "Mazda CX-50 or similar · mid-size SUV", bwiDailyLowCents: 6566, dcaDailyLowCents: 6466 },
  "2017-gmc-acadia-silver": { vehicleId: "2017-gmc-acadia-silver", comparator: "Mazda CX-50 or similar · mid-size SUV", bwiDailyLowCents: 6566, dcaDailyLowCents: 6466 },
  "2020-buick-enclave-black": { vehicleId: "2020-buick-enclave-black", comparator: "SUV comparison range · mid-size SUV to seven-passenger SUV", bwiDailyLowCents: 6566, bwiDailyHighCents: 9133, dcaDailyLowCents: null },
  "2017-chevrolet-tahoe-gray": { vehicleId: "2017-chevrolet-tahoe-gray", comparator: "seven-passenger SUV", bwiDailyLowCents: 9133, dcaDailyLowCents: null },
  "2019-chevrolet-impala-silver": { vehicleId: "2019-chevrolet-impala-silver", comparator: "Toyota Camry or similar · full-size car", bwiDailyLowCents: 6333, dcaDailyLowCents: 6333 },
};

export const PRICELINE_MARKET_SNAPSHOT = {
  capturedOn: "2026-09-04",
  rentalWindow: "September 18–21, 2026",
  bwiSource: "https://www.priceline.com/rentalcars/listings/BWI/BWI/20260918-12:00/20260921-12:00/list",
  dcaSource: "https://www.priceline.com/rentalcars/listings/DCA/DCA/20260918-12:00/20260921-12:00/list",
} as const;

export function formatPricelineDailyBenchmark(benchmark: PricelineDailyMarketBenchmark, market: "BWI" | "DCA") {
  const lowCents = market === "BWI" ? benchmark.bwiDailyLowCents : benchmark.dcaDailyLowCents;
  const highCents = market === "BWI" ? benchmark.bwiDailyHighCents : benchmark.dcaDailyHighCents;
  if (lowCents === null) return "Not recorded";
  if (typeof highCents === "number" && highCents !== lowCents) return `${formatUsdFromCents(lowCents)}–${formatUsdFromCents(highCents)}/day`;
  return `${formatUsdFromCents(lowCents)}/day`;
}

export function getBwiMarketRentalEstimate(vehicleId: ApprovedTransactionVehicleId, days: number): MarketRentalEstimate {
  if (!Number.isInteger(days) || days < 1 || days > 31) throw new Error("Use between 1 and 31 rental days for a market estimate.");
  const reference = BWI_MARKET_RATE_REFERENCE[vehicleId];
  const dailyHighCents = reference.dailyHighCents ?? reference.dailyLowCents;
  return {
    vehicleId,
    pickupMarket: "BWI",
    capturedOn: "2026-09-04",
    days,
    dailyLowCents: reference.dailyLowCents,
    dailyHighCents,
    totalLowCents: reference.dailyLowCents * days,
    totalHighCents: dailyHighCents * days,
    isRange: dailyHighCents !== reference.dailyLowCents,
    comparator: reference.comparator,
  };
}

export function formatUsdFromCents(amountCents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountCents / 100);
}
