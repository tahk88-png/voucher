import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateFeed } from '@/services/gifts/ranker';
import { withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    const userId = session?.user?.id;
    const params = req.nextUrl.searchParams;

    const feed = await generateFeed({
      userId: userId || undefined,
      categorySlug: params.get('category') || undefined,
      occasionSlug: params.get('occasion') || undefined,
      personaSlug: params.get('persona') || undefined,
      budgetMin: params.get('budgetMin') ? Number(params.get('budgetMin')) : undefined,
      budgetMax: params.get('budgetMax') ? Number(params.get('budgetMax')) : undefined,
      moduleType: params.get('moduleType') || undefined,
      cursor: params.get('cursor') || undefined,
      limit: params.get('limit') ? Number(params.get('limit')) : 20,
      language: params.get('language') || undefined,
    });

    return NextResponse.json(feed);
  });
}
