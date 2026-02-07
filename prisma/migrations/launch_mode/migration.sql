-- Launch Mode Migration
-- Adds isActive (kill switch) and featureFlags to Merchant model
-- Run with: npx prisma migrate dev --name launch_mode

-- Add isActive column (kill switch)
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Add featureFlags column (JSON for per-merchant feature flags)
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "featureFlags" JSONB;

-- Add invitedAt column (track manual invites)
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "invitedAt" TIMESTAMP(3);

-- Add onboardedAt column (track onboarding completion)
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "onboardedAt" TIMESTAMP(3);

-- Create index for isActive (for filtering active merchants)
CREATE INDEX IF NOT EXISTS "Merchant_isActive_idx" ON "Merchant"("isActive");

-- Set all existing merchants as active
UPDATE "Merchant" SET "isActive" = true WHERE "isActive" IS NULL;
