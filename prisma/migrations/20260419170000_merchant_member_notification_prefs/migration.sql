-- Add per-member notification preferences as JSONB so we can add new
-- categories (e.g. "fraud_alert", "payout_failed") without migrations.
ALTER TABLE "MerchantMember"
  ADD COLUMN "notificationPrefs" JSONB DEFAULT '{}'::jsonb;
