# DreamCarz Concierge BUY Shopper Profile Release

**Release date:** September 28, 2026  
**Production status:** Deployed successfully to the DreamCarz Railway service. The public Concierge route returned HTTP 200 and the served Concierge bundle contains the shopper-profile persistence and adaptive price-question logic.

## Scope preserved

The existing DreamCarz Concierge interface was retained:

- Black, white, and gold design system
- Left navigation and conversation layout
- Saved rental panel and rental journey
- Existing vehicle cards and account/enrollment actions

The change is focused on BUY-journey intelligence and does **not** automatically select a vehicle, create a finance application, or make claims about unverified inventory details.

## 1. Cause of repeated questions

The old BUY experience combined a fixed guided sequence with ad hoc conversation state. It could render a stale prompt separately from the current conversation and did not keep all buyer requirements in one reusable profile. As a result, a later message could trigger a question that had already been answered.

The duplicate guided prompt was removed. BUY messages now pass through a single profile extraction and next-question decision path before the interface renders a follow-up.

## 2. Shopper Profile storage

The active BUY journey now uses a structured `ShopperProfile` containing:

| Area | Examples captured |
| --- | --- |
| Vehicle | body style, preferred make/model, color, condition |
| Driving fit | sporty/comfort/practical preference, use case, passenger/cargo needs |
| Budget | price vs. monthly method, target price/payment, down payment, trade-in |
| Constraints | maximum mileage and requested features |
| Timing | location and purchase timeline |

For the active browser journey, the profile and separate journey state are saved in `sessionStorage` under a DreamCarz-specific key. This preserves the conversation through navigation or reload during that active session without storing a customer's free-form messages as a financing application.

## 3. Natural-language attribute extraction

Each BUY message is parsed for multiple attributes before any new prompt is selected. A single statement such as:

> “I need a pre-owned premium SUV under $45,000, preferably black, under 50,000 miles, and something fun to drive.”

updates condition, body style, positioning, price cap, color, mileage cap, and driving preference together. Existing values remain unless the buyer explicitly changes or refines one.

## 4. Next-best-question selection

The Concierge evaluates the current profile after every BUY message and asks only the highest-value unanswered item. It does not follow a fixed body-style → condition → budget sequence.

A budget method is intentionally different from a budget amount:

- “I’d rather shop by total price” sets the method to **purchase price**.
- Because no price cap has been supplied, the immediate follow-up is: **“What price range would you like me to stay within?”**
- Once a price is given, the Concierge does not ask for the budget method again.

Contextual quick actions feed the same profile engine as typed messages.

## 5. Inventory filtering and ranking

The ranking engine separates requirements into two groups:

- **Hard constraints:** confirmed body style, price cap, mileage cap, condition, seating capacity, and required features.
- **Soft preferences:** color, premium/value preference, sporty/comfort preference, brand preference, cargo preference, and similar priorities.

A soft preference cannot override a verified hard constraint. If a required inventory field is absent from the confirmed DreamCarz record, the vehicle is not described as meeting that requirement; the result displays it as needing verification.

## 6. DreamCarz Match Score

The match score is deterministic and only appears when at least two relevant criteria are actually verifiable from confirmed inventory data.

```
match score = verified matched criteria ÷ verified applicable criteria
```

If the record lacks enough verified data, the score is withheld rather than fabricated. Result cards show the confirmed reasons for inclusion and explicit trade-offs or items needing verification.

## 7. Duplicate-question prevention

The question selector checks the persisted profile before producing a prompt. It suppresses questions for values already known, including:

- Vehicle type when body style is already supplied
- New/pre-owned when condition is already supplied
- Price vs. monthly method when the budget method is already supplied
- A price or payment range only after the corresponding method was chosen but its amount is still unknown

## 8. Premature-selection prevention

Ranked inventory produces reviewable recommendations only. The BUY journey moves into `RESULTS` without setting `selectedVehicleId`.

A vehicle becomes selected only after the customer explicitly chooses the vehicle through an intentional selection action. Viewing details, comparing, saving, asking about a vehicle, or seeing a match does not select it.

## 9. Acceptance validation

| Scenario | Verified outcome |
| --- | --- |
| Sequential BUY conversation | After SUV + premium/fun + pre-owned + total-price method, the next question is the price range. After a $45,000 cap, the existing SUV, pre-owned, premium/fun, and purchase-price preferences remain and initial results become eligible. |
| Single-message profile | The supplied pre-owned premium SUV message extracts body style, condition, premium positioning, sporty preference, price cap, black preference, and mileage cap together. It does not ask one question per supplied attribute. |
| Hard-constraint ranking | A verified under-budget SUV is retained while a verified over-budget SUV and a non-SUV are excluded. The deterministic test case returns a 100% verified match only from confirmed criteria. |
| No automatic selection | Recommendations do not contain or create a selected vehicle ID. Selection occurs only through the explicit vehicle action. |
| Refinement | “Those are too expensive. Anything black?” retains all prior preferences, keeps black as a preference, clears only the price cap, and asks for the replacement price range. |

## Validation completed

- `pnpm check` — passed
- Focused Concierge tests — **27 passed** across 3 files
- `pnpm build` — passed
- `git diff --check` — passed
- Desktop and mobile preview — visually checked
- Railway deployment `40e02c79-384b-4a8b-b3b7-061f5a4564ea` — **SUCCESS**
- Public production route — HTTP 200; deployed Concierge bundle verified for shopper-profile markers
