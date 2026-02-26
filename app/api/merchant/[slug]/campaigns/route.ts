import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/errors';
import { CacheKeys, invalidateCache } from '@/lib/cache';
import { z } from 'zod';
import { AccessControlError, accessErrorResponse, requireMerchantCapability, requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';

const createCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['weekly', 'limited']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  price: z.number().int().nonnegative().nullable(),
  discountRules: z.record(z.any()).optional(),
  maxRedemptions: z.number().int().positive().nullable(),
  maxPurchases: z.number().int().positive().nullable(),
  terms: z.string().optional(),
  creditPercentage: z.number().int().min(0).max(10000).nullable(), // basis points (0-10000 = 0-100%)
});

const CAMPAIGNS_DEFAULT_PAGE_SIZE = 20;
const CAMPAIGNS_MAX_PAGE_SIZE = 100;
const campaignStatuses = new Set(['draft', 'active', 'ended']);
const campaignTypes = new Set(['weekly', 'limited']);

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return withErrorHandler(async () => {
    const { merchant, profile } = await requireMerchantProfileAccessBySlug(params.slug, 'merchant_admin');
    await requireMerchantCapability(merchant.id, merchant.slug, 'campaign.create');

    const body = await req.json();
    const data = createCampaignSchema.parse(body);

    const campaign = await prisma.campaign.create({
      data: {
        merchantId: merchant.id,
        name: data.name,
        description: data.description,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        price: data.price,
        discountRules: data.discountRules ? JSON.stringify(data.discountRules) : Prisma.DbNull,
        maxRedemptions: data.maxRedemptions,
        maxPurchases: data.maxPurchases,
        terms: data.terms,
        creditPercentage: data.creditPercentage,
        status: 'draft',
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        actorUserId: profile.userId,
        action: 'campaign.created',
        payloadJson: {
          campaignId: campaign.id,
          name: campaign.name,
          type: campaign.type,
        },
      },
    });

    // Draft campaigns are not public by default, but clear public cache for consistency.
    await invalidateCache(CacheKeys.publicMerchantCampaigns(merchant.id));

    return NextResponse.json(campaign);
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return withErrorHandler(async () => {
    const { merchant } = await requireMerchantProfileAccessBySlug(params.slug, 'merchant_staff');
    const { searchParams } = new URL(req.url);

    const statusFilter = searchParams.get('status');
    const typeFilter = searchParams.get('type');
    const qFilterRaw = searchParams.get('q');
    const qFilter = qFilterRaw?.trim() || '';
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const pageSize = clamp(parsePositiveInt(searchParams.get('pageSize'), CAMPAIGNS_DEFAULT_PAGE_SIZE), 1, CAMPAIGNS_MAX_PAGE_SIZE);
    const hasListControls =
      searchParams.has('status') ||
      searchParams.has('type') ||
      searchParams.has('q') ||
      searchParams.has('page') ||
      searchParams.has('pageSize');

    if (statusFilter && !campaignStatuses.has(statusFilter)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
    }

    if (typeFilter && !campaignTypes.has(typeFilter)) {
      return NextResponse.json({ error: 'Invalid type filter' }, { status: 400 });
    }

    const where: Prisma.CampaignWhereInput = {
      merchantId: merchant.id,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(qFilter
        ? {
            OR: [
              { name: { contains: qFilter, mode: 'insensitive' } },
              { description: { contains: qFilter, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    if (!hasListControls) {
      const campaigns = await prisma.campaign.findMany({
        where,
        include: {
          vouchers: true,
          _count: {
            select: {
              vouchers: true,
              purchases: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(campaigns);
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          vouchers: true,
          _count: {
            select: {
              vouchers: true,
              purchases: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.campaign.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      items: campaigns,
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      filters: {
        status: statusFilter ?? null,
        type: typeFilter ?? null,
        q: qFilter || null,
      },
    });
  });
}
