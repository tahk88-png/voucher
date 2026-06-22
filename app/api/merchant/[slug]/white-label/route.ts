import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';
import { getWhiteLabelConfigBySlug } from '@/lib/white-label';

const updateWhiteLabelSchema = z.object({
  logo: z.string().url().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  hidePlatformBranding: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    await requireMerchantProfileAccessBySlug(slug, 'merchant_staff');

    const config = await getWhiteLabelConfigBySlug(slug);
    if (!config) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    return NextResponse.json(config);
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const body = await req.json();
    const data = updateWhiteLabelSchema.parse(body);

    // Fetch current brand settings not included in the access control guard
    const currentMerchant = await prisma.merchant.findUnique({
      where: { id: merchant.id },
      select: { brandColorsJson: true, featureFlags: true },
    });

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (data.logo !== undefined) {
      updateData.brandLogoUrl = data.logo;
    }

    if (data.primaryColor !== undefined) {
      const currentColors = (currentMerchant?.brandColorsJson as Record<string, string> | null) ?? {};
      updateData.brandColorsJson = { ...currentColors, primary: data.primaryColor };
    }

    if (data.hidePlatformBranding !== undefined) {
      const currentFlags = (currentMerchant?.featureFlags as Record<string, unknown> | null) ?? {};
      updateData.featureFlags = { ...currentFlags, hidePlatformBranding: data.hidePlatformBranding };
    }

    const updated = await prisma.merchant.update({
      where: { id: merchant.id },
      data: updateData,
      select: {
        brandLogoUrl: true,
        brandColorsJson: true,
        featureFlags: true,
      },
    });

    const brandColors = (updated.brandColorsJson as Record<string, string> | null) ?? {};
    const featureFlags = (updated.featureFlags as Record<string, unknown> | null) ?? {};

    return NextResponse.json({
      logo: updated.brandLogoUrl,
      primaryColor: brandColors.primary || '#8B7355',
      hidePlatformBranding: featureFlags.hidePlatformBranding === true,
    });
  });
}
