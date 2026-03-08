import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug);

    // Get all purchases grouped by user
    const purchases = await prisma.voucherPurchase.groupBy({
      by: ['userId'],
      where: {
        merchantId: merchant.id,
        status: 'paid',
      },
      _count: { id: true },
      _sum: { amount: true },
      _max: { createdAt: true },
    });

    // Get redemption counts per user
    const redemptions = await prisma.redemption.groupBy({
      by: ['redeemedByUserId'],
      where: {
        merchantId: merchant.id,
        confirmedAt: { not: null },
        redeemedByUserId: { not: null },
      },
      _count: { _all: true },
    });

    const redemptionMap = new Map(
      redemptions.map((r) => [r.redeemedByUserId!, r._count._all])
    );

    // Fetch user details
    const userIds = purchases.map((p) => p.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const customers = purchases
      .map((p) => {
        const user = userMap.get(p.userId);
        return {
          userId: p.userId,
          name: user?.name || 'Unknown',
          email: user?.email || '',
          purchases: p._count.id,
          totalSpent: p._sum.amount || 0,
          lastPurchase: p._max.createdAt?.toISOString() || null,
          redemptions: redemptionMap.get(p.userId) || 0,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);

    return NextResponse.json({ customers, currency: 'EUR' });
  });
}
