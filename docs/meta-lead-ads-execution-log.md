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

## 2026-09-17 signed app-webhook configuration release

The Meta app Webhooks screen confirmed that the Dreamcarz app has no callback configured and that the Page object is selected. The revised server implementation was checkpointed after passing focused Meta tests, typecheck, production build, and retry-worker build. It uses a server-only app access token to request the app-level Page `leadgen` callback configuration, followed by the existing Page installation call. The GitHub direct-main file upload was submitted; GitHub was still processing the upload at the latest browser check. No Meta campaign, ad set, ad, form, audience, budget, or publishing action was performed.

GitHub confirmed direct-main commit `aa8d3f1` titled “Configure signed Meta lead webhook safely.” The commit updates only `server/metaLeadAds.ts` and is ready for Railway’s repository deployment path. It contains no campaign, ad set, ad, budget, audience, targeting, form-creation, or publication operation.

A Railway deployment-status page was opened for the GitHub release. The first content extraction returned only Railway’s cookie notice and the browser status view timed out, so successful deployment is not yet claimed from that check.

After the GitHub update, production reachability probes returned HTTP 200 for the public homepage and HTTP 403 for an unsigned webhook request. The latter preserves the expected signature/verification gate. The authenticated administrator browser page did not finish rendering within the browser inspection timeout, so the revised admin action is not yet treated as verified live.

A production administrator reload completed and showed the authenticated DreamCarz command center. The subsequent Integrations navigation timed out before the browser tool returned a state, so no operation was triggered or claimed from that attempt.

The browser reloaded the production administrator command center successfully. Two attempts to open the Meta Integrations surface via its sidebar timed out at the browser-tool layer before a resulting screen could be read; no subscription or test action is being claimed from those timing-out clicks.

The attempted Railway deployment-list deep link returned Railway’s 404 page, rather than a deployment record. This does not affect the independent production HTTP reachability result and is not used as evidence of a successful new release.

Railway’s service overview again exposed only its cookie-notice extraction and timed out during browser status rendering. Deployment health therefore remains unverified from Railway’s interface; production HTTP remains responsive.

The browser session became unresponsive after the Railway pages. Re-selecting the authenticated My Browser routing restored navigation to the DreamCarz administrator URL, where the initial content now shows the existing NextRoll consent banner. This is a browser-session state only; no consent choice or Meta operation was made.

After browser recovery, the DreamCarz administrative command center is again visible. Its Meta Integrations click is timing out during the long rendered page transition; no button result is asserted from it. A post-transition inspection follows.
