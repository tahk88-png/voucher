// Type definitions for the platform

export type VoucherType = 'percentage' | 'fixed_amount' | 'credit_amount';
export type VoucherStatus = 'draft' | 'published' | 'paused' | 'ended';
export type ReferralStatus = 'created' | 'opened' | 'redeemed' | 'expired' | 'blocked';
export type CreditStatus = 'locked' | 'available' | 'used' | 'expired' | 'reversed';
export type RedemptionMethod = 'online' | 'in_store';
export type MerchantRole = 'merchant_admin' | 'merchant_staff';
export type PlatformRole = 'platform_admin' | MerchantRole | 'user';
export type GiftCardStatus = 'active' | 'redeemed' | 'expired' | 'cancelled';

export interface VoucherDesign {
  headline?: string;
  finePrint?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  logo?: string | null;
}

export interface GiftCardDesign {
  headline?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface WeeklyDropConfig {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "HH:MM"
  stock: number;
  durationMinutes: number;
}

export interface VoucherConditions {
  minPurchase?: number; // in minor units
  newCustomersOnly?: boolean;
  channels?: string[]; // e.g., ['online', 'in_store']
  [key: string]: unknown;
}

export interface FeatureFlags {
  weeklyDropsEnabled?: boolean;
  analyticsEnabled?: boolean;
  customDomainsEnabled?: boolean;
  whiteLabelEnabled?: boolean;
  [key: string]: boolean | undefined;
}

export interface AuditLogPayload {
  [key: string]: unknown;
}

export interface CreditBalance {
  available: number; // minor units
  locked: number;
  total: number;
  currency: string;
  credits: Array<{
    id: string;
    amount: number;
    status: CreditStatus;
    expiresAt: Date | null;
    createdAt: Date;
  }>;
}

export interface CreateVoucherInput {
  type: VoucherType;
  value: number; // basis points for percentage, minor units for money
  currency: string;
  validFrom: string; // ISO datetime
  validTo: string; // ISO datetime
  usageLimitTotal?: number | null;
  usageLimitPerUser?: number | null;
  weeklyDropEnabled?: boolean;
  weeklyDropJson?: WeeklyDropConfig | null;
  conditionsJson?: VoucherConditions | null;
  designJson?: VoucherDesign | null;
  codePrefix?: string | null;
}

export interface CreateReferralInput {
  voucherId: string;
  friendHint?: string;
}

export interface CreateRedemptionInput {
  voucherId: string;
  referralId?: string;
  method: RedemptionMethod;
  orderReference?: string;
  amountBeforeDiscount: number; // minor units
  discountApplied: number; // minor units
  currency: string;
}
