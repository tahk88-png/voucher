import { describe, it, expect } from 'vitest';
import { parseVoucherCsv, splitCsv, VOUCHER_CSV_SAMPLE } from '../voucher-csv';

describe('splitCsv', () => {
  it('handles quoted fields with delimiters and escaped quotes', () => {
    expect(splitCsv('a,b\n"x, y","say ""hi"""\n', ',')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"'],
    ]);
  });
});

describe('parseVoucherCsv', () => {
  it('parses the sample file (semicolons, euros with comma decimals, percent)', () => {
    const { rows, errors } = parseVoucherCsv(VOUCHER_CSV_SAMPLE, { dayBoundary: 'utc' });
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ name: 'Spring coffee deal', type: 'fixed_amount', value: 450, currency: 'EUR', codePrefix: 'SPRING', usageLimitTotal: 100 });
    expect(rows[0].validFrom).toBe('2026-10-01T00:00:00.000Z');
    expect(rows[0].validTo).toBe('2026-12-31T23:59:59.999Z');
    expect(rows[1]).toMatchObject({ type: 'percentage', value: 1500 });
    expect(rows[1].validFrom).toBe('2026-10-01T00:00:00.000Z');
    expect(rows[2]).toMatchObject({ type: 'credit_amount', value: 1000 });
  });

  it('accepts comma-separated files with quoted decimal values and legacy headers', () => {
    const csv = 'type,value,currency,validFrom,validTo,codePrefix,usageLimitTotal\nfixed_amount,"10,50",eur,2026-03-01,2026-06-01,SPRING,100';
    const { rows, errors } = parseVoucherCsv(csv, { dayBoundary: 'utc' });
    expect(errors).toEqual([]);
    expect(rows[0]).toMatchObject({ type: 'fixed_amount', value: 1050, currency: 'EUR' });
  });

  it('uses the default currency when the column is empty', () => {
    const { rows } = parseVoucherCsv('type;value;valid_from;valid_to\namount;5;2026-10-01;2026-10-02', {
      defaultCurrency: 'GBP',
    });
    expect(rows[0].currency).toBe('GBP');
  });

  it('reports row-level errors with row numbers', () => {
    const csv = 'type;value;valid_from;valid_to\nbogus;5;2026-10-01;2026-10-02\namount;-3;2026-10-01;2026-10-02\npercent;150;2026-10-01;2026-10-02\namount;5;31.02.2026;2026-10-02\namount;5;2026-10-05;2026-10-01';
    const { rows, errors } = parseVoucherCsv(csv);
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(5);
    expect(errors[0]).toMatch(/^Row 2: type/);
    expect(errors[1]).toMatch(/^Row 3: .*negative/);
    expect(errors[2]).toMatch(/^Row 4: .*100%/);
    expect(errors[3]).toMatch(/^Row 5: valid_from/);
    expect(errors[4]).toMatch(/^Row 6: valid_to must be on or after/);
  });

  it('requires the key columns and a data row', () => {
    expect(parseVoucherCsv('type;value').errors[0]).toMatch(/header row and at least one/);
    expect(parseVoucherCsv('type;value\namount;5').errors).toContain('Missing column "valid_from".');
  });

  it('enforces the row limit', () => {
    const csv = ['type;value;valid_from;valid_to', 'amount;1;2026-10-01;2026-10-02', 'amount;1;2026-10-01;2026-10-02'].join('\n');
    expect(parseVoucherCsv(csv, { maxRows: 1 }).errors[0]).toMatch(/maximum is 1/);
  });
});
