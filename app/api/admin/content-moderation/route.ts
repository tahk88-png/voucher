import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.moderation.read');

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25')));
    const status = url.searchParams.get('status') || 'flagged';

    const where = {
      status: status as 'flagged' | 'published' | 'hidden',
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          merchant: { select: { id: true, name: true, slug: true } },
          voucher: { select: { id: true, type: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({ reviews, total, page, limit });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const ctx = await requireAdminPermission('admin.moderation.write');

    const body = await req.json();
    const { reviewId, action } = body;

    if (!reviewId || !['approve', 'reject', 'flag'].includes(action)) {
      return NextResponse.json(
        { error: 'reviewId and action (approve|reject|flag) are required' },
        { status: 400 }
      );
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    let newStatus: 'published' | 'hidden' | 'flagged';
    switch (action) {
      case 'approve':
        newStatus = 'published';
        break;
      case 'reject':
        newStatus = 'hidden';
        break;
      case 'flag':
        newStatus = 'flagged';
        break;
      default:
        newStatus = 'flagged';
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { status: newStatus },
    });

    // Log the moderation action in audit
    await prisma.auditLog.create({
      data: {
        actorUserId: ctx.userId,
        action: `review.moderation.${action}`,
        resourceType: 'review',
        resourceId: reviewId,
        payloadJson: {
          previousStatus: review.status,
          newStatus,
        },
      },
    });

    return NextResponse.json({ review: updated });
  });
}
