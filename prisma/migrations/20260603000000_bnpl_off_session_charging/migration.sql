-- BNPL off-session installment charging.
--
-- The installment cron charges later installments while the user is away, so
-- each plan must carry a reusable Stripe Customer + a saved (off-session
-- capable) PaymentMethod, plus the real currency to charge. Previously the
-- cron hardcoded the currency from a truthy `merchant.name` check and never
-- had a customer/payment method to confirm against, so no installment past
-- the first could ever be charged.

-- Currency actually charged on every installment. Defaulted to 'usd' only so
-- the column can be added non-null to any pre-existing rows; the create route
-- always writes the plan's real (voucher- or request-derived) currency.
-- IF NOT EXISTS throughout: 20260602500000_add_missing_schema_objects creates
-- "InstallmentPlan" from the current schema, so on a fresh database these
-- columns already exist by the time this migration runs. Matches the
-- idempotent style already used by the launch_mode migration.
ALTER TABLE "InstallmentPlan" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'usd';

-- Saved payment method the cron charges off-session for installments 2..N.
ALTER TABLE "InstallmentPlan" ADD COLUMN IF NOT EXISTS "stripePaymentMethodId" TEXT;

-- One reusable Stripe Customer per user. Saved payment methods attach here so
-- repeat BNPL plans reuse the same customer instead of orphaning a new one.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
CREATE INDEX IF NOT EXISTS "User_stripeCustomerId_idx" ON "User"("stripeCustomerId");
