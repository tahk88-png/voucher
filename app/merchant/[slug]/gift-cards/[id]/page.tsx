import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import GiftCardQr from '@/components/gift-card-qr';
import { formatCurrency } from '@/lib/utils';
import { normalizeGiftCardCode } from '@/lib/gift-cards';

const statusLabel: Record<string, string> = {
  active: 'Active',
  redeemed: 'Redeemed',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export default async function GiftCardDetailPage({
  params,
}: {
  params: { slug: string; id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const merchant = await prisma.merchant.findUnique({ where: { slug: params.slug } });
  if (!merchant) notFound();

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

  const giftCard = await prisma.giftCard.findFirst({
    where: { id: params.id, merchantId: merchant.id },
  });

  if (!giftCard) notFound();

  const code = normalizeGiftCardCode(giftCard.code);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redeemUrl = `${baseUrl}/redeem/gift-card/${code}`;

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: `/merchant/${params.slug}/dashboard` },
            { label: 'Gift cards', href: `/merchant/${params.slug}/gift-cards` },
            { label: code },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#2D2721]">Gift card</h1>
            <p className="text-sm text-[#6B5744]">Code {code}</p>
          </div>
          <div className="flex gap-2">
            <WarmButton asChild variant="outline">
              <Link href={`/g/${code}`}>Public view</Link>
            </WarmButton>
            <WarmButton asChild variant="outline">
              <Link href={`/merchant/${params.slug}/gift-cards/new`}>New gift card</Link>
            </WarmButton>
          </div>
        </div>

        <WarmCard padding="lg" className="bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#2D2721]">Gift card details</h2>
            <span
              className={`px-2 py-1 text-xs font-bold rounded-full ${
                giftCard.status === 'active'
                  ? 'bg-[#9DB5A5] text-white'
                  : giftCard.status === 'expired'
                  ? 'bg-[#E17B5C] text-white'
                  : 'bg-[#F2EDE3] text-[#8B7355]'
              }`}
            >
              {statusLabel[giftCard.status] || giftCard.status}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-[#8B7355]">Value</p>
              <p className="text-lg font-semibold text-[#2D2721]">
                {formatCurrency(giftCard.amount, giftCard.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#8B7355]">Valid from</p>
              <p className="text-lg font-semibold text-[#2D2721]">
                {giftCard.validFrom.toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#8B7355]">Valid to</p>
              <p className="text-lg font-semibold text-[#2D2721]">
                {giftCard.validTo ? giftCard.validTo.toLocaleDateString() : 'No expiry'}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#8B7355]">Redeemed at</p>
              <p className="text-lg font-semibold text-[#2D2721]">
                {giftCard.redeemedAt ? giftCard.redeemedAt.toLocaleDateString() : 'Not redeemed'}
              </p>
            </div>
          </div>
        </WarmCard>

        <WarmCard padding="lg" className="bg-white">
          <h2 className="text-lg font-semibold text-[#2D2721] mb-4">Staff redemption QR</h2>
          <div className="flex flex-col items-center gap-4 text-center">
            <GiftCardQr qrText={redeemUrl} />
            <p className="text-sm text-[#6B5744]">
              Staff can scan this QR to redeem and invalidate the gift card.
            </p>
            <p className="text-xs text-[#8B7355] break-all">{redeemUrl}</p>
          </div>
        </WarmCard>
      </div>
    </div>
  );
}
