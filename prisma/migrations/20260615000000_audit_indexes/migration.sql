-- Indexes surfaced by the full-domain performance/data-integrity audit.
-- All are additive (no data change). They serve hot filters that currently
-- fall back to sequential scans as the tables grow.

-- Redemption: commerce-confirm + revoke filter by orderReference alone; the
-- composite unique (merchantId, orderReference) leads with merchantId so it
-- cannot serve that lookup.
CREATE INDEX "Redemption_orderReference_idx" ON "Redemption"("orderReference");

-- Purchase tables: admin revenue/analytics group + range-filter by createdAt.
CREATE INDEX "VoucherPurchase_createdAt_idx" ON "VoucherPurchase"("createdAt");
CREATE INDEX "GiftCardPurchase_createdAt_idx" ON "GiftCardPurchase"("createdAt");
CREATE INDEX "TicketPurchase_createdAt_idx" ON "TicketPurchase"("createdAt");

-- User: growth analytics range-filter by signup date.
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- FK indexes (Postgres does not auto-index foreign keys).
CREATE INDEX "ModerationAction_reportId_idx" ON "ModerationAction"("reportId");
CREATE INDEX "PayoutRecord_settlementBatchId_idx" ON "PayoutRecord"("settlementBatchId");
