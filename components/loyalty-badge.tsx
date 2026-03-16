'use client';

import { Shield, ShieldCheck, ShieldPlus, Crown, Gem } from 'lucide-react';

interface LoyaltyBadgeProps {
  tier: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const TIER_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: typeof Shield;
  }
> = {
  bronze: {
    label: 'Bronze',
    color: '#CD7F32',
    bg: '#FFF3E0',
    border: '#CD7F32',
    icon: Shield,
  },
  silver: {
    label: 'Silver',
    color: '#757575',
    bg: '#F5F5F5',
    border: '#C0C0C0',
    icon: ShieldCheck,
  },
  gold: {
    label: 'Gold',
    color: '#F9A825',
    bg: '#FFF8E1',
    border: '#FFD700',
    icon: ShieldPlus,
  },
  platinum: {
    label: 'Platinum',
    color: '#607D8B',
    bg: '#ECEFF1',
    border: '#E5E4E2',
    icon: Crown,
  },
  diamond: {
    label: 'Diamond',
    color: '#0097A7',
    bg: '#E0F7FA',
    border: '#B9F2FF',
    icon: Gem,
  },
};

const SIZE_MAP = {
  sm: { icon: 14, text: 'text-xs', padding: 'px-2 py-0.5', gap: 'gap-1' },
  md: { icon: 16, text: 'text-sm', padding: 'px-3 py-1', gap: 'gap-1.5' },
  lg: { icon: 20, text: 'text-base', padding: 'px-4 py-1.5', gap: 'gap-2' },
};

export default function LoyaltyBadge({
  tier,
  size = 'md',
  showLabel = true,
}: LoyaltyBadgeProps) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
  const sizeConfig = SIZE_MAP[size];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center ${sizeConfig.gap} ${sizeConfig.padding} rounded-full font-medium ${sizeConfig.text}`}
      style={{
        backgroundColor: config.bg,
        color: config.color,
        border: `1.5px solid ${config.border}`,
      }}
    >
      <Icon size={sizeConfig.icon} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
