import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { unlockCreditForRedemption } from '@/lib/credits';
import { logger } from '@/lib/logger';
import { sendRedemptionConfirmation } from '@/lib/emails';
import { withErrorHandler } from '@/lib/error-handler';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redemption = await prisma.redemption.findUnique({
      where: { id },
      include: {
        merchant: true,
        voucher: { include: { campaign: true } },
        redeemedBy: true,
      },
    });

    if (!redemption) {
      return NextResponse.json({ error: 'Redemption not found' }, { status: 404 });
    }

    if (redemption.confirmedAt) {
      return NextResponse.json({ error: 'Redemption already confirmed' }, { status: 400 });
    }

    // Require merchant staff or admin role
    await requireMerchantRole(session.user.id, redemption.merchantId, 'merchant_staff');

    const confirmedAt = new Date();

    // Confirm redemption
    await prisma.$transaction(async (tx) => {
      await tx.redemption.update({
        where: { id },
        data: { confirmedAt, redeemedByStaffUserId: session.user.id },
      });

      // Unlock credit if referral exists
      if (redemption.referralId) {
        await unlockCreditForRedemption(id, redemption.merchantId);
      }
    });

    // Send redemption confirmation email to user (non-blocking)
    if (redemption.redeemedBy?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      sendRedemptionConfirmation({
        to: redemption.redeemedBy.email,
        merchantName: redemption.merchant.name,
        voucherName: redemption.voucher?.campaign?.name || 'Voucher',
        redeemedAt: confirmedAt.toLocaleString(),
        voucherUrl: redemption.voucherId
          ? `${appUrl}/app/voucher/${redemption.voucherId}`
          : `${appUrl}/app/vouchers`,
      }).catch((err) => logger.error('[Email] Redemption confirmation failed:', { error: err instanceof Error ? err.message : String(err) }));
    }

    return NextResponse.json({ success: true });
  });
}
