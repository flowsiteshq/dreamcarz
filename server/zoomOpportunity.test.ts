import { describe, expect, it, vi } from "vitest";
import type { Express } from "express";
import { DREAMCARZ_ZOOM_MEETING_URL, DREAMCARZ_ZOOM_SHORT_PATH } from "../shared/zoomOpportunity";
import { registerDreamCarzZoomRoute } from "./zoomOpportunity";

describe("DreamCarz Zoom short link", () => {
  it("redirects the public short path to the supplied meeting with no customer-data handling", () => {
    const get = vi.fn();
    registerDreamCarzZoomRoute({ get } as unknown as Express);

    expect(get).toHaveBeenCalledWith(DREAMCARZ_ZOOM_SHORT_PATH, expect.any(Function));
    const handler = get.mock.calls[0]?.[1] as (_req: unknown, res: { redirect: (status: number, destination: string) => void }) => void;
    const redirect = vi.fn();
    handler({}, { redirect });
    expect(redirect).toHaveBeenCalledWith(302, DREAMCARZ_ZOOM_MEETING_URL);
  });
});
