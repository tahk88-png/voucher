import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';

const PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_staff');

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get('pageSize') || String(PAGE_SIZE), 10) || PAGE_SIZE)
    );
    const rating = searchParams.get('rating')
      ? parseInt(searchParams.get('rating')!, 10)
      : undefined;
    const status = searchParams.get('status') || undefined;
    const hasReply = searchParams.get('hasReply');

    const where: Prisma.ReviewWhereInput = {
      merchantId: merchant.id,
      ...(rating !== undefined && rating >= 1 && rating <= 5 ? { rating } : {}),
      ...(status ? { status: status as 'published' | 'hidden' | 'flagged' } : {}),
      ...(hasReply === 'true'
        ? { merchantReply: { not: null } }
        : hasReply === 'false'
          ? { merchantReply: null }
          : {}),
    };

    const [reviews, total, allReviews] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
          voucher: {
            select: { id: true, codePrefix: true },
          },
          campaign: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.review.count({ where }),
      // Get all reviews for stats (unfiltered)
      prisma.review.findMany({
        where: { merchantId: merchant.id },
        select: { rating: true, merchantReply: true },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // Compute stats
    const totalReviews = allReviews.length;
    const avgRating =
      totalReviews > 0
        ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
        : 0;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of allReviews) {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating]++;
      }
    }

    const repliedCount = allReviews.filter((r) => r.merchantReply !== null).length;

    return NextResponse.json({
      items: reviews,
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      stats: {
        totalReviews,
        avgRating,
        distribution,
        repliedCount,
        unrepliedCount: totalReviews - repliedCount,
      },
    });
  });
}
