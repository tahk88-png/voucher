import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';
import { withErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';

const checkoutSchema = z.object({
  lineItems: z.array(
    z.object({
      price: z.string().min(3),
      quantity: z.number().int().positive(),
    })
  ),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  metadata: z.record(z.string()).optional(),
});

function getAllowedRedirectHosts(): Set<string> {
  const hosts = new Set<string>();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  try {
    hosts.add(new URL(appUrl).host);
  } catch {
    // Ignore invalid env
  }
  const rootDomain = (process.env.PLATFORM_ROOT_DOMAIN || '').trim();
  if (rootDomain) {
    hosts.add(rootDomain);
  }
  const extra = (process.env.ALLOWED_CHECKOUT_REDIRECT_HOSTS || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  for (const host of extra) hosts.add(host);
  return hosts;
}

function isAllowedRedirect(url: string, allowedHosts: Set<string>) {
  try {
    const parsed = new URL(url);
    if (!allowedHosts.has(parsed.host)) return false;
    if (parsed.protocol !== 'https:' && process.env.NODE_ENV === 'production') return false;
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured. STRIPE_SECRET_KEY is required.' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const data = checkoutSchema.parse(body);

    const allowedHosts = getAllowedRedirectHosts();
    if (!isAllowedRedirect(data.successUrl, allowedHosts) || !isAllowedRedirect(data.cancelUrl, allowedHosts)) {
      return NextResponse.json({ error: 'Invalid redirect URL' }, { status: 400 });
    }

    const allowedPrices = (process.env.STRIPE_ALLOWED_PRICE_IDS || '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (process.env.NODE_ENV === 'production' && allowedPrices.length === 0) {
      return NextResponse.json(
        { error: 'Checkout is not configured. Missing STRIPE_ALLOWED_PRICE_IDS.' },
        { status: 503 }
      );
    }
    if (allowedPrices.length > 0) {
      const allowed = new Set(allowedPrices);
      const invalid = data.lineItems.find((item) => !allowed.has(item.price));
      if (invalid) {
        return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
      }
    }

    const checkoutSession = await createCheckoutSession({
      lineItems: data.lineItems,
      successUrl: data.successUrl,
      cancelUrl: data.cancelUrl,
      metadata: {
        ...data.metadata,
        userId: session.user.id,
      },
      customerEmail: session.user.email || undefined,
    });

    return NextResponse.json({ url: checkoutSession.url });
  });
}
