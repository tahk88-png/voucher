import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handler';
import { getIntent, confirmIntent } from '@/lib/qr-checkout-intents';

export async function GET(req: NextRequest, { params }: { params: Promise<{ intentId: string }> }) {
  return withErrorHandler(async () => {
    const { intentId } = await params;
    const intent = getIntent(intentId);

    if (!intent) {
      // Intent might have been from a Stripe checkout flow — return generic pending
      return NextResponse.json({
        intentId,
        status: 'pending',
        message: 'Checkout intent — proceed to confirmation page',
      });
    }

    return NextResponse.json({ intentId, ...intent });
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ intentId: string }> }) {
  return withErrorHandler(async () => {
    const { intentId } = await params;
    const body = await req.json();
    const { action } = body as { action: string };

    if (action !== 'confirm') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    confirmIntent(intentId);

    return NextResponse.json({ intentId, status: 'confirmed' });
  });
}
