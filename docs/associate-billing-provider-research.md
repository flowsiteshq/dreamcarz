# Associate Billing Provider Notes

## Verified provider capabilities

CoCard describes hosted payments, stored payment methods, and recurring payment plans as supported billing features. Its hosted-payment option keeps card entry on the provider surface rather than in the DreamCarz application.[1]

NMI's recurring-billing documentation states that its Payment API supports creating recurring plans and attaching subscriptions to customers. Its Customer Vault documentation describes tokenized vault identifiers for future billing without storing card data in the merchant application.[2][3]

## Implementation boundary

The $149 Associate enrollment payment should use provider-hosted checkout. The $49 monthly subscription should be created only after provider verification of the initial enrollment payment and use a server-only recurring-billing credential. DreamCarz must store only opaque provider references and lifecycle state—not card numbers, CVV values, or expiration dates.

NMI's Collect Checkout documentation confirms that a hosted sale can request Customer Vault creation and return opaque transaction and vault identifiers only through a configured success URL. Product SKUs must exist in the merchant Product Manager before checkout. Its subscription specification defines `plan_payments: 0` as billing until cancelled, with `month_frequency: 1` and a billing day for monthly cadence.[4][5][6]

## References

[1]: https://www.cocard.com/billing-solutions
[2]: https://support.nmi.com/hc/en-gb/articles/14525725002385-API-Recurring-Payments-and-Subscriptions
[3]: https://docs.nmi.com/docs/customer-vault
[4]: https://docs.nmi.com/docs/advanced-integration
[5]: https://support.nmi.com/hc/en-gb/articles/15424728733073-Product-Manager-via-API
[6]: https://docs.nmi.com/reference/subscriptions-management
