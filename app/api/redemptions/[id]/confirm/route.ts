import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { unlockCreditForRedemption } from '@/lib/credits';
import { sendRedemptionConfirmation } from '@/lib/emails';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redemption = await prisma.redemption.findUnique({
      where: { id: params.id },
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
        where: { id: params.id },
        data: { confirmedAt, redeemedByStaffUserId: session.user.id },
      });

      // Unlock credit if referral exists
      if (redemption.referralId) {
        await unlockCreditForRedemption(params.id, redemption.merchantId);
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
      }).catch((err) => console.error('[Email] Redemption confirmation failed:', err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error confirming redemption:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
