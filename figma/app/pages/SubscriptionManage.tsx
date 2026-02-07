import { useState } from 'react';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowUpCircle,
  Award,
  Shield,
  FileText,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/figma/app/components/ui/progress';

export function SubscriptionManage() {
  const navigate = useNavigate();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Mock subscription data (would come from Stripe API in real app)
  const subscription = {
    plan: 'Professional',
    status: 'active', // trialing, active, past_due, canceled
    price: 29,
    billingPeriod: 'monthly',
    currency: 'EUR',
    currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    trialEnd: null,
    certificateNumber: 'CERT-2024-XYZ789ABC',
    merchantId: 'MERCH-ABC123XYZ',
    
    // Usage stats
    usage: {
      vouchers: { used: 2847, limit: 10000 },
      campaigns: { used: 12, limit: -1 }, // -1 = unlimited
      users: { used: 2, limit: 3 },
    },

    // Payment method
    paymentMethod: {
      type: 'card',
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2025,
    },

    // Billing history
    invoices: [
      { id: 1, date: '2024-11-01', amount: 29, status: 'paid', pdf: '#' },
      { id: 2, date: '2024-10-01', amount: 29, status: 'paid', pdf: '#' },
      { id: 3, date: '2024-09-01', amount: 29, status: 'paid', pdf: '#' },
    ],
  };

  const handleUpgrade = () => {
    navigate('/subscription-plans');
  };

  const handleUpdatePayment = () => {
    toast.info('Redirecting to Stripe payment update...');
    // In real app, redirect to Stripe billing portal
  };

  const handleCancelSubscription = async () => {
    toast.loading('Canceling subscription...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Subscription will be canceled at period end');
    setShowCancelDialog(false);
  };

  const getStatusBadge = () => {
    switch (subscription.status) {
      case 'active':
        return (
          <span className="px-3 py-1 bg-[#9DB5A5] text-white text-sm rounded-full font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </span>
        );
      case 'trialing':
        return (
          <span className="px-3 py-1 bg-[#FFC857] text-white text-sm rounded-full font-semibold flex items-center gap-1">
            <Award className="h-3 w-3" />
            Trial
          </span>
        );
      case 'past_due':
        return (
          <span className="px-3 py-1 bg-[#E17B5C] text-white text-sm rounded-full font-semibold flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Past Due
          </span>
        );
      case 'canceled':
        return (
          <span className="px-3 py-1 bg-gray-400 text-white text-sm rounded-full font-semibold flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Canceled
          </span>
        );
      default:
        return null;
    }
  };

  const voucherUsagePercent = (subscription.usage.vouchers.used / subscription.usage.vouchers.limit) * 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#2D2721] mb-2">Subscription & Billing</h1>
        <p className="text-lg text-[#6B5744]">Manage your plan, payments, and usage</p>
      </div>

      {/* Current Plan */}
      <WarmCard padding="lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm-lg">
              <Award className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-[#2D2721]">{subscription.plan} Plan</h2>
                {getStatusBadge()}
              </div>
              <p className="text-[#8B7355] mb-1">
                {subscription.currency} {subscription.price} / {subscription.billingPeriod}
              </p>
              {subscription.cancelAtPeriodEnd && (
                <div className="flex items-center gap-2 text-[#E17B5C] text-sm font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  Cancels on {subscription.currentPeriodEnd.toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <WarmButton variant="outline" onClick={handleUpgrade}>
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Upgrade Plan
            </WarmButton>
            {!subscription.cancelAtPeriodEnd && (
              <WarmButton variant="outline" onClick={() => setShowCancelDialog(true)}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </WarmButton>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[14px]">
            <div className="text-sm text-[#8B7355] mb-1">Certificate Number</div>
            <div className="font-bold text-[#2D2721] font-mono text-sm">{subscription.certificateNumber}</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[14px]">
            <div className="text-sm text-[#8B7355] mb-1">Merchant ID</div>
            <div className="font-bold text-[#2D2721] font-mono text-sm">{subscription.merchantId}</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[14px]">
            <div className="text-sm text-[#8B7355] mb-1">Next Billing Date</div>
            <div className="font-bold text-[#2D2721]">{subscription.currentPeriodEnd.toLocaleDateString()}</div>
          </div>
        </div>
      </WarmCard>

      {/* Usage Stats */}
      <WarmCard padding="lg">
        <h3 className="text-xl font-bold text-[#2D2721] mb-6">Usage This Period</h3>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-semibold text-[#2D2721]">Vouchers</span>
                <span className="text-sm text-[#8B7355] ml-2">
                  {subscription.usage.vouchers.used.toLocaleString()} / {subscription.usage.vouchers.limit.toLocaleString()}
                </span>
              </div>
              <span className="text-sm font-semibold text-[#2D2721]">{voucherUsagePercent.toFixed(1)}%</span>
            </div>
            <Progress value={voucherUsagePercent} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[14px]">
              <div className="text-sm text-[#8B7355] mb-1">Active Campaigns</div>
              <div className="text-2xl font-bold text-[#2D2721]">
                {subscription.usage.campaigns.used}
                {subscription.usage.campaigns.limit === -1 && <span className="text-sm text-[#9DB5A5] ml-2">Unlimited</span>}
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[14px]">
              <div className="text-sm text-[#8B7355] mb-1">User Accounts</div>
              <div className="text-2xl font-bold text-[#2D2721]">
                {subscription.usage.users.used} / {subscription.usage.users.limit}
              </div>
            </div>
          </div>

          {voucherUsagePercent > 80 && (
            <div className="p-4 bg-[#FFF3E0] border border-[#FFC857] rounded-[14px]">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-[#FFC857] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#2D2721] mb-1">Approaching Limit</div>
                  <p className="text-sm text-[#6B5744]">
                    You've used {voucherUsagePercent.toFixed(0)}% of your voucher limit. 
                    Consider upgrading to a higher plan for unlimited vouchers.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </WarmCard>

      {/* Payment Method */}
      <WarmCard padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[#2D2721]">Payment Method</h3>
          <WarmButton variant="outline" size="sm" onClick={handleUpdatePayment}>
            <Edit className="h-4 w-4 mr-2" />
            Update
          </WarmButton>
        </div>
        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[14px]">
          <div className="w-12 h-12 rounded-[12px] bg-white flex items-center justify-center shadow-sm">
            <CreditCard className="h-6 w-6 text-[#2D2721]" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[#2D2721] capitalize">
              {subscription.paymentMethod.brand} •••• {subscription.paymentMethod.last4}
            </div>
            <div className="text-sm text-[#8B7355]">
              Expires {subscription.paymentMethod.expMonth}/{subscription.paymentMethod.expYear}
            </div>
          </div>
          <Shield className="h-5 w-5 text-[#9DB5A5]" />
        </div>
      </WarmCard>

      {/* Billing History */}
      <WarmCard padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[#2D2721]">Billing History</h3>
          <WarmButton variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download All
          </WarmButton>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(139,115,85,0.1)]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Status</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {subscription.invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-[rgba(139,115,85,0.05)] hover:bg-[#FFF9ED] transition-colors">
                  <td className="py-4 px-4 text-[#2D2721]">{invoice.date}</td>
                  <td className="py-4 px-4 font-semibold text-[#2D2721]">€{invoice.amount}</td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-1 bg-[#9DB5A5] text-white text-xs rounded-full font-semibold">
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <WarmButton variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </WarmButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WarmCard>

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <WarmCard padding="xl" className="max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#E17B5C]/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-[#E17B5C]" />
              </div>
              <h3 className="text-xl font-bold text-[#2D2721]">Cancel Subscription?</h3>
            </div>
            <p className="text-[#6B5744] mb-6">
              Are you sure you want to cancel your subscription? You'll lose access to all features 
              at the end of your current billing period on {subscription.currentPeriodEnd.toLocaleDateString()}.
            </p>
            <div className="flex gap-3">
              <WarmButton variant="outline" className="flex-1" onClick={() => setShowCancelDialog(false)}>
                Keep Subscription
              </WarmButton>
              <WarmButton className="flex-1 bg-[#E17B5C] hover:bg-[#D16B4C]" onClick={handleCancelSubscription}>
                Yes, Cancel
              </WarmButton>
            </div>
          </WarmCard>
        </div>
      )}
    </div>
  );
}
