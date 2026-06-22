import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AccessControlError, accessErrorResponse, requireMerchantProfileAccessBySlug, requireMerchantCapability } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';
import { CacheKeys, invalidateCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// POST /api/merchant/[slug]/vouchers/bulk-import
// Body: multipart with CSV file or JSON array
// CSV columns: type,value,currency,validFrom,validTo,codePrefix,usageLimitTotal
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
    let rows: Array<{
      type: string;
      value: number;
      currency: string;
      validFrom: string;
      validTo: string;
      codePrefix?: string;
      usageLimitTotal?: number;
    }> = [];

    if (contentType.includes('application/json')) {
      rows = await req.json();
    } else {
      // Parse CSV text
      const text = await req.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        return NextResponse.json({ error: 'CSV must have header and at least one row' }, { status: 400 });
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
        rows.push({
          type: row['type'] || 'fixed_amount',
          value: parseInt(row['value'] || '0', 10),
          currency: row['currency'] || 'EUR',
          validFrom: row['validfrom'] || row['valid_from'] || new Date().toISOString(),
          validTo: row['validto'] || row['valid_to'] || new Date(Date.now() + 30 * 86400000).toISOString(),
          codePrefix: row['codeprefix'] || row['code_prefix'] || undefined,
          usageLimitTotal: row['usagelimittotal'] || row['usage_limit_total'] ? parseInt(row['usagelimittotal'] || row['usage_limit_total'], 10) : undefined,
        });
      }
    }

    if (rows.length === 0) return NextResponse.json({ error: 'No rows to import' }, { status: 400 });
    if (rows.length > 500) return NextResponse.json({ error: 'Max 500 vouchers per import' }, { status: 400 });

    // Validate
    const validTypes = ['percentage', 'fixed_amount', 'credit_amount'];
    for (const row of rows) {
      if (!validTypes.includes(row.type)) {
        return NextResponse.json({ error: `Invalid type: ${row.type}` }, { status: 400 });
      }
      if (!row.value || row.value <= 0) {
        return NextResponse.json({ error: 'Each voucher needs a positive value' }, { status: 400 });
      }
    }

    const created = await prisma.$transaction(
      rows.map(row => prisma.voucher.create({
        data: {
          merchantId: merchant.id,
          type: row.type,
          value: row.value,
          currency: row.currency,
          validFrom: new Date(row.validFrom),
          validTo: new Date(row.validTo),
          codePrefix: row.codePrefix,
          usageLimitTotal: row.usageLimitTotal,
          status: 'draft',
        },
      }))
    );

    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        actorUserId: profile.userId,
        action: 'voucher.bulk_import',
        payloadJson: { count: created.length },
      },
    });

    await invalidateCache(CacheKeys.publicMerchantVouchers(merchant.id));

    return NextResponse.json({ imported: created.length, ids: created.map(v => v.id) });
  });
}
