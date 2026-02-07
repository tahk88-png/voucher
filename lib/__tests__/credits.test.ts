import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { unlockCreditForRedemption, getCreditBalance, applyCredit } from '../credits';

const prisma = new PrismaClient();

describe('Credits', () => {
  let merchantId: string;
  let userId: string;
  let voucherId: string;
  let redemptionId: string;

  beforeEach(async () => {
    const runId = randomUUID();
    const merchantSlug = `test-merchant-${runId}`;
    const userEmail = `test-${runId}@example.com`;

    // Create test data
    const merchant = await prisma.merchant.create({
      data: {
        name: 'Test Merchant',
        slug: merchantSlug,
        country: 'US',
        defaultCurrency: 'USD',
      },
    });
    merchantId = merchant.id;

    const user = await prisma.user.create({
      data: {
        email: userEmail,
        name: 'Test User',
      },
    });
    userId = user.id;

    const voucher = await prisma.voucher.create({
      data: {
        merchantId,
        status: 'published',
        type: 'fixed_amount',
        value: 500,
        currency: 'USD',
        validFrom: new Date(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    voucherId = voucher.id;

    const referral = await prisma.referral.create({
      data: {
        voucherId,
        merchantId,
        referrerUserId: userId,
        friendHash: 'test_hash',
        status: 'created',
      },
    });

    const redemption = await prisma.redemption.create({
      data: {
        voucherId,
        merchantId,
        referralId: referral.id,
        method: 'online',
        amountBeforeDiscount: 10000,
        discountApplied: 500,
        currency: 'USD',
        confirmedAt: null,
      },
    });
    redemptionId = redemption.id;

    // Create locked credit
    await prisma.creditLedger.create({
      data: {
        merchantId,
        userId,
        amount: 500,
        currency: 'USD',
        status: 'locked',
        source: 'referral_redemption',
        sourceId: redemptionId,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    });
  });

  it('should unlock credit after redemption confirmation', async () => {
    await prisma.redemption.update({
      where: { id: redemptionId },
      data: { confirmedAt: new Date() },
    });

    await unlockCreditForRedemption(redemptionId, merchantId);

    const credit = await prisma.creditLedger.findFirst({
      where: {
        merchantId,
        userId,
        sourceId: redemptionId,
      },
    });

    expect(credit?.status).toBe('available');
  });

  it('should get credit balance', async () => {
    const balance = await getCreditBalance(userId, merchantId);
    expect(balance.locked).toBe(500);
    expect(balance.available).toBe(0);
    expect(balance.total).toBe(500);
  });

  it('should apply credit to order', async () => {
    // First unlock credit
    await prisma.creditLedger.updateMany({
      where: {
        merchantId,
        userId,
        status: 'locked',
      },
      data: { status: 'available' },
    });

    await applyCredit(userId, merchantId, 500, 'ORD-001');

    const credit = await prisma.creditLedger.findFirst({
      where: {
        merchantId,
        userId,
      },
    });

    expect(credit?.status).toBe('used');
  });

  // Cleanup
  afterEach(async () => {
    await prisma.creditUsage.deleteMany({ where: { merchantId } });
    await prisma.creditLedger.deleteMany({ where: { merchantId } });
    await prisma.redemption.deleteMany({ where: { merchantId } });
    await prisma.referral.deleteMany({ where: { merchantId } });
    await prisma.voucher.deleteMany({ where: { merchantId } });
    await prisma.merchantMember.deleteMany({ where: { merchantId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.merchant.deleteMany({ where: { id: merchantId } });
  });
});
