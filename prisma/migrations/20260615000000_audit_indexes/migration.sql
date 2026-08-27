-- Indexes surfaced by the full-domain performance/data-integrity audit.
-- All are additive (no data change). They serve hot filters that currently
-- fall back to sequential scans as the tables grow.

-- Redemption: commerce-confirm + revoke filter by orderReference alone; the
-- composite unique (merchantId, orderReference) leads with merchantId so it
-- cannot serve that lookup.
CREATE INDEX IF NOT EXISTS "Redemption_orderReference_idx" ON "Redemption"("orderReference");

-- Purchase tables: admin revenue/analytics group + range-filter by createdAt.
CREATE INDEX IF NOT EXISTS "VoucherPurchase_createdAt_idx" ON "VoucherPurchase"("createdAt");
CREATE INDEX IF NOT EXISTS "GiftCardPurchase_createdAt_idx" ON "GiftCardPurchase"("createdAt");
CREATE INDEX IF NOT EXISTS "TicketPurchase_createdAt_idx" ON "TicketPurchase"("createdAt");

-- User: growth analytics range-filter by signup date.
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");

-- FK indexes (Postgres does not auto-index foreign keys).
CREATE INDEX IF NOT EXISTS "ModerationAction_reportId_idx" ON "ModerationAction"("reportId");
CREATE INDEX IF NOT EXISTS "PayoutRecord_settlementBatchId_idx" ON "PayoutRecord"("settlementBatchId");
