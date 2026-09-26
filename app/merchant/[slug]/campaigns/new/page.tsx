'use client';

import { useParams } from 'next/navigation';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { useTranslations } from 'next-intl';
import CampaignForm from '../campaign-form';
import { useMerchantSettings } from '../../_components/merchant-settings-context';

export default function NewCampaignPage() {
  const params = useParams();
  const merchantSlug = params.slug as string;
  const { defaultCurrency } = useMerchantSettings();
  const t = useTranslations();
  const tNav = useTranslations('nav');

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <Breadcrumbs
          items={[
            { label: tNav('dashboard'), href: `/merchant/${merchantSlug}/dashboard` },
            { label: tNav('campaigns'), href: `/merchant/${merchantSlug}/campaigns` },
            { label: t('merchant.createCampaign') },
          ]}
        />
        <div className="mb-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#cc785c] to-[#b5613f] flex items-center justify-center shadow-warm flex-shrink-0">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text)]">{t('merchant.createCampaign')}</h1>
            <p className="text-sm text-[var(--text-muted)]">{t('merchant.setUpCampaign')}</p>
          </div>
        </div>

        <p className="mb-4 text-sm text-[var(--text-muted)]">
          New campaigns start as a draft. Customers can&apos;t see them until you publish from the campaign page.
        </p>

        <CampaignForm merchantSlug={merchantSlug} currency={defaultCurrency} />
      </div>
    </div>
  );
}
