import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCreditBalance } from '@/lib/credits';
import { getMerchantBySlug } from '@/lib/tenant';
import { withErrorHandler } from '@/lib/error-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{merchantSlug: string}> }
) {
  return withErrorHandler(async () => {
    const { merchantSlug } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchant = await getMerchantBySlug(merchantSlug);
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const balance = await getCreditBalance(session.user.id, merchant.id);

    return NextResponse.json(balance);
  });
}
