'use client';

import { useState, useEffect } from 'react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { captureException } from '@/lib/error-tracking';
import { FeatureFlags } from '@/types';

type Merchant = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  featureFlags: FeatureFlags | null;
  createdAt: string;
  _count: {
    vouchers: number;
    members: number;
    redemptions: number;
  };
};

export default function MerchantsTable() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const res = await fetch('/api/admin/merchants');
      if (!res.ok) throw new Error('Failed to fetch merchants');
      const data = await res.json();
      setMerchants(Array.isArray(data) ? data : data.merchants ?? []);
    } catch (error) {
      showError('Failed to load merchants');
      if (error instanceof Error) {
        captureException(error, { context: 'admin_merchants_fetch_client' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMerchantStatus = async (merchantId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/merchants/${merchantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update merchant status');
      }
      showSuccess(`Merchant ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchMerchants();
    } catch (error) {
      showError('Failed to update merchant status');
      if (error instanceof Error) {
        captureException(error, {
          context: 'admin_merchant_toggle_status',
          merchantId,
        });
      }
    }
  };

  const updateFeatureFlag = async (merchantId: string, flagName: string, enabled: boolean) => {
    try {
      const merchant = merchants.find((m) => m.id === merchantId);
      if (!merchant) return;

      const currentFlags = (merchant.featureFlags || {}) as FeatureFlags;
      const newFlags: FeatureFlags = { ...currentFlags, [flagName]: enabled };

      const res = await fetch(`/api/admin/merchants/${merchantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureFlags: newFlags }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update feature flag');
      }
      showSuccess(`Feature flag "${flagName}" ${enabled ? 'enabled' : 'disabled'}`);
      fetchMerchants();
    } catch (error) {
      showError('Failed to update feature flag');
      if (error instanceof Error) {
        captureException(error, {
          context: 'admin_merchant_feature_flag',
          merchantId,
          flagName,
        });
      }
    }
  };

  if (isLoading) {
    return (
      <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
        <h2 className="text-base font-semibold text-[#2D2721]">Merchants</h2>
        <p className="text-sm text-[#6B5744] mt-2">Loading...</p>
      </WarmCard>
    );
  }

  return (
    <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
      <div>
        <h2 className="text-base font-semibold text-[#2D2721]">Merchants</h2>
        <p className="text-sm text-[#6B5744]">Manage merchants and feature flags.</p>
      </div>
      <div className="space-y-4 mt-4">
        {merchants.length === 0 ? (
          <p className="text-[#6B5744] text-center py-4">No merchants found.</p>
        ) : (
          merchants.map((merchant) => (
            <div key={merchant.id} className="border border-[rgba(139,115,85,0.15)] rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-[#2D2721]">{merchant.name}</h3>
                  <p className="text-sm text-[#6B5744]">/{merchant.slug}</p>
                  <p className="text-xs text-[#8B7355] mt-1">
                    {merchant._count.vouchers} vouchers - {merchant._count.members} members - {merchant._count.redemptions} redemptions
                  </p>
                </div>
                <WarmButton
                  variant={merchant.isActive ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => toggleMerchantStatus(merchant.id, merchant.isActive)}
                  className={merchant.isActive ? 'text-[#B3563C] border-[#F7C6B0]' : ''}
                >
                  {merchant.isActive ? 'Deactivate' : 'Activate'}
                </WarmButton>
              </div>
              <div className="border-t border-[rgba(139,115,85,0.15)] pt-3">
                <p className="text-sm font-medium text-[#2D2721] mb-2">Feature flags</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-[#6B5744]">
                    <input
                      type="checkbox"
                      checked={merchant.featureFlags?.weeklyDropsEnabled === true}
                      onChange={(e) => updateFeatureFlag(merchant.id, 'weeklyDropsEnabled', e.target.checked)}
                      className="h-4 w-4 accent-[#FFC857]"
                    />
                    Weekly drops
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[#6B5744]">
                    <input
                      type="checkbox"
                      checked={merchant.featureFlags?.analyticsEnabled === true}
                      onChange={(e) => updateFeatureFlag(merchant.id, 'analyticsEnabled', e.target.checked)}
                      className="h-4 w-4 accent-[#FFC857]"
                    />
                    Analytics (V2)
                  </label>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </WarmCard>
  );
}
