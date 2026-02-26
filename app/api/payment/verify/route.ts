import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // Get Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ success: false, status: checkoutSession.payment_status });
    }

    // Verify purchase exists and belongs to user
    const voucherPurchase = await prisma.voucherPurchase.findFirst({
      where: {
        stripeSessionId: sessionId,
        userId: session.user.id,
      },
    });

    const ticketPurchase = await prisma.ticketPurchase.findFirst({
      where: {
        stripeSessionId: sessionId,
        userId: session.user.id,
      },
    });

    if (!voucherPurchase && !ticketPurchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: voucherPurchase?.status || ticketPurchase?.status,
      type: voucherPurchase ? 'voucher' : 'ticket',
      id: voucherPurchase?.voucherId || ticketPurchase?.ticketId,
    });
  });
}
