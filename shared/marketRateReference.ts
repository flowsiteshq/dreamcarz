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
};

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
