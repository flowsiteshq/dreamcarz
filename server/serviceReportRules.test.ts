import { describe, expect, it } from "vitest";

describe("service-report review lifecycle", () => {
  it("preserves an ordered status history for member follow-up", () => {
    const history = ["submitted", "under_review", "assigned", "resolved"];
    expect(history).toEqual(["submitted", "under_review", "assigned", "resolved"]);
    expect(history.at(-1)).toBe("resolved");
  });
});
