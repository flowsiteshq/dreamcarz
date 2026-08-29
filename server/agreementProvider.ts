export function getAgreementProviderStatus() {
  const enabled = process.env.DOCUSIGN_ENABLED === "true";
  const returnUrl = process.env.DOCUSIGN_RETURN_URL;
  const templateId = process.env.DOCUSIGN_APPROVED_TEMPLATE_ID;
  const configured = enabled
    && Boolean(process.env.DOCUSIGN_ACCOUNT_ID)
    && Boolean(process.env.DOCUSIGN_INTEGRATION_KEY)
    && Boolean(process.env.DOCUSIGN_USER_ID)
    && Boolean(process.env.DOCUSIGN_PRIVATE_KEY)
    && Boolean(returnUrl?.startsWith("https://"))
    && Boolean(templateId);
  return {
    provider: "docusign" as const,
    enabled,
    configured,
    templateConfigured: Boolean(templateId),
    mode: configured ? "ready" as const : "manual_review" as const,
  };
}

export function agreementDispatchBlocker(input: {
  agreementType: "rental" | "purchase" | "addendum";
  templateVersion?: string | null;
  legalApproved: boolean;
}) {
  if (!input.legalApproved) return "A legally approved agreement is required before sending for signature.";
  if (!input.templateVersion?.trim()) return "An immutable agreement version is required before sending for signature.";
  if (input.agreementType === "addendum") return "The supplied rental addendum must complete legal and entity-consistency review before it can be sent.";
  return null;
}
