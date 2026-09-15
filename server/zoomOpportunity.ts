import type { Express } from "express";
import { DREAMCARZ_ZOOM_MEETING_URL, DREAMCARZ_ZOOM_SHORT_PATH } from "../shared/zoomOpportunity";

/** Public event link only; it deliberately carries no account or customer data. */
export function registerDreamCarzZoomRoute(app: Express) {
  app.get(DREAMCARZ_ZOOM_SHORT_PATH, (_req, res) => {
    res.redirect(302, DREAMCARZ_ZOOM_MEETING_URL);
  });
}
