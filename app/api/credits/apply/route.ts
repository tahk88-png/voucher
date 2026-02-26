import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { applyCredit } from '@/lib/credits';
import { getMerchantBySlug } from '@/lib/tenant';
import { withErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';

const applyCreditSchema = z.object({
  merchantSlug: z.string(),
  amount: z.number().int().positive(),
  orderReference: z.string().optional(),
});

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
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
  });
}
