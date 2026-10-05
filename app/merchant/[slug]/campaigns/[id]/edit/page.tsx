import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { AccessControlError, requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { normalizeCurrency } from '@/lib/money-input';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import CampaignForm from '../../campaign-form';

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  let merchantId: string;
  try {
    const access = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');
    merchantId = access.merchant.id;
  } catch (error) {
    if (error instanceof AccessControlError && error.status === 404) notFound();
    // Staff can view the campaign but not edit it.
    redirect(`/merchant/${slug}/campaigns/${id}`);
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id, merchantId, deletedAt: null },
    include: { merchant: { select: { defaultCurrency: true } } },
  });
  if (!campaign) notFound();

  const t = await getTranslations('nav');
  const tc = await getTranslations('merchantCampaigns');
  const currency = normalizeCurrency(campaign.merchant.defaultCurrency);

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <Breadcrumbs
          items={[
            { label: t('dashboard'), href: `/merchant/${slug}/dashboard` },
            { label: t('campaigns'), href: `/merchant/${slug}/campaigns` },
            { label: campaign.name, href: `/merchant/${slug}/campaigns/${campaign.id}` },
            { label: tc('edit.breadcrumb') },
          ]}
        />
        <h1 className="text-2xl font-semibold text-[var(--text)] mb-6">{tc('edit.title')}</h1>
        <CampaignForm
          merchantSlug={slug}
          currency={currency}
          campaignId={campaign.id}
          initial={{
            name: campaign.name,
            description: campaign.description,
            type: campaign.type === 'weekly' ? 'weekly' : 'limited',
            startDate: campaign.startDate.toISOString(),
            endDate: campaign.endDate.toISOString(),
            price: campaign.price,
            maxRedemptions: campaign.maxRedemptions,
            maxPurchases: campaign.maxPurchases,
            terms: campaign.terms,
            creditPercentage: campaign.creditPercentage,
          }}
        />
      </div>
    </div>
  );
}
