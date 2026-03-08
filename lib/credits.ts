import { prisma } from './prisma';
import { sendCreditUnlocked } from './emails';
import { logger } from './logger';

/**
 * Unlock credit after redemption confirmation
 */
export async function unlockCreditForRedemption(
  redemptionId: string,
  merchantId: string
): Promise<void> {
  const redemption = await prisma.redemption.findUnique({
    where: { id: redemptionId },
    include: {
      referral: {
        include: {
          referrer: true,
        },
      },
    },
  });

  if (!redemption || !redemption.referral) {
    throw new Error('Redemption not found or has no referral');
  }

  if (redemption.merchantId !== merchantId) {
    throw new Error('Merchant mismatch');
  }

  // Find locked credit for this redemption
  const lockedCredit = await prisma.creditLedger.findFirst({
    where: {
      merchantId,
      source: 'referral_redemption',
      sourceId: redemptionId,
      status: 'locked',
    },
  });

  if (!lockedCredit) {
    // Credit might already be unlocked or doesn't exist
    return;
  }

  // Unlock the credit
  await prisma.creditLedger.update({
    where: { id: lockedCredit.id },
    data: {
      status: 'available',
    },
  });

  // Send email notification
  if (redemption.referral.referrer.email) {
    try {
      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        select: { name: true, slug: true },
      });

      if (merchant) {
        // Get updated balance
        const balance = await getCreditBalance(redemption.referral.referrerUserId, merchantId);
        const walletUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app/${merchant.slug}/wallet`;

        await sendCreditUnlocked({
          to: redemption.referral.referrer.email,
          merchantName: merchant.name,
          creditAmount: (lockedCredit.amount / 100).toFixed(2),
          currency: lockedCredit.currency.toUpperCase(),
          totalBalance: (balance.total / 100).toFixed(2),
          walletUrl,
        });
      }
    } catch (error) {
      // Don't fail unlock if email fails
      logger.error('Error sending credit unlocked email', { error: error instanceof Error ? error.message : String(error) });
    }
  }
}

/**
 * Get user's credit balance for a merchant
 */
export async function getCreditBalance(
  userId: string,
  merchantId: string
): Promise<{
  available: number;
  locked: number;
  total: number;
  currency: string;
  credits: Array<{
    id: string;
    amount: number;
    status: string;
    expiresAt: Date | null;
    createdAt: Date;
  }>;
}> {
  const credits = await prisma.creditLedger.findMany({
    where: {
      userId,
      merchantId,
      status: {
        in: ['available', 'locked'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const available = credits
    .filter((c) => c.status === 'available')
    .reduce((sum, c) => sum + c.amount, 0);

  const locked = credits
    .filter((c) => c.status === 'locked')
    .reduce((sum, c) => sum + c.amount, 0);

  const currency = credits[0]?.currency || 'USD';

  return {
    available,
    locked,
    total: available + locked,
    currency,
    credits: credits.map((c) => ({
      id: c.id,
      amount: c.amount,
      status: c.status,
      expiresAt: c.expiresAt,
      createdAt: c.createdAt,
    })),
  };
}

/**
 * Apply credit to an order
 */
export async function applyCredit(
  userId: string,
  merchantId: string,
  amount: number,
  orderReference: string
): Promise<{ success: boolean; creditIds: string[] }> {
  // Get available credits (oldest first to use expiring credits first)
  const availableCredits = await prisma.creditLedger.findMany({
    where: {
      userId,
      merchantId,
      status: 'available',
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    orderBy: [
      { expiresAt: 'asc' }, // Use expiring credits first
      { createdAt: 'asc' },
    ],
  });

  let remaining = amount;
  const creditIds: string[] = [];
  const creditsToUse: Array<{ id: string; amount: number }> = [];

  for (const credit of availableCredits) {
    if (remaining <= 0) break;

    const useAmount = Math.min(remaining, credit.amount);
    creditsToUse.push({ id: credit.id, amount: useAmount });
    creditIds.push(credit.id);
    remaining -= useAmount;
  }

  if (remaining > 0) {
    throw new Error('Insufficient credit balance');
  }

  // Use transaction to atomically update credits and create usage record
  await prisma.$transaction(async (tx) => {
    // Mark credits as used (or partially used)
    for (const { id, amount: useAmount } of creditsToUse) {
      const credit = await tx.creditLedger.findUnique({
        where: { id },
      });

      if (!credit) continue;

      if (useAmount === credit.amount) {
        // Fully used
        await tx.creditLedger.update({
          where: { id },
          data: { status: 'used' },
        });
      } else {
        // Partially used - create new ledger entry for remaining
        await tx.creditLedger.update({
          where: { id },
          data: { status: 'used' },
        });
        await tx.creditLedger.create({
          data: {
            merchantId,
            userId,
            amount: credit.amount - useAmount,
            currency: credit.currency,
            status: 'available',
            source: credit.source,
            sourceId: credit.sourceId,
            expiresAt: credit.expiresAt,
          },
        });
      }
    }

    // Create usage record
    await tx.creditUsage.create({
      data: {
        merchantId,
        userId,
        creditLedgerIds: creditIds,
        amountUsed: amount,
        orderReference,
      },
    });
  });

  return { success: true, creditIds };
}
