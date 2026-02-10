'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { Input } from '@/components/ui/input';
import { safeParseJson, formatCurrency } from '@/lib/utils';
import { Gift, Search, Filter } from 'lucide-react';
import { GiftCardDesign } from '@/types';

const statusLabel: Record<string, string> = {
  active: 'Active',
  redeemed: 'Redeemed',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

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
      <WarmCard padding="lg" className="bg-white text-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#FAF7F2] flex items-center justify-center">
            <Gift className="h-8 w-8 text-[#8B7355]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-[#2D2721]">No gift cards yet</h3>
            <p className="text-sm text-[#6B5744] mb-4">
              Create a gift card with custom branding and QR redemption.
            </p>
          </div>
          <WarmButton asChild>
            <Link href={`/merchant/${merchantSlug}/gift-cards/new`}>Create your first gift card</Link>
          </WarmButton>
        </div>
      </WarmCard>
    );
  }

  return (
    <div className="space-y-4">
      <WarmCard padding="lg" className="bg-white">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B7355]" />
            <Input
              type="text"
              placeholder="Search by headline, code, or message"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[rgba(139,115,85,0.15)] bg-white"
              aria-label="Search gift cards"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="gift-card-status-filter" className="text-sm font-medium mb-2 block text-[#6B5744]">
                Status
              </label>
              <select
                id="gift-card-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-md border border-[rgba(139,115,85,0.15)] bg-white px-3 py-2 text-sm"
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="redeemed">Redeemed</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="gift-card-sort-by" className="text-sm font-medium mb-2 block text-[#6B5744]">
                Sort by
              </label>
              <select
                id="gift-card-sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'status')}
                className="w-full h-10 rounded-md border border-[rgba(139,115,85,0.15)] bg-white px-3 py-2 text-sm"
              >
                <option value="date">Date (newest)</option>
                <option value="amount">Amount (high to low)</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {searchQuery || statusFilter !== 'all' ? (
            <div className="flex items-center gap-2 text-sm text-[#8B7355]">
              <Filter className="h-4 w-4" />
              <span>
                Showing {filteredAndSorted.length} of {initialGiftCards.length} gift cards
              </span>
              <WarmButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Clear filters
              </WarmButton>
            </div>
          ) : null}
        </div>
      </WarmCard>

      {filteredAndSorted.length === 0 ? (
        <WarmCard padding="lg" className="bg-white text-center py-16">
          <p className="text-[#6B5744]">No gift cards match your filters.</p>
        </WarmCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAndSorted.map((card) => {
            const design = safeParseJson<GiftCardDesign>(card.designJson);
            const headline = (design?.headline as string) || 'Gift card';
            const validTo = card.validTo
              ? new Date(card.validTo).toLocaleDateString(undefined, { dateStyle: 'medium' })
              : 'No expiry';

            return (
              <WarmCard key={card.id} padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-[#2D2721] truncate">{headline}</h3>
                    <p className="text-xs text-[#8B7355] uppercase tracking-wide">
                      {formatCurrency(card.amount, card.currency)} - {card.code}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded-full ${
                      card.status === 'active'
                        ? 'bg-[#9DB5A5] text-white'
                        : card.status === 'expired'
                        ? 'bg-[#E17B5C] text-white'
                        : 'bg-[#F2EDE3] text-[#8B7355]'
                    }`}
                  >
                    {statusLabel[card.status] || card.status}
                  </span>
                </div>

                <div className="text-sm text-[#6B5744] space-y-1">
                  <p>Valid until: {validTo}</p>
                  {card.redeemedAt ? (
                    <p>Redeemed: {new Date(card.redeemedAt).toLocaleDateString()}</p>
                  ) : null}
                </div>
                <div className="flex gap-2 mt-4">
                  <WarmButton asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/merchant/${merchantSlug}/gift-cards/${card.id}`}>Details</Link>
                  </WarmButton>
                  <WarmButton asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/g/${card.code}`}>View</Link>
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
