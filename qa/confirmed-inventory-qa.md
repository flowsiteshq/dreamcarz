# Confirmed Inventory QA

## Public fleet

The public `/fleet` page displayed exactly eight cards: 2024 Chevrolet Malibu (Gray), 2022 Chevrolet Traverse (White), 2024 Ford Fusion (Gray), 2020 Chevrolet Traverse (Gray), 2019 Chevrolet Malibu (Black), 2015 Ford Taurus (Gray), 2020 Chevrolet Equinox (Gray), and 2020 Chevrolet Equinox (Black). Every card stated that DreamCarz must confirm rental or sale options.

## Authenticated My Vehicles

The signed-in `/dashboard/vehicles` page displayed the same eight confirmed vehicles without fabricated current rentals, reservations, wishlists, pricing, dates, mileage, rewards, or vehicle availability claims.

## Vehicle detail

The public detail page for the 2024 Chevrolet Malibu displayed only the user-confirmed year, make, model, color, and sedan type. It explicitly excluded assumed prices, program fees, values, estimates, and technical specifications pending DreamCarz confirmation.

## Authenticated reservations

The signed-in Reservations page displayed no unsupported vehicle records and no estimated weekly fees. Its empty state correctly directs members to Rental Setup and the confirmed vehicle experience; future reservation entries are filtered to the confirmed vehicle names and use a neutral vehicle icon instead of a generic image.
