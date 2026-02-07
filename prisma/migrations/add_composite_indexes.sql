-- Composite indexes for improved query performance
-- Run this migration after deploying the code changes

-- VoucherPurchase: frequently queried by merchantId + status + createdAt
CREATE INDEX IF NOT EXISTS "VoucherPurchase_merchantId_status_createdAt_idx"
ON "VoucherPurchase" ("merchantId", "status", "createdAt" DESC);

-- VoucherPurchase: queried by userId + merchantId for user's purchase history
CREATE INDEX IF NOT EXISTS "VoucherPurchase_userId_merchantId_idx"
ON "VoucherPurchase" ("userId", "merchantId");

-- Redemption: queried by merchantId + status + createdAt for merchant dashboard
CREATE INDEX IF NOT EXISTS "Redemption_merchantId_status_createdAt_idx"
ON "Redemption" ("merchantId", "status", "createdAt" DESC);

-- Redemption: queried by userId + merchantId for user redemption history
CREATE INDEX IF NOT EXISTS "Redemption_userId_merchantId_idx"
ON "Redemption" ("userId", "merchantId");

-- CreditLedger: queried by userId + merchantId + status for balance calculation
CREATE INDEX IF NOT EXISTS "CreditLedger_userId_merchantId_status_idx"
ON "CreditLedger" ("userId", "merchantId", "status");

-- CreditLedger: queried by merchantId + status + expiresAt for expiry warnings
CREATE INDEX IF NOT EXISTS "CreditLedger_merchantId_status_expiresAt_idx"
ON "CreditLedger" ("merchantId", "status", "expiresAt");

-- Referral: queried by referrerUserId + status for referral tracking
CREATE INDEX IF NOT EXISTS "Referral_referrerUserId_status_idx"
ON "Referral" ("referrerUserId", "status");

-- Referral: queried by friendHash for redemption lookup
CREATE INDEX IF NOT EXISTS "Referral_friendHash_status_idx"
ON "Referral" ("friendHash", "status");

-- Campaign: queried by merchantId + status + dates for active campaigns
CREATE INDEX IF NOT EXISTS "Campaign_merchantId_status_startDate_idx"
ON "Campaign" ("merchantId", "status", "startDate" DESC);

-- Voucher: queried by merchantId + status for merchant voucher list
CREATE INDEX IF NOT EXISTS "Voucher_merchantId_status_idx"
ON "Voucher" ("merchantId", "status");

-- Voucher: queried by campaignId + status for campaign vouchers
CREATE INDEX IF NOT EXISTS "Voucher_campaignId_status_idx"
ON "Voucher" ("campaignId", "status");

-- AuditLog: queried by merchantId + createdAt for merchant audit trail
CREATE INDEX IF NOT EXISTS "AuditLog_merchantId_createdAt_idx"
ON "AuditLog" ("merchantId", "createdAt" DESC);

-- AuditLog: queried by actorUserId + action for user activity tracking
CREATE INDEX IF NOT EXISTS "AuditLog_actorUserId_action_createdAt_idx"
ON "AuditLog" ("actorUserId", "action", "createdAt" DESC);

-- TicketPurchase: queried by merchantId + status + eventId
CREATE INDEX IF NOT EXISTS "TicketPurchase_merchantId_status_eventId_idx"
ON "TicketPurchase" ("merchantId", "status", "eventId");

-- TicketPurchase: queried by userId + eventId for user tickets
CREATE INDEX IF NOT EXISTS "TicketPurchase_userId_eventId_idx"
ON "TicketPurchase" ("userId", "eventId");

-- Notification: queried by userId + read + createdAt for user notifications
CREATE INDEX IF NOT EXISTS "Notification_userId_read_createdAt_idx"
ON "Notification" ("userId", "read", "createdAt" DESC);

-- MerchantMember: queried by merchantId + status for member list
CREATE INDEX IF NOT EXISTS "MerchantMember_merchantId_status_idx"
ON "MerchantMember" ("merchantId", "status");
