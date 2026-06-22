/** Format minor-unit amounts (cents) for display. */
export function formatCurrency(minor: number, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
}

/** Voucher value → human label, honouring the voucher type. */
export function voucherValueLabel(
  type: string,
  value: number,
  currency = 'EUR',
): string {
  if (type === 'percentage') return `${value}% off`;
  return `${formatCurrency(value, currency)}`;
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' });
}
