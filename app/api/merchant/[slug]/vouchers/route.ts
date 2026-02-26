import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireActiveMerchant } from '@/lib/merchant-status';
import { captureException } from '@/lib/error-tracking';
import { CacheKeys, getCached, invalidatePattern } from '@/lib/cache';
import { z } from 'zod';
import { AccessControlError, accessErrorResponse, requireMerchantCapability, requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';

const createVoucherSchema = z.object({
  type: z.enum(['percentage', 'fixed_amount', 'credit_amount']),
  value: z.number().int().positive(),
  currency: z.string(),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
  usageLimitTotal: z.number().int().positive().optional(),
  usageLimitPerUser: z.number().int().positive().optional(),
  weeklyDropEnabled: z.boolean().default(false),
  weeklyDropJson: z.any().optional(),
  conditionsJson: z.any().optional(),
  designJson: z.any().optional(),
  codePrefix: z.string().optional(),
});

const PUBLIC_VOUCHERS_CACHE_TTL_SECONDS = 60;
const VOUCHERS_DEFAULT_PAGE_SIZE = 20;
const VOUCHERS_MAX_PAGE_SIZE = 100;
const voucherStatuses = new Set(['draft', 'published', 'paused', 'ended']);
const voucherTypes = new Set(['percentage', 'fixed_amount', 'credit_amount']);

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
    const { merchant } = await requireMerchantProfileAccessBySlug(params.slug, 'merchant_admin');
    await requireActiveMerchant(merchant.id);
    await requireMerchantCapability(merchant.id, merchant.slug, 'voucher.create');

    const body = await req.json();
    const data = createVoucherSchema.parse(body);

    const voucher = await prisma.voucher.create({
      data: {
        merchantId: merchant.id,
        status: 'draft',
        ...data,
        validFrom: new Date(data.validFrom),
        validTo: new Date(data.validTo),
        weeklyDropJson: data.weeklyDropJson ? JSON.stringify(data.weeklyDropJson) : Prisma.DbNull,
        conditionsJson: data.conditionsJson ? JSON.stringify(data.conditionsJson) : Prisma.DbNull,
        designJson: data.designJson ? JSON.stringify(data.designJson) : Prisma.DbNull,
      },
    });

    // Draft vouchers are not public by default, but clear public cache for consistency.
    await invalidatePattern(`${CacheKeys.publicMerchantVouchers(merchant.id)}*`);

    return NextResponse.json(voucher);
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return withErrorHandler(async () => {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const merchant = await prisma.merchant.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const statusFilter = searchParams.get('status');
    const typeFilter = searchParams.get('type');
    const currencyFilterRaw = searchParams.get('currency');
    const currencyFilter = currencyFilterRaw?.trim().toUpperCase() || '';
    const qFilterRaw = searchParams.get('q');
    const qFilter = qFilterRaw?.trim() || '';
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const pageSize = clamp(parsePositiveInt(searchParams.get('pageSize'), VOUCHERS_DEFAULT_PAGE_SIZE), 1, VOUCHERS_MAX_PAGE_SIZE);
    const hasListControls =
      searchParams.has('status') ||
      searchParams.has('type') ||
      searchParams.has('currency') ||
      searchParams.has('q') ||
      searchParams.has('page') ||
      searchParams.has('pageSize');

    if (statusFilter && !voucherStatuses.has(statusFilter)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
    }

    if (typeFilter && !voucherTypes.has(typeFilter)) {
      return NextResponse.json({ error: 'Invalid type filter' }, { status: 400 });
    }

    const sharedWhere: Prisma.VoucherWhereInput = {
      merchantId: merchant.id,
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(currencyFilter ? { currency: currencyFilter } : {}),
      ...(qFilter
        ? {
            OR: [
              { codePrefix: { contains: qFilter, mode: 'insensitive' } },
              {
                campaign: {
                  is: {
                    name: { contains: qFilter, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const getPublicWhere = (): Prisma.VoucherWhereInput => ({
      ...sharedWhere,
      status: 'published',
    });

    const getPublicVouchersUnpaged = () =>
      getCached(
        CacheKeys.publicMerchantVouchers(merchant.id),
        () =>
          prisma.voucher.findMany({
            where: getPublicWhere(),
            orderBy: { createdAt: 'desc' },
          }),
        PUBLIC_VOUCHERS_CACHE_TTL_SECONDS
      );

    const getPublicVouchersPaged = () =>
      getCached(
        `${CacheKeys.publicMerchantVouchers(merchant.id)}:q=${encodeURIComponent(qFilter)}:type=${typeFilter ?? ''}:currency=${currencyFilter}:page=${page}:size=${pageSize}`,
        () =>
          prisma.voucher.findMany({
            where: getPublicWhere(),
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
          }),
        PUBLIC_VOUCHERS_CACHE_TTL_SECONDS
      );

    const getPublicVoucherList = async () => {
      if (!hasListControls) {
        return getPublicVouchersUnpaged();
      }

      const publicWhere = getPublicWhere();
      const [items, total] = await Promise.all([
        getPublicVouchersPaged(),
        prisma.voucher.count({ where: publicWhere }),
      ]);
      const totalPages = Math.max(1, Math.ceil(total / pageSize));

      return {
        items,
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        filters: {
          status: 'published',
          type: typeFilter ?? null,
          currency: currencyFilter || null,
          q: qFilter || null,
        },
      };
    };

    if (!session?.user?.id) {
      return NextResponse.json(await getPublicVoucherList());
    }

    try {
      await requireMerchantProfileAccessBySlug(params.slug, 'merchant_staff');
    } catch (error) {
      if (error instanceof AccessControlError) {
        if (error.status === 401 || error.status === 403) {
          return NextResponse.json(await getPublicVoucherList());
        }
        if (error.status === 404) {
          return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
        }
        return accessErrorResponse(error);
      }
      throw error;
    }

    const privateWhere: Prisma.VoucherWhereInput = {
      ...sharedWhere,
      ...(statusFilter ? { status: statusFilter } : {}),
    };

    if (!hasListControls) {
      const vouchers = await prisma.voucher.findMany({
        where: privateWhere,
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(vouchers);
    }

    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where: privateWhere,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.voucher.count({ where: privateWhere }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      items: vouchers,
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      filters: {
        status: statusFilter ?? null,
        type: typeFilter ?? null,
        currency: currencyFilter || null,
        q: qFilter || null,
      },
    });
  });
}
