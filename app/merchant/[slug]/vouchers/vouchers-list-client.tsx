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

const statusLabel: Record<string, string> = {
  published: 'Active',
  paused: 'Paused',
  draft: 'Draft',
  ended: 'Ended',
};

type Voucher = {
  id: string;
  status: string;
  type: string;
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
          const aDesign = safeParseJson<VoucherDesign>(a.designJson);
          const bDesign = safeParseJson<VoucherDesign>(b.designJson);
          const aName = (aDesign?.headline as string) || '';
          const bName = (bDesign?.headline as string) || '';
          return aName.localeCompare(bName);
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
        title="No vouchers yet"
        description="Get started by creating your first voucher."
        action={{
          label: 'Create your first voucher',
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
              placeholder="Search by headline, code prefix, or ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[var(--border)] bg-[var(--surface)]"
              aria-label="Search vouchers"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="voucher-status-filter" className="text-sm font-medium mb-2 block text-[var(--text-muted)]">
                Status
              </label>
              <select
                id="voucher-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <option value="all">All status</option>
                <option value="published">Active</option>
                <option value="paused">Paused</option>
                <option value="draft">Draft</option>
                <option value="ended">Ended</option>
              </select>
            </div>
            <div>
              <label htmlFor="voucher-type-filter" className="text-sm font-medium mb-2 block text-[var(--text-muted)]">
                Type
              </label>
              <select
                id="voucher-type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <option value="all">All types</option>
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed amount</option>
                <option value="credit_amount">Credit amount</option>
              </select>
            </div>
            <div>
              <label htmlFor="voucher-sort-by" className="text-sm font-medium mb-2 block text-[var(--text-muted)]">
                Sort by
              </label>
              <select
                id="voucher-sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'redemptions')}
                className="w-full h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <option value="date">Date (newest)</option>
                <option value="name">Name (A-Z)</option>
                <option value="redemptions">Redemptions</option>
              </select>
            </div>
          </div>

          {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? (
            <div className="flex items-center gap-2 text-sm text-[var(--text-faint)]">
              <Filter className="h-4 w-4" />
              <span>
                Showing {filteredAndSorted.length} of {initialVouchers.length} vouchers
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
                Clear filters
              </WarmButton>
            </div>
          ) : null}
        </div>
      </WarmCard>

      {filteredAndSorted.length === 0 ? (
        <WarmCard padding="lg" className="bg-[var(--surface)] text-center py-16">
          <p className="text-[var(--text-muted)]">No vouchers match your filters.</p>
        </WarmCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAndSorted.map((voucher) => {
            const design = safeParseJson<Record<string, unknown>>(voucher.designJson);
            const headline = (design?.headline as string) || 'Voucher';
            const used = voucher._count.redemptions;
            const limit = voucher.usageLimitTotal;
            const pct = limit != null && limit > 0 ? Math.min(100, (used / limit) * 100) : null;
            const status = statusLabel[voucher.status] || voucher.status;

            return (
              <WarmCard key={voucher.id} padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-[var(--text)] truncate">{headline}</h3>
                    <p className="text-xs text-[var(--text-faint)] uppercase tracking-wide">
                      {voucher.type} - {voucher.currency}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded-full ${
                        voucher.status === 'published'
                          ? 'bg-[#4e8a5b] text-white'
                          : voucher.status === 'paused'
                          ? 'bg-[var(--danger)] text-white'
                          : 'bg-[#F2EDE3] text-[var(--text-faint)]'
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
                        <span>Usage</span>
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
                    <p className="text-xs text-[var(--text-faint)]">Usage: {used} - Unlimited</p>
                  )}
                  <p className="text-sm text-[var(--text-muted)]">
                    {new Date(voucher.validFrom).toLocaleDateString(undefined, { dateStyle: 'medium' })} -{' '}
                    {new Date(voucher.validTo).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </p>
                  <div className="flex gap-2">
                    <WarmButton asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/merchant/${merchantSlug}/vouchers/${voucher.id}`}>Edit</Link>
                    </WarmButton>
                    <WarmButton asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/v/${voucher.id}`}>View</Link>
                    </WarmButton>
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
