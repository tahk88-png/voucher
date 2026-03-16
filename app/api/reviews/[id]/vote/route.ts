import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reviewId } = await params;
    const body = await req.json();
    const { helpful } = body;

    if (typeof helpful !== 'boolean') {
      return NextResponse.json({ error: 'helpful must be a boolean' }, { status: 400 });
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Don't allow voting on your own review
    if (review.userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot vote on your own review' }, { status: 400 });
    }

    // Toggle vote: if existing vote matches, remove it; otherwise upsert
    const existingVote = await prisma.reviewVote.findUnique({
      where: { reviewId_userId: { reviewId, userId: session.user.id } },
    });

    if (existingVote && existingVote.helpful === helpful) {
      // Remove vote (toggle off)
      await prisma.$transaction([
        prisma.reviewVote.delete({
          where: { id: existingVote.id },
        }),
        prisma.review.update({
          where: { id: reviewId },
          data: { helpful: { decrement: helpful ? 1 : 0 } },
        }),
      ]);

      return NextResponse.json({ voted: false, helpful: null });
    }

    // Upsert vote
    const wasHelpfulBefore = existingVote?.helpful;
    await prisma.$transaction([
      prisma.reviewVote.upsert({
        where: { reviewId_userId: { reviewId, userId: session.user.id } },
        create: { reviewId, userId: session.user.id, helpful },
        update: { helpful },
      }),
      prisma.review.update({
        where: { id: reviewId },
        data: {
          helpful: {
            increment: helpful ? 1 : 0,
            ...(wasHelpfulBefore === true ? { decrement: 1 } : {}),
          },
        },
      }),
    ]);

    // Recalculate helpful count to avoid drift
    const helpfulCount = await prisma.reviewVote.count({
      where: { reviewId, helpful: true },
    });
    await prisma.review.update({
      where: { id: reviewId },
      data: { helpful: helpfulCount },
    });

    return NextResponse.json({ voted: true, helpful });
  });
}
