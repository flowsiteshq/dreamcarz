import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const routerSource = readFileSync(resolve(root, "server/routers.ts"), "utf8");
const rewardsSource = readFileSync(resolve(root, "client/src/pages/dashboard/Rewards.tsx"), "utf8");

describe("member DCP wallet projection", () => {
  it("uses an account-owned, rate-limited DCP ledger projection without a wallet write path", () => {
    expect(routerSource).toContain("myWallets: protectedProcedure");
    expect(routerSource).toContain('"dcp_wallet_projection_read"');
    expect(routerSource).toContain("from(dcpLedgerEntries).where(eq(dcpLedgerEntries.userId, ctx.user.id))");
    expect(routerSource).not.toContain("myWallets: protectedProcedure.mutation");
  });

  it("replaces static reward balances and redemption actions with recorded wallet streams and permitted-use guidance", () => {
    expect(rewardsSource).toContain("trpc.masterProgram.myWallets.useQuery");
    expect(rewardsSource).toContain("Recorded posted points");
    expect(rewardsSource).toContain("Permitted-use guidance");
    expect(rewardsSource).toContain("does not redeem DCP");
    expect(rewardsSource).not.toContain("Redeem</button>");
    expect(rewardsSource).not.toContain("285,000");
  });
});
