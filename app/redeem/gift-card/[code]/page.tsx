import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { WarmCard } from '@/components/warm-card';
import { normalizeGiftCardCode } from '@/lib/gift-cards';
import { getTranslations } from 'next-intl/server';

export default async function RedeemGiftCardPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const t = await getTranslations('giftsPages.redeem');
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const code = normalizeGiftCardCode(rawCode);
  const giftCard = await prisma.giftCard.findUnique({
    where: { code },
    include: { merchant: true },
  });

  if (!giftCard) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF7F2]">
        <WarmCard padding="lg" className="max-w-md w-full bg-white text-center">
          <h1 className="text-lg font-semibold text-[#2D2721]">{t('notFound.title')}</h1>
          <p className="text-sm text-[#6B5744] mt-2">{t('notFound.body')}</p>
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
          <h1 className="text-lg font-semibold text-[#2D2721]">{t('notActive.title')}</h1>
          <p className="text-sm text-[#6B5744] mt-2">{t('notActive.body')}</p>
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
          <h1 className="text-lg font-semibold text-[#2D2721]">{t('expired.title')}</h1>
          <p className="text-sm text-[#6B5744] mt-2">{t('expired.body')}</p>
        </WarmCard>
      </div>
    );
  }

  let message = t('result.confirmed');
  if (giftCard.status !== 'active') {
    message = t('result.alreadyRedeemedOrCancelled');
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
      message = t('result.alreadyRedeemedOrInvalid');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF7F2]">
      <WarmCard padding="lg" className="max-w-md w-full bg-white text-center">
        <h1 className="text-lg font-semibold text-[#2D2721]">{t('result.title')}</h1>
        <p className="text-sm text-[#6B5744] mt-2">{message}</p>
      </WarmCard>
    </div>
  );
}
