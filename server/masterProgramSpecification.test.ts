import { describe, expect, it } from "vitest";
import { MASTER_DCP_WALLET_SEED, MASTER_MEMBERSHIP_PLAN_SEED, MASTER_PROGRAM_SPECIFICATION } from "../shared/masterProgramSpecification";

describe("DreamCarz AI + DCP master configuration source", () => {
  it("captures the approved effective-dated membership table without deprecated prices", () => {
    expect(MASTER_PROGRAM_SPECIFICATION.version).toBe("1.3");
    expect(MASTER_PROGRAM_SPECIFICATION.effectiveStart).toBe("2026-09-11T00:00:00.000Z");
    expect(MASTER_MEMBERSHIP_PLAN_SEED.map(plan => plan.code)).toEqual(["FREE", "FREEDOM", "PLUS", "PRO", "ELITE", "SILVER", "GOLD", "BLACK"]);
    expect(MASTER_MEMBERSHIP_PLAN_SEED.find(plan => plan.code === "FREEDOM")).toMatchObject({ enrollmentFeeCents: 24_900, monthlyFeeCents: 4_900, startingDcpr: 15_000 });
    expect(MASTER_MEMBERSHIP_PLAN_SEED.find(plan => plan.code === "BLACK")).toMatchObject({ enrollmentFeeCents: 2_499_500, monthlyFeeCents: 129_500, startingDcpr: 500_000, multiplier: 7 });
  });

  it("defines wallet-level accounting taxonomy and excludes the retired DCPU code", () => {
    expect(MASTER_DCP_WALLET_SEED.map(wallet => wallet.walletCode)).toEqual(["DCPR", "DCPM", "DCPO", "DCPW", "DCPP", "DCPF", "DCPE"]);
    expect(MASTER_DCP_WALLET_SEED.some(wallet => wallet.walletCode === "DCPU")).toBe(false);
    expect(MASTER_DCP_WALLET_SEED.find(wallet => wallet.walletCode === "DCPE")).toMatchObject({ minimumTier: "BLACK", earnMultiplier: 2 });
  });
});
