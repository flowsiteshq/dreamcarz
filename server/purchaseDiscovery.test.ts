import { describe, expect, it } from "vitest";
import { advancePurchaseConversation, emptyShopperProfile, extractShopperProfile, nextBestPurchaseQuestion, rankPurchaseInventory } from "../client/src/lib/purchaseDiscovery";

const verifiedInventory = [
  {
    vehicleId: "suv-premium",
    vehicleName: "Confirmed Premium SUV",
    vehicleClass: "suv" as const,
    image: "suv.png",
    confirmed: { condition: "used" as const, purchasePrice: 42_000, mileage: 42_000, color: "black", features: ["AWD"] },
  },
  {
    vehicleId: "suv-over-budget",
    vehicleName: "Confirmed SUV Over Budget",
    vehicleClass: "suv" as const,
    image: "suv-over.png",
    confirmed: { condition: "used" as const, purchasePrice: 51_000, mileage: 30_000, color: "black" },
  },
  {
    vehicleId: "sedan-value",
    vehicleName: "Confirmed Value Sedan",
    vehicleClass: "sedan" as const,
    image: "sedan.png",
    confirmed: { condition: "used" as const, purchasePrice: 28_000, mileage: 30_000, color: "black" },
  },
];

describe("shopper profile purchase intelligence", () => {
  it("does not repeat collected answers and asks for an actual price after total-price method", () => {
    let profile = emptyShopperProfile();
    profile = advancePurchaseConversation("I want to buy a car.", profile).profile;
    profile = advancePurchaseConversation("I want an SUV.", profile).profile;
    profile = advancePurchaseConversation("I want something premium and fun to drive.", profile).profile;
    profile = advancePurchaseConversation("Pre-owned is fine.", profile).profile;
    const transition = advancePurchaseConversation("I'd rather shop by total price.", profile);

    expect(transition.profile.bodyStyle).toBe("suv");
    expect(transition.profile.condition).toBe("used");
    expect(transition.profile.positioning).toBe("premium");
    expect(transition.profile.drivingStyle).toBe("sporty");
    expect(transition.profile.budgetMethod).toBe("purchase_price");
    expect(transition.profile.maxPurchasePrice).toBeNull();
    expect(transition.nextQuestion).toMatchObject({ field: "max_purchase_price" });
    expect(transition.nextQuestion?.prompt).toContain("price range");

    const afterPrice = advancePurchaseConversation("I want to stay under $45,000.", transition.profile);
    expect(afterPrice.profile.maxPurchasePrice).toBe(45_000);
    expect(afterPrice.profile.bodyStyle).toBe("suv");
    expect(afterPrice.profile.condition).toBe("used");
    expect(afterPrice.profile.budgetMethod).toBe("purchase_price");
    expect(afterPrice.journeyState).toBe("results");
    expect(afterPrice.nextQuestion).toBeNull();
  });

  it("extracts multiple requirements from one natural-language message", () => {
    const { profile, changedFields } = extractShopperProfile(
      "I need a pre-owned premium SUV under $45,000, preferably black, under 50,000 miles, and something fun to drive.",
      emptyShopperProfile(),
    );

    expect(profile).toMatchObject({
      intent: "buy",
      bodyStyle: "suv",
      condition: "used",
      positioning: "premium",
      drivingStyle: "sporty",
      maxPurchasePrice: 45_000,
      maxMileage: 50_000,
      preferredColor: "black",
    });
    expect(changedFields).toEqual(expect.arrayContaining(["bodyStyle", "condition", "positioning", "drivingStyle", "maxPurchasePrice", "maxMileage", "preferredColor"]));
    expect(nextBestPurchaseQuestion(profile)).toBeNull();
  });

  it("enforces verified hard constraints before ranking soft preferences", () => {
    const profile = extractShopperProfile(
      "I need a pre-owned premium SUV under $45,000, preferably black, under 50,000 miles, and something fun to drive.",
      emptyShopperProfile(),
    ).profile;
    const matches = rankPurchaseInventory(verifiedInventory, profile);

    expect(matches.map(match => match.vehicle.vehicleId)).toEqual(["suv-premium"]);
    expect(matches[0]).toMatchObject({ category: "Best match", score: 100 });
    expect(matches[0].reasons.join(" ")).toMatch(/price|mileage|color/i);
  });

  it("does not create a selected vehicle when it presents results", () => {
    const transition = advancePurchaseConversation(
      "I need a pre-owned premium SUV under $45,000, preferably black, under 50,000 miles, and something fun to drive.",
      emptyShopperProfile(),
    );

    expect(transition.journeyState).toBe("results");
    expect("selectedVehicleId" in transition).toBe(false);
  });

  it("refines an active search without discarding prior requirements", () => {
    let profile = extractShopperProfile(
      "I need a pre-owned premium SUV under $45,000, preferably black, under 50,000 miles, and something fun to drive.",
      emptyShopperProfile(),
    ).profile;

    profile = extractShopperProfile("Those are too expensive. Anything black?", profile).profile;

    expect(profile).toMatchObject({
      bodyStyle: "suv",
      condition: "used",
      positioning: "premium",
      drivingStyle: "sporty",
      preferredColor: "black",
      budgetMethod: "purchase_price",
      maxPurchasePrice: null,
    });
    expect(nextBestPurchaseQuestion(profile)).toMatchObject({ field: "max_purchase_price" });
  });

  it("recognizes a stated price as a price-budget preference", () => {
    const profile = extractShopperProfile("I need an SUV under $35,000.", emptyShopperProfile()).profile;

    expect(profile).toMatchObject({ bodyStyle: "suv", budgetMethod: "purchase_price", maxPurchasePrice: 35_000 });
    expect(nextBestPurchaseQuestion(profile)).toMatchObject({ field: "priority" });
  });
});
