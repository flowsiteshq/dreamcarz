import { describe, expect, it } from "vitest";
import { filterPartnerDirectory, partnerActivationValue } from "./partnerDirectory";

const directory = [
  { id: 1, name: "DreamCarz Network — HQ", category: "dreamcarz", address: "10001 Derekwood Ln", city: "Lanham", state: "MD", tags: "Headquarters,Pickup", isActive: 1 },
  { id: 2, name: "Capital Auto Body & Repair", category: "repair", address: "4521 Kenilworth Ave", city: "Bladensburg", state: "MD", tags: "Collision,Mechanical", isActive: 1 },
  { id: 3, name: "Tesla Supercharger — Lanham", category: "charging", address: "9200 Basil Court", city: "Largo", state: "MD", tags: "Tesla,Supercharger", isActive: 0 },
];

describe("partner directory filtering", () => {
  it("returns only active listings by default", () => {
    expect(filterPartnerDirectory(directory).map(item => item.id)).toEqual([1, 2]);
  });

  it("filters active listings by normalized category", () => {
    expect(filterPartnerDirectory(directory, { category: "REPAIR" }).map(item => item.name)).toEqual(["Capital Auto Body & Repair"]);
  });

  it("searches name, address, city, state, and tags", () => {
    expect(filterPartnerDirectory(directory, { query: "kenilworth" }).map(item => item.id)).toEqual([2]);
    expect(filterPartnerDirectory(directory, { query: "pickup" }).map(item => item.id)).toEqual([1]);
    expect(filterPartnerDirectory(directory, { query: "lanham" }).map(item => item.id)).toEqual([1]);
  });

  it("does not expose an inactive listing even when it matches search and category", () => {
    expect(filterPartnerDirectory(directory, { category: "charging", query: "tesla" })).toEqual([]);
  });
});

describe("partner directory activation values", () => {
  it("maps administrator activation choices to database-safe integer values", () => {
    expect(partnerActivationValue(true)).toBe(1);
    expect(partnerActivationValue(false)).toBe(0);
  });
});
