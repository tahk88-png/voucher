'use client';

import { useState, useEffect } from 'react';
import { WarmCard } from '@/components/warm-card';
import { Badge } from '@/components/ui/badge';
import LoyaltyBadge from '@/components/loyalty-badge';
import { showError } from '@/lib/toast-helpers';
import {
  Shield,
  ShieldCheck,
  ShieldPlus,
  Crown,
  Gem,
  TrendingUp,
  Gift,
  Star,
  ChevronRight,
} from 'lucide-react';

interface TierInfo {
  name: string;
  label: string;
  color: string;
  icon: string;
  minPoints: number;
  discountPercent: number;
  benefits: string[];
  isCurrent: boolean;
}

interface PointLog {
  id: string;
  points: number;
  reason: string;
  description: string | null;
  createdAt: string;
}

interface LoyaltyData {
  totalPoints: number;
  lifetimePoints: number;
  currentTier: {
    name: string;
    label: string;
    color: string;
    icon: string;
    discountPercent: number;
  };
  nextTier: {
    name: string;
    label: string;
    color: string;
    minPoints: number;
  } | null;
  pointsToNextTier: number;
  progressPercent: number;
  benefits: string[];
  allTiers: TierInfo[];
  pointsHistory: PointLog[];
}

const ICON_MAP: Record<string, typeof Shield> = {
  Shield,
  ShieldCheck,
  ShieldPlus,
  Crown,
  Gem,
};

function TierIcon({ name, size = 20 }: { name: string; size?: number }) {
  const Icon = ICON_MAP[name] || Shield;
  return <Icon size={size} />;
}

export default function LoyaltyPage() {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/loyalty')
      .then((res) => res.json())
      .then(setData)
      .catch(() => showError('Failed to load loyalty data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-[var(--text-muted)]">Loading loyalty data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-[var(--text-muted)]">Could not load loyalty information.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Loyalty Program</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Earn points with every purchase and unlock exclusive rewards
        </p>
      </div>

      {/* Current tier card */}
      <WarmCard padding="lg" className="bg-white">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: data.currentTier.color + '20' }}
          >
            <TierIcon name={data.currentTier.icon} size={32} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <LoyaltyBadge tier={data.currentTier.name} size="lg" />
              {data.currentTier.discountPercent > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {data.currentTier.discountPercent}% discount
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                {data.totalPoints.toLocaleString()} points available
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                {data.lifetimePoints.toLocaleString()} lifetime
              </span>
            </div>
          </div>
        </div>

        {/* Progress to next tier */}
        {data.nextTier && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[var(--text-muted)]">
                Progress to {data.nextTier.label}
              </span>
              <span className="font-medium text-[var(--text)]">
                {data.pointsToNextTier.toLocaleString()} points to go
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${data.progressPercent}%`,
                  backgroundColor: data.currentTier.color,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mt-1">
              <span>{data.currentTier.label}</span>
              <span>{data.nextTier.minPoints.toLocaleString()} pts</span>
            </div>
          </div>
        )}
        {!data.nextTier && (
          <div className="mt-4 p-3 bg-[#FFF9ED] rounded-lg">
            <p className="text-sm text-[var(--text)] font-medium">
              You have reached the highest tier! Enjoy all the exclusive benefits.
            </p>
          </div>
        )}
      </WarmCard>

      {/* Current benefits */}
      <WarmCard padding="lg" className="bg-white">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="h-5 w-5 text-[var(--primary)]" />
          <h2 className="text-lg font-semibold text-[var(--text)]">Your Benefits</h2>
        </div>
        <div className="space-y-3">
          {data.benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <ChevronRight className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm text-[var(--text)]">{benefit}</span>
            </div>
          ))}
        </div>
      </WarmCard>

      {/* Tier comparison table */}
      <WarmCard padding="lg" className="bg-white">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">All Tiers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 px-2 text-[var(--text-muted)] font-medium">
                  Tier
                </th>
                <th className="text-left py-3 px-2 text-[var(--text-muted)] font-medium">
                  Points Required
                </th>
                <th className="text-left py-3 px-2 text-[var(--text-muted)] font-medium">
                  Discount
                </th>
                <th className="text-left py-3 px-2 text-[var(--text-muted)] font-medium">
                  Benefits
                </th>
              </tr>
            </thead>
            <tbody>
              {data.allTiers.map((tier) => (
                <tr
                  key={tier.name}
                  className={`border-b border-[var(--border)] last:border-0 ${
                    tier.isCurrent ? 'bg-[#FFF9ED]' : ''
                  }`}
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <LoyaltyBadge tier={tier.name} size="sm" />
                      {tier.isCurrent && (
                        <span className="text-xs text-[var(--primary)] font-medium">
                          (You)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-[var(--text)]">
                    {tier.minPoints === 0
                      ? 'Start'
                      : tier.minPoints.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-[var(--text)]">
                    {tier.discountPercent > 0 ? `${tier.discountPercent}%` : '-'}
                  </td>
                  <td className="py-3 px-2">
                    <div className="space-y-1">
                      {tier.benefits.map((b, i) => (
                        <p key={i} className="text-xs text-[var(--text-muted)]">
                          {b}
                        </p>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WarmCard>

      {/* Points history */}
      <WarmCard padding="lg" className="bg-white">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Points History</h2>
        {data.pointsHistory.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No points activity yet. Make a purchase to start earning!
          </p>
        ) : (
          <div className="space-y-3">
            {data.pointsHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
              >
                <div>
                  <p className="text-sm text-[var(--text)]">
                    {entry.description || entry.reason}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    entry.points > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {entry.points > 0 ? '+' : ''}
                  {entry.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </WarmCard>
    </div>
  );
}
