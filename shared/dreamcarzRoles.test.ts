import { describe, expect, it } from "vitest";
import { effectiveDreamCarzRoles, hasDreamCarzRole } from "./dreamcarzRoles";

describe("DreamCarz OS roles", () => {
  it("preserves legacy administrator access and gives every account a customer role", () => {
    expect(effectiveDreamCarzRoles("admin", ["operations"])).toEqual(expect.arrayContaining(["customer", "operations", "administrator"]));
    expect(effectiveDreamCarzRoles("user", [])).toEqual(["customer"]);
  });

  it("checks role access explicitly", () => {
    expect(hasDreamCarzRole(["customer", "fleet_partner"], ["fleet_partner", "administrator"])).toBe(true);
    expect(hasDreamCarzRole(["customer"], ["operations", "administrator"])).toBe(false);
  });
});
