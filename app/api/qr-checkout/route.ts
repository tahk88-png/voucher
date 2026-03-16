import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCheckoutSession } from '@/lib/stripe';
import { withErrorHandler } from '@/lib/error-handler';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const body = await req.json();
    const { merchantSlug, voucherId } = body as { merchantSlug: string; voucherId?: string };

    if (!merchantSlug) {
      return NextResponse.json({ error: 'merchantSlug is required' }, { status: 400 });
    }

    const merchant = await prisma.merchant.findUnique({ where: { slug: merchantSlug } });
    if (!merchant || !merchant.isActive) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    let voucher = null;
    if (voucherId) {
      voucher = await prisma.voucher.findFirst({
        where: { id: voucherId, merchantId: merchant.id, status: 'published' },
      });
      if (!voucher) {
        return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
      }
    }

    const intentId = crypto.randomUUID();
    const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;

    // If we have a voucher with a price, create a Stripe checkout
    if (voucher && voucher.type === 'fixed_amount') {
      const session = await createCheckoutSession({
        successUrl: `${baseUrl}/qr-checkout/${intentId}?status=success`,
        cancelUrl: `${baseUrl}/qr-checkout/${intentId}?status=cancelled`,
        lineItems: [
          {
            price_data: {
              currency: voucher.currency.toLowerCase(),
              product_data: {
                name: `Voucher from ${merchant.name}`,
                description: `${voucher.type} voucher - ${voucher.value} ${voucher.currency}`,
              },
              unit_amount: voucher.value,
            },
            quantity: 1,
          },
        ],
        metadata: {
          intentId,
          merchantId: merchant.id,
          voucherId: voucher.id,
          source: 'qr-checkout',
        },
      });

      return NextResponse.json({
        intentId,
        checkoutUrl: session.url,
        merchant: { name: merchant.name, slug: merchant.slug },
        voucher: voucher ? { id: voucher.id, type: voucher.type, value: voucher.value, currency: voucher.currency } : null,
      });
    }

    // No payment needed — just return the intent for confirmation
    return NextResponse.json({
      intentId,
      checkoutUrl: `${baseUrl}/qr-checkout/${intentId}`,
      merchant: { name: merchant.name, slug: merchant.slug },
      voucher: voucher ? { id: voucher.id, type: voucher.type, value: voucher.value, currency: voucher.currency } : null,
    });
  });
}
