import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await params;

    const plan = await prisma.installmentPlan.findFirst({
      where: {
        id: planId,
        userId: session.user.id,
      },
      include: {
        merchant: {
          select: { name: true, slug: true },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const installments = plan.installmentsJson as Array<{
      number: number;
      amountCents: number;
      dueDate: string;
      status: string;
      stripePaymentIntentId?: string;
    }>;

    const paidCount = installments.filter((i) => i.status === 'paid').length;
    const totalCount = installments.length;
    const paidAmountCents = installments
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + i.amountCents, 0);
    const remainingAmountCents = plan.totalWithInterestCents - paidAmountCents;

    return NextResponse.json({
      id: plan.id,
      status: plan.status,
      planType: plan.planType,
      totalCents: plan.totalCents,
      currency: plan.currency,
      interestRate: plan.interestRate,
      totalWithInterestCents: plan.totalWithInterestCents,
      paidCount,
      totalCount,
      paidAmountCents,
      remainingAmountCents,
      nextInstallmentDate: plan.nextInstallmentDate,
      installments,
      merchant: plan.merchant,
      createdAt: plan.createdAt,
    });
  });
}
