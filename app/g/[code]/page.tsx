import { notFound } from 'next/navigation';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { normalizeGiftCardCode } from '@/lib/gift-cards';
import GiftCardQr from '@/components/gift-card-qr';
import { safeParseJson, formatCurrency } from '@/lib/utils';
import { GiftCardDesign } from '@/types';
import { WarmCard } from '@/components/warm-card';

export default async function GiftCardPublicPage({ params }: { params: { code: string } }) {
  const code = normalizeGiftCardCode(params.code);
  const giftCard = await prisma.giftCard.findUnique({
    where: { code },
    include: { merchant: true },
  });

  if (!giftCard) notFound();

  const design = safeParseJson<GiftCardDesign>(giftCard.designJson);
  const headline = design?.headline || 'Gift card';
  const now = new Date();
  const expired = giftCard.validTo ? giftCard.validTo < now : false;
  const status = expired && giftCard.status === 'active' ? 'expired' : giftCard.status;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redeemUrl = `${baseUrl}/redeem/gift-card/${code}`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4]">
      <WarmCard padding="lg" className="max-w-lg w-full bg-white">
        <h1 className="text-xl font-semibold text-[#2D2721] mb-4">{headline}</h1>

        <div
          className="rounded-2xl border border-[#E7DCC7] overflow-hidden bg-[var(--bg)]"
          style={{
            ['--bg' as string]: design?.backgroundColor || '#fff8e6',
            ['--accent' as string]: design?.accentColor || '#f4b400',
            ['--text' as string]: design?.textColor || '#1f2937',
          }}
        >
          {giftCard.imageUrl ? (
            <div className="relative h-40 w-full overflow-hidden bg-[#FAF7F2]">
              <Image
                src={giftCard.imageUrl}
                alt="Gift card"
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                className="object-cover"
                unoptimized
              />
            </div>
          ) : null}
          <div className="p-5 space-y-3 text-[var(--text)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">{headline}</h3>
              {giftCard.logoUrl ? (
                <Image
                  src={giftCard.logoUrl}
                  alt="Brand logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                  unoptimized
                />
              ) : null}
            </div>
            <p className="text-2xl font-semibold text-[var(--accent)]">
              {formatCurrency(giftCard.amount, giftCard.currency)}
            </p>
            {giftCard.message ? <p className="text-sm text-[#6B5744]">{giftCard.message}</p> : null}
          </div>
        </div>

        <div className="text-sm text-[#6B5744] space-y-1 mt-6">
          <p>Merchant: {giftCard.merchant?.name || 'Merchant'}</p>
          <p>Code: {code}</p>
          <p>Valid until: {giftCard.validTo ? giftCard.validTo.toLocaleDateString() : 'No expiry'}</p>
        </div>

        {status === 'active' ? (
          <div className="flex flex-col items-center gap-3 text-center mt-6">
            <GiftCardQr qrText={redeemUrl} />
            <p className="text-sm text-[#6B5744]">Show this QR to staff to redeem the gift card.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#E7DCC7] p-4 text-center text-sm text-[#8B7355] mt-6">
            This gift card is {status}.
          </div>
        )}
      </WarmCard>
    </div>
  );
}
