import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { applyCredit } from '@/lib/credits';
import { getMerchantBySlug } from '@/lib/tenant';
import { z } from 'zod';

const applyCreditSchema = z.object({
  merchantSlug: z.string(),
  amount: z.number().int().positive(),
  orderReference: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { merchantSlug, amount, orderReference } = applyCreditSchema.parse(body);

    const merchant = await getMerchantBySlug(merchantSlug);
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const result = await applyCredit(session.user.id, merchant.id, amount, orderReference || '');

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Insufficient credit balance') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error applying credit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
