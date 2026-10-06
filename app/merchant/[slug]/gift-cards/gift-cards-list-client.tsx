'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { Input } from '@/components/ui/input';
import { safeParseJson, formatCurrency } from '@/lib/utils';
import { Gift, Search, Filter } from 'lucide-react';
import { GiftCardDesign } from '@/types';
import { useLocale, useTranslations } from 'next-intl';

const KNOWN_STATUSES = ['active', 'redeemed', 'expired', 'cancelled'];

type GiftCard = {
  id: string;
  code: string;
  amount: number;
  currency: string;
  status: string;
  validFrom: string;
  validTo: string | null;
  redeemedAt: string | null;
  message: string | null;
  designJson: string | GiftCardDesign | null;
};

export default function GiftCardsListClient({
  giftCards: initialGiftCards,
  merchantSlug,
}: {
  giftCards: GiftCard[];
  merchantSlug: string;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const t = useTranslations('merchantGiftCards');
  const locale = useLocale();
  const dateLocale = locale === 'en' ? 'en-GB' : locale;
  const statusText = (status: string) =>
    KNOWN_STATUSES.includes(status) ? t(`status.${status}`) : status;

  const filteredAndSorted = useMemo(() => {
    let filtered = [...initialGiftCards];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((card) => {
        const design = safeParseJson<GiftCardDesign>(card.designJson);
        const headline = (design?.headline as string) || '';
        return (
          headline.toLowerCase().includes(query) ||
          (card.message || '').toLowerCase().includes(query) ||
          card.code.toLowerCase().includes(query)
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((card) => card.status === statusFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount;
        case 'status':
          return a.status.localeCompare(b.status);
        case 'date':
        default:
          return new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime();
      }
    });

    return filtered;
  }, [initialGiftCards, searchQuery, statusFilter, sortBy]);

  if (initialGiftCards.length === 0) {
    return (
      <WarmCard padding="lg" className="bg-[var(--surface)] text-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#FAF7F2] flex items-center justify-center">
            <Gift className="h-8 w-8 text-[var(--text-faint)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-[var(--text)]">{t('listClient.emptyTitle')}</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              {t('listClient.emptyDescription')}
            </p>
          </div>
          <WarmButton asChild>
            <Link href={`/merchant/${merchantSlug}/gift-cards/new`}>{t('listClient.createFirst')}</Link>
          </WarmButton>
        </div>
      </WarmCard>
    );
  }

  return (
    <div className="space-y-4">
      <WarmCard padding="lg" className="bg-[var(--surface)]">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-faint)]" />
            <Input
              type="text"
              placeholder={t('listClient.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[var(--border)] bg-[var(--surface)]"
              aria-label={t('listClient.searchLabel')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="gift-card-status-filter" className="text-sm font-medium mb-2 block text-[var(--text-muted)]">
                {t('listClient.status')}
              </label>
              <select
                id="gift-card-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <option value="all">{t('listClient.allStatus')}</option>
                <option value="active">{t('status.active')}</option>
                <option value="redeemed">{t('status.redeemed')}</option>
                <option value="expired">{t('status.expired')}</option>
                <option value="cancelled">{t('status.cancelled')}</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="gift-card-sort-by" className="text-sm font-medium mb-2 block text-[var(--text-muted)]">
                {t('listClient.sortBy')}
              </label>
              <select
                id="gift-card-sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'status')}
                className="w-full h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <option value="date">{t('listClient.sortDate')}</option>
                <option value="amount">{t('listClient.sortAmount')}</option>
                <option value="status">{t('listClient.status')}</option>
              </select>
            </div>
          </div>

          {searchQuery || statusFilter !== 'all' ? (
            <div className="flex items-center gap-2 text-sm text-[var(--text-faint)]">
              <Filter className="h-4 w-4" />
              <span>
                {t('listClient.showing', { shown: filteredAndSorted.length, total: initialGiftCards.length })}
              </span>
              <WarmButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                {t('listClient.clearFilters')}
              </WarmButton>
            </div>
          ) : null}
        </div>
      </WarmCard>

      {filteredAndSorted.length === 0 ? (
        <WarmCard padding="lg" className="bg-[var(--surface)] text-center py-16">
          <p className="text-[var(--text-muted)]">{t('listClient.noMatches')}</p>
        </WarmCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAndSorted.map((card) => {
            const design = safeParseJson<GiftCardDesign>(card.designJson);
            const headline = (design?.headline as string) || t('listClient.defaultHeadline');
            const validTo = card.validTo
              ? new Date(card.validTo).toLocaleDateString(undefined, { dateStyle: 'medium' })
              : t('listClient.noExpiry');

            return (
              <WarmCard key={card.id} padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-[var(--text)] truncate">{headline}</h3>
                    <p className="text-xs text-[var(--text-faint)] uppercase tracking-wide">
                      {formatCurrency(card.amount, card.currency)} - {card.code}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded-full ${
                      card.status === 'active'
                        ? 'bg-[#9DB5A5] text-white'
                        : card.status === 'expired'
                        ? 'bg-[var(--danger)] text-white'
                        : 'bg-[#F2EDE3] text-[var(--text-faint)]'
                    }`}
                  >
                    {statusText(card.status)}
                  </span>
                </div>

                <div className="text-sm text-[var(--text-muted)] space-y-1">
                  <p>{t('listClient.validUntil', { date: validTo })}</p>
                  {card.redeemedAt ? (
                    <p>{t('listClient.redeemedOn', { date: new Date(card.redeemedAt).toLocaleDateString(dateLocale) })}</p>
                  ) : null}
                </div>
                <div className="flex gap-2 mt-4">
                  <WarmButton asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/merchant/${merchantSlug}/gift-cards/${card.id}`}>{t('listClient.details')}</Link>
                  </WarmButton>
                  <WarmButton asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/g/${card.code}`}>{t('listClient.view')}</Link>
                  </WarmButton>
                </div>
              </WarmCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
