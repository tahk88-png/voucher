'use client';

import Link from 'next/link';
import { Share2, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { getCurrencyLocale } from '@/lib/i18n-utils';
import { CopyField } from '../_components/copy-field';

interface ReferralRow {
  id: string;
  merchantName: string;
  voucherTitle: string;
  status: string;
  createdAt: string;
  /** Public, tracked link for this referral (/r/<id>). */
  link: string;
}

interface ReferralsClientProps {
  currency: string;
  stats: {
    totalEarned: number;
    pendingRewards: number;
    activeReferrals: number;
    completedReferrals: number;
  };
  referrals: ReferralRow[];
}

const statusStyles: Record<string, string> = {
  redeemed: 'bg-[#EDE9F8] text-[#4C1D95]',
  opened: 'bg-[#E6F4FF] text-[#0F766E]',
  created: 'bg-[#FFF4E6] text-[#9D402A]',
  default: 'bg-[#F4F4F5] text-[#4B5563]',
};

const KNOWN_STATUSES = ['created', 'opened', 'redeemed', 'expired', 'blocked'];
// Only links a friend can still use are worth copying again.
const SHAREABLE_STATUSES = new Set(['created', 'opened']);

export default function ReferralsClient({ currency, stats, referrals }: ReferralsClientProps) {
  const locale = useLocale();
  const t = useTranslations('referral');
  const tDashboard = useTranslations('dashboard');
  const tAccount = useTranslations('account');

  const formatMoney = (value: number) =>
    new Intl.NumberFormat(getCurrencyLocale(locale), { style: 'currency', currency }).format(value / 100);

  const statusLabel = (status: string) =>
    KNOWN_STATUSES.includes(status) ? tDashboard(`referralStatus.${status}` as never) : status;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <WarmCard padding="lg" className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#FFF9ED] text-[#E17B5C]">
              <Share2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-[#2D2721]">{t('howItWorksTitle')}</h1>
              <p className="mt-1 text-sm text-[#6B5744]">{t('howItWorksBody')}</p>
            </div>
          </div>
          <WarmButton asChild size="sm">
            <Link href="/campaigns">{t('findVoucher')}</Link>
          </WarmButton>
        </WarmCard>
        <WarmCard
          padding="lg"
          className="space-y-4 bg-gradient-to-br from-[#FFF9ED] via-[#FFEED1] to-[#FFE5B4] border border-[rgba(139,115,85,0.15)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white text-[#E17B5C] shadow-warm-sm">
              <Users className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#6B5744]">{t('activeReferrals')}</p>
              <p className="text-3xl font-semibold text-[#2D2721]">{stats.activeReferrals}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-[#6B5744]">
            <div className="rounded-[12px] bg-white/80 p-3 min-w-0">
              <p className="text-xs uppercase tracking-wide text-[#8B7355]">{t('pendingRewards')}</p>
              <p className="text-lg font-semibold text-[#2D2721] break-words">{formatMoney(stats.pendingRewards)}</p>
            </div>
            <div className="rounded-[12px] bg-white/80 p-3 min-w-0">
              <p className="text-xs uppercase tracking-wide text-[#8B7355]">{t('totalEarned')}</p>
              <p className="text-lg font-semibold text-[#2D2721] break-words">{formatMoney(stats.totalEarned)}</p>
            </div>
          </div>
        </WarmCard>
      </div>

      <WarmCard padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-[#2D2721]">{t('yourReferrals')}</h2>
          <div className="text-sm text-[#8B7355] font-semibold">
            {tAccount('referrals.completedCount', { count: stats.completedReferrals })}
          </div>
        </div>
        {referrals.length === 0 ? (
          <div className="text-sm text-[#6B5744]">{t('noReferralsDescription')}</div>
        ) : (
          <div className="space-y-2">
            {referrals.map((referral) => (
              <div key={referral.id} className="space-y-3 rounded-[16px] border border-[#F0E2C9] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1 text-sm text-[#6B5744] min-w-0">
                    <p className="text-base font-semibold text-[#2D2721]">{referral.merchantName}</p>
                    <p className="text-xs uppercase tracking-wide text-[#8B7355]">{referral.voucherTitle}</p>
                    <p className="text-xs text-[#8B7355]">
                      {new Date(referral.createdAt).toLocaleDateString(getCurrencyLocale(locale), { dateStyle: 'medium' })}
                    </p>
                  </div>
                  <span
                    className={`self-start sm:self-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ${
                      statusStyles[referral.status] || statusStyles.default
                    }`}
                  >
                    {statusLabel(referral.status)}
                  </span>
                </div>
                {SHAREABLE_STATUSES.has(referral.status) && (
                  <CopyField value={referral.link} label={t('linkForVoucher', { voucher: referral.voucherTitle })} />
                )}
              </div>
            ))}
          </div>
        )}
      </WarmCard>
    </div>
  );
}
