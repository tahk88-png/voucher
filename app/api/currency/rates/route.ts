import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

export async function GET() {
  return withErrorHandler(async () => {
    const rates = await prisma.currencyRate.findMany({
      orderBy: { fetchedAt: 'desc' },
    });

    return NextResponse.json({
      currencies: SUPPORTED_CURRENCIES,
      rates: rates.map((r: any) => ({
        from: r.fromCurrency,
        to: r.toCurrency,
        rate: r.rate,
        source: r.source,
        fetchedAt: r.fetchedAt.toISOString(),
      })),
    });
  });
}
