import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Gift, CreditCard } from 'lucide-react';
import { Input } from '@app/components/ui/input';
import { CurrencyDisplay } from '@app/components/CurrencyDisplay';

type GiftCard = {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'draft' | 'expired' | 'redeemed' | 'partially_redeemed';
  initialValue: number;
  currentBalance: number;
  currency: 'EUR' | 'SEK' | 'NOK' | 'DKK';
  validUntil: string;
  recipient?: string;
  createdAt: string;
  redemptions: number;
};

export function GiftCardsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'redeemed'>('all');

  const giftCards: GiftCard[] = [
    {
      id: 'GC-2024-001',
      name: 'Holiday Gift Card',
      code: 'GIFT-XMAS-2024-A3F9',
      status: 'active',
      initialValue: 100,
      currentBalance: 100,
      currency: 'EUR',
      validUntil: '2024-12-31',
      recipient: 'anna@example.com',
      createdAt: '2024-01-15',
      redemptions: 0,
    },
    {
      id: 'GC-2024-002',
      name: 'Birthday Special',
      code: 'GIFT-BDAY-2024-X7K2',
      status: 'partially_redeemed',
      initialValue: 50,
      currentBalance: 28.50,
      currency: 'EUR',
      validUntil: '2024-06-30',
      recipient: 'johan@example.com',
      createdAt: '2024-01-10',
      redemptions: 2,
    },
    {
      id: 'GC-2024-003',
      name: 'Wedding Gift Card',
      code: 'GIFT-WEDD-2024-M9P1',
      status: 'redeemed',
      initialValue: 200,
      currentBalance: 0,
      currency: 'EUR',
      validUntil: '2024-09-30',
      recipient: 'marie@example.com',
      createdAt: '2024-01-05',
      redemptions: 5,
    },
    {
      id: 'GC-2024-004',
      name: 'Corporate Rewards',
      code: 'GIFT-CORP-2024-Q5T8',
      status: 'draft',
      initialValue: 75,
      currentBalance: 75,
      currency: 'EUR',
      validUntil: '2024-12-31',
      createdAt: '2024-01-20',
      redemptions: 0,
    },
  ];

  const getStatusColor = (status: GiftCard['status']) => {
    switch (status) {
      case 'active':
        return 'bg-[#9DB5A5] text-white';
      case 'partially_redeemed':
        return 'bg-[#FFE5B4] text-[#6B5744]';
      case 'draft':
        return 'bg-[#F2EDE3] text-[#6B5744]';
      case 'expired':
        return 'bg-[#E5E7EB] text-[#6B7280]';
      case 'redeemed':
        return 'bg-[#8B7355] text-white';
      default:
        return 'bg-[#F2EDE3] text-[#6B5744]';
    }
  };

  const getStatusLabel = (status: GiftCard['status']) => {
    switch (status) {
      case 'partially_redeemed':
        return 'Partial';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const filteredGiftCards = giftCards.filter((card) => {
    const matchesSearch =
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.recipient?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || card.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">Gift Cards</h1>
          <p className="text-[#6B5744] mt-1">Create and manage gift cards with monetary value</p>
        </div>
        <WarmButton onClick={() => navigate('/gift-cards/create')}>
          <Plus className="h-5 w-5 mr-2" />
          Create Gift Card
        </WarmButton>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <WarmCard padding="md">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-[#8B7355]" />
            <Input
              type="text"
              placeholder="Search by name, code, or recipient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[#2D2721]"
            />
          </div>
        </WarmCard>

        {/* Filter Pills */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'draft', 'redeemed'] as const).map((status) => (
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

      {/* Gift Cards List */}
      {filteredGiftCards.length === 0 ? (
        <WarmCard padding="lg" className="text-center">
          <div className="py-12">
            <div className="w-16 h-16 rounded-full bg-[#FFF9ED] flex items-center justify-center mx-auto mb-4">
              <Gift className="h-8 w-8 text-[#FFC857]" />
            </div>
            <h3 className="text-lg font-semibold text-[#2D2721] mb-2">No gift cards found</h3>
            <p className="text-[#6B5744] mb-6">
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first gift card to get started'}
            </p>
            {!searchQuery && filter === 'all' && (
              <WarmButton onClick={() => navigate('/gift-cards/create')}>
                <Plus className="h-5 w-5 mr-2" />
                Create Gift Card
              </WarmButton>
            )}
          </div>
        </WarmCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGiftCards.map((card) => (
            <WarmCard 
              key={card.id} 
              hover 
              padding="lg" 
              className="cursor-pointer"
              onClick={() => navigate(`/gift-card/${card.id}`)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#2D2721] mb-1">
                      {card.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs font-mono bg-[#FFF9ED] px-2 py-1 rounded text-[#6B5744]">
                        {card.code}
                      </code>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(card.status)}`}>
                        {getStatusLabel(card.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[#FFC857]">
                    <CreditCard className="h-5 w-5" />
                  </div>
                </div>

                {/* Balance Display */}
                <div className="bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#6B5744]">Current Balance</span>
                    <span className="text-xs text-[#8B7355]">
                      of <CurrencyDisplay amount={card.initialValue} currency={card.currency} />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[#2D2721]">
                    <CurrencyDisplay amount={card.currentBalance} currency={card.currency} />
                  </div>
                  <div className="mt-3 w-full h-2 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FFC857] to-[#FFB627] rounded-full transition-all"
                      style={{ width: `${(card.currentBalance / card.initialValue) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  {card.recipient && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#8B7355]">Recipient</span>
                      <span className="font-medium text-[#2D2721]">{card.recipient}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[#8B7355]">Redemptions</span>
                    <span className="font-medium text-[#2D2721]">{card.redemptions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8B7355]">Valid until</span>
                    <span className="font-medium text-[#2D2721]">{card.validUntil}</span>
                  </div>
                </div>
              </div>
            </WarmCard>
          ))}
        </div>
      )}
    </div>
  );
}