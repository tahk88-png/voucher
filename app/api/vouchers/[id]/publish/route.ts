import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { requireActiveMerchant } from '@/lib/merchant-status';
import { ensureMerchantOwnership } from '@/lib/tenant';
import { withErrorHandler } from '@/lib/error-handler';
import { CacheKeys, invalidatePattern } from '@/lib/cache';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const voucher = await prisma.voucher.findUnique({
      where: { id: params.id },
      include: { merchant: true },
    });

    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    await requireActiveMerchant(voucher.merchantId);
    await requireMerchantRole(session.user.id, voucher.merchantId, 'merchant_admin');

    // Validate voucher can be published
    if (voucher.status === 'published') {
      return NextResponse.json({ error: 'Voucher already published' }, { status: 400 });
    }

    if (!voucher.designJson) {
      return NextResponse.json({ error: 'Voucher design is required' }, { status: 400 });
    }

    // Update status to published
    const updated = await prisma.voucher.update({
      where: { id: params.id },
      data: { status: 'published' },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: voucher.merchantId,
        actorUserId: session.user.id,
        action: 'voucher.published',
        payloadJson: JSON.stringify({ voucherId: params.id }),
      },
    });

    await invalidatePattern(`${CacheKeys.publicMerchantVouchers(voucher.merchantId)}*`);

    return NextResponse.json(updated);
  });
}
