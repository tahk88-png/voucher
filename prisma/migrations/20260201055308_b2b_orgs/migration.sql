-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('buyer', 'partner', 'platform_owner');

-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('owner', 'admin', 'finance', 'marketing', 'support', 'partner_cashier', 'auditor');

-- CreateEnum
CREATE TYPE "B2BCampaignStatus" AS ENUM ('draft', 'active', 'paused', 'archived');

-- CreateEnum
CREATE TYPE "B2BVoucherStatus" AS ENUM ('created', 'issued', 'active', 'redeemed', 'expired', 'voided');

-- CreateEnum
CREATE TYPE "VoucherValueType" AS ENUM ('fixed', 'percent');

-- CreateEnum
CREATE TYPE "VoucherUsageType" AS ENUM ('single', 'multi');

-- CreateEnum
CREATE TYPE "IssuedToType" AS ENUM ('company', 'person');

-- CreateEnum
CREATE TYPE "B2BOrderStatus" AS ENUM ('draft', 'submitted', 'invoiced', 'paid', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "B2BInvoiceStatus" AS ENUM ('issued', 'paid', 'voided', 'overdue');

-- CreateEnum
CREATE TYPE "B2BRedemptionStatus" AS ENUM ('approved', 'reversed', 'failed');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('system', 'user', 'partner_api');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('voucher', 'campaign', 'order', 'invoice', 'org', 'user', 'redemption');

-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('create', 'issue', 'activate', 'redeem', 'expire', 'void', 'refund', 'pause', 'resume', 'update');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "type" "OrgType" NOT NULL,
    "name" TEXT NOT NULL,
    "registryCode" TEXT,
    "vatNumber" TEXT,
    "billingEmail" TEXT,
    "status" "OrgStatus" NOT NULL DEFAULT 'active',
    "flagsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgMembership" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherCampaign" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "codePrefix" TEXT,
    "valueType" "VoucherValueType" NOT NULL,
    "valueAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "usageType" "VoucherUsageType" NOT NULL DEFAULT 'single',
    "maxRedemptionsPerVoucher" INTEGER,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "minPurchaseAmount" INTEGER,
    "status" "B2BCampaignStatus" NOT NULL DEFAULT 'draft',
    "restrictionsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoucherCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherInstance" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "codeHash" TEXT,
    "qrPayload" TEXT,
    "status" "B2BVoucherStatus" NOT NULL DEFAULT 'created',
    "issuedToType" "IssuedToType",
    "issuedToOrgId" TEXT,
    "issuedToEmail" TEXT,
    "initialValueAmount" INTEGER NOT NULL,
    "remainingValueAmount" INTEGER,
    "redeemedCount" INTEGER NOT NULL DEFAULT 0,
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoucherInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignAllowedPartner" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "partnerOrgId" TEXT NOT NULL,

    CONSTRAINT "CampaignAllowedPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "B2BOrder" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceAmount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "B2BOrderStatus" NOT NULL DEFAULT 'draft',
    "paymentProvider" TEXT,
    "paymentReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "B2BOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "B2BInvoice" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "dueAt" TIMESTAMP(3),
    "subtotalAmount" INTEGER NOT NULL,
    "vatAmount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "status" "B2BInvoiceStatus" NOT NULL DEFAULT 'issued',
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "B2BInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderVoucher" (
    "orderId" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,

    CONSTRAINT "OrderVoucher_pkey" PRIMARY KEY ("orderId","voucherId")
);

-- CreateTable
CREATE TABLE "VoucherRedemption" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "partnerOrgId" TEXT NOT NULL,
    "locationId" TEXT,
    "cashierUserId" TEXT,
    "amountRedeemed" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "B2BRedemptionStatus" NOT NULL DEFAULT 'approved',
    "idempotencyKey" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorType" "AuditActorType" NOT NULL DEFAULT 'user',
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "eventType" "AuditEventType" NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerApiKey" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "label" TEXT,
    "keyHash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE INDEX "OrgMembership_orgId_idx" ON "OrgMembership"("orgId");

-- CreateIndex
CREATE INDEX "OrgMembership_userId_idx" ON "OrgMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgMembership_orgId_userId_key" ON "OrgMembership"("orgId", "userId");

-- CreateIndex
CREATE INDEX "VoucherCampaign_orgId_idx" ON "VoucherCampaign"("orgId");

-- CreateIndex
CREATE INDEX "VoucherCampaign_status_idx" ON "VoucherCampaign"("status");

-- CreateIndex
CREATE INDEX "VoucherCampaign_validFrom_validTo_idx" ON "VoucherCampaign"("validFrom", "validTo");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherInstance_code_key" ON "VoucherInstance"("code");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherInstance_codeHash_key" ON "VoucherInstance"("codeHash");

-- CreateIndex
CREATE INDEX "VoucherInstance_orgId_idx" ON "VoucherInstance"("orgId");

-- CreateIndex
CREATE INDEX "VoucherInstance_campaignId_idx" ON "VoucherInstance"("campaignId");

-- CreateIndex
CREATE INDEX "VoucherInstance_status_idx" ON "VoucherInstance"("status");

-- CreateIndex
CREATE INDEX "VoucherInstance_codeHash_idx" ON "VoucherInstance"("codeHash");

-- CreateIndex
CREATE INDEX "CampaignAllowedPartner_partnerOrgId_idx" ON "CampaignAllowedPartner"("partnerOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignAllowedPartner_campaignId_partnerOrgId_key" ON "CampaignAllowedPartner"("campaignId", "partnerOrgId");

-- CreateIndex
CREATE INDEX "B2BOrder_orgId_idx" ON "B2BOrder"("orgId");

-- CreateIndex
CREATE INDEX "B2BOrder_campaignId_idx" ON "B2BOrder"("campaignId");

-- CreateIndex
CREATE INDEX "B2BOrder_status_idx" ON "B2BOrder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "B2BInvoice_orderId_key" ON "B2BInvoice"("orderId");

-- CreateIndex
CREATE INDEX "B2BInvoice_status_idx" ON "B2BInvoice"("status");

-- CreateIndex
CREATE INDEX "B2BInvoice_issuedAt_idx" ON "B2BInvoice"("issuedAt");

-- CreateIndex
CREATE INDEX "OrderVoucher_voucherId_idx" ON "OrderVoucher"("voucherId");

-- CreateIndex
CREATE INDEX "VoucherRedemption_voucherId_idx" ON "VoucherRedemption"("voucherId");

-- CreateIndex
CREATE INDEX "VoucherRedemption_partnerOrgId_idx" ON "VoucherRedemption"("partnerOrgId");

-- CreateIndex
CREATE INDEX "VoucherRedemption_createdAt_idx" ON "VoucherRedemption"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherRedemption_partnerOrgId_idempotencyKey_key" ON "VoucherRedemption"("partnerOrgId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "AuditEvent_orgId_idx" ON "AuditEvent"("orgId");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerApiKey_keyHash_key" ON "PartnerApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "PartnerApiKey_orgId_idx" ON "PartnerApiKey"("orgId");

-- AddForeignKey
ALTER TABLE "OrgMembership" ADD CONSTRAINT "OrgMembership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMembership" ADD CONSTRAINT "OrgMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherCampaign" ADD CONSTRAINT "VoucherCampaign_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherInstance" ADD CONSTRAINT "VoucherInstance_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherInstance" ADD CONSTRAINT "VoucherInstance_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "VoucherCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherInstance" ADD CONSTRAINT "VoucherInstance_issuedToOrgId_fkey" FOREIGN KEY ("issuedToOrgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignAllowedPartner" ADD CONSTRAINT "CampaignAllowedPartner_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "VoucherCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignAllowedPartner" ADD CONSTRAINT "CampaignAllowedPartner_partnerOrgId_fkey" FOREIGN KEY ("partnerOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "B2BOrder" ADD CONSTRAINT "B2BOrder_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "B2BOrder" ADD CONSTRAINT "B2BOrder_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "VoucherCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "B2BInvoice" ADD CONSTRAINT "B2BInvoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "B2BOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderVoucher" ADD CONSTRAINT "OrderVoucher_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "B2BOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderVoucher" ADD CONSTRAINT "OrderVoucher_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "VoucherInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "VoucherInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_partnerOrgId_fkey" FOREIGN KEY ("partnerOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_cashierUserId_fkey" FOREIGN KEY ("cashierUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerApiKey" ADD CONSTRAINT "PartnerApiKey_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
