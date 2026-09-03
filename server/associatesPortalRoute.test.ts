import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routes = readFileSync(resolve(import.meta.dirname, "../client/src/App.tsx"), "utf8");
const page = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Associates.tsx"), "utf8");

describe("separate Associate portal route", () => {
  it("registers the requested /associates route and uses only account-owned Associate and wallet functions", () => {
    expect(routes).toContain('<Route path="/associates" component={Associates} />');
    expect(page).toContain("trpc.associate.overview.useQuery");
    expect(page).toContain("trpc.associate.createLead.useMutation");
    expect(page).toContain("trpc.associate.updateLead.useMutation");
    expect(page).toContain("trpc.wallet.mine.useQuery");
    expect(page).toContain("Recorded relationship status");
    expect(page).toContain("Customer identity, application details, screening, and eligibility decisions remain private.");
    expect(page).toContain("This private portal shows recorded account data.");
    expect(page).toContain("does not promise earnings");
  });
});
