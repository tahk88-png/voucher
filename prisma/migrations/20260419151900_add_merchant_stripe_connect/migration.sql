-- Phase 2: Stripe Connect (merchant payouts).
--
-- Adds the three Connect-related columns to Merchant. All three are
-- nullable / default-false so this migration is backwards-compatible
-- with existing unconnected merchants (direct-charge flow still works).
--
-- `stripeAccountId` is UNIQUE — each acct_... maps to exactly one merchant.

-- AlterTable
ALTER TABLE "Merchant"
  ADD COLUMN "stripeAccountId"     TEXT,
  ADD COLUMN "stripeAccountStatus" TEXT DEFAULT 'pending',
  ADD COLUMN "payoutsEnabled"      BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_stripeAccountId_key" ON "Merchant"("stripeAccountId");
