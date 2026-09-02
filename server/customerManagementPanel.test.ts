import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const routers = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const panel = readFileSync(resolve(process.cwd(), "client/src/components/CustomerManagementPanel.tsx"), "utf8");
const customerDirectory = routers.slice(routers.indexOf("customerDirectory: protectedProcedure"), routers.indexOf("vehiclePassports: router"));

describe("administrator customer management", () => {
  it("is administrator-only and returns account and transaction summaries without credential or document queries", () => {
    expect(customerDirectory).toContain('ctx.user.role !== "admin"');
    expect(customerDirectory).toContain("transactionCount: customerTransactions.length");
    expect(customerDirectory).toContain("openTransactionCount");
    expect(customerDirectory).not.toContain("userCredentials");
    expect(customerDirectory).not.toContain("passwordHash");
    expect(customerDirectory).not.toContain("transactionDocuments");
    expect(customerDirectory).not.toContain("paymentProvider");
  });

  it("limits each customer-management response to a bounded page", () => {
    expect(customerDirectory).toContain("pageSize: z.number().int().min(10).max(50).default(20)");
    expect(customerDirectory).toContain("items: filtered.slice((page - 1) * pageSize, page * pageSize)");
    expect(customerDirectory).toContain("activeJourneyCount");
  });

  it("keeps credentials, payments, and private documents outside the customer-management view", () => {
    expect(panel).toContain("Credentials, payment details, and private documents are not listed here.");
    expect(panel).toContain("Review transactions");
    expect(panel).toContain("Page {page} of {totalPages}");
    expect(panel).toContain("Showing {records.length");
    expect(panel).not.toContain("password");
    expect(panel).not.toContain("paymentProvider");
  });
});
