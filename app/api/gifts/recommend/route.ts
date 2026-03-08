import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { withErrorHandler } from '@/lib/error-handler';
import { rateLimitDistributed } from '@/lib/rate-limit';
import { generateGiftSuggestions, generateUpsellSuggestions } from '@/services/gifts/aiGiftEngine';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const recommendSchema = z.object({
  recipientType: z.string().min(1).max(100),
  budget: z.number().int().positive().max(100_000_00), // max 100k EUR in cents
  occasion: z.string().min(1).max(100),
  tone: z.enum(['playful', 'premium', 'corporate']).optional(),
  language: z.string().max(5).optional(),
  limit: z.number().int().min(1).max(20).optional(),
});

const upsellSchema = z.object({
  productId: z.string().min(1),
  limit: z.number().int().min(1).max(10).optional(),
});

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { allowed } = await rateLimitDistributed(`gift-recommend:${ip}`, 20, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    const body = await req.json();

    // Upsell mode
    if (body.productId) {
      const parsed = upsellSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
      }
      const upsells = await generateUpsellSuggestions(parsed.data.productId, parsed.data.limit || 3);
      return NextResponse.json({ type: 'upsell', suggestions: upsells });
    }

    // Standard recommendation
    const parsed = recommendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const suggestions = await generateGiftSuggestions(parsed.data);
    return NextResponse.json({ type: 'recommendation', suggestions });
  });
}
