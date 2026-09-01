import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const conciergeSource = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Concierge.tsx"), "utf8");

describe("Concierge enrollment continuity", () => {
  it("opens the protected enrollment panel in the Concierge instead of redirecting after the first journey choices", () => {
    expect(conciergeSource).toContain("<ConciergeEnrollmentPanel reference={enrollmentReference}");
    expect(conciergeSource).toContain("openEnrollment(result.reference)");
    expect(conciergeSource).not.toContain("navigate(`/dashboard/rental-setup?ref=${encodeURIComponent(result.reference)}`)");
  });

  it("keeps the natural-language question form available alongside in-page enrollment", () => {
    expect(conciergeSource).toContain('placeholder={dashboardCreationField && !dashboardQuestionMode ? dashboardPrompt : "Ask DreamCarz"}');
    expect(conciergeSource).toContain("Ask a question instead");
    expect(conciergeSource).toContain("{enrollmentReference ? <ConciergeEnrollmentPanel");
  });
});
