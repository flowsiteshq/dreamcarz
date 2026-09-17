# Meta Lead Ads Execution Log

## 2026-09-17 token workflow

The approved Meta system-user token permission step was completed for DreamCarz Lead Sync. Meta reported that a token had been generated, and then displayed its value in the browser automation output. The token was therefore treated as exposed and the Business Suite **Revoke tokens** confirmation was completed. The token was never placed in Railway or source control.

Meta then presented an **Account verification required** prompt for the token request. Selecting **Verify account** opened a verification modal that was still loading at the last inspected state. No paid Meta campaign, ad set, ad, budget, audience, schedule, or publication state was accessed or changed.

Meta’s verification workflow advanced to a one-time SMS confirmation form. At 04:47 ET, the connected browser still showed an empty confirmation-code field and a disabled Next button; verification therefore cannot yet be treated as complete.

## 2026-09-17 Leads Access verification

The Meta Business Suite **Leads Access** screen for the Dreamcarz Page showed the default state: all Page administrators and connected CRMs can access leads. The page displayed a **Customize access** control, but customization was not enabled and no access rule was changed. This means no extra Leads Access grant is currently required for the existing default state. Source: https://business.facebook.com/latest/settings/leads_access/?business_id=1826650437433320

## 2026-09-17 credential containment

The previously exposed `META_APP_SECRET` was removed from Railway production and the deployed Railway variable inventory no longer contained that name. A subsequently rotated secret was accidentally exposed by the automation when entered into Railway and was not saved or deployed; its entry form was cleared. It must be rotated again through a user-private browser action before reconfiguration. The production Meta integration remains disabled because no Page token, verify token, feature flag, retry secret, or active app secret is currently configured.

## 2026-09-17 retry worker preparation

A one-shot `metaLeadAdsCron` worker was added locally and validated for a Railway Cron service. It processes a bounded batch of due events and exits, with no in-process scheduler. The worker is not yet published to GitHub or provisioned as a Railway service because the GitHub credential is invalid and a separate Railway scheduled service can incur infrastructure charges. It therefore has not been treated as a production retry mechanism. The currently deployed web process continues to offer only administrator-triggered processing and the bearer-protected retry route, both disabled without configuration.
