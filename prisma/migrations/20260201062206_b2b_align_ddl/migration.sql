-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'invited', 'disabled');

-- AlterEnum
ALTER TYPE "AuditEventType" ADD VALUE 'reverse';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "VoucherCampaign" ALTER COLUMN "restrictionsJson" SET DEFAULT '{}';

-- CreateTable
CREATE TABLE "CampaignAllowedProduct" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "CampaignAllowedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignAllowedLocation" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "CampaignAllowedLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignAllowedProduct_productId_idx" ON "CampaignAllowedProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignAllowedProduct_campaignId_productId_key" ON "CampaignAllowedProduct"("campaignId", "productId");

-- CreateIndex
CREATE INDEX "CampaignAllowedLocation_locationId_idx" ON "CampaignAllowedLocation"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignAllowedLocation_campaignId_locationId_key" ON "CampaignAllowedLocation"("campaignId", "locationId");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- AddForeignKey
ALTER TABLE "CampaignAllowedProduct" ADD CONSTRAINT "CampaignAllowedProduct_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "VoucherCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignAllowedLocation" ADD CONSTRAINT "CampaignAllowedLocation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "VoucherCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
