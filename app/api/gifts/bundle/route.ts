import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { withErrorHandler } from '@/lib/error-handler';
import { rateLimitDistributed } from '@/lib/rate-limit';
import { generateGiftBundle } from '@/services/gifts/aiGiftEngine';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const bundleSchema = z.object({
  title: z.string().min(1).max(200),
  budgetCents: z.number().int().positive().max(100_000_00),
  categorySlug: z.string().max(100).optional(),
  maxItems: z.number().int().min(2).max(10).optional(),
});

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { allowed } = await rateLimitDistributed(`gift-bundle:${ip}`, 10, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = bundleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { title, budgetCents, categorySlug, maxItems } = parsed.data;
    const bundle = await generateGiftBundle(title, budgetCents, categorySlug, maxItems || 3);

    if (!bundle) {
      return NextResponse.json({ error: 'No products found to create a bundle' }, { status: 404 });
    }

    return NextResponse.json(bundle);
  });
}
