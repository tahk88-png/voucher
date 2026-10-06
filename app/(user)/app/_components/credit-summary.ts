/**
 * Summarises a user's credit ledger rows into per-currency balances.
 *
 * Credit is merchant-issued money (minor units) from the referral flow. It is
 * never converted between currencies, so balances in different currencies are
 * kept apart instead of being added up into one misleading number.
 */
export interface CreditRow {
  amount: number;
  currency: string;
  status: string;
  expiresAt: Date | null;
}

export interface CurrencyBalance {
  currency: string;
  /** Spendable now. */
  available: number;
  /** Earned, waiting for the friend's redemption to be confirmed. */
  locked: number;
}

export function summariseCredits(rows: CreditRow[], now: Date = new Date()): CurrencyBalance[] {
  const byCurrency = new Map<string, CurrencyBalance>();
  for (const row of rows) {
    if (row.status !== 'available' && row.status !== 'locked') continue;
    // Same rule as getCreditBalance/applyCredit: credit past its expiry is not spendable.
    if (row.expiresAt && row.expiresAt <= now) continue;
    const entry = byCurrency.get(row.currency) ?? { currency: row.currency, available: 0, locked: 0 };
    if (row.status === 'available') entry.available += row.amount;
    else entry.locked += row.amount;
    byCurrency.set(row.currency, entry);
  }
  return Array.from(byCurrency.values()).sort(
    (a, b) => b.available + b.locked - (a.available + a.locked),
  );
}
