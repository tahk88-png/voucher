import { NextRequest, NextResponse } from 'next/server';
import { calculateVat, formatVatBreakdown } from '@/lib/vat';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const amountStr = searchParams.get('amount');
  const country = searchParams.get('country');
  const merchantId = searchParams.get('merchantId') || undefined;

  if (!amountStr || !country) {
    return NextResponse.json(
      { error: 'amount and country query parameters are required' },
      { status: 400 }
    );
  }

  const amountCents = parseInt(amountStr, 10);
  if (isNaN(amountCents) || amountCents < 0) {
    return NextResponse.json(
      { error: 'amount must be a non-negative integer (cents)' },
      { status: 400 }
    );
  }

  if (!/^[A-Za-z]{2}$/.test(country)) {
    return NextResponse.json(
      { error: 'country must be a 2-letter ISO country code' },
      { status: 400 }
    );
  }

  const result = await calculateVat(amountCents, country, merchantId);

  return NextResponse.json({
    ...result,
    formatted: formatVatBreakdown(result),
  });
}
