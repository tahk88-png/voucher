import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { withErrorHandler } from '@/lib/error-handler';
import { calculateInstallments, BnplPlanType } from '@/lib/bnpl';

const VALID_PLANS: BnplPlanType[] = ['3x', '6x', '12x'];

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { voucherId, merchantId, totalCents, currency, planType } = await req.json();

    if (!merchantId || !totalCents || !currency || !planType) {
      return NextResponse.json(
        { error: 'merchantId, totalCents, currency, and planType are required' },
        { status: 400 }
      );
    }

    if (!VALID_PLANS.includes(planType)) {
      return NextResponse.json(
        { error: 'planType must be one of: 3x, 6x, 12x' },
        { status: 400 }
      );
    }

    if (totalCents < 5000) {
      return NextResponse.json(
        { error: 'Minimum purchase for BNPL is 50.00' },
        { status: 400 }
      );
    }

    // Verify merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, name: true },
    });
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const calculation = calculateInstallments(totalCents, planType);

    // Create Stripe PaymentIntent for the first installment
    const firstInstallment = calculation.installments[0];
    const paymentIntent = await stripe.paymentIntents.create({
      amount: firstInstallment.amountCents,
      currency: currency.toLowerCase(),
      metadata: {
        type: 'bnpl_installment',
        installmentNumber: '1',
        planType,
        userId: session.user.id,
        merchantId,
        ...(voucherId && { voucherId }),
      },
    });

    // Mark first installment with stripe ID
    const installments = calculation.installments.map((inst, idx) => ({
      ...inst,
      stripePaymentIntentId: idx === 0 ? paymentIntent.id : undefined,
    }));

    // Create the installment plan
    const plan = await prisma.installmentPlan.create({
      data: {
        userId: session.user.id,
        voucherId: voucherId || null,
        merchantId,
        totalCents,
        planType,
        interestRate: calculation.interestRate,
        totalWithInterestCents: calculation.totalWithInterestCents,
        installmentsJson: installments,
        status: 'active',
        nextInstallmentDate: new Date(installments[1]?.dueDate || installments[0].dueDate),
      },
    });

    return NextResponse.json({
      planId: plan.id,
      clientSecret: paymentIntent.client_secret,
      installments,
      totalWithInterestCents: calculation.totalWithInterestCents,
      interestRate: calculation.interestRate,
    });
  });
}
