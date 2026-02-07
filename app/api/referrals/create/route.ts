import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashFriendIdentifier } from '@/lib/utils';
import { checkReferralRateLimit } from '@/lib/fraud';
import { captureException } from '@/lib/error-tracking';
import { z } from 'zod';

const createReferralSchema = z.object({
  voucherId: z.string(),
  friendHint: z.string().optional(), // optional identifier hint for friend
});

export async function POST(req: NextRequest) {
  let voucherId: string | undefined;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createReferralSchema.parse(body);
    voucherId = parsed.voucherId;
    const { friendHint } = parsed;

    // Get voucher
    const voucher = await prisma.voucher.findUnique({
      where: { id: parsed.voucherId },
      include: { merchant: true },
    });

    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    if (voucher.status !== 'published') {
      return NextResponse.json({ error: 'Voucher not available' }, { status: 400 });
    }

    // Check rate limit
    const rateLimit = await checkReferralRateLimit(session.user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', remaining: rateLimit.remaining },
        { status: 429 }
      );
    }

    // Hash friend identifier if provided
    const friendHash = friendHint
      ? await hashFriendIdentifier(friendHint)
      : `anonymous_${Date.now()}_${Math.random()}`;

    // Create referral
    const referral = await prisma.referral.create({
      data: {
        voucherId: voucher.id,
        merchantId: voucher.merchantId,
        referrerUserId: session.user.id,
        friendHash,
        status: 'created',
      },
    });

    // Generate share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${referral.id}`;

    return NextResponse.json({
      referralId: referral.id,
      shareUrl,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Error) {
      captureException(error, {
        context: 'referral_creation',
        voucherId,
      });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
