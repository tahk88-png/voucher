import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';

const replySchema = z.object({
  reply: z.string().min(1).max(2000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; reviewId: string }> }
) {
  return withErrorHandler(async () => {
    const { slug, reviewId } = await params;
    const { merchant, profile } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const body = await req.json();
    const data = replySchema.parse(body);

    const review = await prisma.review.findFirst({
      where: { id: reviewId, merchantId: merchant.id },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        merchantReply: data.reply,
        merchantReplyAt: new Date(),
      },
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
    });

    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        actorUserId: profile.userId,
        action: 'review.replied',
        resourceType: 'review',
        resourceId: reviewId,
        payloadJson: JSON.stringify({
          reviewId,
          rating: review.rating,
          replyLength: data.reply.length,
        }),
      },
    });

    return NextResponse.json(updated);
  });
}
