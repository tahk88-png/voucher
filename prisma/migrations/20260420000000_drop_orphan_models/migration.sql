-- Drop HealthCheckLog — a speculative audit table that was never
-- wired up: grep across the repo finds zero `prisma.healthCheckLog.*`
-- calls, no relations from other models, and no seed data. The live
-- `/api/health` endpoint reports health synchronously from upstream
-- checks; nothing persisted a history row. Keeping the empty table
-- costs backup size and schema cognitive load with no payoff.
--
-- Previously this migration also proposed dropping CheckoutIntent.
-- An audit pass caught `app/api/commerce/checkout/route.ts:44`
-- actively creating rows in it, so it stays.

DROP TABLE IF EXISTS "HealthCheckLog";
