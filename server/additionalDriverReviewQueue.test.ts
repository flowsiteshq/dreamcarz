import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const router = readFileSync(resolve(import.meta.dirname, "./routers.ts"), "utf8");
const view = readFileSync(resolve(import.meta.dirname, "../client/src/components/AdministratorAdditionalDriverReview.tsx"), "utf8");
describe("additional-driver administrator review queue", () => {
  it("is administrator-only, bounded, and excludes contact details", () => {
    expect(router).toContain("adminAdditionalDrivers: protectedProcedure");
    expect(router).toContain('rateLimitKey(ctx.req, "admin_additional_drivers"');
    expect(router).toContain("fullName: transactionAdditionalDrivers.fullName");
    expect(router).not.toContain("email: transactionAdditionalDrivers.email");
    expect(router).not.toContain("phone: transactionAdditionalDrivers.phone");
    expect(view).toContain("Contact details, documents, and any clearance action remain outside this queue.");
  });
});
