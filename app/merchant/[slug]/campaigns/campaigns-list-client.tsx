'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { formatCurrency } from '@/lib/utils';
import { Megaphone, Search } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

type CampaignItem = {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  price: number | null;
  vouchers: number;
  purchases: number;
  paidPurchases: number;
  revenue: number;
};

/** Statuses with a label under merchantCampaigns.list.status.* (others show the raw value). */
const LABELLED_STATUSES = ['active', 'draft', 'ended', 'paused'];

const statusStyles: Record<string, string> = {
  active: 'bg-[#4e8a5b] text-white',
  draft: 'bg-[#F2EDE3] text-[var(--text-muted)]',
  ended: 'bg-[#E5E7EB] text-[#6B7280]',
  paused: 'bg-[var(--danger)] text-white',
};

export default function CampaignsListClient({
  campaigns,
  merchantSlug,
  currency,
  canCreate,
}: {
  campaigns: CampaignItem[];
  merchantSlug: string;
  currency: string;
  canCreate: boolean;
}) {
  const router = useRouter();
  const t = useTranslations('merchantCampaigns');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredCampaigns = useMemo(() => {
    let filtered = [...campaigns];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((campaign) => campaign.name.toLowerCase().includes(query));
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((campaign) => campaign.status === statusFilter);
    }

    return filtered;
  }, [campaigns, searchQuery, statusFilter]);

  const statusLabel = (status: string) =>
    LABELLED_STATUSES.includes(status) ? t(`list.status.${status}`) : status;
  const typeLabel = (type: string) =>
    type === 'weekly' || type === 'limited' ? t(`list.type.${type}`) : t('list.type.other', { type });

  if (campaigns.length === 0) {
    const description = canCreate
      ? t('list.empty.descriptionCanCreate')
      : t('list.empty.descriptionNeedsSubscription');
    return (
      <EmptyState
        icon={Megaphone}
        title={t('list.empty.title')}
        description={description}
        action={
          canCreate
            ? {
                label: t('list.empty.action'),
                onClick: () => router.push(`/merchant/${merchantSlug}/campaigns/new`),
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <WarmCard padding="lg" className="bg-[var(--surface)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-faint)]" />
            <Input
              type="text"
              placeholder={t('list.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[var(--border)] bg-[var(--surface)]"
              aria-label={t('list.searchLabel')}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'active', 'draft', 'paused', 'ended'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-gradient-to-br from-[#cc785c] to-[#b5613f] text-white shadow-warm'
                    : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[rgba(139,115,85,0.3)]'
                }`}
              >
                {status === 'all' ? t('list.filterAll') : statusLabel(status)}
              </button>
            ))}
          </div>
        </div>
      </WarmCard>

      {filteredCampaigns.length === 0 ? (
        <WarmCard padding="lg" className="bg-[var(--surface)] text-center py-12">
          <p className="text-[var(--text-muted)]">{t('list.noMatches')}</p>
          <WarmButton
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
          >
            {t('list.clearFilters')}
          </WarmButton>
        </WarmCard>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => {
            const statusText = statusLabel(campaign.status);
            const statusClass = statusStyles[campaign.status] || statusStyles.draft;
            const startLabel = new Date(campaign.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' });
            const endLabel = new Date(campaign.endDate).toLocaleDateString(undefined, { dateStyle: 'medium' });

            return (
              <WarmCard key={campaign.id} padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-[var(--text)]">{campaign.name}</h3>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
                        {statusText}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">{typeLabel(campaign.type)}</p>
                    <p className="text-xs text-[var(--text-faint)]">
                      {t('list.runs', { start: startLabel, end: endLabel })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <WarmButton asChild variant="outline" size="sm">
                      <Link href={`/merchant/${merchantSlug}/campaigns/${campaign.id}`}>{t('list.view')}</Link>
                    </WarmButton>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-[var(--text-faint)]">{t('list.stats.vouchers')}</div>
                    <div className="font-semibold text-[var(--text)]">{campaign.vouchers}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-faint)]">{t('list.stats.paidPurchases')}</div>
                    <div className="font-semibold text-[var(--text)]">{campaign.paidPurchases}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-faint)]">{t('list.stats.revenue')}</div>
                    <div className="font-semibold text-[var(--text)]">
                      {formatCurrency(campaign.revenue, currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-faint)]">{t('list.stats.price')}</div>
                    <div className="font-semibold text-[var(--text)]">
                      {campaign.price != null ? formatCurrency(campaign.price, currency) : t('list.free')}
                    </div>
                  </div>
                </div>
              </WarmCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
