# Pricing-to-Vehicle Production QA

The live production Pricing page is deployed at `/pricing`. It presents the membership enrollment charge and recurring monthly cost as the membership price, and explicitly states that vehicle terms are reviewed separately when a customer chooses Rent, Buy, or Reserve.

The Free plan’s **Explore matching vehicles** path was checked at `/fleet?access=entry&plan=free`. The Fleet page displayed the selected Free membership summary and Entry access filter together, while preserving the four confirmed Entry vehicles and the separately labeled Coming Soon reserve option.

From that filtered production Fleet view, a confirmed 2019 Chevrolet Malibu opened in the full vehicle dialog. Both **Rent this vehicle** and **Buy this vehicle** opened their respective request forms. Each form retained the selected plan summary—Free, $0 enrollment, no monthly fee—and explicitly stated that the membership price is separate from vehicle costs. No request was submitted during this production form-routing check.
