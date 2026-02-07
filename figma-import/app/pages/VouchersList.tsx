import { useState } from 'react';
import { WarmCard } from '@/app/components/WarmCard';
import { WarmButton } from '@/app/components/WarmButton';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, QrCode, Eye, Edit, Copy, Trash2, ExternalLink, Share2 } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { CurrencyDisplay } from '@/app/components/CurrencyDisplay';
import { toast } from 'sonner';

type Voucher = {
  id: string;
  headline: string;
  code: string;
  status: 'active' | 'draft' | 'expired' | 'redeemed';
  discount: string;
  validUntil: string;
  used: number;
  limit: number;
};

export function VouchersList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'expired'>('all');

  const vouchers: Voucher[] = [
    {
      id: '1',
      headline: '25% Off Summer Collection',
      code: 'SUMMER25',
      status: 'active',
      discount: '25%',
      validUntil: '2024-08-31',
      used: 45,
      limit: 100,
    },
    {
      id: '2',
      headline: 'Free Shipping',
      code: 'FREESHIP',
      status: 'active',
      discount: 'Free',
      validUntil: '2024-12-31',
      used: 123,
      limit: 500,
    },
    {
      id: '3',
      headline: '€10 Welcome Gift',
      code: 'WELCOME10',
      status: 'draft',
      discount: '€10',
      validUntil: '2024-12-31',
      used: 0,
      limit: 1000,
    },
  ];

  const getStatusColor = (status: Voucher['status']) => {
    switch (status) {
      case 'active':
        return 'bg-[#9DB5A5] text-white';
      case 'draft':
        return 'bg-[#F2EDE3] text-[#6B5744]';
      case 'expired':
        return 'bg-[#E5E7EB] text-[#6B7280]';
      case 'redeemed':
        return 'bg-[#FFE5B4] text-[#6B5744]';
      default:
        return 'bg-[#F2EDE3] text-[#6B5744]';
    }
  };

  const filteredVouchers = vouchers.filter((voucher) => {
    const matchesSearch =
      voucher.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voucher.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || voucher.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">Vouchers</h1>
          <p className="text-[#6B5744] mt-1">Create and manage your voucher codes</p>
        </div>
        <WarmButton onClick={() => navigate('/vouchers/create')}>
          <Plus className="h-5 w-5 mr-2" />
          Create Voucher
        </WarmButton>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <WarmCard padding="md">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-[#8B7355]" />
            <Input
              type="text"
              placeholder="Search by headline or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[#2D2721]"
            />
          </div>
        </WarmCard>

        {/* Filter Pills */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'draft', 'expired'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === status
                  ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721] shadow-warm'
                  : 'bg-white text-[#6B5744] border border-[rgba(139,115,85,0.15)] hover:border-[rgba(139,115,85,0.3)]'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Vouchers List */}
      {filteredVouchers.length === 0 ? (
        <WarmCard padding="lg" className="text-center">
          <div className="py-12">
            <div className="w-16 h-16 rounded-full bg-[#FFF9ED] flex items-center justify-center mx-auto mb-4">
              <QrCode className="h-8 w-8 text-[#FFC857]" />
            </div>
            <h3 className="text-lg font-semibold text-[#2D2721] mb-2">No vouchers found</h3>
            <p className="text-[#6B5744] mb-6">
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first voucher to get started'}
            </p>
            {!searchQuery && filter === 'all' && (
              <WarmButton onClick={() => navigate('/vouchers/create')}>
                <Plus className="h-5 w-5 mr-2" />
                Create Voucher
              </WarmButton>
            )}
          </div>
        </WarmCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVouchers.map((voucher) => (
            <WarmCard key={voucher.id} hover padding="lg" className="cursor-pointer">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#2D2721] mb-1">
                      {voucher.headline}
                    </h3>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-[#FFF9ED] px-2 py-1 rounded text-[#6B5744]">
                        {voucher.code}
                      </code>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(voucher.status)}`}>
                        {voucher.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-[#FFC857]">{voucher.discount}</div>
                </div>

                <div className="pt-4 border-t border-[rgba(139,115,85,0.1)]">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-[#8B7355]">Usage</span>
                    <span className="font-medium text-[#2D2721]">
                      {voucher.used} / {voucher.limit}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#F2EDE3] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FFC857] to-[#FFB627] rounded-full transition-all"
                      style={{ width: `${(voucher.used / voucher.limit) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#8B7355]">Valid until</span>
                  <span className="font-medium text-[#2D2721]">{voucher.validUntil}</span>
                </div>
              </div>
            </WarmCard>
          ))}
        </div>
      )}
    </div>
  );
}