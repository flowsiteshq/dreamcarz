# Coming Soon Reserve QA

The fleet now separates current confirmed inventory from representative Coming Soon options. The current owned-vehicle list remains unchanged: the eight user-confirmed Chevrolet and Ford vehicles are displayed only under **Confirmed DreamCarz inventory**.

The new reserve options fill access-level gaps without being represented as owned inventory: 2021 Nissan Altima for Entry; 2022 Toyota Camry XSE for Mid-Range; and 2024 Tesla Model 3 plus 2023 Mercedes-Benz E-Class for Elite. Each card and full-screen view carries the visible **Coming Soon** label, states that it is not current DreamCarz inventory, and offers **Reserve your vehicle** rather than rent or purchase.

Direct browser verification of `/fleet?access=elite` confirmed the level filter shows one confirmed vehicle plus two Coming Soon reserve options. Opening the Tesla card rendered its full-screen view and the clearly labeled reserve action, while withholding any unsupported availability, price, or financing promise. The reserve workflow is backed by the new `reserve` inquiry type and router-level tests.
