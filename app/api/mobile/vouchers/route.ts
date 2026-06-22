import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyMobileToken } from '@/lib/mobile-auth';
import { withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

// GET /api/mobile/vouchers — the user's purchased vouchers (bearer-authed).
export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const userId = await verifyMobileToken(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const purchases = await prisma.voucherPurchase.findMany({
      where: { userId, status: 'paid', voucherId: { not: null } },
      include: {
        voucher: {
          select: { id: true, type: true, value: true, currency: true, status: true, validTo: true, codePrefix: true },
        },
        merchant: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const now = new Date();
    const vouchers = purchases
      .filter((p) => p.voucher)
      .map((p) => {
        const v = p.voucher!;
        const expired = v.validTo ? v.validTo < now : false;
        return {
          purchaseId: p.id,
          voucherId: v.id,
          type: v.type,
          value: v.value,
          currency: v.currency,
          merchantName: p.merchant.name,
          merchantSlug: p.merchant.slug,
          // Mirror the web's display code so a redemption QR matches.
          code: `${v.codePrefix || 'V'}-${v.id.slice(0, 8).toUpperCase()}`,
          validTo: v.validTo ? v.validTo.toISOString() : null,
          status: expired ? 'expired' : v.status,
          purchasedAt: p.createdAt.toISOString(),
        };
      });

    return NextResponse.json({ vouchers });
  });
}
