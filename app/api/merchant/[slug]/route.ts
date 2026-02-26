import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { withErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';

const updateMerchantSchema = z.object({
  name: z.string().min(1).optional(),
  website: z.string().url().optional().nullable(),
  supportEmail: z.string().email().optional().nullable(),
  brandLogoUrl: z.string().url().optional().nullable(),
  brandColorsJson: z
    .object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      background: z.string().optional(),
    })
    .optional()
    .nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return withErrorHandler(async () => {
    const merchant = await prisma.merchant.findUnique({
      where: { slug: params.slug },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    return NextResponse.json(merchant);
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug: params.slug },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    await requireMerchantRole(session.user.id, merchant.id, 'merchant_admin');

    const body = await req.json();
    const data = updateMerchantSchema.parse(body);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.supportEmail !== undefined) updateData.supportEmail = data.supportEmail;
    if (data.brandLogoUrl !== undefined) updateData.brandLogoUrl = data.brandLogoUrl;
    if (data.brandColorsJson !== undefined) {
      updateData.brandColorsJson = data.brandColorsJson ? JSON.stringify(data.brandColorsJson) : null;
    }

    const updated = await prisma.merchant.update({
      where: { id: merchant.id },
      data: updateData,
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        actorUserId: session.user.id,
        action: 'merchant.updated',
        payloadJson: {
          changes: Object.keys(updateData),
        },
      },
    });

    return NextResponse.json(updated);
  });
}
