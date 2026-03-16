import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handler';

// In-memory intent store (production would use Redis or DB)
const intents = new Map<string, { status: string; merchantSlug: string; voucherId?: string; createdAt: number }>();

export function setIntent(intentId: string, data: { merchantSlug: string; voucherId?: string }) {
  intents.set(intentId, { ...data, status: 'pending', createdAt: Date.now() });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ intentId: string }> }) {
  return withErrorHandler(async () => {
    const { intentId } = await params;
    const intent = intents.get(intentId);

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

    const intent = intents.get(intentId);
    if (intent) {
      intent.status = 'confirmed';
    }

    return NextResponse.json({ intentId, status: 'confirmed' });
  });
}
