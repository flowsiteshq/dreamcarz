import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(() => null), getPaymentProviderStatus: vi.fn(() => ({ configured: true, checkoutKey: "public-checkout-key", checkoutScriptUrl: "https://provider.example/checkout.js" })), verifyCoCardCheckoutReturn: vi.fn() }));
vi.mock("./associateBilling", () => ({ ASSOCIATE_ENROLLMENT_FEE_CENTS: 14900, ASSOCIATE_MONTHLY_FEE_CENTS: 4900, ASSOCIATE_ENROLLMENT_SKU: "DREAMCARZ-ASSOCIATE-ENROLLMENT-149", ensureAssociateEnrollmentProduct: vi.fn(async () => ({ ready: true, sku: "DREAMCARZ-ASSOCIATE-ENROLLMENT-149" })), createAssociateMonthlySubscription: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const context = { user: { id: 701, name: "Associate Applicant", email: "applicant@example.test", role: "user" }, req: { headers: { host: "www.dreamcarz.io" }, ip: "203.0.113.201" }, res: {} };

describe("Associate enrollment checkout", () => {
  beforeEach(() => vi.mocked(getDb).mockReset());

  it("requires explicit recurring authorization before any provider product setup or record creation", async () => {
    const select = vi.fn();
    vi.mocked(getDb).mockResolvedValue({ select } as never);

    await expect(appRouter.createCaller(context as never).associateEnrollment.startCheckout({ authorizeRecurring: false as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(select).not.toHaveBeenCalled();
  });

  it("returns a hosted $149 checkout configuration with a provider-verified $49 monthly authorization path", async () => {
    const eventValues = vi.fn().mockResolvedValue(undefined);
    const enrollmentValues = vi.fn().mockResolvedValue([{ insertId: 81 }]);
    const select = vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })) })) }));
    vi.mocked(getDb).mockResolvedValue({ select, insert: vi.fn(() => ({ values: enrollmentValues.mockImplementationOnce((value) => { expect(value).toMatchObject({ userId: 701, enrollmentFeeCents: 14900, monthlyFeeCents: 4900 }); return [{ insertId: 81 }]; }).mockImplementationOnce(eventValues) })) } as never);

    const result = await appRouter.createCaller(context as never).associateEnrollment.startCheckout({ authorizeRecurring: true });

    expect(result).toMatchObject({ alreadyActive: false, checkout: { lineItems: [{ sku: "DREAMCARZ-ASSOCIATE-ENROLLMENT-149", quantity: 1 }], customerVault: { addCustomer: true }, successUrl: expect.stringContaining("https://www.dreamcarz.io/associate-enroll?reference=") } });
  });
});
