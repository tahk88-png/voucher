import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';

export async function POST(_req: NextRequest, { params }: { params: Promise<{token: string}> }) {
  return withErrorHandler(async () => {
  const { token } = await params
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=/gifts/claim/${token}`, _req.url));
    }

    const gift = await prisma.giftedVoucher.findUnique({ where: { token: token } });
    if (!gift) return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
    if (gift.status !== 'pending') {
      return NextResponse.redirect(new URL(`/gifts/claim/${token}`, _req.url));
    }

    await prisma.giftedVoucher.update({
      where: { token: token },
      data: {
        status: 'claimed',
        claimedAt: new Date(),
        claimedByUserId: session.user.id,
      },
    });

    // Redirect to app wallet
    return NextResponse.redirect(new URL('/app/wallet', _req.url));
  });
}
