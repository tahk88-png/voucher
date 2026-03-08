import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { activateMerchant, deactivateMerchant } from '@/lib/merchant-status';
import { withErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';
import { requireAdminPermission } from '@/lib/admin/guards';
import { recordAdminAudit } from '@/lib/admin/audit';

const updateMerchantSchema = z.object({
  isActive: z.boolean().optional(),
  featureFlags: z.record(z.string(), z.boolean()).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  const { id } = await params;

  return withErrorHandler(async () => {
    const admin = await requireAdminPermission('admin.merchants.edit');

    const body = await req.json();
    const data = updateMerchantSchema.parse(body);

    const merchant = await prisma.merchant.findUnique({
      where: { id },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Handle isActive change (kill switch)
    if (data.isActive !== undefined && data.isActive !== merchant.isActive) {
      if (data.isActive) {
        await activateMerchant(id, admin.userId);
      } else {
        await deactivateMerchant(id, admin.userId, 'Deactivated by platform admin');
      }

      await recordAdminAudit({
        actorUserId: admin.userId,
        action: data.isActive ? 'merchant.activate' : 'merchant.deactivate',
        targetType: 'Merchant',
        targetId: id,
        reason: data.isActive ? 'Activated by admin' : 'Deactivated by platform admin',
      });
    }

    // Handle feature flags
    const updateData: { featureFlags?: Record<string, boolean> } = {};
    if (data.featureFlags !== undefined) {
      const validatedFlags: Record<string, boolean> = {};
      for (const [key, value] of Object.entries(data.featureFlags)) {
        if (typeof value === 'boolean') {
          validatedFlags[key] = value;
        }
      }
      updateData.featureFlags = validatedFlags;
    }

    const updated = await prisma.merchant.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  });
}
