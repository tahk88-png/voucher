import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';
import { campaignCategories, getCampaignCategoryId, getCampaignCategoryLabel } from '@/lib/campaign-categories';

/** Upper bound on campaign matches returned alongside the voucher page. */
const CAMPAIGN_RESULT_LIMIT = 24;

/**
 * Active campaigns matching the text query — the same "active" definition as
 * the /campaigns marketplace (status active, inside its date range, merchant
 * active). Category is derived the same way /campaigns derives it, so a
 * category filter shows the same campaigns in both places.
 */
async function searchCampaigns({
  q,
  category,
  maxPrice,
  sort,
}: {
  q: string;
  category: string;
  maxPrice: number;
  sort: string;
}) {
  const now = new Date();
  const where: Prisma.CampaignWhereInput = {
    status: 'active',
    startDate: { lte: now },
    endDate: { gte: now },
    merchant: { isActive: true },
  };
  const and: Prisma.CampaignWhereInput[] = [];
  if (q) {
    and.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { merchant: { name: { contains: q, mode: 'insensitive' } } },
      ],
    });
  }
  if (maxPrice > 0) {
    and.push({ OR: [{ price: { lte: maxPrice } }, { price: null }] });
  }
  // Narrow to the category in the database before the row cap, so older
  // matching campaigns are not crowded out by newer ones from other
  // categories. The substring match is a superset of getCampaignCategoryId
  // (word-start rule, category precedence); the exact filter runs below.
  const cat = category ? campaignCategories.find((c) => c.id === category) : undefined;
  if (cat) {
    const terms = [...cat.keywords, ...cat.stems];
    and.push({
      OR: terms.flatMap((term) => [
        { name: { contains: term, mode: 'insensitive' as const } },
        { description: { contains: term, mode: 'insensitive' as const } },
      ]),
    });
  }
  if (and.length > 0) where.AND = and;

  // Same ordering choices as the voucher results, so one Sort control means
  // the same thing for both sections.
  const orderBy: Prisma.CampaignOrderByWithRelationInput =
    sort === 'expiring'
      ? { endDate: 'asc' }
      : sort === 'popular'
        ? { purchases: { _count: 'desc' } }
        : { createdAt: 'desc' };

  const campaigns = await prisma.campaign.findMany({
    where,
    orderBy,
    // Headroom for the exact in-memory category check below.
    take: category ? CAMPAIGN_RESULT_LIMIT * 4 : CAMPAIGN_RESULT_LIMIT,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      endDate: true,
      merchant: {
        select: { id: true, name: true, slug: true, brandLogoUrl: true, defaultCurrency: true },
      },
    },
  });

  return campaigns
    .map((c) => {
      const categoryId = getCampaignCategoryId({ name: c.name, description: c.description });
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        price: c.price,
        currency: c.merchant.defaultCurrency,
        endDate: c.endDate.toISOString(),
        categoryId,
        categoryLabel: getCampaignCategoryLabel(categoryId),
        merchant: {
          id: c.merchant.id,
          name: c.merchant.name,
          slug: c.merchant.slug,
          brandLogoUrl: c.merchant.brandLogoUrl,
        },
      };
    })
    .filter((c) => !category || c.categoryId === category)
    .slice(0, CAMPAIGN_RESULT_LIMIT);
}

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
      // A database substring match: looser than getCampaignCategoryId's
      // word-start rule for English keywords, but a reasonable search filter.
      const terms = cat ? [...cat.keywords, ...cat.stems] : [];
      if (terms.length > 0) {
        const categoryConditions = terms.map((kw) => ({
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

    // Discount type / minimum discount are voucher attributes; campaigns are
    // only listed when no voucher-only filter is active, so those filters are
    // never silently ignored.
    const includeCampaigns = !type && !(minDiscount > 0);

    // ── Execute query ──
    const [vouchers, total, campaigns] = await Promise.all([
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
      includeCampaigns ? searchCampaigns({ q, category, maxPrice, sort }) : Promise.resolve([]),
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
      campaigns,
      meta: {
        total,
        campaignTotal: campaigns.length,
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
    logger.error('[search] Error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
