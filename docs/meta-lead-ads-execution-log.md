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

The GitHub browser upload page now reports that uploads are disabled for its current session because it lacks push access. A noninteractive local push also confirms no GitHub credential is available. The repository connector configuration reports enabled, but does not expose a GitHub MCP publishing tool in this session. The dedicated Meta admin workspace remains saved locally and checkpointed, pending a valid repository publishing session.

The authenticated GitHub session shown by the user is available to the connected browser. The dedicated administrator workspace file `client/src/pages/AdminPortal.tsx` is staged on GitHub's direct-main upload form; no commit has been made at this point.

The dedicated Meta administrator workspace was submitted to GitHub direct-main with the commit title “Open Meta leads in dedicated admin workspace.” GitHub shows its standard “Processing your files” state; confirmation follows before using it in production.

GitHub confirmed the direct-main release as commit `106d9a5`, “Open Meta leads in dedicated admin workspace.” The repository shows 21 production deployments. The new workspace will be checked after its deployment becomes active.

GitHub’s raw main-branch source confirms the dedicated `admin-integrations` rendering is published. The production site still showed the prior full operations behavior on its last page load, so Railway has not yet been verified to serve the newest frontend commit. Railway’s service page has been opened and is loading for deployment status inspection.

Railway’s build log for deployment `3823e34e` confirms source installation and `pnpm run build` completed successfully, then image publication completed. The Deploy Logs view contained no startup output while the status remained Deploying, so the release is still not claimed active. No paid-ad action or data migration was performed.

The new Railway deployment’s build has completed with no recorded build error, but it is still marked Deploying and its deployment log has no startup output after image publication. Service deployment configuration is being inspected read-only to identify the blocker; no setting was changed.

Railway service settings confirm the repository and `main` branch are connected with auto-deploy enabled, the custom start command defaults to `pnpm run start`, and no pre-deploy step or healthcheck path is configured. The app therefore has no project-configured migration or healthcheck command blocking this release. Railway itself still reports its container-creation phase; a safe deployment retry is being prepared.

The stuck deployment has now remained in Railway’s container-creation phase for more than twelve minutes despite a successful image build and no configured pre-deploy command. The existing active production deployment remains online. A cancellation and clean retry of only this pending application deployment is the reversible recovery path; it neither changes Meta ads nor customer data.

The deployment detail view was re-opened after refreshing the authenticated browser connection. It is still loading and will be inspected before a retry action is taken.

Railway confirms there is no active deployment while the new release remains stuck. The retry dialog states it will rebuild and deploy the exact same configuration. This retry does not alter service variables, domains, source, data, or Meta advertising settings.

Railway accepted the exact-configuration retry and confirmed “Redeploy started.” Its first post-retry browser status check timed out before returning a resulting state, so completion remains unverified.

After the exact-configuration retry, the Railway service page was reopened following a browser connection refresh. Initial rendering did not return deployment details, so a post-load inspection is required before drawing any conclusion.

A production asset comparison now returns a different active JavaScript asset than the prior deployment, consistent with the newest frontend release being served. The authenticated administrator page has been reopened and is loading for direct workspace verification.

The reloaded production administrator portal visibly shows the signed-in DreamCarz command center. The Integrations navigation was invoked using its identified sidebar control; the browser tool timed out before a resulting screen was returned, so the subsequent state must be inspected before any Meta connection action can be claimed.

The production JavaScript bundle contains the dedicated Meta Lead Ads workspace source. However, the remote browser automation has intermittently timed out while attempting to activate the Integrations control, and its console-execution channel is unsupported for the connected browser. No connection, subscription, test lead, or campaign operation has been invoked through that UI as a result.

The authenticated GitHub browser now has direct-main write access. The validated `server/metaLeadAdsCron.ts` retry-worker file was uploaded and its GitHub direct-main commit was submitted as “Add Railway Meta lead retry worker.” GitHub is processing that file publication; completion is pending verification.

GitHub confirmed direct-main commit `e11cc46`, “Add Railway Meta lead retry worker,” and the published source was fetched and verified. Two supporting files still need a follow-on GitHub release: `package.json` adds the worker build/start scripts, and `AdminPortal.tsx` adds a stable `?section=integrations` entry point. The browser session again became inconsistent when opening the root upload page; no second upload was attempted while GitHub reported uploads disabled.

The browser-controlled Meta app route currently redirects to Meta Business’s sign-in page, while the user’s screenshot separately shows an authenticated developer-dashboard session under user takeover. This means the automated browser does not presently have access to the authenticated Meta session. No Page, app, form, subscription, or campaign setting has been changed from the automated session.

After the user restored shared browser control, the connected session is confirmed authenticated to `flowsiteshq/dreamcarz` and shows GitHub commit `e11cc46` for the Meta retry-worker file. The browser is currently on GitHub rather than Meta; supporting release files can now be published through this authenticated session.

GitHub confirmed direct-main commit `07b8941`, “Add Meta retry worker package commands.” This publishes the build and one-shot-start scripts required for the separate Railway retry-worker service. No ad, Page, form, campaign, or customer-data operation was part of this release.

GitHub confirmed direct-main commit `0db45ec`, “Add direct Meta Lead Ads workspace link.” This makes `/admin?section=integrations` open the dedicated Meta Lead Ads workspace after deployment. The worker and its package commands are now published in GitHub; Railway deployment activation remains to be verified.

GitHub’s deployment record now confirms the three supporting releases are deployed to `Dreamcarz / production`, with commit `0db45ec` (“Add direct Meta Lead Ads workspace link”) marked Active and Deployed (completed). A prior bundle-string monitor did not recognize the minified asset, but GitHub’s authoritative Railway deployment record confirms production activation.

The deployed, authenticated Meta Lead Ads workspace was opened successfully. Its protected “Check connection and forms” action returned the customer-safe failure state “The Meta Lead Ads operation could not be completed safely.” It did not change any Page, form, campaign, ad set, ad, budget, audience, or publication setting. The server-recorded safe error code will be inspected next to determine whether the remaining cause is a Page token, access grant, or Meta permission condition.

With the user’s explicit approval, Meta Business Suite assigned exactly one Page asset to the `DreamCarz Lead Sync` employee system user: the Dreamcarz Page, partial access **Ads** only. The resulting assigned-assets view confirms `Facebook Pages → Dreamcarz → Partial access (Ads)`. No ad account asset was assigned, and no campaign, ad set, ad, budget, targeting, audience, form, or publication setting was opened or changed.

Immediately after the Page-only Ads assignment, the protected connection check was rerun and still returned the safe failure state. The administrator workspace remains in `attention`; it records no forms or leads. The next safe diagnostic is the dedicated Page `leadgen` subscription action, which configures only the approved webhook endpoint and then performs the same Page read-back verification. No advertising object has been accessed or changed.

The Meta Page `leadgen` subscription operation was attempted through the protected DreamCarz administrator control after the Page-only access assignment. It completed only with the safe failure state. The protected status query records the specific code `meta_graph_access_denied`, with all required server variables still present and no lead events created. This establishes an access-token/Meta authorization blocker rather than an absent environment configuration. No paid-ad resource was accessed or changed.

During preparation of the Railway Page-token replacement, an incorrect control exposed the previously stored Meta Page token in browser automation output. The value is not recorded here. It is treated as compromised and will be removed from Railway before the user’s newly generated token is entered privately. The replacement will not be revealed, copied, or logged through automation.

Railway’s production variable inventory confirms that all Meta configuration keys remain present and masked. The Page-token action controls are being used only to remove the exposed old value and prepare a private replacement; the new user-generated value has not been entered or displayed.

The Railway variable interface confirms the prior Page token is still present but masked after the mistaken display. The replacement workflow is being limited to its correct Page-token row; its editing field will be handed to the user because browser automation records typed secret values.

Railway displayed the explicit deletion confirmation for `META_PAGE_ACCESS_TOKEN`. This removes the previously exposed old value only; it does not change source code, database data, or any Meta advertising resource. It will be immediately recreated under the same name with the user’s fresh token through a private browser handoff.

The old `META_PAGE_ACCESS_TOKEN` removal is now staged in Railway as one pending configuration change; it has not yet been deployed. Railway confirms 16 remaining service variables and does not display the removed value. The fresh replacement will be added under the same variable name before the pending changes are deployed together.

The user privately entered a newly generated Meta token under `META_PAGE_ACCESS_TOKEN`. Railway subsequently displayed the variable as masked, with all 17 service variables present and no staged changes remaining after deployment. The prior exposed token was removed and replaced under the same server-only variable name. No token value was retained in this record, source code, or administrator UI.

After Railway accepted the masked fresh Page-token replacement and the service returned online, the protected Meta connection check was run again. It still returned the customer-safe failure state and produced no forms, test leads, or inbox events. The exact persisted safe diagnostic code will be read next; no Meta advertising resource was accessed or changed.

The refreshed protected status query records `meta_graph_request_rejected` after the fresh token was deployed. This differs from the preceding access-denied result and keeps the issue confined to Meta’s Page/token/Leads Access configuration. DreamCarz configuration remains complete, and no forms, webhook events, or lead records were created.

A corrected connection check was implemented locally: it reads only documented stable Page node fields (`id,name`) rather than requesting the unsupported nested `leadgen_forms` field. Signed webhook events and administrator-provided test Form IDs continue to discover forms. The focused Meta suite (7/7), TypeScript check, production build, and retry-worker build all passed. The two server files were submitted through GitHub direct-main; GitHub’s follow-up browser render timed out, so publication is being verified from the raw main source before the next production check.

The corrected server source is confirmed on GitHub main. After the Railway activation wait, reopening the production administrator workspace shows the DreamCarz Administrator sign-in screen rather than the prior authenticated workspace, so its protected connection check cannot be invoked until an administrator session is restored. This is an authentication-session change only; it did not alter the integration, data, Page, forms, or advertising resources.

## 2026-09-17 Zapier Facebook authorization retry

The saved Zapier draft remains at the Facebook Lead Ads **New Lead (Instant)** trigger connection step. On resumption, Meta presented its own “I’m not a robot” CAPTCHA before it will authorize the connection. An automated click did not satisfy the challenge. The Zap remains unpublished; no campaign, ad, budget, audience, form, or lead data has been changed.

## 2026-09-17 scoped Zapier authorization review

The initial **Facebook Lead Ads (for Business admins)** authorization presented unrelated business assets and was cancelled before any external connection was created. The standard **Facebook Lead Ads** authorization then presented a permission editor. Email access and ad-account management were deselected. Meta’s Page-leads permission editor lists the Dreamcarz Page among the available Pages; all Pages were deselected before narrowing access to the Dreamcarz Page only. No Meta campaign, ad account, budget, targeting, or form was opened or changed.

Meta’s permission editor now shows both **Email address** and **Manage ads for ad accounts** switched off. The only remaining requested capability is **Access leads for your Pages**, which is being restricted to the Dreamcarz Page alone before consent. This changes no existing advertising resource.

While navigating the Meta Page list, an unrelated Page toggle was momentarily selected by a mismatched UI element index. It was immediately returned to off. The requested grant remains limited to Page-lead access; no email or ad-account-management permission is active.

The Meta selector visibly showed **Dreamcarz** as the sole active (blue) Page toggle, with surrounding unrelated Page toggles off. The consent summary lists only **Access leads for your Pages**; email and ad-account-management access are not listed.

## 2026-09-18 scoped Zapier consent retry

A fresh Zapier authorization session was generated through its connection manager and opened in the user’s connected browser. In Meta’s Page-access editor, **Dreamcarz** was visibly the only active Page toggle; the surrounding unrelated Page toggles were off. The consent screen still separately lists Email address and ad-account management, so the next step is to retain the user-approved ad-management permission while turning email off before final consent.

Meta’s permission editor now shows Email address disabled and ad-account management enabled. The consent summary has removed Email address and now lists only the user-approved ad-account management permission plus Page-lead access. The Dreamcarz Page remained the sole selected Page during the preceding scope review.

After email was disabled, Meta’s consent summary correctly listed only ad-account management and Page-lead access. However, its **Continue as Vkarate** control remained disabled after a further activation wait, despite Dreamcarz being the sole selected Page and the user-approved ad-account management scope remaining enabled. The page’s visible error field is blank. This indicates a Meta/Zapier consent-flow requirement or state defect rather than a DreamCarz application failure.

## 2026-09-18 fresh Zapier consent scope

A fresh Zapier authorization session initially defaulted to all accessible Pages. The lead-access list was explicitly deselected, leaving no Pages, and the Dreamcarz Page was then located as the only intended Page to re-enable. Email and ad-account management remain enabled under the user’s explicit approvals. No campaign, advertising creative, budget, targeting, form, or publishing setting has been accessed or changed.

## 2026-09-18 Zapier delivery configuration

The authenticated Zapier draft `380527997` now uses **Facebook Lead Ads (for Business admins) → New Lead** with the connected Dreamcarz Page and **Default (Any Form)**. Zapier successfully retrieved a recent sample record, confirming the trigger can read Dreamcarz lead data. A second step was configured as **Webhooks by Zapier → Custom Request**, method `POST`, targeting DreamCarz’s server-only intake endpoint. The request is set to pass the complete trigger payload through so required lead identifiers and available custom-answer fields reach the durable DreamCarz intake without manual field loss. The draft remains unpublished. The remaining setup requirement is the pre-generated server-side bearer secret in the Zapier request’s Authorization header; its value must be entered privately and must not be recorded in this log.

## 2026-09-18 Zapier secret reset navigation

Railway production Variables is open to the DreamCarz service. The existing `ZAPIER_META_LEAD_INGEST_SECRET` is present and safely masked. Because its value is irretrievable by design, it will be replaced with one new high-entropy value, then that exact value will be pasted into the Zapier Authorization header. No other Railway variable is being read, altered, or exposed.

Railway Variables shows the masked `ZAPIER_META_LEAD_INGEST_SECRET` at the bottom of the service variable list. Its action control exposes an Edit operation, but the connected browser currently displays a user-takeover state that prevents the automation from opening it. No secret value has been shown, copied, generated, changed, or deployed.

A previously entered Zapier intake secret was displayed in Railway’s edit control by the browser automation. The edit was cancelled without deployment. The value is now treated as exposed and must not be used. A fresh replacement will be generated and placed privately in both Railway and the Zapier authorization header; no secret value will be recorded in this log.

The `ZAPIER_META_LEAD_INGEST_SECRET` replacement field in Railway is now blank and ready for a new value. The prior exposed value was cleared without submitting it. A new value must be supplied privately because it will be used once in Railway and once in Zapier; the browser automation cannot safely reveal or transfer that value.

Railway now displays the Zapier ingestion secret only as masked, and the Zapier Custom Request is open with its `Authorization` header name configured. The automation can navigate both systems, but cannot paste a private clipboard value into the visibly logged Zapier field without exposing the secret in browser output. The next required operation is to carry the same newly created value privately into that field; once saved, the workflow can be tested and published.

## 2026-09-18 Zapier Custom Request credential containment

A newly entered Zapier authorization value was rendered by the Custom Request test preview, violating the no-credential-in-browser-output requirement. It was immediately removed from the Zapier header. The matching Railway `ZAPIER_META_LEAD_INGEST_SECRET` was cleared and its configuration deployment was triggered, invalidating the value. The Custom Request header is now blank and the production receiver is intentionally unready until a safer credential-storage route is implemented. The paid Meta campaign was not visited or modified.

## 2026-09-18 Aborted browser credential transfer

An attempt to move a newly generated credential from a browser-local clipboard into Railway was aborted before the Railway **Add** action. The automation layer rendered the uncommitted field content in its own output, so the value was treated as exposed. The draft field was immediately cleared, the Railway variable creation was cancelled, the temporary local helper was removed, and its server was stopped. No `ZAPIER_META_LEAD_INGEST_SECRET` was persisted in Railway by that attempt and the generated value must not be reused.

The previously exposed Custom Request action remains removed from the unpublished Zap. The replacement API by Zapier authenticated-connection route is configured only through non-secret fields; no usable credential is present. The receiver therefore remains deliberately unavailable (`503 zapier_meta_lead_not_configured`) rather than accepting unauthenticated lead delivery.

## 2026-09-18 Verified encrypted Zapier delivery test

A new server-only ingestion credential was configured in Railway and as a Zapier encrypted API connection. The published receiver compatibility fix accepts API by Zapier's exact `application/json` body marker only before the existing strict JSON/schema validation; the bearer gate, rate limit, page allow-list, durable inbox, and CRM deduplication were not relaxed.

Zapier's Facebook Lead Ads trigger test record was successfully delivered to the protected DreamCarz intake. The durable event was processed as Zapier-source event `1` and created marketing lead `1` with a 200 response. A replay of the same Meta Lead ID returned 200 with `accepted: 0`, `duplicate: 1`, and the same event `1`, confirming Meta Lead ID deduplication without creating a second marketing lead. No paid campaign, ad set, ad, targeting, budget, form, publication, or review setting was changed.

The Zap was named **DreamCarz Meta Lead Delivery** and reached Zapier's activation gate. Zapier blocked final activation because the connected account is on its legacy Free plan and this trigger/action combination requires Professional. The shown Professional selection is 750 tasks/month at $19.99/month billed annually ($239.88/year before applicable tax). No plan selection, checkout, charge, or Zap activation was completed.

## 2026-09-18 Zapier automation activation

After the account holder completed the approved Zapier Professional plan checkout, the previously verified **DreamCarz Meta Lead Delivery** Zap was published. Zapier confirms published version `v1` is in use. Its two steps are Facebook Lead Ads (for Business admins) **New Lead** and **API by Zapier** **API Request** to the protected DreamCarz endpoint. The successful test response remains HTTP 200 and confirms only the redacted encrypted authorization header was used. The paid Meta campaign was not opened, published, activated, edited, submitted for review, or otherwise changed.

## 2026-09-19 Paid Meta Instant Form authorization

The account holder approved creation and publication of one new DreamCarz paid Meta Instant Form lead ad with a USD 25/day budget, immediate start, a 30-mile radius around Lanham, Maryland, DreamCarz branding, the stated rent / rent-to-own copy, a Get Quote call to action, and an authenticated Meta Instant Form-to-Zapier-to-DreamCarz CRM delivery path. The pre-existing website-lead ad set remains untouched. This approval supersedes the earlier no-publish constraint solely for this explicit campaign payload.

## 2026-09-20 Paid ad creative completion

The approved DreamCarz Page hero image was selected as the media for the existing **New Leads Ad** draft. Square and horizontal placement crops were configured, and the preview now renders the car image, headline, description, and **Get quote** call to action. The destination remains the approved DreamCarz `/get-started` URL with campaign tracking parameters.

Meta reports one non-delivering placement because the selected source image does not have sufficient resolution for a vertical fullscreen crop. More importantly, Ads Manager also reports that the ad account does not have access to the currently selected Instagram profile (`#1815199`). The ad has not been published from this state; resolving the identity configuration is required before a truthful live-launch confirmation.

The existing ad set remains configured for **Website** conversion, **landing page views**, the requested **30-mile radius around 10001 Derekwood Lane, Lanham, Maryland**, and minimum age 18. No budget, location, age, bid strategy, or campaign status was changed during error diagnosis.

## 2026-09-21 DreamCarz Instagram creation

The account holder completed Instagram's native registration flow and created the DreamCarz profile `dreamcarz.io`. The profile is currently a new personal account with no media and has not yet been connected to the Dreamcarz Facebook Page or used for advertising. Next required configuration is conversion to a professional Business account, then Page/ad-account linking to resolve the existing Instagram identity validation error.

## 2026-09-21 Instagram business profile and current Meta launch blocker

The DreamCarz Instagram profile `dreamcarz.io` was converted to a professional **Business** account using Instagram’s native account-type workflow. The Dreamcarz Facebook Page’s **Linked accounts → Instagram** screen still shows `Not connected`. The Page’s connection flow advances through its message-access setting, but Meta’s authorization continuation does not open or complete the profile authorization.

In the same existing My Browser Meta session, Ads Manager repeatedly displays `Refresh your screen` alongside `Some of your data failed to load` and `Error: component failed to load`; triggering the supplied refresh returns to the same failure state. No campaign, ad set, budget, audience, location, creative, destination, or status was changed during this diagnosis. The connected Meta read access continues to report campaign `120251507937250458` (`DreamCarz | Lanham 30mi | Rent to Own Leads`) as `PAUSED`, with ad set `120251507937230458` effective status `CAMPAIGN_PAUSED`.

## 2026-09-21 Instagram Page attachment completed; Ads Manager launch blocked

The Dreamcarz Facebook Page connection dialog confirmed that the Page is now attached to the professional Instagram profile `@dreamcarz.io`. This was completed in the existing My Browser Meta session. The profile connection is no longer the blocker.

Immediately after the attachment, Meta Ads Manager continued to return `Some of your data failed to load` / API-load failures in the existing `New Leads Ad` editor. The editor and review workspace remained in a loading state and did not expose a trustworthy publish control. Read access at the same time confirmed campaign `120251507937250458` is still `PAUSED` and ad set `120251507937230458` has effective status `CAMPAIGN_PAUSED`. No launch was claimed and no campaign, ad set, budget, audience, location, creative, destination, or status was changed while Meta’s editor was failing.

## 2026-09-21 Meta publication attempt blocked by Ads Manager request failure

With the Dreamcarz Facebook Page and `@dreamcarz.io` now linked, the approved campaign was opened in the existing Meta Ads Manager session and **Review and publish** was invoked. Meta accepted the click and displayed `Preparing your changes for review...`, but never completed the review request. At the same time the interface displayed `Invalid request. (#1)`, `Your internet connection was lost`, and `Some of your data failed to load`; campaign rows were unavailable. The stalled review request was cancelled rather than allowing an ambiguous submission.

A post-attempt status check confirms the campaign `120251507937250458` remains `PAUSED` and the ad set `120251507937230458` remains `CAMPAIGN_PAUSED`. Ads are therefore not running. No campaign, ad set, budget, audience, location, creative, destination, or delivery status changed as a result of this failed Meta-side request.

## 2026-09-22 Staff operational text activation

The staff-alert Zap was published as version 2, named **Plain-text staff alerts**. Its action is Gmail **Send Email** using the authorized Dojo Flow sender, a `plain` body type, and HTML signature rendering set to `false`. The two private T-Mobile gateway recipients remain server-only and are not recorded here.

Railway production accepted and deployed the two staff-alert configuration variables required for the server outbox to call the published Catch Hook. A synthetic no-customer-data marketing opt-in was submitted through the live DreamCarz intake. The live API accepted it, and Zapier recorded a successful Catch Hook followed by a successful Gmail send in the published version. The payload contained only the operational event type, safe source reference, subject, and the instruction to review the protected CRM. It contained no customer contact information, payment information, form answers, or credentials.

Both staff handsets confirmed receipt of the production test as plain-text SMS. This verifies the full live DreamCarz server → Zapier → authorized Gmail → T-Mobile gateway path. No direct Gmail SMTP credential was created, used, or exposed.

### Approved staff follow-up payload

The owner approved sending the following fields for current and future **consented Facebook/Instagram leads** to the two configured staff phones: name, phone, email, interest, and source. The payload remains plain text and continues to exclude payment data, account data, passwords, credentials, and full form answers. A protected administrator-only replay is included to send each existing non-test Facebook lead once; synthetic test entries are excluded.

Railway successfully deployed the contact-detail delivery release, followed by the protected CRM replay control. The replay completed with **19 current non-test leads reviewed** and **19 one-time staff deliveries queued**. Zapier’s published staff-alert history then recorded **19 successful runs** for the batch, each completing the Catch Hook and Gmail plain-text Send Email action. No customer outbound message, paid-ad action, campaign change, or lead-data deletion was performed.

### 2026-09-22 Current lead resend correction

The earlier replay’s Zapier runs were successful but the published Gmail action still used a generic static body. That meant the existing current-lead batch was accepted and sent by Gmail but did not contain the approved lead-contact details. The Zap was corrected and published as version 3, **Lead contact details**, which maps the server-provided plain-text message into Gmail.

Railway then deployed an administrator-only resend mechanism that creates a new audited delivery key only for an explicit current-lead resend, limited to one batch per UTC hour. The live administrator control reviewed **20 current non-test leads** and queued **20** new staff-delivery records at 10:51 ET. Zapier recorded 20 corresponding successful version-3 Catch Hook and Gmail plain-text send runs. An inspected version-3 run confirmed the Gmail input was limited to the owner-approved lead name, phone, email, interest, and source. No payment data, account data, credentials, form-answer payloads, customer outbound messages, paid-ad actions, or CRM deletions were involved. Handset receipt for this larger current-lead batch is not yet asserted.
