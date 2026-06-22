import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { withErrorHandler } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { calculateInstallments, BnplPlanType } from '@/lib/bnpl';
import { getOrCreateStripeCustomerForUser } from '@/lib/stripe-customers';
import { SUPPORTED_CURRENCIES } from '@/lib/currency-constants';

const VALID_PLANS: BnplPlanType[] = ['3x', '6x', '12x'];
const MIN_PURCHASE_CENTS = 5000;
// Upper bound (€50,000) so a malformed/abusive request can't push an
// unbounded amount through to Stripe or persist a corrupt plan.
const MAX_PURCHASE_CENTS = 5_000_000;

/**
 * Create a BNPL installment plan.
 *
 * The client must first collect an off-session-capable PaymentMethod
 * (e.g. via a SetupIntent with `usage: 'off_session'` confirmed in Stripe
 * Elements) and pass its id as `paymentMethodId`. We attach it to the user's
 * (reused or freshly created) Stripe Customer, charge installment 1 on the
 * spot, and persist the customer + payment method + currency on the plan so
 * the daily cron can charge installments 2..N off-session.
 */
export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json().catch(() => ({}));
    const { voucherId, planType, paymentMethodId } = body ?? {};

    if (!planType || !VALID_PLANS.includes(planType)) {
      return NextResponse.json(
        { error: 'planType must be one of: 3x, 6x, 12x' },
        { status: 400 }
      );
    }
    if (!paymentMethodId || typeof paymentMethodId !== 'string') {
      return NextResponse.json(
        {
          error:
            'paymentMethodId is required — collect a payment method client-side (SetupIntent) first',
        },
        { status: 400 }
      );
    }

    // Resolve amount, currency and merchant. When a voucher is supplied we
    // derive ALL THREE server-side from the voucher/campaign and ignore any
    // client-supplied price/currency, so a user can't POST a lower totalCents
    // (or a mismatched currency) to underpay. Only the voucher-less path
    // (ad-hoc / merchant-initiated) trusts the request body.
    let totalCents: number;
    let currency: string;
    let merchantId: string;

    if (voucherId) {
      const voucher = await prisma.voucher.findUnique({
        where: { id: voucherId },
        select: {
          status: true,
          currency: true,
          merchantId: true,
          campaign: { select: { price: true } },
        },
      });
      if (!voucher) {
        return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
      }
      if (voucher.status !== 'published') {
        return NextResponse.json(
          { error: 'Voucher not available for purchase' },
          { status: 400 }
        );
      }
      const price = voucher.campaign?.price ?? null;
      if (price === null || price <= 0) {
        return NextResponse.json(
          { error: 'Voucher has no purchase price and cannot be financed' },
          { status: 400 }
        );
      }
      totalCents = price;
      currency = voucher.currency.toLowerCase();
      merchantId = voucher.merchantId;
    } else {
      const bodyMerchantId = body?.merchantId;
      const bodyTotalCents = body?.totalCents;
      const bodyCurrency = body?.currency;
      if (!bodyMerchantId || bodyTotalCents == null || !bodyCurrency) {
        return NextResponse.json(
          {
            error:
              'merchantId, totalCents and currency are required when voucherId is omitted',
          },
          { status: 400 }
        );
      }
      if (
        typeof bodyTotalCents !== 'number' ||
        !Number.isInteger(bodyTotalCents) ||
        bodyTotalCents <= 0
      ) {
        return NextResponse.json(
          { error: 'totalCents must be a positive integer' },
          { status: 400 }
        );
      }
      currency = String(bodyCurrency).toLowerCase();
      // Validate against the supported-currency allowlist before it reaches
      // Stripe / the DB — an arbitrary code would corrupt every later
      // installment charge.
      if (!SUPPORTED_CURRENCIES.includes(currency.toUpperCase() as (typeof SUPPORTED_CURRENCIES)[number])) {
        return NextResponse.json(
          { error: `Unsupported currency. Must be one of: ${SUPPORTED_CURRENCIES.join(', ')}` },
          { status: 400 }
        );
      }
      totalCents = bodyTotalCents;
      merchantId = String(bodyMerchantId);
    }

    if (totalCents < MIN_PURCHASE_CENTS) {
      return NextResponse.json(
        { error: 'Minimum purchase for BNPL is 50.00' },
        { status: 400 }
      );
    }
    if (totalCents > MAX_PURCHASE_CENTS) {
      return NextResponse.json(
        { error: 'Amount exceeds the maximum financeable purchase' },
        { status: 400 }
      );
    }

    // Verify the merchant exists. (The voucher path already guarantees it via
    // FK, but this also covers the voucher-less path and yields a clean 404.)
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true },
    });
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Reuse-or-create the user's Stripe Customer (shared helper persists the
    // id back to User.stripeCustomerId so the off-session installment cron and
    // other flows resolve to the same customer).
    const stripeCustomerId = await getOrCreateStripeCustomerForUser(userId);

    // Attach the collected payment method to the customer and make it the
    // default so the off-session installment cron can charge it later.
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });
    } catch (err) {
      // Re-attaching a PM already on this customer is a no-op we tolerate;
      // anything else (PM belongs to another customer, bad id) must surface.
      if (
        !(err instanceof Stripe.errors.StripeInvalidRequestError) ||
        !/already( been)? attached/i.test(err.message)
      ) {
        throw err;
      }
    }
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const calculation = calculateInstallments(totalCents, planType);
    const firstInstallment = calculation.installments[0];

    // Charge installment 1 now. The user is present (off_session:false) so any
    // SCA step-up surfaces as `requires_action` and we hand the client a
    // client_secret to finish it; otherwise it succeeds synchronously.
    // `setup_future_usage: off_session` saves the mandate for installments 2..N.
    // The idempotency key makes a double-submit (or a retry after the plan
    // insert below fails) reuse the same charge instead of billing twice.
    let firstPaymentIntent: Stripe.PaymentIntent;
    try {
      firstPaymentIntent = await stripe.paymentIntents.create(
        {
          amount: firstInstallment.amountCents,
          currency,
          customer: stripeCustomerId,
          payment_method: paymentMethodId,
          payment_method_types: ['card'],
          confirm: true,
          off_session: false,
          setup_future_usage: 'off_session',
          metadata: {
            type: 'bnpl_installment',
            installmentNumber: '1',
            planType,
            userId,
            merchantId,
            ...(voucherId ? { voucherId } : {}),
          },
        },
        {
          idempotencyKey: `bnpl_create_${userId}_${paymentMethodId}_${totalCents}_${planType}_${voucherId ?? merchantId}`,
        }
      );
    } catch (err) {
      if (err instanceof Stripe.errors.StripeCardError) {
        logger.warn('BNPL first installment declined', {
          userId,
          merchantId,
          code: err.code,
          message: err.message,
        });
        return NextResponse.json(
          { error: 'Your card was declined for the first installment', code: err.code },
          { status: 402 }
        );
      }
      throw err;
    }

    const firstPaid = firstPaymentIntent.status === 'succeeded';

    // Stamp installment 1 with its PaymentIntent id + resolved status.
    const installments = calculation.installments.map((inst, idx) => ({
      ...inst,
      status: idx === 0 ? (firstPaid ? 'paid' : 'pending') : inst.status,
      stripePaymentIntentId: idx === 0 ? firstPaymentIntent.id : undefined,
    }));

    // Only activate the plan (and arm the cron) once installment 1 is
    // confirmed. When SCA is still pending (requires_action) we set
    // nextInstallmentDate=null so the cron skips this plan; the
    // payment_intent.succeeded webhook will arm it once the 3DS completes.
    const plan = await prisma.installmentPlan.create({
      data: {
        userId,
        voucherId: voucherId || null,
        merchantId,
        totalCents,
        currency,
        planType,
        interestRate: calculation.interestRate,
        totalWithInterestCents: calculation.totalWithInterestCents,
        installmentsJson: installments,
        status: 'active',
        stripeCustomerId,
        stripePaymentMethodId: paymentMethodId,
        nextInstallmentDate: firstPaid
          ? new Date(installments[1]?.dueDate || installments[0].dueDate)
          : null,
      },
    });

    // Best-effort: link the first charge back to the plan for traceability.
    await stripe.paymentIntents
      .update(firstPaymentIntent.id, {
        metadata: { ...firstPaymentIntent.metadata, planId: plan.id },
      })
      .catch(() => {});

    return NextResponse.json({
      planId: plan.id,
      firstInstallmentStatus: firstPaymentIntent.status,
      requiresAction: firstPaymentIntent.status === 'requires_action',
      // Only returned when installment 1 still needs the client to finish (SCA).
      clientSecret: firstPaid ? null : firstPaymentIntent.client_secret,
      installments,
      totalWithInterestCents: calculation.totalWithInterestCents,
      interestRate: calculation.interestRate,
    });
  });
}
