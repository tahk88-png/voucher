import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AccessControlError, accessErrorResponse, requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{slug: string}> }
) {
  return withErrorHandler(async () => {
  const { slug } = await params
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_staff');
    const { searchParams } = new URL(req.url);
    const days = Math.min(parseInt(searchParams.get('days') || '30', 10), 365);
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalReferrals,
      redeemedReferrals,
      confirmedRedemptions,
      totalPurchases,
      paidPurchases,
      creditStats,
      redemptionsByDay,
      referralsByDay,
    ] = await Promise.all([
      // Funnel: referrals created
      prisma.referral.count({ where: { merchantId: merchant.id, createdAt: { gte: from } } }),
      // Funnel: referrals redeemed
      prisma.referral.count({ where: { merchantId: merchant.id, status: 'redeemed', createdAt: { gte: from } } }),
      // Funnel: redemptions confirmed
      prisma.redemption.count({ where: { merchantId: merchant.id, confirmedAt: { not: null, gte: from } } }),
      // Purchases total
      prisma.voucherPurchase.count({ where: { merchantId: merchant.id, createdAt: { gte: from } } }),
      // Purchases paid
      prisma.voucherPurchase.count({ where: { merchantId: merchant.id, status: 'paid', createdAt: { gte: from } } }),
      // Credit stats
      prisma.creditLedger.aggregate({
        where: { merchantId: merchant.id, createdAt: { gte: from } },
        _sum: { amount: true },
        _count: true,
      }),
      // Daily redemptions
      prisma.redemption.findMany({
        where: { merchantId: merchant.id, confirmedAt: { not: null, gte: from } },
        select: { confirmedAt: true },
        orderBy: { confirmedAt: 'asc' },
      }),
      // Daily referrals
      prisma.referral.findMany({
        where: { merchantId: merchant.id, createdAt: { gte: from } },
        select: { createdAt: true, status: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Build daily buckets
    const dayBuckets: Record<string, { redemptions: number; referrals: number; conversions: number }> = {};
    const now = new Date();
    for (let d = new Date(from); d <= now; d.setDate(d.getDate() + 1)) {
      dayBuckets[d.toISOString().split('T')[0]] = { redemptions: 0, referrals: 0, conversions: 0 };
    }

    for (const r of redemptionsByDay) {
      if (r.confirmedAt) {
        const key = r.confirmedAt.toISOString().split('T')[0];
        if (dayBuckets[key]) dayBuckets[key].redemptions++;
      }
    }
    for (const r of referralsByDay) {
      const key = r.createdAt.toISOString().split('T')[0];
      if (dayBuckets[key]) {
        dayBuckets[key].referrals++;
        if (r.status === 'redeemed') dayBuckets[key].conversions++;
      }
    }

    const dailyData = Object.entries(dayBuckets).map(([date, counts]) => ({ date, ...counts }));

    const conversionRate = totalReferrals > 0 ? Math.round((redeemedReferrals / totalReferrals) * 100) : 0;
    const purchaseConversion = totalPurchases > 0 ? Math.round((paidPurchases / totalPurchases) * 100) : 0;

    return NextResponse.json({
      period: { from: from.toISOString(), days },
      funnel: [
        { stage: 'Referrals Created', count: totalReferrals },
        { stage: 'Referrals Redeemed', count: redeemedReferrals },
        { stage: 'Redemptions Confirmed', count: confirmedRedemptions },
      ],
      conversionRate,
      purchases: { total: totalPurchases, paid: paidPurchases, conversionRate: purchaseConversion },
      credits: {
        totalIssued: creditStats._sum.amount || 0,
        totalEntries: creditStats._count,
      },
      dailyData,
    });
  });
}
