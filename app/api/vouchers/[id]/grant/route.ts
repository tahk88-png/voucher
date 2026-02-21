import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { sendVoucherDelivery } from '@/lib/emails';
import { z } from 'zod';

const grantSchema = z.object({
  userId: z.string().optional(), // If not provided, grants to current user
  email: z.string().email().optional(), // Alternative: grant by email
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { userId, email } = grantSchema.parse(body);

    // Get voucher
    const voucher = await prisma.voucher.findUnique({
      where: { id: params.id },
      include: { merchant: true },
    });

    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    // Check permissions - merchant staff can grant vouchers
    await requireMerchantRole(session.user.id, voucher.merchantId, 'merchant_staff');

    // Determine target user
    let targetUserId = userId;
    if (!targetUserId && email) {
      const targetUser = await prisma.user.findUnique({ where: { email } });
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      targetUserId = targetUser.id;
    }
    if (!targetUserId) {
      targetUserId = session.user.id; // Grant to current user
    }

    // Create free purchase record
    const purchase = await prisma.voucherPurchase.create({
      data: {
        voucherId: voucher.id,
        campaignId: voucher.campaignId || null,
        merchantId: voucher.merchantId,
        userId: targetUserId,
        amount: 0, // Free
        currency: voucher.currency,
        status: 'paid', // Immediately paid for free vouchers
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: voucher.merchantId,
        actorUserId: session.user.id,
        action: 'voucher_granted',
        payloadJson: {
          voucherId: voucher.id,
          purchaseId: purchase.id,
          grantedToUserId: targetUserId,
        },
      },
    });

    // Send voucher delivery email to the recipient (non-blocking)
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (targetUser?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const voucherCode = voucher.id.slice(-8).toUpperCase();
      sendVoucherDelivery({
        to: targetUser.email,
        merchantName: voucher.merchant.name,
        voucherCode,
        value: 'Free voucher',
        validUntil: voucher.validTo
          ? new Date(voucher.validTo).toLocaleDateString()
          : 'No expiry',
        voucherUrl: `${appUrl}/app/voucher/${voucher.id}`,
      }).catch((err) => console.error('[Email] Voucher grant delivery failed:', err));
    }

    return NextResponse.json({ purchase, message: 'Voucher granted successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Voucher grant error:', error);
    return NextResponse.json({ error: 'Failed to grant voucher' }, { status: 500 });
  }
}
