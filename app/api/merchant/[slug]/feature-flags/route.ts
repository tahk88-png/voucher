import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { getMerchantFeatureFlags } from '@/lib/merchant-status';
import { withErrorHandler } from '@/lib/error-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{slug: string}> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

    const flags = await getMerchantFeatureFlags(merchant.id);

    return NextResponse.json(flags);
  });
}
