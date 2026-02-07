'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

const statusLabel: Record<string, string> = {
  active: 'Active',
  draft: 'Draft',
  ended: 'Ended',
  paused: 'Paused',
};

const statusStyles: Record<string, string> = {
  active: 'bg-[#9DB5A5] text-white',
  draft: 'bg-[#F2EDE3] text-[#6B5744]',
  ended: 'bg-[#E5E7EB] text-[#6B7280]',
  paused: 'bg-[#E17B5C] text-white',
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

  if (campaigns.length === 0) {
    const description = canCreate
      ? 'Create a campaign to organize and manage your vouchers.'
      : 'Start a subscription to create new campaigns.';
    return (
      <EmptyState
        icon={Megaphone}
        title="No campaigns yet"
        description={description}
        action={
          canCreate
            ? {
                label: 'Create your first campaign',
                onClick: () => router.push(`/merchant/${merchantSlug}/campaigns/new`),
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <WarmCard padding="lg" className="bg-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B7355]" />
            <Input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[#E7DCC7] bg-white"
              aria-label="Search campaigns"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'active', 'draft', 'paused', 'ended'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721] shadow-warm'
                    : 'bg-white text-[#6B5744] border border-[rgba(139,115,85,0.15)] hover:border-[rgba(139,115,85,0.3)]'
                }`}
              >
                {status === 'all' ? 'All' : statusLabel[status] || status}
              </button>
            ))}
          </div>
        </div>
      </WarmCard>

      {filteredCampaigns.length === 0 ? (
        <WarmCard padding="lg" className="bg-white text-center py-12">
          <p className="text-[#6B5744]">No campaigns match your filters.</p>
          <WarmButton
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
          >
            Clear filters
          </WarmButton>
        </WarmCard>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => {
            const statusText = statusLabel[campaign.status] || campaign.status;
            const statusClass = statusStyles[campaign.status] || statusStyles.draft;
            const startLabel = new Date(campaign.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' });
            const endLabel = new Date(campaign.endDate).toLocaleDateString(undefined, { dateStyle: 'medium' });

            return (
              <WarmCard key={campaign.id} padding="lg" className="bg-white border border-[#E7DCC7]">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-[#2D2721]">{campaign.name}</h3>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
                        {statusText}
                      </span>
                    </div>
                    <p className="text-sm text-[#6B5744] capitalize">{campaign.type} campaign</p>
                    <p className="text-xs text-[#8B7355]">Runs {startLabel} - {endLabel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <WarmButton asChild variant="outline" size="sm">
                      <Link href={`/merchant/${merchantSlug}/campaigns/${campaign.id}`}>View</Link>
                    </WarmButton>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-[#8B7355]">Vouchers</div>
                    <div className="font-semibold text-[#2D2721]">{campaign.vouchers}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#8B7355]">Paid purchases</div>
                    <div className="font-semibold text-[#2D2721]">{campaign.paidPurchases}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#8B7355]">Revenue</div>
                    <div className="font-semibold text-[#2D2721]">
                      {formatCurrency(campaign.revenue, currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#8B7355]">Price</div>
                    <div className="font-semibold text-[#2D2721]">
                      {campaign.price != null ? formatCurrency(campaign.price, currency) : 'Free'}
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
