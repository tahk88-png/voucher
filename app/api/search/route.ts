import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/search?q=text&category=cafe&type=percentage&sort=newest&minDiscount=10&maxPrice=50&page=1&limit=20
 *
 * Full-text search across vouchers and campaigns with rich filtering.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const q = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category') || '';
    const type = searchParams.get('type') || ''; // percentage | fixed_amount | credit_amount
    const sort = searchParams.get('sort') || 'newest'; // newest | popular | expiring
    const minDiscount = parseInt(searchParams.get('minDiscount') || '0');
    const maxPrice = parseInt(searchParams.get('maxPrice') || '0'); // cents
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '20'), 1),
      100
    );
    const skip = (page - 1) * limit;

    // ── Build voucher WHERE clause ──
    const voucherWhere: Prisma.VoucherWhereInput = {
      status: 'published',
      validFrom: { lte: new Date() },
      validTo: { gte: new Date() },
      merchant: { isActive: true },
    };

    // Full-text search across voucher code prefix, campaign name/description, merchant name
    if (q) {
      voucherWhere.OR = [
        { codePrefix: { contains: q, mode: 'insensitive' } },
        {
          campaign: {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
        { merchant: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // Type filter
    if (type && ['percentage', 'fixed_amount', 'credit_amount'].includes(type)) {
      voucherWhere.type = type;
    }

    // Min discount (value in basis points for percentage, minor units for fixed)
    if (minDiscount > 0) {
      voucherWhere.value = { gte: minDiscount };
    }

    // Max price filter (campaign price in minor units)
    if (maxPrice > 0) {
      voucherWhere.campaign = {
        ...((voucherWhere.campaign as Prisma.CampaignWhereInput) || {}),
        OR: [
          { price: { lte: maxPrice } },
          { price: null }, // free campaigns
        ],
      };
    }

    // Category filter — match campaign name/description against category keywords
    if (category) {
      const { campaignCategories } = await import('@/lib/campaign-categories');
      const cat = campaignCategories.find((c) => c.id === category);
      if (cat && cat.keywords.length > 0) {
        const categoryConditions = cat.keywords.map((kw) => ({
          campaign: {
            OR: [
              { name: { contains: kw, mode: 'insensitive' as const } },
              { description: { contains: kw, mode: 'insensitive' as const } },
            ],
          },
        }));
        // Merge with existing OR or create new
        if (voucherWhere.OR) {
          voucherWhere.AND = [
            { OR: voucherWhere.OR },
            { OR: categoryConditions },
          ];
          delete voucherWhere.OR;
        } else {
          voucherWhere.OR = categoryConditions;
        }
      }
    }

    // ── Sorting ──
    let orderBy: Prisma.VoucherOrderByWithRelationInput;
    switch (sort) {
      case 'popular':
        orderBy = { redemptions: { _count: 'desc' } };
        break;
      case 'expiring':
        orderBy = { validTo: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    // ── Execute query ──
    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where: voucherWhere,
        orderBy,
        skip,
        take: limit,
        include: {
          merchant: {
            select: {
              id: true,
              name: true,
              slug: true,
              brandLogoUrl: true,
              city: true,
            },
          },
          campaign: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              startDate: true,
              endDate: true,
              type: true,
            },
          },
          _count: {
            select: { redemptions: true },
          },
        },
      }),
      prisma.voucher.count({ where: voucherWhere }),
    ]);

    const results = vouchers.map((v) => ({
      id: v.id,
      type: v.type,
      value: v.value,
      currency: v.currency,
      validFrom: v.validFrom.toISOString(),
      validTo: v.validTo.toISOString(),
      codePrefix: v.codePrefix,
      isFlashSale: v.isFlashSale,
      flashSaleEndsAt: v.flashSaleEndsAt?.toISOString() || null,
      merchant: v.merchant,
      campaign: v.campaign,
      redemptionCount: v._count.redemptions,
    }));

    return NextResponse.json({
      results,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        query: q,
        filters: {
          category: category || null,
          type: type || null,
          sort,
          minDiscount: minDiscount || null,
          maxPrice: maxPrice || null,
        },
      },
    });
  } catch (error) {
    console.error('[search] Error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
