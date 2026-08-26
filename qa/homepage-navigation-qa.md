# Homepage Navigation QA

The incorrect destination position was caused by client-side route changes preserving the prior page scroll position. A user who clicked a lower homepage action could therefore arrive on the correct destination while still viewing its lower section.

The application now resets the browser scroll position to the top on each Wouter location change. The primary hero **Browse inventory** action was checked, then the bottom-page **Browse inventory** action was checked after scrolling to the footer. Both routes opened `/fleet`; after the route settled, the Fleet heading and first row of confirmed vehicles appeared at the top of the destination page.

The homepage retains direct paths for membership, Associate Path, Fleet Partners, each confirmed vehicle, rental, purchase, contact, and My Account. The navigation correction does not change the existing route destinations or vehicle workflows.

## Complete homepage action audit

The homepage action matrix is now covered at source level and protected by automated tests. The hero and closing inventory actions target `/fleet`; the hero membership action targets `/membership`; the pathway data targets the Member, Associate, and Fleet Partner destinations; each inventory card targets its own `/vehicle?id=...` detail page; and the support action targets `/contact`. The authenticated closing action uses `/dashboard`, while an unauthenticated visitor is directed to `/login`.

The prompt bar maps vehicle, rental, and purchase requests to Fleet; membership requests to Membership; Associate or Partner requests to Opportunity; and any other account-intent request to My Account or Login. The prompt suggestion chips intentionally populate the prompt field before **Find my path** submits the selected intent. Every route change uses the global top-of-page reset.

Manual browser regression testing covered the primary hero inventory action and the bottom-page inventory action after scrolling to the footer. Both opened Fleet, and a subsequent page check confirmed the destination settled at its top heading rather than retaining the old footer scroll position.

## Action matrix

| Action family | Expected destination or state | Verification |
|---|---|---|
| Hero and closing inventory actions | Fleet at top | Manually tested from both the hero and footer positions. |
| Hero membership action | Membership at top | Manually tested; Membership opened at its heading. |
| Prompt bar and suggestion intents | Fleet, Membership, Opportunity, or My Account/Login by entered intent | Source-level routing test plus manual Associate Path prompt submission. |
| Member, Associate, and Fleet Partner pathway cards | Membership or Opportunity at top | Structured-path route coverage test. |
| Confirmed inventory cards | Matching vehicle detail experience | Template route coverage test; the same vehicle-detail route was previously verified with full-screen, rent, and purchase actions. |
| Support CTA | Contact at top | Direct `/contact` action route coverage test. |
| Auth CTA | My Account for authenticated visitors; Login otherwise | Auth-aware route coverage test. |

The action test asserts every homepage route expression and the global scroll-reset component. Combined with the browser checks of the top, bottom, membership, and prompt-path actions, the audit confirms the reported bottom-of-page retention issue is corrected across the shared route pattern.

Additional browser checks confirmed a prompt chip populates the prompt field, **Find my path** sends the selected inventory intent to Fleet, and a vehicle action opens the full-screen Chevrolet Malibu viewer with its direct rent and buy choices. The visible inventory workflow opens as a dialog by design, rather than changing to an unrelated lower page section.

The closing **Go to My Account** action was tested from the homepage footer and opened the authenticated My Account dashboard. The dashboard loaded its title and member process content rather than retaining the footer position. Together with the footer Browse inventory, hero membership, prompt, and vehicle-viewer checks, this confirms route destinations and in-page workflows no longer strand the visitor at the prior page bottom.
