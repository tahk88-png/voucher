import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import Link from 'next/link';
import { WarmButton } from '@/components/warm-button';
import { StatsCard } from '@/components/ui/stats-card';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle2, DollarSign, Gift, TrendingUp } from 'lucide-react';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { getTranslations } from 'next-intl/server';
import GiftCardsListClient from './gift-cards-list-client';

export default async function GiftCardsListPage({ params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const merchant = await prisma.merchant.findUnique({ where: { slug: params.slug } });
  if (!merchant) notFound();

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

  const t = await getTranslations('nav');

  const giftCards = await prisma.giftCard.findMany({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: 'desc' },
  });

  const totalGiftCards = giftCards.length;
  const activeGiftCards = giftCards.filter((card) => card.status === 'active').length;
  const redeemedGiftCards = giftCards.filter((card) => card.status === 'redeemed').length;
  const totalValue = giftCards.reduce((sum, card) => sum + card.amount, 0);

  const serializedGiftCards = giftCards.map((card) => ({
    ...card,
    validFrom: card.validFrom.toISOString(),
    validTo: card.validTo ? card.validTo.toISOString() : null,
    redeemedAt: card.redeemedAt ? card.redeemedAt.toISOString() : null,
    designJson: card.designJson
      ? (typeof card.designJson === 'string'
          ? card.designJson
          : JSON.stringify(card.designJson))
      : null,
  }));

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs
          items={[
            { label: t('dashboard'), href: `/merchant/${params.slug}/dashboard` },
            { label: t('giftCards') },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
              <Gift className="h-6 w-6 text-[#2D2721]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#2D2721]">Gift cards</h1>
              <p className="text-sm text-[#6B5744]">Create and manage gift cards</p>
            </div>
          </div>
          <WarmButton asChild>
            <Link href={`/merchant/${params.slug}/gift-cards/new`}>New gift card</Link>
          </WarmButton>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatsCard
            title="Total gift cards"
            value={totalGiftCards}
            description="All issued gift cards"
            icon={Gift}
          />
          <StatsCard
            title="Active"
            value={activeGiftCards}
            description="Currently redeemable"
            icon={TrendingUp}
          />
          <StatsCard
            title="Redeemed"
            value={redeemedGiftCards}
            description="Completed redemptions"
            icon={CheckCircle2}
          />
          <StatsCard
            title="Total value"
            value={formatCurrency(totalValue, merchant.defaultCurrency)}
            description="Issued gift card value"
            icon={DollarSign}
          />
        </div>

        <GiftCardsListClient giftCards={serializedGiftCards} merchantSlug={params.slug} />
      </div>
    </div>
  );
}
