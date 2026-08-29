import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);

const visitorContext = {
  user: null,
  req: { headers: {} },
  res: {},
};

const baseInquiry = {
  vehicleId: "2024-chevrolet-malibu-gray",
  vehicleName: "2024 Chevrolet Malibu",
  contactName: "Vehicle Inquiry Test",
  contactEmail: "vehicle.inquiry.test@dreamcarz.example",
  contactPhone: "3015550100",
  preferredContact: "phone" as const,
};

describe("vehicle inquiry router", () => {
  beforeEach(() => mockedGetDb.mockReset());

  it("persists a complete rental request with a rental-specific reference", async () => {
    const values = vi.fn().mockResolvedValue({ affectedRows: 1 });
    mockedGetDb.mockResolvedValue({ insert: vi.fn(() => ({ values })) } as never);

    const caller = appRouter.createCaller(visitorContext as never);
    const result = await caller.vehicleInquiries.create({
      ...baseInquiry,
      inquiryType: "rental",
      requestedStartDate: "2026-09-10",
      requestedEndDate: "2026-09-13",
      pickupLocation: "Lanham, MD",
    });

    expect(result.success).toBe(true);
    expect(result.inquiryType).toBe("rental");
    expect(result.reference).toMatch(/^VR-\d{4}-[A-Z0-9]{7}$/);
    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      inquiryType: "rental",
      vehicleId: baseInquiry.vehicleId,
      pickupLocation: "Lanham, MD",
      status: "submitted",
    }));
  });

  it("persists a purchase inquiry without inventing rental timing", async () => {
    const values = vi.fn().mockResolvedValue({ affectedRows: 1 });
    mockedGetDb.mockResolvedValue({ insert: vi.fn(() => ({ values })) } as never);

    const caller = appRouter.createCaller(visitorContext as never);
    const result = await caller.vehicleInquiries.create({
      ...baseInquiry,
      inquiryType: "purchase",
      notes: "Please confirm the current purchase path.",
    });

    expect(result.success).toBe(true);
    expect(result.inquiryType).toBe("purchase");
    expect(result.reference).toMatch(/^VP-\d{4}-[A-Z0-9]{7}$/);
    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      inquiryType: "purchase",
      requestedStartDate: null,
      requestedEndDate: null,
      pickupLocation: null,
    }));
  });

  it("persists a Coming Soon reserve request with a reserve-specific reference", async () => {
    const values = vi.fn().mockResolvedValue({ affectedRows: 1 });
    mockedGetDb.mockResolvedValue({ insert: vi.fn(() => ({ values })) } as never);

    const caller = appRouter.createCaller(visitorContext as never);
    const result = await caller.vehicleInquiries.create({
      ...baseInquiry,
      inquiryType: "reserve",
      vehicleId: "coming-soon-2024-tesla-model-3",
      vehicleName: "2024 Tesla Model 3",
      notes: "Reserve request for a Coming Soon vehicle.",
    });

    expect(result.success).toBe(true);
    expect(result.inquiryType).toBe("reserve");
    expect(result.reference).toMatch(/^VS-\d{4}-[A-Z0-9]{7}$/);
    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      inquiryType: "reserve",
      vehicleId: "coming-soon-2024-tesla-model-3",
      requestedStartDate: null,
      requestedEndDate: null,
      pickupLocation: null,
      status: "submitted",
    }));
  });

  it("rejects a rental request when required timing or pickup information is missing", async () => {
    mockedGetDb.mockResolvedValue({ insert: vi.fn() } as never);
    const caller = appRouter.createCaller(visitorContext as never);

    await expect(caller.vehicleInquiries.create({
      ...baseInquiry,
      inquiryType: "rental",
      requestedStartDate: "2026-09-10",
      requestedEndDate: "2026-09-13",
    })).rejects.toThrow("Add a pickup location and valid rental dates to continue.");
  });
});
