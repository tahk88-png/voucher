export type VoucherStatus = 'draft' | 'active' | 'paused';
export type Currency = 'EUR' | 'SEK' | 'NOK' | 'DKK' | 'UAH';
export type Country = 'DE' | 'FR' | 'SE' | 'NO' | 'DK' | 'UA' | 'NL' | 'FI';

export interface AIInsight {
  id: string;
  type: 'warning' | 'suggestion' | 'info';
  title: string;
  description: string;
  action?: {
    label: string;
    value: string;
  };
}

export interface Voucher {
  id: string;
  name: string;
  status: VoucherStatus;
  netValue: number;
  grossValue: number;
  currency: Currency;
  country: Country;
  vatRate: number;
  referralReward: number;
  referralType: 'percentage' | 'fixed';
  redemptions: number;
  conversions: number;
  cost: number;
  roi: number;
  createdAt: Date;
  updatedAt: Date;
  sharableLink: string;
  aiInsights?: AIInsight[];
}

export interface Merchant {
  id: string;
  name: string;
  email: string;
  country: Country;
  totalVouchers: number;
  activeVouchers: number;
  totalRedemptions: number;
  totalRevenue: number;
  riskScore: number;
  joinedAt: Date;
}

export interface CountryMetrics {
  country: Country;
  totalVouchers: number;
  redemptions: number;
  revenue: number;
  avgConversionRate: number;
}

export interface VATRate {
  country: Country;
  standardRate: number;
  reducedRates?: number[];
}
