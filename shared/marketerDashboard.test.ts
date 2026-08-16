import { describe, expect, it } from "vitest";
import { getMarketerPath, getNextMarketerPath, isActiveTeamMember } from "./marketerDashboard";

describe("marketer dashboard helpers", () => {
  it("resolves a stored rank to an approved business path and falls back safely", () => {
    expect(getMarketerPath("road_captain").label).toBe("Road Captain");
    expect(getMarketerPath("unexpected").label).toBe("Associate");
  });

  it("returns the next path without stepping past the final path", () => {
    expect(getNextMarketerPath("associate").label).toBe("Driver");
    expect(getNextMarketerPath("dream_ambassador").label).toBe("Dream Ambassador");
  });

  it("counts only explicitly active referral records as active team members", () => {
    expect(isActiveTeamMember("active")).toBe(true);
    expect(isActiveTeamMember("pending")).toBe(false);
    expect(isActiveTeamMember("inactive")).toBe(false);
  });
});
