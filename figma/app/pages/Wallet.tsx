import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { useNavigate } from '@/lib/router-shim';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp,
  Download,
  CreditCard,
  Gift,
  Users,
  Calendar,
  Filter
} from 'lucide-react';
import { CurrencyDisplay } from '@app/components/CurrencyDisplay';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@app/components/ui/select';

type TransactionType = 'credit' | 'debit' | 'referral' | 'reward' | 'withdrawal';
type TransactionStatus = 'completed' | 'pending' | 'failed';

type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  currency: 'EUR' | 'SEK' | 'NOK' | 'DKK';
  description: string;
  date: string;
  status: TransactionStatus;
  balanceAfter: number;
  referenceId?: string;
};

export function Wallet() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | TransactionType>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Mock wallet data
  const walletBalance = {
    available: 347.50,
    pending: 125.00,
    currency: 'EUR' as const,
  };

  const transactions: Transaction[] = [
    {
      id: 'TXN-001',
      type: 'referral',
      amount: 25.00,
      currency: 'EUR',
      description: 'Referral reward from Anna Andersson',
      date: '2024-01-24',
      status: 'completed',
      balanceAfter: 347.50,
      referenceId: 'REF-2024-A3F9',
    },
    {
      id: 'TXN-002',
      type: 'reward',
      amount: 15.00,
      currency: 'EUR',
      description: 'Campaign performance bonus',
      date: '2024-01-23',
      status: 'completed',
      balanceAfter: 322.50,
      referenceId: 'RWD-2024-B7K2',
    },
    {
      id: 'TXN-003',
      type: 'referral',
      amount: 25.00,
      currency: 'EUR',
      description: 'Referral reward from Johan Svensson',
      date: '2024-01-22',
      status: 'pending',
      balanceAfter: 307.50,
      referenceId: 'REF-2024-M9P1',
    },
    {
      id: 'TXN-004',
      type: 'withdrawal',
      amount: -100.00,
      currency: 'EUR',
      description: 'Withdrawal to bank account',
      date: '2024-01-20',
      status: 'completed',
      balanceAfter: 307.50,
      referenceId: 'WTH-2024-Q5T8',
    },
    {
      id: 'TXN-005',
      type: 'referral',
      amount: 25.00,
      currency: 'EUR',
      description: 'Referral reward from Marie Dubois',
      date: '2024-01-18',
      status: 'completed',
      balanceAfter: 407.50,
      referenceId: 'REF-2024-X7K2',
    },
    {
      id: 'TXN-006',
      type: 'credit',
      amount: 50.00,
      currency: 'EUR',
      description: 'Welcome bonus',
      date: '2024-01-15',
      status: 'completed',
      balanceAfter: 382.50,
      referenceId: 'CRD-2024-Z3N5',
    },
  ];

  const stats = [
    {
      label: 'Total Earned',
      value: 1247.50,
      change: '+18.5%',
      icon: TrendingUp,
      color: 'from-[#9DB5A5] to-[#7FA090]',
    },
    {
      label: 'This Month',
      value: 165.00,
      change: '+12.3%',
      icon: Calendar,
      color: 'from-[#FFC857] to-[#FFB627]',
    },
    {
      label: 'Active Referrals',
      value: 23,
      change: '+4',
      icon: Users,
      color: 'from-[#E17B5C] to-[#D16B4C]',
    },
  ];

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'referral':
        return Users;
      case 'reward':
        return Gift;
      case 'credit':
        return ArrowDownRight;
      case 'debit':
      case 'withdrawal':
        return ArrowUpRight;
    }
  };

  const getTransactionColor = (type: TransactionType, amount: number) => {
    if (amount < 0) return 'text-[#E17B5C]';
    switch (type) {
      case 'referral':
        return 'text-[#9DB5A5]';
      case 'reward':
        return 'text-[#FFC857]';
      case 'credit':
        return 'text-[#9DB5A5]';
      default:
        return 'text-[#6B5744]';
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-[#9DB5A5] text-white';
      case 'pending':
        return 'bg-[#FFE5B4] text-[#6B5744]';
      case 'failed':
        return 'bg-[#FEE2E2] text-[#DC2626]';
    }
  };

  const filteredTransactions = transactions.filter((txn) => {
    if (filter === 'all') return true;
    return txn.type === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">Wallet</h1>
          <p className="text-[#6B5744] mt-1">Manage your credits and earnings</p>
        </div>
        <WarmButton onClick={() => navigate('/referrals')}>
          <Users className="h-5 w-5 mr-2" />
          View Referrals
        </WarmButton>
      </div>

      {/* Balance Card */}
      <WarmCard padding="none" className="overflow-hidden">
        <div className="bg-gradient-to-br from-[#FFC857] to-[#FFB627] p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-white/80 mb-2">
                <WalletIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Available Balance</span>
              </div>
              <div className="text-5xl font-bold text-white mb-2">
                <CurrencyDisplay amount={walletBalance.available} currency={walletBalance.currency} />
              </div>
              <div className="text-white/80 text-sm">
                + <CurrencyDisplay amount={walletBalance.pending} currency={walletBalance.currency} /> pending
              </div>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="flex gap-3">
            <WarmButton
              variant="outline"
              className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              Withdraw
            </WarmButton>
            <WarmButton
              variant="outline"
              className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Statement
            </WarmButton>
          </div>
        </div>
      </WarmCard>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <WarmCard key={index} hover padding="lg">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-[14px] bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-warm`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-sm font-medium text-[#9DB5A5]">
                  {stat.change}
                </div>
              </div>
              <div className="text-2xl font-bold text-[#2D2721] mb-1">
                {typeof stat.value === 'number' && stat.label.includes('Earned') || stat.label.includes('Month') ? (
                  <CurrencyDisplay amount={stat.value as number} currency="EUR" />
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-sm text-[#8B7355]">{stat.label}</div>
            </WarmCard>
          );
        })}
      </div>

      {/* Transactions */}
      <WarmCard padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[#2D2721] mb-1">Transaction History</h2>
            <p className="text-sm text-[#6B5744]">All your wallet activity</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="referral">Referrals</SelectItem>
                <SelectItem value="reward">Rewards</SelectItem>
                <SelectItem value="credit">Credits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(139,115,85,0.1)]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Description</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Status</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">Amount</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((txn) => {
                const Icon = getTransactionIcon(txn.type);
                return (
                  <tr
                    key={txn.id}
                    className="border-b border-[rgba(139,115,85,0.05)] hover:bg-[#FFF9ED] transition-colors"
                  >
                    <td className="py-4 px-4 text-sm text-[#6B5744]">{txn.date}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FFF9ED] flex items-center justify-center flex-shrink-0">
                          <Icon className={`h-4 w-4 ${getTransactionColor(txn.type, txn.amount)}`} />
                        </div>
                        <div>
                          <div className="font-medium text-[#2D2721]">{txn.description}</div>
                          {txn.referenceId && (
                            <div className="text-xs text-[#8B7355] font-mono">{txn.referenceId}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(txn.status)}`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className={`py-4 px-4 text-right font-semibold ${getTransactionColor(txn.type, txn.amount)}`}>
                      {txn.amount > 0 ? '+' : ''}
                      <CurrencyDisplay amount={txn.amount} currency={txn.currency} />
                    </td>
                    <td className="py-4 px-4 text-right text-[#6B5744]">
                      <CurrencyDisplay amount={txn.balanceAfter} currency={txn.currency} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filteredTransactions.map((txn) => {
            const Icon = getTransactionIcon(txn.type);
            return (
              <div key={txn.id} className="p-4 bg-[#FFF9ED] rounded-xl">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                    <Icon className={`h-5 w-5 ${getTransactionColor(txn.type, txn.amount)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#2D2721] mb-1">{txn.description}</div>
                    <div className="text-xs text-[#8B7355]">{txn.date}</div>
                    {txn.referenceId && (
                      <div className="text-xs text-[#8B7355] font-mono mt-1">{txn.referenceId}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${getTransactionColor(txn.type, txn.amount)}`}>
                      {txn.amount > 0 ? '+' : ''}
                      <CurrencyDisplay amount={txn.amount} currency={txn.currency} />
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusBadge(txn.status)}`}>
                      {txn.status}
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t border-[rgba(139,115,85,0.1)] text-sm text-[#6B5744]">
                  Balance after: <CurrencyDisplay amount={txn.balanceAfter} currency={txn.currency} />
                </div>
              </div>
            );
          })}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[#FFF9ED] flex items-center justify-center mx-auto mb-4">
              <WalletIcon className="h-8 w-8 text-[#FFC857]" />
            </div>
            <h3 className="text-lg font-semibold text-[#2D2721] mb-2">No transactions found</h3>
            <p className="text-[#6B5744]">Try adjusting your filters</p>
          </div>
        )}
      </WarmCard>
    </div>
  );
}
