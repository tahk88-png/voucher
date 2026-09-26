/**
 * Client-safe helpers for showing vouchers to people: a name, a formatted
 * value and plain-language labels instead of raw enum values.
 */
import { formatPrice } from './currency-constants';
import { safeParseJson } from './utils';
import { formatVoucherCode } from './voucher-code';

export const DISPLAY_LOCALE = 'en-GB';

type VoucherLike = {
  id: string;
  type: string;
  value: number;
  currency: string;
  codePrefix?: string | null;
  designJson?: unknown;
};

const TYPE_LABELS: Record<string, string> = {
  percentage: 'Percentage off',
  fixed_amount: 'Amount off',
  credit_amount: 'Store credit',
};

export function voucherTypeLabel(type: string): string {
  return TYPE_LABELS[type.toLowerCase()] ?? type.replace(/_/g, ' ');
}

/** 1500 bp → "15%", 700 cents EUR → "€7.00". */
export function formatVoucherValue(v: Pick<VoucherLike, 'type' | 'value' | 'currency'>, locale = DISPLAY_LOCALE): string {
  if (v.type.toLowerCase() === 'percentage') {
    return `${Number((v.value / 100).toFixed(2))}%`;
  }
  return formatPrice(v.value, (v.currency || 'EUR').toUpperCase(), locale);
}

/** "15% off", "€7.00 off", "€7.00 credit". */
export function describeVoucherValue(v: Pick<VoucherLike, 'type' | 'value' | 'currency'>, locale = DISPLAY_LOCALE): string {
  const value = formatVoucherValue(v, locale);
  return v.type.toLowerCase() === 'credit_amount' ? `${value} credit` : `${value} off`;
}

export function voucherHeadline(v: Pick<VoucherLike, 'designJson'>): string | null {
  const design = safeParseJson<{ headline?: unknown }>(v.designJson);
  const headline = typeof design?.headline === 'string' ? design.headline.trim() : '';
  return headline || null;
}

/** Best available name: headline, else the value ("15% off"). */
export function voucherDisplayName(v: VoucherLike, locale = DISPLAY_LOCALE): string {
  return voucherHeadline(v) ?? describeVoucherValue(v, locale);
}

export { formatVoucherCode };

export const VOUCHER_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  paused: 'Paused',
  ended: 'Ended',
  expired: 'Expired',
};

export function voucherStatusLabel(status: string): string {
  return VOUCHER_STATUS_LABELS[status] ?? status;
}

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  active: 'Live',
  ended: 'Ended',
};

export const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  limited: 'One-off offer',
  weekly: 'Weekly offer',
};

/** Plain-language explanation of a campaign type. */
export const CAMPAIGN_TYPE_HELP: Record<'limited' | 'weekly', string> = {
  limited: 'Runs once between the start and end date, while stock lasts.',
  weekly: 'A recurring weekly offer that customers can come back for every week until the end date.',
};

export function formatDisplayDate(date: Date | string, locale = DISPLAY_LOCALE): string {
  return new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}
