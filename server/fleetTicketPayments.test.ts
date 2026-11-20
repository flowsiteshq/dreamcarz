import { afterEach, describe, expect, it, vi } from "vitest";
import { chargeFleetTicket } from "./paymentProvider";

const ticket = {
  ticketId: 43,
  amountCents: 12550,
  vaultId: "vault_123",
  initialTransactionId: "original_123",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("fleet ticket card charges", () => {
  it("keeps ticket charging disabled without the feature flag", async () => {
    vi.stubEnv("FLEET_TICKET_PAYMENTS_ENABLED", "false");
    vi.stubEnv("COCARD_TICKET_SECURITY_KEY", "test");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(chargeFleetTicket(ticket)).resolves.toMatchObject({
      status: "blocked",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ["response=1&transactionid=payment_123", "paid"],
    ["response=2&transactionid=declined_123", "declined"],
    ["response=1", "uncertain"],
    ["response=3", "uncertain"],
  ])("records gateway response %s as %s", async (payload, status) => {
    vi.stubEnv("FLEET_TICKET_PAYMENTS_ENABLED", "true");
    vi.stubEnv("COCARD_TICKET_SECURITY_KEY", "test");
    const fetch = vi.fn(async (_url: string, options: RequestInit) => {
      expect(Object.fromEntries(options.body as URLSearchParams)).toMatchObject(
        {
          type: "sale",
          amount: "125.50",
          customer_vault_id: "vault_123",
          initiated_by: "merchant",
          stored_credential_indicator: "used",
          initial_transaction_id: "original_123",
          orderid: "DC-TICKET-43",
        }
      );
      return new Response(payload);
    });
    vi.stubGlobal("fetch", fetch);
    await expect(chargeFleetTicket(ticket)).resolves.toMatchObject({ status });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
