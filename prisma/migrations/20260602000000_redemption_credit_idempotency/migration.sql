-- Idempotency + expiry-cron support for the credit/referral & commerce-confirm flows.

-- Commerce-confirm webhook idempotency: two concurrent deliveries with the
-- same orderReference can no longer both create a redemption (and double
-- unlock referral credit). orderReference is nullable; Postgres treats NULLs
-- as distinct, so in-store / API redemptions that don't set it are unaffected.
CREATE UNIQUE INDEX "Redemption_merchantId_orderReference_key"
  ON "Redemption"("merchantId", "orderReference");

-- Auto-expire cron filter: (status='available', expiresAt < now).
CREATE INDEX "CreditLedger_status_expiresAt_idx"
  ON "CreditLedger"("status", "expiresAt");

-- Referral-unlock lookup: (source, sourceId, status='locked').
CREATE INDEX "CreditLedger_sourceId_status_idx"
  ON "CreditLedger"("sourceId", "status");
