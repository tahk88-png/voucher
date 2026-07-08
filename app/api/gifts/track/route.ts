import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { rateLimitDistributed } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-client-ip';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const trackSchema = z.object({
  productId: z.string().min(1),
  interactionType: z.enum(['VIEW', 'SAVE', 'SHARE', 'ADD_TO_CART', 'PURCHASE', 'CLICK_AFFILIATE']),
  dwellMs: z.number().int().min(0).max(3600000).optional(),
  feedModuleId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const ip = getClientIp(req);
    const { allowed } = await rateLimitDistributed(`gift-track:${ip}`, 60, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = trackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { productId, interactionType, dwellMs, feedModuleId } = parsed.data;

    // Verify product exists
    const product = await prisma.giftProduct.findUnique({
      where: { id: productId },
      select: { id: true, engagementScore: true, viewCount: true, purchaseCount: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Create interaction
    await prisma.userGiftInteraction.create({
      data: {
        userId: session.user.id,
        productId,
        interactionType,
        dwellMs,
        feedModuleId,
      },
    });

    // Update product engagement metrics
    const scoreIncrements: Record<string, number> = {
      VIEW: 1,
      SAVE: 5,
      SHARE: 3,
      ADD_TO_CART: 8,
      PURCHASE: 15,
      CLICK_AFFILIATE: 4,
    };

    const updates: Record<string, unknown> = {
      engagementScore: { increment: scoreIncrements[interactionType] || 1 },
    };
    if (interactionType === 'VIEW') updates.viewCount = { increment: 1 };
    if (interactionType === 'PURCHASE') {
      updates.purchaseCount = { increment: 1 };
      // Recalculate conversion rate
      const newPurchaseCount = product.purchaseCount + 1;
      const newViewCount = Math.max(product.viewCount, 1);
      updates.conversionRate = newPurchaseCount / newViewCount;
    }

    await prisma.giftProduct.update({
      where: { id: productId },
      data: updates as Parameters<typeof prisma.giftProduct.update>[0]['data'],
    });

    return NextResponse.json({ ok: true });
  });
}
