import { useState } from 'react';
import { WarmCard } from '@/app/components/WarmCard';
import { WarmButton } from '@/app/components/WarmButton';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign,
  Users,
  TrendingUp,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Share2,
  Gift,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react';
import { CurrencyDisplay } from '@/app/components/CurrencyDisplay';
import { Input } from '@/app/components/ui/input';
import { useBonusTracking } from '@/app/contexts/BonusTracking';

type BonusStatus = 'pending' | 'approved' | 'paid' | 'cancelled';

type BonusEntry = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  campaignId: string;
  campaignName: string;
  bonusAmount: number;
  shareDate: string;
  status: BonusStatus;
  paidDate?: string;
  notes?: string;
};

export function BonusAccounting() {
  const navigate = useNavigate();
  const { getPendingForMerchant, markAsPaid, getAllBonusesForMerchant } = useBonusTracking();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BonusStatus | 'all'>('all');
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

  // Mock merchant ID - in real app would come from auth
  const merchantId = 'merchant-fashion';

  // Mock bonus data - in real app would come from Supabase
  const bonusEntries: BonusEntry[] = [
    {
      id: 'bonus-1',
      userId: 'user-123',
      userName: 'Maria Silva',
      userEmail: 'maria.silva@email.com',
      userPhone: '+372 5123 4567',
      campaignId: 'camp-1',
      campaignName: 'Summer Sale 2024',
      bonusAmount: 5.00,
      shareDate: '2024-01-20',
      status: 'pending',
      notes: 'Shared on Facebook - 45 views, 3 clicks'
    },
    {
      id: 'bonus-2',
      userId: 'user-456',
      userName: 'John Anderson',
      userEmail: 'john.anderson@email.com',
      campaignId: 'camp-1',
      campaignName: 'Summer Sale 2024',
      bonusAmount: 5.00,
      shareDate: '2024-01-19',
      status: 'pending',
      notes: 'Shared on Instagram - 120 views, 8 clicks'
    },
    {
      id: 'bonus-3',
      userId: 'user-789',
      userName: 'Anna Kask',
      userEmail: 'anna.kask@email.com',
      userPhone: '+372 5987 6543',
      campaignId: 'camp-2',
      campaignName: 'Winter Collection Launch',
      bonusAmount: 10.00,
      shareDate: '2024-01-18',
      status: 'approved',
      notes: 'High engagement - Shared on TikTok - 580 views, 34 clicks'
    },
    {
      id: 'bonus-4',
      userId: 'user-123',
      userName: 'Maria Silva',
      userEmail: 'maria.silva@email.com',
      campaignId: 'camp-2',
      campaignName: 'Winter Collection Launch',
      bonusAmount: 10.00,
      shareDate: '2024-01-15',
      status: 'paid',
      paidDate: '2024-01-22',
      notes: 'Paid via bank transfer'
    },
    {
      id: 'bonus-5',
      userId: 'user-999',
      userName: 'Peeter Tamm',
      userEmail: 'peeter.tamm@email.com',
      campaignId: 'camp-1',
      campaignName: 'Summer Sale 2024',
      bonusAmount: 5.00,
      shareDate: '2024-01-17',
      status: 'paid',
      paidDate: '2024-01-22',
      notes: 'Paid via PayPal'
    },
  ];

  const getStatusConfig = (status: BonusStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending Review', color: 'bg-[#FFE5B4] text-[#8B7355]', icon: Clock };
      case 'approved':
        return { label: 'Approved', color: 'bg-[#E8F5E9] text-[#2D2721]', icon: AlertCircle };
      case 'paid':
        return { label: 'Paid', color: 'bg-[#9DB5A5] text-white', icon: CheckCircle2 };
      case 'cancelled':
        return { label: 'Cancelled', color: 'bg-[#FEE2E2] text-[#E17B5C]', icon: AlertCircle };
    }
  };

  const filteredEntries = bonusEntries.filter((entry) => {
    const matchesSearch = entry.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.campaignName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingTotal = bonusEntries
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + e.bonusAmount, 0);
  
  const approvedTotal = bonusEntries
    .filter(e => e.status === 'approved')
    .reduce((sum, e) => sum + e.bonusAmount, 0);
  
  const paidTotal = bonusEntries
    .filter(e => e.status === 'paid')
    .reduce((sum, e) => sum + e.bonusAmount, 0);

  const totalOwed = pendingTotal + approvedTotal;

  const handleSelectEntry = (id: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEntries(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEntries.size === filteredEntries.filter(e => e.status === 'pending' || e.status === 'approved').length) {
      setSelectedEntries(new Set());
    } else {
      const allIds = filteredEntries
        .filter(e => e.status === 'pending' || e.status === 'approved')
        .map(e => e.id);
      setSelectedEntries(new Set(allIds));
    }
  };

  const handleMarkAsPaid = () => {
    // In real app, would update Supabase
    alert(`Marked ${selectedEntries.size} entries as paid`);
    setSelectedEntries(new Set());
  };

  const handleExportCSV = () => {
    // Generate CSV
    const csv = [
      ['Date', 'User', 'Email', 'Campaign', 'Amount (EUR)', 'Status', 'Notes'].join(','),
      ...filteredEntries.map(entry => [
        entry.shareDate,
        entry.userName,
        entry.userEmail,
        entry.campaignName,
        entry.bonusAmount.toFixed(2),
        entry.status,
        entry.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bonus-accounting-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#2D2721]">Bonus Accounting</h1>
        <p className="text-[#6B5744] mt-1">Track and manage customer referral bonuses</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">Total Owed</p>
              <p className="text-2xl font-bold text-[#2D2721]">
                <CurrencyDisplay amount={totalOwed} currency="EUR" />
              </p>
              <p className="text-xs text-[#8B7355] mt-1">Pending + Approved</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] flex items-center justify-center shadow-warm">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </WarmCard>

        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">Pending Review</p>
              <p className="text-2xl font-bold text-[#2D2721]">
                <CurrencyDisplay amount={pendingTotal} currency="EUR" />
              </p>
              <p className="text-xs text-[#8B7355] mt-1">
                {bonusEntries.filter(e => e.status === 'pending').length} entries
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </WarmCard>

        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">Approved</p>
              <p className="text-2xl font-bold text-[#2D2721]">
                <CurrencyDisplay amount={approvedTotal} currency="EUR" />
              </p>
              <p className="text-xs text-[#8B7355] mt-1">
                {bonusEntries.filter(e => e.status === 'approved').length} ready to pay
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center shadow-warm">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
          </div>
        </WarmCard>

        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">Paid This Month</p>
              <p className="text-2xl font-bold text-[#2D2721]">
                <CurrencyDisplay amount={paidTotal} currency="EUR" />
              </p>
              <p className="text-xs text-[#8B7355] mt-1">
                {bonusEntries.filter(e => e.status === 'paid').length} payments
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C8A882] to-[#B5956F] flex items-center justify-center shadow-warm">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </WarmCard>
      </div>

      {/* Actions & Filters */}
      <WarmCard padding="lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B7355]" />
            <Input
              type="text"
              placeholder="Search by user, email, or campaign..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all' as const, label: 'All', count: bonusEntries.length },
              { id: 'pending' as const, label: 'Pending', count: bonusEntries.filter(e => e.status === 'pending').length },
              { id: 'approved' as const, label: 'Approved', count: bonusEntries.filter(e => e.status === 'approved').length },
              { id: 'paid' as const, label: 'Paid', count: bonusEntries.filter(e => e.status === 'paid').length },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  statusFilter === filter.id
                    ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white shadow-warm'
                    : 'bg-[#FFF9ED] text-[#6B5744] hover:bg-[#FFE5B4]'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>

          <WarmButton variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </WarmButton>
        </div>

        {selectedEntries.size > 0 && (
          <div className="mt-4 pt-4 border-t border-[rgba(139,115,85,0.1)] flex items-center justify-between">
            <span className="text-sm text-[#6B5744]">
              {selectedEntries.size} selected
            </span>
            <WarmButton onClick={handleMarkAsPaid}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Paid
            </WarmButton>
          </div>
        )}
      </WarmCard>

      {/* Bonus Entries Table */}
      {filteredEntries.length > 0 ? (
        <div className="space-y-3">
          {filteredEntries.map((entry) => {
            const statusConfig = getStatusConfig(entry.status);
            const StatusIcon = statusConfig.icon;
            const isSelectable = entry.status === 'pending' || entry.status === 'approved';
            const isSelected = selectedEntries.has(entry.id);

            return (
              <WarmCard key={entry.id} padding="lg" hover>
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  {isSelectable && (
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectEntry(entry.id)}
                        className="w-5 h-5 rounded border-[#E7DCC7] text-[#FFC857] focus:ring-[#FFC857]"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-[#2D2721]">{entry.userName}</h3>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-[#6B5744]">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-[#8B7355]" />
                            <a href={`mailto:${entry.userEmail}`} className="hover:text-[#FFC857] transition-colors">
                              {entry.userEmail}
                            </a>
                          </div>
                          {entry.userPhone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-[#8B7355]" />
                              <a href={`tel:${entry.userPhone}`} className="hover:text-[#FFC857] transition-colors">
                                {entry.userPhone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#2D2721] mb-1">
                          <CurrencyDisplay amount={entry.bonusAmount} currency="EUR" />
                        </div>
                        {entry.paidDate && (
                          <div className="text-xs text-[#8B7355]">
                            Paid: {entry.paidDate}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Campaign Info */}
                    <div className="bg-gradient-to-br from-[#FFF9ED] to-[#FFFBF5] rounded-[12px] p-3 mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center flex-shrink-0">
                          <Share2 className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-[#2D2721] mb-1">{entry.campaignName}</div>
                          <div className="flex items-center gap-4 text-xs text-[#8B7355]">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Shared: {entry.shareDate}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {entry.notes && (
                      <div className="text-sm text-[#6B5744] bg-[#F8F6F1] rounded-lg p-3">
                        <div className="font-medium text-[#2D2721] mb-1">Performance Notes:</div>
                        {entry.notes}
                      </div>
                    )}
                  </div>
                </div>
              </WarmCard>
            );
          })}
        </div>
      ) : (
        <WarmCard padding="lg" className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFE5B4] to-[#FFC857] flex items-center justify-center mx-auto mb-6">
            <DollarSign className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-[#2D2721] mb-3">No bonuses found</h3>
          <p className="text-[#6B5744]">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters to find bonuses.'
              : 'No customer referral bonuses yet.'}
          </p>
        </WarmCard>
      )}

      {/* Help Section */}
      <WarmCard padding="lg" className="bg-gradient-to-br from-[#E8F5E9] to-[#F1F8E9]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <Gift className="h-5 w-5 text-[#9DB5A5]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#2D2721] mb-2">How Bonus Accounting Works</h3>
            <ul className="text-sm text-[#6B5744] space-y-1">
              <li>• When a customer shares your campaign, they earn a bonus</li>
              <li>• Review shared content and approve bonuses (or mark as pending for investigation)</li>
              <li>• Once approved, pay the customer via bank transfer, PayPal, or gift card</li>
              <li>• Mark entries as "Paid" to keep accurate records</li>
              <li>• Export monthly reports for your accounting</li>
            </ul>
          </div>
        </div>
      </WarmCard>
    </div>
  );
}