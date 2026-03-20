import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.analytics.read');

    const [
      totalProducts,
      activeProducts,
      totalInteractions,
      totalCategories,
      totalOccasions,
      totalPersonas,
      activeModules,
      activeSponsorships,
      topProducts,
      recentInteractions,
      interactionsByType,
    ] = await Promise.all([
      prisma.giftProduct.count(),
      prisma.giftProduct.count({ where: { isActive: true } }),
      prisma.userGiftInteraction.count(),
      prisma.giftCategory.count({ where: { isActive: true } }),
      prisma.giftOccasion.count({ where: { isActive: true } }),
      prisma.giftPersona.count({ where: { isActive: true } }),
      prisma.giftFeedModule.count({ where: { isActive: true } }),
      prisma.sponsoredGiftPlacement.count({
        where: { isActive: true, startDate: { lte: new Date() }, endDate: { gte: new Date() } },
      }),
      prisma.giftProduct.findMany({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          priceCents: true,
          viewCount: true,
          purchaseCount: true,
          engagementScore: true,
          conversionRate: true,
          merchant: { select: { name: true, slug: true } },
        },
        orderBy: { engagementScore: 'desc' },
        take: 10,
      }),
      prisma.userGiftInteraction.groupBy({
        by: ['interactionType'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.userGiftInteraction.groupBy({
        by: ['interactionType'],
        _count: { id: true },
        _avg: { dwellMs: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    return NextResponse.json({
      overview: {
        totalProducts,
        activeProducts,
        totalInteractions,
        totalCategories,
        totalOccasions,
        totalPersonas,
        activeModules,
        activeSponsorships,
      },
      topProducts,
      interactionsByType: interactionsByType.map((g) => ({
        type: g.interactionType,
        count: g._count.id,
        avgDwellMs: Math.round(g._avg.dwellMs || 0),
      })),
      recentInteractionBreakdown: recentInteractions.map((g) => ({
        type: g.interactionType,
        count: g._count.id,
      })),
    });
  });
}
