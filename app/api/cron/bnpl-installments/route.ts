import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { logger } from '@/lib/logger';
import { buildInstallmentChargeParams } from '@/lib/bnpl';

/**
 * Cron endpoint that charges due BNPL installments via Stripe.
 * Runs daily via Vercel cron. GET is required for Vercel invocation;
 * POST is kept for manual/admin triggers.
 * Protected by CRON_SECRET via Authorization or x-cron-secret header.
 */
export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = req.headers.get('x-cron-secret') || authHeader?.replace('Bearer ', '');
  if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  let charged = 0;
  let failed = 0;
  let defaulted = 0;

  try {
    // Find all active plans with installments due
    const duePlans = await prisma.installmentPlan.findMany({
      where: {
        status: 'active',
        nextInstallmentDate: { lte: now },
      },
    });

    for (const plan of duePlans) {
      const installments = plan.installmentsJson as Array<{
        number: number;
        amountCents: number;
        dueDate: string;
        status: string;
        stripePaymentIntentId?: string;
      }>;

      // Find the next pending installment
      const pendingIdx = installments.findIndex((i) => i.status === 'pending');
      if (pendingIdx === -1) {
        // All installments are paid — mark completed
        await prisma.installmentPlan.update({
          where: { id: plan.id },
          data: { status: 'completed', nextInstallmentDate: null },
        });
        continue;
      }

      const installment = installments[pendingIdx];
      const dueDate = new Date(installment.dueDate);

      // Only process if due
      if (dueDate > now) continue;

      try {
        // A plan can only be charged off-session if it carries a saved
        // customer + payment method (both collected at plan creation). Without
        // them there is nothing to charge — fail the installment so the plan
        // moves toward `defaulted` instead of silently retrying forever.
        if (!plan.stripeCustomerId || !plan.stripePaymentMethodId) {
          throw new Error('Plan has no saved Stripe customer/payment method');
        }

        // Create + confirm the off-session charge against the saved card. The
        // idempotency key is scoped to this exact installment, so a same-day
        // cron re-run (or a Stripe SDK network retry) cannot double-charge it.
        const paymentIntent = await stripe.paymentIntents.create(
          buildInstallmentChargeParams({
            amountCents: installment.amountCents,
            currency: plan.currency,
            stripeCustomerId: plan.stripeCustomerId,
            stripePaymentMethodId: plan.stripePaymentMethodId,
            planId: plan.id,
            installmentNumber: installment.number,
            userId: plan.userId,
            merchantId: plan.merchantId,
          }),
          { idempotencyKey: `bnpl_installment_${plan.id}_${installment.number}` }
        );

        // Update installment status
        installments[pendingIdx] = {
          ...installment,
          status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
          stripePaymentIntentId: paymentIntent.id,
        };

        // Find next pending installment's due date
        const nextPending = installments.find(
          (i, idx) => idx > pendingIdx && i.status === 'pending'
        );
        const allPaid = installments.every(
          (i) => i.status === 'paid'
        );

        await prisma.installmentPlan.update({
          where: { id: plan.id },
          data: {
            installmentsJson: installments,
            status: allPaid ? 'completed' : 'active',
            nextInstallmentDate: nextPending ? new Date(nextPending.dueDate) : null,
          },
        });

        if (paymentIntent.status === 'succeeded') {
          charged++;
        }
      } catch (error) {
        // Mark as failed
        installments[pendingIdx] = { ...installment, status: 'failed' };

        // Check how many have failed — if 3+ consecutive failures, default the plan
        const consecutiveFailures = installments.filter((i) => i.status === 'failed').length;
        const isDefaulted = consecutiveFailures >= 3;

        await prisma.installmentPlan.update({
          where: { id: plan.id },
          data: {
            installmentsJson: installments,
            status: isDefaulted ? 'defaulted' : 'active',
          },
        });

        if (isDefaulted) {
          defaulted++;
        }
        failed++;

        logger.error('BNPL installment charge failed', {
          planId: plan.id,
          installmentNumber: installment.number,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      processed: duePlans.length,
      charged,
      failed,
      defaulted,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error('BNPL cron job failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
