import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashFriendIdentifier, safeParseJson } from '@/lib/utils';
import { isFeatureEnabled } from '@/lib/merchant-status';
import { z } from 'zod';

const claimSchema = z.object({
  voucherId: z.string(),
  friendHint: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { voucherId, friendHint } = claimSchema.parse(body);

    // Get voucher with weekly drop info
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
      include: { merchant: true },
    });

    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    // Check feature flag
    const weeklyDropsEnabled = await isFeatureEnabled(voucher.merchantId, 'weeklyDropsEnabled');
    if (!weeklyDropsEnabled) {
      return NextResponse.json({ error: 'Weekly drops are not enabled for this merchant' }, { status: 403 });
    }

    if (!voucher.weeklyDropEnabled) {
      return NextResponse.json({ error: 'Weekly drop not enabled for this voucher' }, { status: 400 });
    }

    if (voucher.status !== 'published') {
      return NextResponse.json({ error: 'Voucher not available' }, { status: 400 });
    }

    const weeklyDrop = safeParseJson<{
      dayOfWeek: number;
      startTime: string;
      stock: number;
      durationMinutes: number;
    }>(voucher.weeklyDropJson);

    if (!weeklyDrop) {
      return NextResponse.json({ error: 'Weekly drop configuration missing' }, { status: 400 });
    }

    // Check if we're in the drop window
    const now = new Date();
    const dayOfWeek = now.getDay();
    const [hours, minutes] = weeklyDrop.startTime.split(':').map(Number);
    const startTime = new Date(now);
    startTime.setHours(hours, minutes, 0, 0);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + weeklyDrop.durationMinutes);

    if (dayOfWeek !== weeklyDrop.dayOfWeek || now < startTime || now > endTime) {
      return NextResponse.json({ error: 'Weekly drop not active' }, { status: 400 });
    }

    // Atomically check stock and create referral
    const result = await prisma.$transaction(async (tx) => {
      // Count existing referrals for this voucher created in this drop window
      const existingCount = await tx.referral.count({
        where: {
          voucherId: voucher.id,
          createdAt: {
            gte: startTime,
            lte: endTime,
          },
        },
      });

      if (existingCount >= weeklyDrop.stock) {
        throw new Error('Weekly drop sold out');
      }

      // Create referral
      const friendHash = friendHint
        ? await hashFriendIdentifier(friendHint)
        : `anonymous_${Date.now()}_${Math.random()}`;

      const referral = await tx.referral.create({
        data: {
          voucherId: voucher.id,
          merchantId: voucher.merchantId,
          referrerUserId: session.user.id,
          friendHash,
          status: 'created',
        },
      });

      return referral;
    });

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${result.id}`;

    return NextResponse.json({
      referralId: result.id,
      shareUrl,
      remaining: weeklyDrop.stock - 1, // Approximate
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Weekly drop sold out') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Error claiming weekly drop:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
