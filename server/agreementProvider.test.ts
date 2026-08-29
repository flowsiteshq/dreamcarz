import { afterEach, describe, expect, it } from "vitest";
import { agreementDispatchBlocker, getAgreementProviderStatus } from "./agreementProvider";

const originalEnabled = process.env.DOCUSIGN_ENABLED;

afterEach(() => { process.env.DOCUSIGN_ENABLED = originalEnabled; });

describe("agreement provider safeguards", () => {
  it("keeps electronic signing in manual-review mode until all provider and legal configuration is deliberate", () => {
    process.env.DOCUSIGN_ENABLED = "false";
    expect(getAgreementProviderStatus().configured).toBe(false);
    expect(getAgreementProviderStatus().mode).toBe("manual_review");
  });

  it("blocks addendum dispatch until legal review and entity consistency are complete", () => {
    expect(agreementDispatchBlocker({ agreementType: "addendum", templateVersion: "rto-v1", legalApproved: false })).toContain("legally approved");
    expect(agreementDispatchBlocker({ agreementType: "addendum", templateVersion: "rto-v1", legalApproved: true })).toContain("entity-consistency");
  });
});
