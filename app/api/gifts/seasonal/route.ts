import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handler';
import { generateSeasonalCollection } from '@/services/gifts/aiGiftEngine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const occasionSlug = req.nextUrl.searchParams.get('occasion');
    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit')) || 10, 30);

    if (!occasionSlug) {
      return NextResponse.json({ error: 'occasion query parameter required' }, { status: 400 });
    }

    const collection = await generateSeasonalCollection(occasionSlug, limit);
    return NextResponse.json(collection);
  });
}
