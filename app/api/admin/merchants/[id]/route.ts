import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { activateMerchant, deactivateMerchant } from '@/lib/merchant-status';
import { captureException } from '@/lib/error-tracking';
import { isPlatformAdmin } from '@/lib/admin';
import { z } from 'zod';

const updateMerchantSchema = z.object({
  isActive: z.boolean().optional(),
  featureFlags: z.record(z.string(), z.boolean()).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !isPlatformAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = updateMerchantSchema.parse(body);

    const merchant = await prisma.merchant.findUnique({
      where: { id: params.id },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Handle isActive change (kill switch)
    if (data.isActive !== undefined && data.isActive !== merchant.isActive) {
      if (data.isActive) {
        await activateMerchant(params.id, session.user.id);
      } else {
        await deactivateMerchant(params.id, session.user.id, 'Deactivated by platform admin');
      }
    }

    // Handle feature flags
    const updateData: { featureFlags?: Record<string, boolean> } = {};
    if (data.featureFlags !== undefined) {
      // Validate feature flags are booleans
      const validatedFlags: Record<string, boolean> = {};
      for (const [key, value] of Object.entries(data.featureFlags)) {
        if (typeof value === 'boolean') {
          validatedFlags[key] = value;
        }
      }
      updateData.featureFlags = validatedFlags;
    }

    const updated = await prisma.merchant.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Error) {
      captureException(error, {
        context: 'admin_merchant_update',
        merchantId: params.id,
      });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
