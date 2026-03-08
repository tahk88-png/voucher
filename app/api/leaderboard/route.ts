import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    // Count confirmed redemptions per merchant in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topMerchants = await prisma.merchant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        brandLogoUrl: true,
        website: true,
        country: true,
        _count: {
          select: {
            redemptions: true,
            vouchers: true,
          },
        },
        redemptions: {
          where: {
            confirmedAt: { gte: thirtyDaysAgo },
          },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const ranked = topMerchants
      .map(m => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        brandLogoUrl: m.brandLogoUrl,
        website: m.website,
        country: m.country,
        totalRedemptions: m._count.redemptions,
        recentRedemptions: m.redemptions.length,
        totalVouchers: m._count.vouchers,
      }))
      .sort((a, b) => b.recentRedemptions - a.recentRedemptions || b.totalRedemptions - a.totalRedemptions)
      .slice(0, limit);

    return NextResponse.json(ranked);
  });
}
