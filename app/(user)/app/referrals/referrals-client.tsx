'use client';

import { useState } from 'react';
import { Copy, Share2, Users } from 'lucide-react';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { showError, showSuccess } from '@/lib/toast-helpers';

interface ReferralRow {
  id: string;
  merchantName: string;
  voucherTitle: string;
  status: string;
  createdAt: string;
}

interface ReferralsClientProps {
  referralLink: string;
  referralCode: string;
  currency: string;
  stats: {
    totalEarned: number;
    pendingRewards: number;
    activeReferrals: number;
    completedReferrals: number;
  };
  referrals: ReferralRow[];
}

const statusStyles: Record<string, string> = {
  redeemed: 'bg-[#EDE9F8] text-[#4C1D95]',
  opened: 'bg-[#E6F4FF] text-[#0F766E]',
  active: 'bg-[#E9F3EC] text-[#166534]',
  pending: 'bg-[#FFF4E6] text-[#9D402A]',
  default: 'bg-[#F4F4F5] text-[#4B5563]',
};

export default function ReferralsClient({
  referralLink,
  referralCode,
  currency,
  stats,
  referrals,
}: ReferralsClientProps) {
  const [sharing, setSharing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const formatMoney = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value / 100);

  const handleCopy = async (value: string, label: string) => {
    if (!navigator?.clipboard) {
      showError('Clipboard is not available');
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      showSuccess(`${label} copied`);
      setTimeout(() => setCopiedField(null), 1200);
    } catch {
      showError('Unable to copy right now');
    }
  };

  const handleShare = async () => {
    if (!referralLink) return;
    setSharing(true);
    try {
      if (navigator?.share) {
        await navigator.share({ title: 'Referral link', url: referralLink });
        showSuccess('Referral link opened');
      } else {
        await navigator.clipboard.writeText(referralLink);
        showSuccess('Referral link copied');
      }
    } catch {
      showError('Unable to share link');
    } finally {
      setSharing(false);
    }
  };

  const badgeForStatus = (status: string) => {
    const normalized = status.toLowerCase();
    return statusStyles[normalized] || statusStyles.default;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <WarmCard padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B5744]">Referral Link</p>
              <p className="text-2xl font-semibold text-[#2D2721] break-all">{referralLink}</p>
            </div>
            <div className="flex gap-2">
              <WarmButton size="sm" variant="outline" onClick={() => handleCopy(referralLink, 'Link')} className="h-10">
                <Copy className="h-4 w-4" aria-hidden="true" />
                <span className="ml-2">{copiedField === 'Link' ? 'Copied' : 'Copy'}</span>
              </WarmButton>
              <WarmButton size="sm" variant="secondary" onClick={handleShare} disabled={sharing} className="h-10">
                <Share2 className="h-4 w-4" aria-hidden="true" />
                <span className="ml-2">Share</span>
              </WarmButton>
            </div>
          </div>
          <div className="rounded-[18px] border border-[#F0E2C9] bg-[#FFF9ED] p-4">
            <p className="text-sm text-[#6B5744] mb-2">Referral code</p>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-lg font-semibold text-[#2D2721]">{referralCode}</span>
              <WarmButton size="sm" variant="ghost" onClick={() => handleCopy(referralCode, 'Code')} className="h-9">
                <Copy className="h-4 w-4" aria-hidden="true" />
              </WarmButton>
            </div>
          </div>
        </WarmCard>
        <WarmCard padding="lg" className="space-y-4 bg-gradient-to-br from-[#FFF9ED] via-[#FFEED1] to-[#FFE5B4] border border-[#E7DCC7]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white text-[#E17B5C] shadow-warm-sm">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#6B5744]">Active Referrals</p>
              <p className="text-3xl font-semibold text-[#2D2721]">{stats.activeReferrals}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-[#6B5744]">
            <div className="rounded-[12px] bg-white/80 p-3">
              <p className="text-xs uppercase tracking-wide text-[#8B7355]">Pending Rewards</p>
              <p className="text-lg font-semibold text-[#2D2721]">{formatMoney(stats.pendingRewards)}</p>
            </div>
            <div className="rounded-[12px] bg-white/80 p-3">
              <p className="text-xs uppercase tracking-wide text-[#8B7355]">Total Earned</p>
              <p className="text-lg font-semibold text-[#2D2721]">{formatMoney(stats.totalEarned)}</p>
            </div>
          </div>
        </WarmCard>
      </div>

      <WarmCard padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#6B5744]">Referral HUD</p>
            <h2 className="text-xl font-semibold text-[#2D2721]">Your Referrals</h2>
          </div>
          <div className="text-sm text-[#8B7355] font-semibold">Completed: {stats.completedReferrals}</div>
        </div>
        {referrals.length === 0 ? (
          <div className="text-sm text-[#6B5744]">No referrals yet. Share your link to start earning credits.</div>
        ) : (
          <div className="space-y-2">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex flex-col gap-2 rounded-[16px] border border-[#F0E2C9] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1 text-sm text-[#6B5744]">
                  <p className="text-base font-semibold text-[#2D2721]">{referral.merchantName}</p>
                  <p className="text-xs uppercase tracking-wide text-[#8B7355]">{referral.voucherTitle}</p>
                  <p className="text-xs text-[#8B7355]">
                    {new Date(referral.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ${badgeForStatus(
                      referral.status,
                    )}`}
                  >
                    {referral.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </WarmCard>
    </div>
  );
}
