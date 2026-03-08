import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { requireActiveMerchant } from '@/lib/merchant-status';
import { ensureMerchantOwnership } from '@/lib/tenant';
import { withErrorHandler } from '@/lib/error-handler';
import { rateLimitDistributed } from '@/lib/rate-limit';
import { CacheKeys, invalidatePattern } from '@/lib/cache';

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

    const { allowed } = await rateLimitDistributed(`voucher-publish:${session.user.id}`, 20, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const voucher = await prisma.voucher.findUnique({
      where: { id },
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
      where: { id },
      data: { status: 'published' },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: voucher.merchantId,
        actorUserId: session.user.id,
        action: 'voucher.published',
        payloadJson: JSON.stringify({ voucherId: id }),
      },
    });

    await invalidatePattern(`${CacheKeys.publicMerchantVouchers(voucher.merchantId)}*`);

    return NextResponse.json(updated);
  });
}
