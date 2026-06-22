import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { moderateContent } from '@/lib/content-moderation';
import { queueWebhook } from '@/lib/webhooks';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const url = new URL(req.url);
    const merchantId = url.searchParams.get('merchantId');
    const voucherId = url.searchParams.get('voucherId');
    const campaignId = url.searchParams.get('campaignId');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const sort = url.searchParams.get('sort') || 'newest';

    if (!merchantId && !voucherId && !campaignId) {
      return NextResponse.json({ error: 'merchantId, voucherId, or campaignId is required' }, { status: 400 });
    }

    const where = {
      ...(merchantId && { merchantId }),
      ...(voucherId && { voucherId }),
      ...(campaignId && { campaignId }),
      status: 'published' as const,
    };

    const orderBy = sort === 'highest'
      ? { rating: 'desc' as const }
      : sort === 'helpful'
        ? { helpful: 'desc' as const }
        : { createdAt: 'desc' as const };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, image: true } },
          votes: { select: { id: true, userId: true, helpful: true } },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.review.count({ where }),
    ]);

    // Calculate average rating
    const stats = await prisma.review.aggregate({
      where: { ...where },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return NextResponse.json({
      reviews,
      total,
      avgRating: stats._avg.rating || 0,
      totalReviews: stats._count.rating,
      limit,
      offset,
    });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { merchantId, voucherId, campaignId, rating, title, comment } = body;

    if (!merchantId && !voucherId && !campaignId) {
      return NextResponse.json({ error: 'merchantId, voucherId, or campaignId is required' }, { status: 400 });
    }

    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    // Check for existing review (one per user per target)
    const existingWhere = {
      userId: session.user.id,
      ...(merchantId && { merchantId }),
      ...(voucherId && { voucherId }),
      ...(campaignId && { campaignId }),
    };

    const existing = await prisma.review.findFirst({ where: existingWhere });
    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this item' }, { status: 409 });
    }

    // Check if user has a verified purchase (optional enhancement)
    let verified = false;
    if (voucherId) {
      const purchase = await prisma.voucherPurchase.findFirst({
        where: { userId: session.user.id, voucherId, status: 'paid' },
      });
      verified = !!purchase;
    }

    // Auto-moderate content before creating the review
    const textToModerate = [title, comment].filter(Boolean).join(' ');
    const moderation = moderateContent(textToModerate);

    // Determine initial review status based on moderation
    let reviewStatus: 'published' | 'flagged' | 'hidden' = 'published';
    if (moderation.suggestedAction === 'reject') {
      reviewStatus = 'hidden';
    } else if (moderation.suggestedAction === 'flag_for_review') {
      reviewStatus = 'flagged';
    }

    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        merchantId: merchantId || null,
        voucherId: voucherId || null,
        campaignId: campaignId || null,
        rating,
        title: title || null,
        comment: comment || null,
        verified,
        status: reviewStatus,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    // Fire merchant webhook only when the review is immediately visible. If
    // auto-moderation flagged/hid it, we don't notify the merchant — they'll
    // get a signal via the moderation queue instead, and only once it's
    // approved for publishing (TODO: emit on moderation approval too).
    if (reviewStatus === 'published' && merchantId) {
      queueWebhook(merchantId, 'review.created', {
        reviewId: review.id,
        merchantId,
        voucherId: voucherId || null,
        campaignId: campaignId || null,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        verified: review.verified,
        userId: session.user.id,
        createdAt: review.createdAt.toISOString(),
      });
    }

    return NextResponse.json({
      review,
      moderation: {
        approved: moderation.approved,
        flags: moderation.flags,
        status: reviewStatus,
      },
    }, { status: 201 });
  });
}
