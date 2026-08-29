# User-Provided Pricing Source Review

Source reviewed: <https://dream-carz-pathway.ceparr1.chatgpt.site/>

## Verified information

The source describes an eight-level membership ladder: Free, Freedom, Plus, Pro, Elite, Silver, Gold, and Black. The rendered Plus plan specifically states a **$499 enrollment** and **$99 monthly** charge. The source also explicitly states that membership fees are separate from vehicle activation, rental, subscription, lease-to-own, insurance, taxes, and other vehicle charges unless expressly stated.

This separation is the core pricing design requirement for DreamCarz: customers must never mistake their recurring membership selection for the cost to access, rent, lease, or buy a particular vehicle. The source does not expose a complete current vehicle-specific rate sheet in its rendered pricing section. Accordingly, no vehicle-specific rental, purchase, activation, subscription, or lease-to-own amount will be invented or published until it is confirmed.

## Implementation direction

The redesigned experience will use a **two-part, one-flow layout**:

1. **Monthly Membership** — recurring plan selection, with its enrollment and monthly cost clearly labeled.
2. **Vehicle Access Cost** — shown after a customer chooses a vehicle and path (rent, subscribe, lease-to-own, or buy), with separate one-time, recurring, and applicable vehicle charges displayed before request confirmation.

An order-summary rail will label the two categories independently: **Membership today** and **Vehicle access after selection**. A customer can opt into a membership without implying that a vehicle is included, or browse vehicle access without concealing the membership requirement.
