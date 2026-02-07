import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCreditBalance } from '@/lib/credits';
import { getMerchantBySlug } from '@/lib/tenant';

export async function GET(
  req: NextRequest,
  { params }: { params: { merchantSlug: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchant = await getMerchantBySlug(params.merchantSlug);
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const balance = await getCreditBalance(session.user.id, merchant.id);

    return NextResponse.json(balance);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
