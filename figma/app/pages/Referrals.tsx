import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { useNavigate } from '@/lib/router-shim';
import { 
  Users, 
  Copy, 
  Check, 
  Share2, 
  Gift,
  TrendingUp,
  Clock,
  CheckCircle,
  QrCode,
  Mail,
  MessageSquare
} from 'lucide-react';
import { CurrencyDisplay } from '@app/components/CurrencyDisplay';
import { toast } from 'sonner';
import { Input } from '@app/components/ui/input';
import { copyToClipboard } from '@app/utils/clipboard';

type ReferralStatus = 'pending' | 'active' | 'completed' | 'expired';

type Referral = {
  id: string;
  referredName: string;
  referredEmail: string;
  status: ReferralStatus;
  joinedDate: string;
  completedDate?: string;
  reward: number;
  currency: 'EUR' | 'SEK' | 'NOK' | 'DKK';
  campaigns: number;
};

export function Referrals() {
  const navigate = useNavigate();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const referralData = {
    link: 'https://gifthub.com/ref/FST2024',
    code: 'FST2024',
    totalEarned: 625.00,
    pendingRewards: 125.00,
    activeReferrals: 23,
    completedReferrals: 17,
    currency: 'EUR' as const,
  };

  const referrals: Referral[] = [
    {
      id: 'REF-001',
      referredName: 'Anna Andersson',
      referredEmail: 'anna@example.com',
      status: 'completed',
      joinedDate: '2024-01-15',
      completedDate: '2024-01-24',
      reward: 25.00,
      currency: 'EUR',
      campaigns: 5,
    },
    {
      id: 'REF-002',
      referredName: 'Johan Svensson',
      referredEmail: 'johan@example.com',
      status: 'active',
      joinedDate: '2024-01-20',
      reward: 25.00,
      currency: 'EUR',
      campaigns: 2,
    },
    {
      id: 'REF-003',
      referredName: 'Marie Dubois',
      referredEmail: 'marie@example.fr',
      status: 'pending',
      joinedDate: '2024-01-23',
      reward: 25.00,
      currency: 'EUR',
      campaigns: 0,
    },
    {
      id: 'REF-004',
      referredName: 'Lars Nielsen',
      referredEmail: 'lars@example.dk',
      status: 'completed',
      joinedDate: '2024-01-10',
      completedDate: '2024-01-22',
      reward: 25.00,
      currency: 'EUR',
      campaigns: 8,
    },
    {
      id: 'REF-005',
      referredName: 'Sofia Korhonen',
      referredEmail: 'sofia@example.fi',
      status: 'active',
      joinedDate: '2024-01-18',
      reward: 25.00,
      currency: 'EUR',
      campaigns: 3,
    },
  ];

  const stats = [
    {
      label: 'Total Earned',
      value: referralData.totalEarned,
      icon: Gift,
      color: 'from-[#9DB5A5] to-[#7FA090]',
    },
    {
      label: 'Pending Rewards',
      value: referralData.pendingRewards,
      icon: Clock,
      color: 'from-[#FFE5B4] to-[#FFC857]',
    },
    {
      label: 'Active Referrals',
      value: referralData.activeReferrals,
      icon: Users,
      color: 'from-[#E17B5C] to-[#D16B4C]',
    },
    {
      label: 'Completed',
      value: referralData.completedReferrals,
      icon: CheckCircle,
      color: 'from-[#F5C98E] to-[#E5B97E]',
    },
  ];

  const handleCopyLink = async () => {
    const success = await copyToClipboard(referralData.link);
    if (success) {
      setCopiedLink(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyCode = async () => {
    const success = await copyToClipboard(referralData.code);
    if (success) {
      setCopiedCode(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on GiftHub!',
          text: `Use my referral code ${referralData.code} and we both get rewards!`,
          url: referralData.link,
        });
        toast.success('Shared successfully!');
      } catch (error: any) {
        // User cancelled or permission denied
        if (error.name !== 'AbortError') {
          // Fallback to clipboard
          const success = await copyToClipboard(referralData.link);
          if (success) {
            toast.success('Link copied to clipboard!');
          }
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const success = await copyToClipboard(referralData.link);
      if (success) {
        toast.success('Link copied to clipboard!');
      }
    }
  };

  const getStatusColor = (status: ReferralStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-[#9DB5A5] text-white';
      case 'active':
        return 'bg-[#FFC857] text-[#2D2721]';
      case 'pending':
        return 'bg-[#FFE5B4] text-[#6B5744]';
      case 'expired':
        return 'bg-[#E5E7EB] text-[#6B7280]';
    }
  };

  const getStatusLabel = (status: ReferralStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">Referrals</h1>
          <p className="text-[#6B5744] mt-1">Invite merchants and earn rewards</p>
        </div>
        <WarmButton onClick={() => navigate('/wallet')}>
          <Gift className="h-5 w-5 mr-2" />
          View Wallet
        </WarmButton>
      </div>

      {/* Share Card */}
      <WarmCard padding="none" className="overflow-hidden">
        <div className="bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center mx-auto mb-4 shadow-warm-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#2D2721] mb-2">Invite & Earn</h2>
            <p className="text-[#6B5744]">
              Get <span className="font-semibold text-[#2D2721]">€25</span> for every merchant you refer
            </p>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Referral Link */}
            <div>
              <label className="text-sm font-medium text-[#6B5744] mb-2 block">Your Referral Link</label>
              <div className="flex items-center gap-2">
                <Input
                  value={referralData.link}
                  readOnly
                  className="bg-white/80 backdrop-blur-sm border-[rgba(139,115,85,0.2)] text-[#2D2721] font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-white/80 hover:bg-white rounded-lg transition-colors flex items-center gap-2 font-medium text-[#2D2721] shadow-warm"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4 text-[#9DB5A5]" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Referral Code */}
            <div>
              <label className="text-sm font-medium text-[#6B5744] mb-2 block">Your Referral Code</label>
              <div className="flex items-center gap-2">
                <Input
                  value={referralData.code}
                  readOnly
                  className="bg-white/80 backdrop-blur-sm border-[rgba(139,115,85,0.2)] text-[#2D2721] font-mono text-lg text-center font-bold"
                />
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2 bg-white/80 hover:bg-white rounded-lg transition-colors flex items-center gap-2 font-medium text-[#2D2721] shadow-warm"
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-4 w-4 text-[#9DB5A5]" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-3 gap-3 pt-4">
              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-2 p-4 bg-white/80 hover:bg-white rounded-xl transition-colors shadow-warm"
              >
                <Share2 className="h-6 w-6 text-[#FFC857]" />
                <span className="text-sm font-medium text-[#2D2721]">Share</span>
              </button>
              <button
                onClick={() => setShowQR(!showQR)}
                className="flex flex-col items-center gap-2 p-4 bg-white/80 hover:bg-white rounded-xl transition-colors shadow-warm"
              >
                <QrCode className="h-6 w-6 text-[#9DB5A5]" />
                <span className="text-sm font-medium text-[#2D2721]">QR Code</span>
              </button>
              <button
                onClick={() => toast.info('Email invite coming soon!')}
                className="flex flex-col items-center gap-2 p-4 bg-white/80 hover:bg-white rounded-xl transition-colors shadow-warm"
              >
                <Mail className="h-6 w-6 text-[#E17B5C]" />
                <span className="text-sm font-medium text-[#2D2721]">Email</span>
              </button>
            </div>
          </div>
        </div>
      </WarmCard>

      {/* QR Code */}
      {showQR && (
        <WarmCard padding="lg" className="text-center">
          <h3 className="text-lg font-semibold text-[#2D2721] mb-4">Referral QR Code</h3>
          <div className="w-64 h-64 mx-auto bg-white rounded-xl p-4 shadow-warm flex items-center justify-center border border-[rgba(139,115,85,0.1)]">
            <div className="text-center">
              <QrCode className="h-32 w-32 text-[#FFC857] mx-auto mb-2" />
              <p className="text-sm text-[#8B7355]">QR Code</p>
              <p className="text-xs text-[#8B7355] mt-1 font-mono">{referralData.code}</p>
            </div>
          </div>
          <p className="text-sm text-[#6B5744] mt-4">
            New merchants can scan this code to use your referral
          </p>
        </WarmCard>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <WarmCard key={index} hover padding="lg">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-[14px] bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-warm`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#2D2721] mb-1">
                {typeof stat.value === 'number' && stat.label.includes('Earned') || stat.label.includes('Pending') ? (
                  <CurrencyDisplay amount={stat.value as number} currency={referralData.currency} />
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-sm text-[#8B7355]">{stat.label}</div>
            </WarmCard>
          );
        })}
      </div>

      {/* How It Works */}
      <WarmCard padding="lg" className="bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4]">
        <h3 className="text-lg font-semibold text-[#2D2721] mb-4">How Referrals Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center font-bold text-white shadow-warm flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="font-semibold text-[#2D2721] mb-1">Share Your Link</h4>
              <p className="text-sm text-[#6B5744]">Send your referral link or code to other merchants</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center font-bold text-white shadow-warm flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-semibold text-[#2D2721] mb-1">They Sign Up</h4>
              <p className="text-sm text-[#6B5744]">Your referral creates an account using your code</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center font-bold text-white shadow-warm flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="font-semibold text-[#2D2721] mb-1">Earn Rewards</h4>
              <p className="text-sm text-[#6B5744]">Get €25 when they create their first campaign</p>
            </div>
          </div>
        </div>
      </WarmCard>

      {/* Referrals List */}
      <WarmCard padding="lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#2D2721] mb-1">Your Referrals</h2>
          <p className="text-sm text-[#6B5744]">Track all merchants you've referred</p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(139,115,85,0.1)]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Merchant</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Joined</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">Campaigns</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">Reward</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((referral) => (
                <tr
                  key={referral.id}
                  className="border-b border-[rgba(139,115,85,0.05)] hover:bg-[#FFF9ED] transition-colors"
                >
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-[#2D2721]">{referral.referredName}</div>
                      <div className="text-sm text-[#8B7355]">{referral.referredEmail}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                      {getStatusLabel(referral.status)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-[#6B5744]">
                    <div>{referral.joinedDate}</div>
                    {referral.completedDate && (
                      <div className="text-xs text-[#9DB5A5]">✓ {referral.completedDate}</div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right text-[#6B5744]">{referral.campaigns}</td>
                  <td className="py-4 px-4 text-right font-semibold text-[#2D2721]">
                    <CurrencyDisplay amount={referral.reward} currency={referral.currency} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {referrals.map((referral) => (
            <div key={referral.id} className="p-4 bg-[#FFF9ED] rounded-xl">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-[#2D2721] mb-1">{referral.referredName}</div>
                  <div className="text-sm text-[#8B7355] mb-2">{referral.referredEmail}</div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                    {getStatusLabel(referral.status)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-[#2D2721]">
                    <CurrencyDisplay amount={referral.reward} currency={referral.currency} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[rgba(139,115,85,0.1)] text-sm">
                <div>
                  <div className="text-xs text-[#8B7355] mb-1">Joined</div>
                  <div className="text-[#2D2721]">{referral.joinedDate}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8B7355] mb-1">Campaigns</div>
                  <div className="text-[#2D2721]">{referral.campaigns}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </WarmCard>
    </div>
  );
}

