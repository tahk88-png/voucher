import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { useNavigate } from '@/lib/router-shim';
import { Plus, Search, QrCode } from 'lucide-react';
import { Input } from '@app/components/ui/input';
import { useLanguage } from '@app/contexts/LanguageContext';

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
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'expired'>('all');

  const copy =
    language === 'et'
      ? {
          title: 'Vautserid',
          subtitle: 'Loo ja halda oma vautserikoode',
          createVoucher: 'Loo vautser',
          searchPlaceholder: 'Otsi pealkirja voi koodi jargi...',
          noVouchersFound: 'Vautsereid ei leitud',
          adjustFilters: 'Proovi filtreid muuta',
          createFirstVoucher: 'Loo esimene vautser alustamiseks',
          usage: 'Kasutus',
          validUntil: 'Kehtib kuni',
          statusLabels: {
            all: 'Koik',
            active: 'Aktiivne',
            draft: 'Mustand',
            expired: 'Aegunud',
            redeemed: 'Lunastatud',
          },
          vouchers: [
            {
              headline: '25% allahindlus suvekollektsioonilt',
              discount: '25%',
              validUntil: '31.08.2024',
            },
            {
              headline: 'Tasuta tarne',
              discount: 'Tasuta',
              validUntil: '31.12.2024',
            },
            {
              headline: '€10 tervituskink',
              discount: '€10',
              validUntil: '31.12.2024',
            },
          ],
        }
      : {
          title: 'Vouchers',
          subtitle: 'Create and manage your voucher codes',
          createVoucher: 'Create Voucher',
          searchPlaceholder: 'Search by headline or code...',
          noVouchersFound: 'No vouchers found',
          adjustFilters: 'Try adjusting your filters',
          createFirstVoucher: 'Create your first voucher to get started',
          usage: 'Usage',
          validUntil: 'Valid until',
          statusLabels: {
            all: 'All',
            active: 'Active',
            draft: 'Draft',
            expired: 'Expired',
            redeemed: 'Redeemed',
          },
          vouchers: [
            {
              headline: '25% Off Summer Collection',
              discount: '25%',
              validUntil: '2024-08-31',
            },
            {
              headline: 'Free Shipping',
              discount: 'Free',
              validUntil: '2024-12-31',
            },
            {
              headline: '€10 Welcome Gift',
              discount: '€10',
              validUntil: '2024-12-31',
            },
          ],
        };

  const vouchers: Voucher[] = [
    {
      id: '1',
      headline: copy.vouchers[0].headline,
      code: 'SUMMER25',
      status: 'active',
      discount: copy.vouchers[0].discount,
      validUntil: copy.vouchers[0].validUntil,
      used: 45,
      limit: 100,
    },
    {
      id: '2',
      headline: copy.vouchers[1].headline,
      code: 'FREESHIP',
      status: 'active',
      discount: copy.vouchers[1].discount,
      validUntil: copy.vouchers[1].validUntil,
      used: 123,
      limit: 500,
    },
    {
      id: '3',
      headline: copy.vouchers[2].headline,
      code: 'WELCOME10',
      status: 'draft',
      discount: copy.vouchers[2].discount,
      validUntil: copy.vouchers[2].validUntil,
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

  const getStatusLabel = (status: Voucher['status'] | 'all') => {
    return copy.statusLabels[status];
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
          <h1 className="text-3xl font-bold text-[#2D2721]">{copy.title}</h1>
          <p className="text-[#6B5744] mt-1">{copy.subtitle}</p>
        </div>
        <WarmButton onClick={() => navigate('/vouchers/create')}>
          <Plus className="h-5 w-5 mr-2" />
          {copy.createVoucher}
        </WarmButton>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <WarmCard padding="md">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-[#8B7355]" />
            <Input
              type="text"
              placeholder={copy.searchPlaceholder}
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
              {getStatusLabel(status)}
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
            <h3 className="text-lg font-semibold text-[#2D2721] mb-2">{copy.noVouchersFound}</h3>
            <p className="text-[#6B5744] mb-6">
              {searchQuery || filter !== 'all'
                ? copy.adjustFilters
                : copy.createFirstVoucher}
            </p>
            {!searchQuery && filter === 'all' && (
              <WarmButton onClick={() => navigate('/vouchers/create')}>
                <Plus className="h-5 w-5 mr-2" />
                {copy.createVoucher}
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
                        {getStatusLabel(voucher.status)}
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-[#FFC857]">{voucher.discount}</div>
                </div>

                <div className="pt-4 border-t border-[rgba(139,115,85,0.1)]">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-[#8B7355]">{copy.usage}</span>
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
                  <span className="text-[#8B7355]">{copy.validUntil}</span>
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
