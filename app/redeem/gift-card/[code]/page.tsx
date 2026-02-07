import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { WarmCard } from '@/components/warm-card';
import { normalizeGiftCardCode } from '@/lib/gift-cards';

export default async function RedeemGiftCardPage({ params }: { params: { code: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const code = normalizeGiftCardCode(params.code);
  const giftCard = await prisma.giftCard.findUnique({
    where: { code },
    include: { merchant: true },
  });

  if (!giftCard) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF7F2]">
        <WarmCard padding="lg" className="max-w-md w-full bg-white text-center">
          <h1 className="text-lg font-semibold text-[#2D2721]">Gift card not found</h1>
          <p className="text-sm text-[#6B5744] mt-2">The QR code is invalid or expired.</p>
        </WarmCard>
      </div>
    );
  }

  await requireMerchantRole(session.user.id, giftCard.merchantId, 'merchant_staff');

  const now = new Date();
  if (giftCard.validFrom > now) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF7F2]">
        <WarmCard padding="lg" className="max-w-md w-full bg-white text-center">
          <h1 className="text-lg font-semibold text-[#2D2721]">Gift card not active yet</h1>
          <p className="text-sm text-[#6B5744] mt-2">This gift card becomes valid later.</p>
        </WarmCard>
      </div>
    );
  }

  if (giftCard.validTo && giftCard.validTo < now) {
    if (giftCard.status === 'active') {
      await prisma.giftCard.update({
        where: { id: giftCard.id },
        data: { status: 'expired' },
      });
    }
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF7F2]">
        <WarmCard padding="lg" className="max-w-md w-full bg-white text-center">
          <h1 className="text-lg font-semibold text-[#2D2721]">Gift card expired</h1>
          <p className="text-sm text-[#6B5744] mt-2">This gift card is no longer valid.</p>
        </WarmCard>
      </div>
    );
  }

  let message = 'Redemption confirmed successfully.';
  if (giftCard.status !== 'active') {
    message = 'This gift card was already redeemed or cancelled.';
  } else {
    const updated = await prisma.giftCard.updateMany({
      where: {
        id: giftCard.id,
        status: 'active',
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gte: now } }],
      },
      data: {
        status: 'redeemed',
        redeemedAt: now,
        redeemedByStaffUserId: session.user.id,
      },
    });
    if (updated.count === 0) {
      message = 'This gift card was already redeemed or invalid.';
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF7F2]">
      <WarmCard padding="lg" className="max-w-md w-full bg-white text-center">
        <h1 className="text-lg font-semibold text-[#2D2721]">Gift card redeemed</h1>
        <p className="text-sm text-[#6B5744] mt-2">{message}</p>
      </WarmCard>
    </div>
  );
}
