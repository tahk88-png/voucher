import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { useNavigate } from '@/lib/router-shim';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Download, 
  CreditCard, 
  Building,
  AlertCircle,
  Calendar,
  Filter,
  CheckCircle2,
  Info,
  X
} from 'lucide-react';
import { CurrencyDisplay } from '@app/components/CurrencyDisplay';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@app/components/ui/select';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

type TransactionType = 'sale' | 'payout' | 'fee' | 'refund';
type TransactionStatus = 'completed' | 'pending' | 'processing' | 'failed';

type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  currency: 'EUR';
  description: string;
  date: string;
  status: TransactionStatus;
  referenceId?: string;
};

export function MerchantWallet() {
  const navigate = useNavigate();
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [timeRange, setTimeRange] = useState('30d');
  
  // Mock data
  const walletBalance = {
    available: 12450.00,
    pending: 340.00,
    currency: 'EUR' as const,
  };

  const bankAccount = {
    iban: 'EE12 3456 7890 1234 5678',
    bankName: 'Swedbank AS',
    holder: 'Fashion Store OÃœ'
  };

  const chartData = [
    { date: 'Jan 1', income: 120, payout: 0 },
    { date: 'Jan 5', income: 450, payout: 0 },
    { date: 'Jan 10', income: 380, payout: 0 },
    { date: 'Jan 15', income: 1200, payout: 0 },
    { date: 'Jan 20', income: 800, payout: 2500 },
    { date: 'Jan 25', income: 650, payout: 0 },
  ];

  const transactions: Transaction[] = [
    {
      id: 'TXN-M001',
      type: 'sale',
      amount: 45.00,
      currency: 'EUR',
      description: 'Ticket Sale - Summer Festival 2024',
      date: '2024-01-25',
      status: 'completed',
      referenceId: 'ORD-8492'
    },
    {
      id: 'TXN-M002',
      type: 'sale',
      amount: 120.00,
      currency: 'EUR',
      description: 'Gift Card Sale - â‚¬120 Value',
      date: '2024-01-24',
      status: 'completed',
      referenceId: 'ORD-8491'
    },
    {
      id: 'TXN-M003',
      type: 'payout',
      amount: -2500.00,
      currency: 'EUR',
      description: 'Payout to EE12...5678',
      date: '2024-01-20',
      status: 'completed',
      referenceId: 'PO-9921'
    },
    {
      id: 'TXN-M004',
      type: 'fee',
      amount: -150.00,
      currency: 'EUR',
      description: 'Service Fee (6%) for Payout PO-9921',
      date: '2024-01-20',
      status: 'completed',
      referenceId: 'FEE-9921'
    },
    {
      id: 'TXN-M005',
      type: 'sale',
      amount: 60.00,
      currency: 'EUR',
      description: 'Ticket Sale - VIP Access',
      date: '2024-01-18',
      status: 'completed',
      referenceId: 'ORD-8488'
    }
  ];

  const handlePayoutRequest = () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount > walletBalance.available) {
      toast.error('Insufficient funds');
      return;
    }

    // Calculate fee
    const fee = amount * 0.06;
    const netAmount = amount - fee;

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Processing payout request...',
        success: () => {
          setIsPayoutModalOpen(false);
          setPayoutAmount('');
          return `Payout of â‚¬${netAmount.toFixed(2)} requested successfully!`;
        },
        error: 'Failed to request payout'
      }
    );
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'sale': return ArrowDownRight;
      case 'payout': return ArrowUpRight;
      case 'fee': return CreditCard;
      case 'refund': return AlertCircle;
    }
  };

  const getTransactionColor = (type: TransactionType) => {
    switch (type) {
      case 'sale': return 'text-[#9DB5A5]';
      case 'payout': return 'text-[#2D2721]';
      case 'fee': return 'text-[#E17B5C]';
      case 'refund': return 'text-[#E17B5C]';
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'completed': return 'bg-[#E8F5F1] text-[#2D5B46]';
      case 'pending': return 'bg-[#FFF9ED] text-[#B58D3F]';
      case 'processing': return 'bg-[#F0F7FF] text-[#3F6FB5]';
      case 'failed': return 'bg-[#FEF2F2] text-[#B91C1C]';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">Merchant Wallet</h1>
          <p className="text-[#6B5744] mt-1">Manage payouts from ticket & gift card sales</p>
        </div>
        <div className="flex items-center gap-3">
          <WarmButton variant="outline" onClick={() => navigate('/settings')}>
            <Building className="h-5 w-5 mr-2" />
            Bank Settings
          </WarmButton>
          <WarmButton variant="outline">
             <Download className="h-5 w-5 mr-2" />
             Export Report
          </WarmButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance & Chart Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Balance Card */}
          <WarmCard padding="none" className="overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="h-48 w-48 text-white transform rotate-12" />
            </div>
            
            <div className="bg-gradient-to-br from-[#2D2721] to-[#3E362E] p-8 text-white relative z-10">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
                <div>
                  <div className="flex items-center gap-2 text-white/70 mb-2">
                    <div className="p-1.5 bg-white/10 rounded-lg">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium tracking-wide uppercase">Available Balance</span>
                  </div>
                  <div className="text-5xl font-bold mb-3 tracking-tight">
                    <CurrencyDisplay amount={walletBalance.available} currency={walletBalance.currency} />
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="px-2.5 py-1 bg-[#4CAF50]/20 text-[#81C784] rounded-full border border-[#4CAF50]/20 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span className="font-medium">+12.5% this month</span>
                    </div>
                    <span className="text-white/50">|</span>
                    <span className="text-white/70">
                      + <CurrencyDisplay amount={walletBalance.pending} currency={walletBalance.currency} /> pending
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 min-w-[200px]">
                   <div className="text-right mb-2">
                    <div className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">Next Payout</div>
                    <div className="text-white font-medium">Manual Request</div>
                   </div>
                   {!isPayoutModalOpen && (
                      <WarmButton 
                        onClick={() => setIsPayoutModalOpen(true)}
                        className="bg-[#FFC857] text-[#2D2721] hover:bg-[#FFB627] border-none shadow-lg shadow-[#FFC857]/20"
                      >
                        Request Payout
                      </WarmButton>
                   )}
                </div>
              </div>

              {/* Payout Form Overlay */}
              {isPayoutModalOpen && (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-bold">New Payout Request</h3>
                      <p className="text-sm text-white/60">Withdraw funds to your connected bank account</p>
                    </div>
                    <button 
                      onClick={() => setIsPayoutModalOpen(false)} 
                      className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X className="h-5 w-5 text-white/70" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white/90 mb-1.5 block">Amount to Withdraw</Label>
                        <div className="relative">
                          <Input 
                            type="number" 
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                            className="bg-black/20 border-white/10 text-white placeholder:text-white/20 pl-10 h-12 text-lg font-medium focus:border-[#FFC857]/50 focus:ring-[#FFC857]/20"
                            placeholder="0.00"
                            autoFocus
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg">â‚¬</span>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-white/50">
                          <span>Min: â‚¬50.00</span>
                          <span className="cursor-pointer hover:text-[#FFC857]" onClick={() => setPayoutAmount(walletBalance.available.toString())}>
                            Max: â‚¬{walletBalance.available.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-3 rounded-lg bg-[#E17B5C]/10 border border-[#E17B5C]/20 flex gap-3 items-start">
                        <AlertCircle className="h-5 w-5 text-[#E17B5C] flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-[#E17B5C]">
                          <span className="font-semibold block mb-0.5">Service Fee (6%)</span>
                          Included in our platform service agreement for all withdrawals.
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/20 rounded-xl p-5 space-y-3">
                      <div className="flex justify-between text-white/70 text-sm">
                        <span>Requested Amount</span>
                        <span>â‚¬{parseFloat(payoutAmount || '0').toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[#E17B5C] text-sm">
                        <span>Service Fee (6%)</span>
                        <span>-â‚¬{(parseFloat(payoutAmount || '0') * 0.06).toFixed(2)}</span>
                      </div>
                      <div className="h-px bg-white/10 my-1" />
                      <div className="flex justify-between items-end">
                        <span className="text-white font-medium">You Receive</span>
                        <span className="text-2xl font-bold text-[#9DB5A5]">
                          â‚¬{(parseFloat(payoutAmount || '0') * 0.94).toFixed(2)}
                        </span>
                      </div>
                      
                      <WarmButton 
                        onClick={handlePayoutRequest}
                        className="w-full mt-4 bg-[#FFC857] text-[#2D2721] hover:bg-[#FFB627] border-none font-bold"
                        disabled={!payoutAmount || parseFloat(payoutAmount) <= 0}
                      >
                        Confirm Withdrawal
                      </WarmButton>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </WarmCard>

          {/* Cash Flow Chart */}
          <WarmCard padding="lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-[#2D2721]">Cash Flow</h2>
                <p className="text-xs text-[#8B7355]">Income vs Payouts over time</p>
              </div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[120px] h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 3 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9DB5A5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#9DB5A5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPayout" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E17B5C" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#E17B5C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8B7355' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8B7355' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#9DB5A5" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" name="Income" />
                  <Area type="monotone" dataKey="payout" stroke="#E17B5C" strokeWidth={3} fillOpacity={1} fill="url(#colorPayout)" name="Payouts" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </WarmCard>

          {/* Transaction History */}
          <WarmCard padding="none" className="overflow-hidden">
            <div className="p-6 border-b border-[rgba(139,115,85,0.1)] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#2D2721]">Transaction History</h2>
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="sale">Sales</SelectItem>
                    <SelectItem value="payout">Payouts</SelectItem>
                    <SelectItem value="fee">Fees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="divide-y divide-[rgba(139,115,85,0.1)]">
              {transactions.map((txn) => {
                const Icon = getTransactionIcon(txn.type);
                return (
                  <div key={txn.id} className="p-4 hover:bg-[#FFF9ED] transition-colors group flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                        txn.type === 'sale' ? 'bg-[#E8F5F1]' : 
                        txn.type === 'payout' ? 'bg-[#FFF9ED]' : 'bg-[#FFF5F5]'
                      }`}>
                        <Icon className={`h-5 w-5 ${getTransactionColor(txn.type)}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-[#2D2721] text-sm md:text-base truncate max-w-[200px] md:max-w-[300px]">{txn.description}</div>
                        <div className="flex items-center gap-2 text-xs text-[#8B7355] mt-0.5">
                          <span>{txn.date}</span>
                          <span className="text-[rgba(139,115,85,0.3)]">â€¢</span>
                          <span className="font-mono bg-[rgba(139,115,85,0.1)] px-1.5 rounded text-[10px]">{txn.referenceId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className={`font-bold text-sm md:text-base ${
                        txn.amount > 0 ? 'text-[#9DB5A5]' : 'text-[#2D2721]'
                      }`}>
                        {txn.amount > 0 ? '+' : ''}<CurrencyDisplay amount={txn.amount} currency={txn.currency} />
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusBadge(txn.status)}`}>
                        {txn.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="p-4 bg-[#F9F7F5] text-center">
              <button className="text-sm font-medium text-[#8B7355] hover:text-[#2D2721] transition-colors">
                View All Transactions
              </button>
            </div>
          </WarmCard>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Bank Account Info */}
          <WarmCard padding="lg" className="bg-gradient-to-br from-[#FFF9ED] to-[#FFF]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center text-white shadow-warm">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#2D2721]">Bank Account</h3>
                <p className="text-xs text-[#8B7355]">Connected for payouts</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white rounded-xl border border-[rgba(139,115,85,0.1)] shadow-sm space-y-3">
                 <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-xs text-[#8B7355]">Status</span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#9DB5A5]">
                       <CheckCircle2 className="h-3.5 w-3.5" />
                       Verified
                    </span>
                 </div>
                 <div>
                    <div className="text-xs text-[#8B7355] mb-1">Account Holder</div>
                    <div className="font-medium text-[#2D2721] text-sm">{bankAccount.holder}</div>
                 </div>
                 <div>
                    <div className="text-xs text-[#8B7355] mb-1">IBAN</div>
                    <div className="font-mono text-sm font-medium text-[#2D2721] break-all bg-gray-50 p-2 rounded border border-gray-100">
                      {bankAccount.iban}
                    </div>
                 </div>
                 <div>
                    <div className="text-xs text-[#8B7355] mb-1">Bank Name</div>
                    <div className="font-medium text-[#2D2721] text-sm">{bankAccount.bankName}</div>
                 </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#FFF5F5] border border-[#FFE0E0]">
                <Info className="h-4 w-4 text-[#E17B5C] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#2D2721] leading-relaxed">
                  Payouts usually arrive within <span className="font-semibold">1-3 business days</span>. 
                  Weekend requests are processed on Mondays.
                </p>
              </div>
            </div>
          </WarmCard>

          {/* Quick Stats Summary */}
          <WarmCard padding="lg">
            <h3 className="font-bold text-[#2D2721] mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#FFC857]" />
              Monthly Summary
            </h3>
            <div className="space-y-4">
              <div className="group">
                <div className="flex justify-between items-center mb-1 gap-2">
                  <span className="text-sm text-[#6B5744] truncate">Gross Revenue</span>
                  <span className="font-bold text-[#2D2721] whitespace-nowrap">â‚¬15,240.00</span>
                </div>
                <div className="w-full bg-[#F0EBE5] h-1.5 rounded-full overflow-hidden">
                   <div className="bg-[#9DB5A5] h-full w-[85%] rounded-full group-hover:bg-[#8CA896] transition-colors"></div>
                </div>
              </div>
              
              <div className="group">
                <div className="flex justify-between items-center mb-1 gap-2">
                  <span className="text-sm text-[#6B5744] truncate">Fees Paid (6%)</span>
                  <span className="font-bold text-[#2D2721] whitespace-nowrap">â‚¬914.40</span>
                </div>
                <div className="w-full bg-[#F0EBE5] h-1.5 rounded-full overflow-hidden">
                   <div className="bg-[#E17B5C] h-full w-[6%] rounded-full group-hover:bg-[#D66A4B] transition-colors"></div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-[rgba(139,115,85,0.1)] flex justify-between items-center">
                <span className="text-sm font-medium text-[#2D2721]">Net Income</span>
                <span className="font-bold text-lg text-[#9DB5A5]">â‚¬14,325.60</span>
              </div>
            </div>
          </WarmCard>
        </div>
      </div>
    </div>
  );
}

