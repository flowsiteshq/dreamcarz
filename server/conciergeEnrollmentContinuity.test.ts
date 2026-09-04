import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const conciergeSource = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Concierge.tsx"), "utf8");
const enrollmentSource = readFileSync(resolve(import.meta.dirname, "../client/src/components/ConciergeEnrollmentPanel.tsx"), "utf8");

describe("Concierge enrollment continuity", () => {
  it("opens the protected enrollment panel in the Concierge instead of redirecting after the first journey choices", () => {
    expect(conciergeSource).toContain("<ConciergeEnrollmentPanel reference={enrollmentReference}");
    expect(conciergeSource).toContain("openEnrollment(result.reference)");
    expect(conciergeSource).not.toContain("navigate(`/dashboard/rental-setup?ref=${encodeURIComponent(result.reference)}`)");
  });

  it("keeps the natural-language question form available alongside in-page enrollment", () => {
    expect(conciergeSource).toContain('voiceAgentState === "connected" ? "Live Concierge is listening…"');
    expect(conciergeSource).toContain('isRecording ? "Listening… pause to send" : composerPlaceholder');
    expect(conciergeSource).toContain("Your conversation is private and secure.");
    expect(conciergeSource).toContain("Ask a question instead");
    expect(conciergeSource).toContain("{enrollmentReference ? <ConciergeEnrollmentPanel");
  });

  it("keeps the Concierge composer screen-locked and reserves reading space beneath the conversation", () => {
    expect(conciergeSource).toContain("fixed inset-x-3 bottom-4 z-40");
    expect(conciergeSource).toContain("pointer-events-auto mx-auto w-full max-w-3xl");
    expect(conciergeSource).toContain("pb-48 pt-8");
    expect(conciergeSource).toContain('htmlFor="dreamcarz-concierge-input"');
    expect(conciergeSource).toContain('aria-label={voiceAgentState === "connected" ? "End live DreamCarz voice conversation" : "Start live DreamCarz voice conversation"}');
  });

  it("captures an additional driver in Concierge only for separate review", () => {
    expect(enrollmentSource).toContain("trpc.transactions.addAdditionalDriver.useMutation");
    expect(enrollmentSource).toContain("Add for review");
    expect(enrollmentSource).toContain("does not authorize them to operate the vehicle");
    expect(enrollmentSource).toContain('continueStep("membership"');
  });
});
