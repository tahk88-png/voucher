import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyMobileToken } from '@/lib/mobile-auth';
import { withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

// GET /api/mobile/wallet — the user's spendable credit balance per currency
// (excludes locked + already-expired credit, matching the web wallet).
export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const userId = await verifyMobileToken(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const available = await prisma.creditLedger.groupBy({
      by: ['currency'],
      where: {
        userId,
        status: 'available',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      _sum: { amount: true },
    });

    const locked = await prisma.creditLedger.groupBy({
      by: ['currency'],
      where: { userId, status: 'locked' },
      _sum: { amount: true },
    });

    const lockedByCurrency = new Map(locked.map((l) => [l.currency, l._sum.amount ?? 0]));

    const balances = available.map((a) => ({
      currency: a.currency,
      available: a._sum.amount ?? 0,
      locked: lockedByCurrency.get(a.currency) ?? 0,
    }));

    // Include currencies that only have locked credit.
    for (const l of locked) {
      if (!balances.some((b) => b.currency === l.currency)) {
        balances.push({ currency: l.currency, available: 0, locked: l._sum.amount ?? 0 });
      }
    }

    return NextResponse.json({ balances });
  });
}
