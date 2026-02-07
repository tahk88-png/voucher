import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { unlockCreditForRedemption } from '@/lib/credits';
import { WarmCard } from '@/components/warm-card';

export default async function RedeemByQrPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const redemption = await prisma.redemption.findUnique({
    where: { id: params.id },
    include: { merchant: true },
  });

  if (!redemption) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF7F2]">
        <WarmCard padding="lg" className="max-w-md w-full bg-white text-center">
          <h1 className="text-lg font-semibold text-[#2D2721]">Redemption not found</h1>
          <p className="text-sm text-[#6B5744] mt-2">The QR code is invalid or expired.</p>
        </WarmCard>
      </div>
    );
  }

  await requireMerchantRole(session.user.id, redemption.merchantId, 'merchant_staff');

  if (!redemption.confirmedAt) {
    await prisma.$transaction(async (tx) => {
      await tx.redemption.update({
        where: { id: redemption.id },
        data: { confirmedAt: new Date(), redeemedByStaffUserId: session.user.id },
      });
    });

    if (redemption.referralId) {
      await unlockCreditForRedemption(redemption.id, redemption.merchantId);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF7F2]">
      <WarmCard padding="lg" className="max-w-md w-full bg-white text-center">
        <h1 className="text-lg font-semibold text-[#2D2721]">Voucher redeemed</h1>
        <p className="text-sm text-[#6B5744] mt-2">
          {redemption.confirmedAt
            ? 'This voucher was already redeemed.'
            : 'Redemption confirmed successfully.'}
        </p>
      </WarmCard>
    </div>
  );
}
