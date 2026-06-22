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
 * Create a Stripe checkout session for voucher purchase or campaign payment.
 *
 * When `connectedAccountId` is provided (merchant has Connect onboarding
 * complete), we split the charge: the `applicationFeeAmount` stays on the
 * platform balance and the remainder is transferred to the connected
 * account via `transfer_data[destination]`. Un-connected merchants still
 * work via direct charge — funds sit on the platform balance until a
 * manual payout (legacy path, kept for backwards compatibility).
 *
 * See also: `lib/stripe-fees.ts` for the platform-fee percentage and
 * `app/api/stripe/webhook/route.ts` for the capture-side reconciliation.
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
  /** acct_... from Merchant.stripeAccountId. Omit for platform-only charges. */
  connectedAccountId?: string | null;
  /** Platform fee in smallest currency unit (cents). Required if connectedAccountId is set. */
  applicationFeeAmount?: number;
}): Promise<Stripe.Checkout.Session> {
  // Mirror session metadata onto the PaymentIntent so it lands on the
  // resulting Charge. Stripe does NOT copy Checkout Session metadata onto
  // the PaymentIntent/Charge — without this the charge.refunded and
  // charge.dispute.created webhook handlers (which key off
  // charge.metadata.purchaseId) silently no-op and a refunded purchase
  // keeps its voucher.
  const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData = {
    ...(params.metadata ? { metadata: params.metadata } : {}),
    ...(params.connectedAccountId
      ? {
          application_fee_amount: params.applicationFeeAmount ?? 0,
          transfer_data: { destination: params.connectedAccountId },
        }
      : {}),
  };

  const hasPaymentIntentData = Object.keys(paymentIntentData).length > 0;

  return withCircuitBreaker(
    { name: 'stripe', failureThreshold: 5, resetTimeoutMs: 30_000 },
    () =>
      stripe.checkout.sessions.create({
        mode: 'payment',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        line_items: params.lineItems,
        metadata: params.metadata,
        customer_email: params.customerEmail,
        ...(hasPaymentIntentData ? { payment_intent_data: paymentIntentData } : {}),
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

/**
 * --- Stripe Connect (Phase 2) ---
 *
 * We use Express accounts so Stripe owns the KYC UI. The flow is:
 *   1. Merchant admin clicks "Set up payouts" on the payouts settings page.
 *   2. API POSTs to /api/merchant/:slug/stripe/connect → we either create
 *      a new Express account + account_link, or a fresh account_link for
 *      an existing-but-incomplete account → respond with the onboarding URL.
 *   3. Merchant completes onboarding on Stripe → Stripe redirects back to
 *      the return URL (`/api/merchant/:slug/stripe/connect/return`) which
 *      refreshes our cached capabilities + redirects to the dashboard.
 *   4. `account.updated` webhook keeps `payoutsEnabled` and
 *      `stripeAccountStatus` in sync thereafter.
 *
 * These helpers encapsulate the Stripe API calls so route handlers stay
 * thin and testable.
 */

/**
 * Create a new Express-type connected account. Merchants are charged on
 * the platform account and we transfer the net to the connected account
 * via `transfer_data` at checkout time. `business_type: 'company'` is the
 * default expected case for a SaaS merchant; Stripe will refine during
 * onboarding if the user opts for a sole proprietorship.
 */
export async function createExpressAccount(params: {
  email?: string | null;
  country?: string;
  businessName?: string | null;
}): Promise<Stripe.Account> {
  if (!stripeInstance) {
    stripeInstance = getStripeClient();
  }
  return stripeInstance.accounts.create({
    type: 'express',
    country: params.country || 'US',
    email: params.email || undefined,
    business_profile: params.businessName
      ? { name: params.businessName }
      : undefined,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
}

/**
 * Create an account link a merchant can use to (re)enter Stripe-hosted
 * onboarding. The link expires after a few minutes and is single-use.
 */
export async function createAccountOnboardingLink(params: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}): Promise<Stripe.AccountLink> {
  if (!stripeInstance) {
    stripeInstance = getStripeClient();
  }
  return stripeInstance.accountLinks.create({
    account: params.accountId,
    refresh_url: params.refreshUrl,
    return_url: params.returnUrl,
    type: 'account_onboarding',
  });
}

/**
 * Create a login link to the Express dashboard (where the merchant can
 * view their balance, payouts, edit banking, etc).
 */
export async function createDashboardLoginLink(
  accountId: string,
): Promise<Stripe.LoginLink> {
  if (!stripeInstance) {
    stripeInstance = getStripeClient();
  }
  return stripeInstance.accounts.createLoginLink(accountId);
}

/**
 * Fetch the latest capabilities for a connected account. We read this
 * inside the `account.updated` webhook and on the return-from-onboarding
 * redirect to keep our cached `payoutsEnabled` / `stripeAccountStatus`
 * columns in sync.
 */
export async function retrieveAccount(
  accountId: string,
): Promise<Stripe.Account> {
  if (!stripeInstance) {
    stripeInstance = getStripeClient();
  }
  return stripeInstance.accounts.retrieve(accountId);
}

/**
 * Map a Stripe `Account` to the narrow `stripeAccountStatus` enum we
 * persist on Merchant. Kept here (rather than at the call-site) so the
 * webhook handler, the return-redirect handler, and admin listings all
 * derive status the same way.
 */
export function deriveAccountStatus(
  account: Stripe.Account,
): { status: 'pending' | 'restricted' | 'enabled' | 'disabled'; payoutsEnabled: boolean } {
  const transfersActive = account.capabilities?.transfers === 'active';
  const payoutsEnabled = !!account.payouts_enabled && transfersActive;

  if (account.requirements?.disabled_reason) {
    return { status: 'disabled', payoutsEnabled: false };
  }
  if (payoutsEnabled) {
    return { status: 'enabled', payoutsEnabled: true };
  }
  if (account.details_submitted) {
    // Submitted but capability still pending review / additional info.
    return { status: 'restricted', payoutsEnabled: false };
  }
  return { status: 'pending', payoutsEnabled: false };
}
