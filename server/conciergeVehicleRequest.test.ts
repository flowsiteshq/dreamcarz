import { describe, expect, it } from "vitest";
import { resolveConciergeVehicleRequest, vehicleClassFromText } from "../shared/conciergeVehicleRequest";

describe("conversational vehicle list requests", () => {
  it.each(["Do you hav anymore?", "Do you have any more?", "Any more", "More", "Show me more", "Can you show me more?", "Other options", "Anything else?", "What else do you have?", "Show me all", "The rest", "I would like to see all SUV vehicles"])("continues the SUV list for %s", question => {
    expect(resolveConciergeVehicleRequest(question, "suv")).toMatchObject({ vehicleClass: "suv", showAll: true });
  });
  it.each(["How much more would it cost?", "Do I need more insurance?", "Can I have more time?", "How does membership work?", "Tomorrow"])("does not mistake a different question for more vehicles: %s", question => {
    expect(resolveConciergeVehicleRequest(question, "suv").showAll).toBe(false);
  });
  it("uses the newest customer class, ignoring category names in assistant prompts", () => {
    expect(resolveConciergeVehicleRequest("More", null, [
      { role: "member", text: "I need a sedan" },
      { role: "member", text: "Actually I want an SUV" },
      { role: "concierge", text: "Here are sedans and SUVs." },
    ])).toMatchObject({ vehicleClass: "suv", showAll: true });
  });
  it("supports changing from SUVs to sedans", () => {
    expect(resolveConciergeVehicleRequest("Show me all sedans instead", "suv")).toMatchObject({ vehicleClass: "sedan", showAll: true });
    expect(vehicleClassFromText("Not a sedan, an SUV")).toBe("suv");
  });
  it("does not guess a class when no preference has been supplied", () => {
    expect(resolveConciergeVehicleRequest("More")).toMatchObject({ vehicleClass: null, showAll: false });
  });
});
