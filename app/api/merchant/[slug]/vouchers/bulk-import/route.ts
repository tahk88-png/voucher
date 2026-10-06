import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AccessControlError, accessErrorResponse, requireMerchantProfileAccessBySlug, requireMerchantCapability } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';
import { CacheKeys, invalidateCache } from '@/lib/cache';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { parseVoucherCsv, type VoucherCsvRow } from '@/lib/voucher-csv';
import { SUPPORTED_CURRENCIES } from '@/lib/currency-constants';

const MAX_ROWS = 500;

const jsonRowsSchema = z
  .array(
    z
      .object({
        name: z.string().max(200).optional(),
        type: z.enum(['percentage', 'fixed_amount', 'credit_amount']),
        value: z.number().int().positive(),
        currency: z
          .string()
          .transform((c) => c.toUpperCase())
          .refine((c) => (SUPPORTED_CURRENCIES as readonly string[]).includes(c), 'Unsupported currency'),
        validFrom: z.string().datetime(),
        validTo: z.string().datetime(),
        codePrefix: z.string().max(10).optional(),
        usageLimitTotal: z.number().int().positive().optional(),
      })
      .refine((r) => new Date(r.validTo) > new Date(r.validFrom), 'valid_to must be after valid_from')
      .refine((r) => r.type !== 'percentage' || r.value <= 10000, "A percentage can't be more than 100%")
  )
  .max(MAX_ROWS);

export const dynamic = 'force-dynamic';

// POST /api/merchant/[slug]/vouchers/bulk-import
// Body: CSV text (see lib/voucher-csv.ts for columns; values in euros/percent)
// or a JSON array of already-converted rows (minor units / basis points).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{slug: string}> }
) {
  return withErrorHandler(async () => {
  const { slug } = await params
    const { merchant, profile } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');
    // Gate bulk creation behind the same entitlement as single create —
    // otherwise a locked/over-limit merchant creates up to 500 free.
    await requireMerchantCapability(merchant.id, merchant.slug, 'voucher.create');

    const contentType = req.headers.get('content-type') || '';
    const merchantSettings = await prisma.merchant.findUnique({
      where: { id: merchant.id },
      select: { defaultCurrency: true },
    });
    let rows: VoucherCsvRow[] = [];

    if (contentType.includes('application/json')) {
      // JSON rows are already converted: value in minor units / basis points.
      const parsed = jsonRowsSchema.safeParse(await req.json());
      if (!parsed.success) {
        const first = parsed.error.errors[0];
        return NextResponse.json(
          { error: `Row ${typeof first?.path[0] === 'number' ? first.path[0] + 1 : '?'}: ${first?.message ?? 'invalid data'}` },
          { status: 400 }
        );
      }
      rows = parsed.data;
    } else {
      // CSV as merchants type it: euros / percent, "," or ";" separated.
      // Dates are whole days in UTC here (the upload page converts in the
      // merchant's own time zone and posts JSON instead).
      const result = parseVoucherCsv(await req.text(), {
        defaultCurrency: merchantSettings?.defaultCurrency,
        dayBoundary: 'utc',
        maxRows: MAX_ROWS,
      });
      if (result.errors.length > 0) {
        return NextResponse.json({ error: result.errors.slice(0, 10).join(' '), errors: result.errors }, { status: 400 });
      }
      rows = result.rows;
    }

    if (rows.length === 0) return NextResponse.json({ error: 'No rows to import' }, { status: 400 });
    if (rows.length > MAX_ROWS) return NextResponse.json({ error: `Max ${MAX_ROWS} vouchers per import` }, { status: 400 });

    const created = await prisma.$transaction(
      rows.map(row => prisma.voucher.create({
        data: {
          merchantId: merchant.id,
          type: row.type,
          value: row.value,
          currency: row.currency.toUpperCase(),
          validFrom: new Date(row.validFrom),
          validTo: new Date(row.validTo),
          codePrefix: row.codePrefix,
          usageLimitTotal: row.usageLimitTotal,
          designJson: row.name ? { headline: row.name } : Prisma.DbNull,
          status: 'draft',
        },
      }))
    );

    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        actorUserId: profile.userId,
        action: 'voucher.bulk_import',
        resourceType: 'voucher',
        payloadJson: { count: created.length },
      },
    });

    await invalidateCache(CacheKeys.publicMerchantVouchers(merchant.id));

    return NextResponse.json({ imported: created.length, ids: created.map(v => v.id) });
  });
}
