/**
 * Small helpers shared by the merchant voucher screens for showing values,
 * dates and lib/money-input errors in the viewer's language.
 */
import { DISPLAY_LOCALE, formatVoucherValue } from '@/lib/voucher-display';

type Translate = {
  (key: string, values?: Record<string, string | number>): string;
  has(key: string): boolean;
};

/** Locale for number/date formatting: English keeps the app's en-GB style. */
export function displayLocaleFor(locale: string): string {
  return !locale || locale === 'en' ? DISPLAY_LOCALE : locale;
}

/** "15% off" / "€7.00 credit", translated (t = useTranslations('labels')). */
export function describeVoucherValueT(
  tLabels: Translate,
  v: { type: string; value: number; currency: string },
  locale: string,
): string {
  const value = formatVoucherValue(v, locale);
  return v.type.toLowerCase() === 'credit_amount' ? tLabels('valueCredit', { value }) : tLabels('valueOff', { value });
}

// Labels passed to lib/money-input. Its error messages are English sentences
// built from the label; voucherValueErrorMessage maps them back to a key.
export const PERCENT_LABEL = 'Discount';
export const AMOUNT_LABEL = 'Value';

type ParseErrorKind = 'negative' | 'invalid' | 'wholeNumber' | 'decimals' | 'tooLarge' | 'tooHigh';

export function valueErrorKind(error: string, label: string): { kind: ParseErrorKind; decimals: number } | null {
  if (error === `${label} can't be negative.`) return { kind: 'negative', decimals: 0 };
  if (error === `${label} isn't a valid number.`) return { kind: 'invalid', decimals: 0 };
  if (error === `${label} must be a whole number.`) return { kind: 'wholeNumber', decimals: 0 };
  if (error === `${label} is too large.`) return { kind: 'tooLarge', decimals: 0 };
  if (error === `${label} can't be more than 100%.`) return { kind: 'tooHigh', decimals: 0 };
  const match = /at most (\d+) decimal places\.$/.exec(error);
  if (error.startsWith(`${label} can have at most `) && match) return { kind: 'decimals', decimals: Number(match[1]) };
  return null;
}

/**
 * Translated message for a lib/money-input error on the voucher value
 * (t = useTranslations('merchantVouchers')). Unknown errors are shown as-is.
 */
export function voucherValueErrorMessage(t: Translate, type: string, error: string): string {
  const isPercent = type === 'percentage';
  const parsed = valueErrorKind(error, isPercent ? PERCENT_LABEL : AMOUNT_LABEL);
  if (!parsed) return error;
  const key = `form.${isPercent ? 'discountErrors' : 'valueErrors'}.${parsed.kind}`;
  return t.has(key) ? t(key, { decimals: parsed.decimals }) : error;
}
