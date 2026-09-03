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
    expect(page).toContain("dreamcarz-dc-monogram-gold_085f22a2.png");
    expect(page).toContain("dreamcarz-wordmark-gold_8bf4fbfa.png");
    expect(page).toContain("QRCodeSVG");
    expect(page).toContain("conversionEvents");
    expect(page).toContain("commissionRecords");
    expect(page).toContain("AssociateTrainingHub");
    expect(page).toContain("Recent wallet activity");
    expect(page).toContain("walletEntries");
    expect(page).not.toContain("providerReference");
    expect(page).toContain("Add a consented lead");
    expect(page).toContain('openMode("network", "associate-referrals")');
    expect(page).toContain('onAcademy={() => openMode("academy")}');
    expect(page).toContain('setLocation("/dashboard/rewards")');
    expect(page).toContain('setLocation("/dashboard/notifications")');
    expect(page).toContain('setLocation("/dashboard/support")');
    expect(page).toContain("navigator.share");
    expect(page).toContain("Recorded relationship status");
    expect(page).toContain("Customer identity, application details, screening, and eligibility decisions remain private.");
    expect(page).toContain("fallbackCopy");
    expect(page).toContain("Copy unavailable");
    expect(page).toContain("Share unavailable");
    expect(page).toContain("This private portal shows recorded account data.");
    expect(page).toContain("does not promise earnings");
  });
});
