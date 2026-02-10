import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import Link from 'next/link';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { formatCurrency } from '@/lib/utils';
import GenerateVouchersButton from './generate-vouchers-button';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { getTranslations } from 'next-intl/server';
import CampaignPromotionForm from './campaign-promotion-form';

export default async function CampaignDetailPage({
  params,
}: {
  params: { slug: string; id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const merchant = await prisma.merchant.findUnique({ where: { slug: params.slug } });
  if (!merchant) notFound();

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

  const member = await prisma.merchantMember.findUnique({
    where: { merchantId_userId: { merchantId: merchant.id, userId: session.user.id } },
  });
  const isAdmin = member?.role === 'merchant_admin';

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: {
      merchant: {
        select: { defaultCurrency: true },
      },
      vouchers: {
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          vouchers: true,
          purchases: true,
        },
      },
    },
  });

  if (!campaign || campaign.merchantId !== merchant.id) {
    notFound();
  }

  const t = await getTranslations('nav');

  const paidPurchases = await prisma.voucherPurchase.count({
    where: {
      campaignId: campaign.id,
      status: 'paid',
    },
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: t('dashboard'), href: `/merchant/${params.slug}/dashboard` },
            { label: t('campaigns'), href: `/merchant/${params.slug}/campaigns` },
            { label: campaign.name },
          ]}
        />
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#2D2721]">{campaign.name}</h1>
          <p className="text-sm text-[#6B5744]">
            {campaign.description || 'No description'}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          {[
            { label: 'Status', value: campaign.status },
            { label: 'Type', value: campaign.type },
            {
              label: 'Price',
              value:
                campaign.price !== null
                  ? formatCurrency(campaign.price, merchant.defaultCurrency)
                  : 'Free',
            },
            {
              label: 'Credit %',
              value: campaign.creditPercentage ? `${campaign.creditPercentage / 100}%` : 'None',
            },
          ].map((item) => (
            <WarmCard key={item.label} padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
              <p className="text-sm font-medium text-[#8B7355]">{item.label}</p>
              <p className="text-lg font-semibold capitalize text-[#2D2721] mt-2">{item.value}</p>
            </WarmCard>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          {[
            { label: 'Vouchers', value: campaign._count.vouchers },
            { label: 'Total purchases', value: campaign._count.purchases },
            { label: 'Paid purchases', value: paidPurchases },
          ].map((item) => (
            <WarmCard key={item.label} padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
              <p className="text-sm font-medium text-[#8B7355]">{item.label}</p>
              <p className="text-2xl font-semibold text-[#2D2721] mt-2">{item.value}</p>
            </WarmCard>
          ))}
        </div>

        {campaign.terms && (
          <WarmCard padding="lg" className="mb-6 bg-white border border-[rgba(139,115,85,0.15)]">
            <h2 className="text-sm font-semibold text-[#2D2721]">Terms and conditions</h2>
            <p className="text-sm text-[#6B5744] whitespace-pre-wrap mt-2">{campaign.terms}</p>
          </WarmCard>
        )}

        {isAdmin && (
          <WarmCard padding="lg" className="mb-6 bg-white border border-[rgba(139,115,85,0.15)]">
            <div>
              <h2 className="text-sm font-semibold text-[#2D2721]">Promotion</h2>
              <p className="text-sm text-[#6B5744]">
                Paid visibility for weekly newsletter and notifications.
              </p>
            </div>
            <div className="mt-4">
              <CampaignPromotionForm
                campaignId={campaign.id}
                initial={{
                  promotedWeeklyEmail: campaign.promotedWeeklyEmail,
                  promotedNotification: campaign.promotedNotification,
                  promotedUntil: campaign.promotedUntil
                    ? campaign.promotedUntil.toISOString().slice(0, 16)
                    : null,
                }}
              />
            </div>
          </WarmCard>
        )}

        <WarmCard padding="lg" className="relative bg-white border border-[rgba(139,115,85,0.15)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#2D2721]">Vouchers</h2>
              <p className="text-sm text-[#6B5744]">Vouchers generated from this campaign.</p>
            </div>
            <div className="relative">
              <GenerateVouchersButton
                campaignId={campaign.id}
                merchantSlug={params.slug}
                campaign={{
                  name: campaign.name,
                  startDate: campaign.startDate.toISOString(),
                  endDate: campaign.endDate.toISOString(),
                  price: campaign.price,
                  merchant: campaign.merchant,
                }}
              />
            </div>
          </div>
          <div className="mt-4">
            {campaign.vouchers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#6B5744] text-sm mb-4">No vouchers generated yet.</p>
                <GenerateVouchersButton
                  campaignId={campaign.id}
                  merchantSlug={params.slug}
                  campaign={{
                    name: campaign.name,
                    startDate: campaign.startDate.toISOString(),
                    endDate: campaign.endDate.toISOString(),
                    price: campaign.price,
                    merchant: { defaultCurrency: merchant.defaultCurrency },
                  }}
                />
              </div>
            ) : (
              <div className="space-y-2">
                {campaign.vouchers.map((voucher) => (
                  <div
                    key={voucher.id}
                    className="flex items-center justify-between p-3 border border-[rgba(139,115,85,0.15)] rounded-lg bg-[#FFF9ED]"
                  >
                    <div>
                      <p className="font-medium text-[#2D2721]">
                        {voucher.codePrefix || 'V'}-{voucher.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-sm text-[#6B5744] capitalize">{voucher.status}</p>
                    </div>
                    <WarmButton asChild variant="outline" size="sm">
                      <Link href={`/merchant/${params.slug}/vouchers/${voucher.id}`}>View</Link>
                    </WarmButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        </WarmCard>
      </div>
    </div>
  );
}
