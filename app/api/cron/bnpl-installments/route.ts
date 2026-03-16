import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { logger } from '@/lib/logger';

/**
 * Cron endpoint that charges due BNPL installments via Stripe.
 * Should be called daily by a cron job.
 * Protected by CRON_SECRET header.
 */
export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
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
      include: {
        user: { select: { id: true, email: true } },
        merchant: { select: { id: true, name: true } },
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
        // Create a PaymentIntent for this installment
        const paymentIntent = await stripe.paymentIntents.create({
          amount: installment.amountCents,
          currency: plan.merchant.name ? 'eur' : 'usd',
          customer: plan.stripeCustomerId || undefined,
          metadata: {
            type: 'bnpl_installment',
            planId: plan.id,
            installmentNumber: String(installment.number),
            userId: plan.userId,
            merchantId: plan.merchantId,
          },
          confirm: !!plan.stripeCustomerId,
          off_session: !!plan.stripeCustomerId,
        });

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
