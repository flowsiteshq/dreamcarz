# Railway Production Launch Blocker

## Verified on Railway

On the DreamCarz production service Variables page, Railway reports **No Environment Variables**. The only listed values are Railway-provided system variables.

## Effect

The direct DreamCarz authentication backend requires `DATABASE_URL` to reach the existing MySQL/TiDB database. Without it, both member registration and sign-in return the application’s account-unavailable path.

## Required next action

Add the **existing** DreamCarz MySQL/TiDB connection string as Railway’s `DATABASE_URL`, then redeploy and verify registration and sign-in. Do not create or substitute a new database, because the user selected the existing-data route.
