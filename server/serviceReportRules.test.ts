import { describe, expect, it } from "vitest";
import { orderServiceReportTimeline } from "../shared/serviceReportTimeline";

describe("service-report review timeline", () => {
  it("returns persisted review events newest first for member and administrator timelines", () => {
    const submitted = { id: 1, status: "submitted", createdAt: new Date("2026-08-13T09:00:00.000Z") };
    const assigned = { id: 2, status: "assigned", createdAt: new Date("2026-08-13T10:00:00.000Z") };
    const resolved = { id: 3, status: "resolved", createdAt: new Date("2026-08-13T11:00:00.000Z") };

    expect(orderServiceReportTimeline([assigned, submitted, resolved]).map(event => event.status)).toEqual(["resolved", "assigned", "submitted"]);
  });

  it("uses event identifiers to keep events with the same timestamp deterministic", () => {
    const first = { id: 4, status: "under_review", createdAt: new Date("2026-08-13T10:00:00.000Z") };
    const second = { id: 5, status: "assigned", createdAt: new Date("2026-08-13T10:00:00.000Z") };

    expect(orderServiceReportTimeline([first, second]).map(event => event.id)).toEqual([5, 4]);
  });
});
