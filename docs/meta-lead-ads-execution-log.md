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

## 2026-09-17 system-user Page assignment validation

The system-user **Assign assets** flow was inspected for only the Dreamcarz Page. Meta offered individual partial-access switches for Content, Community activity, Messages and calls, Ads, Insights, Revenue, Creator content, and Creator management; it did **not** offer an individual Leads switch. The only broader option listed Leads also included Ads and other Page rights. No Page asset permission was assigned, no Ads capability was selected, and the incomplete assignment was closed. This preserves the least-privilege requirement and leaves the system user assigned only to the Dreamcarz app.

## 2026-09-17 production configuration verification

Railway production accepted and deployed the five Meta integration variables with all values masked in the UI. The service reported Online and Deployment successful. Public negative probes confirmed the production webhook rejects a wrong verification token and an invalid signature with HTTP 403. The authenticated DreamCarz administrator portal is reachable; the Integrations navigation targets the Meta Lead Ads workspace within the administrator operations page.

## 2026-09-17 live verification caveats

The public production webhook was verified from the sandbox with negative probes: an incorrect Meta verification token returned HTTP 403, and an invalid `X-Hub-Signature-256` POST returned HTTP 403. The authenticated DreamCarz admin portal loads the Integrations → Meta Lead Ads controls, including connection check, Page leadgen subscription, durable inbox processing, and controlled test-lead form controls. A direct sandbox database inspection returned no Meta integration rows, which is not treated as production evidence because the sandbox `DATABASE_URL` is not confirmed to be Railway production. Railway’s browser terminal is visible but browser-driven keystrokes have not reliably executed commands, so no secret values have been read or printed.

## 2026-09-17 live admin validation

Railway’s production variable inventory visibly lists all seven required Meta variables plus the retry secret, with their values masked. The authenticated administrator portal’s Integrations navigation reaches the combined administrative operations surface; the dedicated Meta Lead Ads section remains further down that surface. Local validation at this stage reconfirmed TypeScript, the seven focused Meta tests, and the production build all pass. No ad, ad set, campaign, budget, targeting, or publishing setting has been opened or modified.

The administrator page’s Integrations navigation is confirmed to use a delayed in-page scroll across the unified operations surface. It passed maintenance completion and scheduling controls while progressing toward the dedicated Meta panel; no operational form was submitted or altered during navigation.

The integrated administrator surface has a single long-body operations layout. Its Integrations control re-renders the operations content and issues a smooth scroll to the Meta section after a short delay. Browser-native keyboard focus interacted unpredictably with that animation; no management action, Page setting, or lead test was submitted while navigating.

The administrator page confirms that the Meta integration component is placed after the Fleet Operations section and before extension, settlement, DCP, and other operational sections. Browser focus movement remains inconsistent on this unusually long page. No lead, marketing action, campaign, Page, billing, vehicle, customer, or transaction control was activated.
