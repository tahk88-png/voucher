-- Composite indexes for the auto-expire cron's predicate
-- (`status='active' AND endDate < now` / `status='published' AND validTo < now`).
-- Without these the bulk-update step does a status-bucket scan that
-- degrades as campaign/voucher counts grow.

CREATE INDEX "Campaign_status_endDate_idx" ON "Campaign"("status", "endDate");

CREATE INDEX "Voucher_status_validTo_idx" ON "Voucher"("status", "validTo");
