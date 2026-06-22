import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cashback/summary
 *
 * Cross-merchant credit/cashback summary for the signed-in user.
 * Aggregates every CreditLedger row the user owns regardless of
 * status, so the wallet UI can show "available", "locked", "expiring
 * soon" and "used" totals in one place. Unlike /api/wallet which is
 * per-merchant and membership-scoped, this endpoint reaches across
 * every merchant the user has ever earned credit from.
 *
 * Shape:
 *   {
 *     currencies: ["EUR", "USD"],
 *     totals: { available, locked, used, expired, total },
 *     byMerchant: [{ merchantId, slug, name, available, locked, used, currency }],
 *     expiringSoon: [{ id, amount, currency, expiresAt, merchantName }],
 *   }
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const credits = await prisma.creditLedger.findMany({
    where: { userId },
    include: {
      merchant: {
        select: { id: true, slug: true, name: true, defaultCurrency: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Treat available-but-past-expiry as expired even if the auto-expire
  // cron hasn't flipped the status yet, so the summary matches what the
  // spend path will actually allow.
  const effectiveStatus = (c: { status: string; expiresAt: Date | null }): string =>
    c.status === 'available' && c.expiresAt && c.expiresAt < now ? 'expired' : c.status;

  // Totals across all merchants, per status bucket.
  const totals = credits.reduce(
    (acc, c) => {
      const status = effectiveStatus(c);
      if (status === 'available') acc.available += c.amount;
      else if (status === 'locked') acc.locked += c.amount;
      else if (status === 'used') acc.used += c.amount;
      else if (status === 'expired') acc.expired += c.amount;
      acc.total += c.amount;
      return acc;
    },
    { available: 0, locked: 0, used: 0, expired: 0, total: 0 },
  );

  // Per-merchant breakdown.
  const byMerchantMap = new Map<
    string,
    {
      merchantId: string;
      slug: string;
      name: string;
      currency: string;
      available: number;
      locked: number;
      used: number;
    }
  >();
  for (const c of credits) {
    const key = c.merchantId;
    const existing = byMerchantMap.get(key) ?? {
      merchantId: c.merchantId,
      slug: c.merchant.slug,
      name: c.merchant.name,
      currency: c.currency || c.merchant.defaultCurrency || 'EUR',
      available: 0,
      locked: 0,
      used: 0,
    };
    const status = effectiveStatus(c);
    if (status === 'available') existing.available += c.amount;
    else if (status === 'locked') existing.locked += c.amount;
    else if (status === 'used') existing.used += c.amount;
    byMerchantMap.set(key, existing);
  }

  const expiringSoon = credits
    .filter(
      (c) =>
        c.status === 'available' &&
        c.expiresAt &&
        c.expiresAt > now &&
        c.expiresAt <= soon,
    )
    .map((c) => ({
      id: c.id,
      amount: c.amount,
      currency: c.currency,
      expiresAt: c.expiresAt,
      merchantName: c.merchant.name,
      merchantSlug: c.merchant.slug,
    }));

  const currencies = Array.from(new Set(credits.map((c) => c.currency))).sort();

  return NextResponse.json({
    currencies,
    totals,
    byMerchant: Array.from(byMerchantMap.values()).sort(
      (a, b) => b.available + b.locked - (a.available + a.locked),
    ),
    expiringSoon,
  });
}
