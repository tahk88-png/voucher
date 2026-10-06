'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { safeParseJson } from '@/lib/utils';
import { sanitizeCssValue } from '@/lib/sanitize-css';
import { VoucherRowActions } from './voucher-row-actions';
import { Gift, Search, Filter, Ticket } from 'lucide-react';
import { VoucherDesign } from '@/types';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDisplayDate, voucherDisplayName, voucherHeadline } from '@/lib/voucher-display';
import { useLocale, useTranslations } from 'next-intl';
import { describeVoucherValueT, displayLocaleFor } from './voucher-i18n';

const STATUS_KEYS = ['published', 'paused', 'draft', 'ended', 'expired'];
const TYPE_KEYS = ['percentage', 'fixed_amount', 'credit_amount'];

// Paused is a temporary, merchant-chosen state: warning tone, not danger.
const statusClass: Record<string, string> = {
  published: 'bg-[#4e8a5b] text-white',
  paused: 'bg-[#F6E7C8] text-[#7a5a14]',
};

type Voucher = {
  id: string;
  status: string;
  type: string;
  value: number;
  currency: string;
  validFrom: string;
  validTo: string;
  usageLimitTotal: number | null;
  designJson: string | VoucherDesign | null;
  codePrefix: string | null;
  _count: {
    redemptions: number;
  };
};

export default function VouchersListClient({
  vouchers: initialVouchers,
  merchantSlug,
}: {
  vouchers: Voucher[];
  merchantSlug: string;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'redemptions'>('date');
  const t = useTranslations('merchantVouchers');
  const tLabels = useTranslations('labels');
  const tCommon = useTranslations('common');
  const displayLocale = displayLocaleFor(useLocale());

  const filteredAndSorted = useMemo(() => {
    let filtered = [...initialVouchers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((voucher) => {
        const design = safeParseJson<VoucherDesign>(voucher.designJson);
        const headline = (design?.headline as string) || '';
        const codePrefix = voucher.codePrefix || '';
        return (
          headline.toLowerCase().includes(query) ||
          codePrefix.toLowerCase().includes(query) ||
          voucher.id.toLowerCase().includes(query)
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((v) => v.type === typeFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': {
          return voucherDisplayName(a).localeCompare(voucherDisplayName(b));
        }
        case 'redemptions':
          return b._count.redemptions - a._count.redemptions;
        case 'date':
        default:
          return new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime();
      }
    });

    return filtered;
  }, [initialVouchers, searchQuery, statusFilter, typeFilter, sortBy]);

  if (initialVouchers.length === 0) {
    return (
      <EmptyState
        icon={Gift}
        title={t('list.empty.title')}
        description={t('list.empty.description')}
        action={{
          label: t('list.empty.action'),
          onClick: () => router.push(`/merchant/${merchantSlug}/vouchers/new`),
        }}
      />
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
              placeholder={t('list.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[var(--border)] bg-[var(--surface)]"
              aria-label={t('list.searchLabel')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="voucher-status-filter" className="text-sm font-medium mb-2 block text-[var(--text-muted)]">
                {t('list.statusLabel')}
              </label>
              <select
                id="voucher-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <option value="all">{t('list.statusAll')}</option>
                {STATUS_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {t(`list.status.${key}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="voucher-type-filter" className="text-sm font-medium mb-2 block text-[var(--text-muted)]">
                {t('list.typeLabel')}
              </label>
              <select
                id="voucher-type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <option value="all">{t('list.typeAll')}</option>
                {TYPE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {tLabels(`voucherType.${key}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="voucher-sort-by" className="text-sm font-medium mb-2 block text-[var(--text-muted)]">
                {t('list.sortLabel')}
              </label>
              <select
                id="voucher-sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'redemptions')}
                className="w-full h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <option value="date">{t('list.sort.date')}</option>
                <option value="name">{t('list.sort.name')}</option>
                <option value="redemptions">{t('list.sort.redemptions')}</option>
              </select>
            </div>
          </div>

          {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? (
            <div className="flex items-center gap-2 text-sm text-[var(--text-faint)]">
              <Filter className="h-4 w-4" />
              <span>
                {t('list.showing', { shown: filteredAndSorted.length, total: initialVouchers.length })}
              </span>
              <WarmButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
              >
                {t('list.clearFilters')}
              </WarmButton>
            </div>
          ) : null}
        </div>
      </WarmCard>

      {filteredAndSorted.length === 0 ? (
        <WarmCard padding="lg" className="bg-[var(--surface)] text-center py-16">
          <p className="text-[var(--text-muted)]">{t('list.noMatches')}</p>
        </WarmCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAndSorted.map((voucher) => {
            const valueText = describeVoucherValueT(tLabels, voucher, displayLocale);
            const headline = voucherHeadline(voucher) ?? valueText;
            const used = voucher._count.redemptions;
            const limit = voucher.usageLimitTotal;
            const pct = limit != null && limit > 0 ? Math.min(100, (used / limit) * 100) : null;
            const status = STATUS_KEYS.includes(voucher.status) ? t(`list.status.${voucher.status}`) : voucher.status;
            const typeKey = voucher.type.toLowerCase();
            const typeText = TYPE_KEYS.includes(typeKey) ? tLabels(`voucherType.${typeKey}`) : voucher.type.replace(/_/g, ' ');

            return (
              <WarmCard key={voucher.id} padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-[var(--text)] truncate">{headline}</h3>
                    <p className="text-xs text-[var(--text-faint)]">
                      {typeText} · {valueText}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded-full ${
                        statusClass[voucher.status] ?? 'bg-[#F2EDE3] text-[#6b5f4f]'
                      }`}
                    >
                      {status}
                    </span>
                    <VoucherRowActions
                      slug={merchantSlug}
                      voucherId={voucher.id}
                      status={voucher.status as 'draft' | 'published' | 'paused' | 'ended'}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {limit != null ? (
                    <div>
                      <style
                        dangerouslySetInnerHTML={{
                          __html: `.prog-${sanitizeCssValue(String(voucher.id))}{--pct:${sanitizeCssValue(String(pct ?? 0))}%}`,
                        }}
                      />
                      <div className="flex justify-between text-xs text-[var(--text-faint)] mb-1">
                        <span>{t('list.usage')}</span>
                        <span>
                          {used} / {limit}
                        </span>
                      </div>
                      <div
                        className={`prog-${String(voucher.id).replace(/\\s/g, '')} h-1.5 rounded-full bg-[#F2EDE3] overflow-hidden`}
                      >
                        <div className="h-full rounded-full bg-[#cc785c] transition-all w-[var(--pct)]" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-faint)]">{t('list.usageUnlimited', { used })}</p>
                  )}
                  <p className="text-sm text-[var(--text-muted)]">
                    {formatDisplayDate(voucher.validFrom, displayLocale)} – {formatDisplayDate(voucher.validTo, displayLocale)}
                  </p>
                  <div className="flex gap-2">
                    <WarmButton asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/merchant/${merchantSlug}/vouchers/${voucher.id}`}>{tCommon('edit')}</Link>
                    </WarmButton>
                    {voucher.status === 'published' ? (
                      <WarmButton asChild variant="outline" size="sm" className="flex-1">
                        <Link href={`/v/${voucher.id}`}>{t('list.view')}</Link>
                      </WarmButton>
                    ) : (
                      <WarmButton
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled
                        title={t('publicPageHint')}
                      >
                        {t('list.view')}
                      </WarmButton>
                    )}
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
