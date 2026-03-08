import Stripe from 'stripe';
import { withCircuitBreaker } from './circuit-breaker';

function getStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set. Add it to your .env file.');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    typescript: true,
  });
}

// Lazy initialization - only creates client when first used
let stripeInstance: Stripe | null = null;

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    if (!stripeInstance) {
      stripeInstance = getStripeClient();
    }
    const value = stripeInstance[prop as keyof Stripe];
    return typeof value === 'function' ? value.bind(stripeInstance) : value;
  },
});

/**
 * Create a Stripe checkout session for voucher purchase or campaign payment
 */
export async function createCheckoutSession(params: {
  successUrl: string;
  cancelUrl: string;
  lineItems: Array<{
    price_data?: {
      currency: string;
      product_data: { name: string; description?: string };
      unit_amount: number;
    };
    price?: string;
    quantity: number;
  }>;
  metadata?: Record<string, string>;
  customerEmail?: string;
}): Promise<Stripe.Checkout.Session> {
  return withCircuitBreaker(
    { name: 'stripe', failureThreshold: 5, resetTimeoutMs: 30_000 },
    () => stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      line_items: params.lineItems,
      metadata: params.metadata,
      customer_email: params.customerEmail,
    }),
  );
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  if (!stripeInstance) {
    stripeInstance = getStripeClient();
  }
  return stripeInstance.webhooks.constructEvent(payload, signature, secret);
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
