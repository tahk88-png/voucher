/**
 * Parse a merchant-supplied voucher CSV (client-safe, no DB).
 *
 * Merchants type values the way they read them: euros for amounts
 * ("10", "10.50", or "10,50" when the file uses ";" as the separator, as
 * European spreadsheet exports do) and percent for percentage vouchers
 * ("15", "12.5%"). The parser converts to what we store: minor units and
 * basis points.
 */
import { parseMoneyToMinor, parsePercentToBasisPoints, normalizeCurrency, isSupportedCurrency } from './money-input';

export type VoucherCsvRow = {
  name?: string;
  type: 'percentage' | 'fixed_amount' | 'credit_amount';
  /** Minor units for money, basis points for percentage. */
  value: number;
  currency: string;
  validFrom: string; // ISO
  validTo: string; // ISO
  codePrefix?: string;
  usageLimitTotal?: number;
};

export type VoucherCsvResult = { rows: VoucherCsvRow[]; errors: string[] };

export const VOUCHER_CSV_COLUMNS: Array<{ name: string; required: boolean; help: string }> = [
  { name: 'name', required: false, help: 'What customers see as the voucher title, e.g. "Spring coffee deal".' },
  { name: 'type', required: true, help: '"amount" (money off), "percent" (percentage off) or "credit" (store credit).' },
  { name: 'value', required: true, help: 'Euros for amount/credit (10 or 10.50), percent for percent (15 or 12.5).' },
  { name: 'currency', required: false, help: 'Three-letter code such as EUR. Defaults to your shop currency.' },
  { name: 'valid_from', required: true, help: 'First day the voucher works: 2026-10-01 or 01.10.2026.' },
  { name: 'valid_to', required: true, help: 'Last day the voucher works (it stays valid until the end of that day).' },
  { name: 'code_prefix', required: false, help: 'Letters at the start of each code, e.g. SPRING.' },
  { name: 'usage_limit', required: false, help: 'How many times it can be used in total. Leave empty for unlimited.' },
];

export const VOUCHER_CSV_SAMPLE = [
  'name;type;value;currency;valid_from;valid_to;code_prefix;usage_limit',
  'Spring coffee deal;amount;4,50;EUR;2026-10-01;2026-12-31;SPRING;100',
  'Autumn sale;percent;15;EUR;01.10.2026;30.11.2026;AUTUMN;',
  'Welcome credit;credit;10;EUR;2026-10-01;2027-03-31;WELCOME;500',
].join('\n');

const TYPE_ALIASES: Record<string, VoucherCsvRow['type']> = {
  amount: 'fixed_amount',
  fixed: 'fixed_amount',
  fixed_amount: 'fixed_amount',
  percent: 'percentage',
  percentage: 'percentage',
  '%': 'percentage',
  credit: 'credit_amount',
  credit_amount: 'credit_amount',
};

const HEADER_ALIASES: Record<string, string> = {
  name: 'name',
  headline: 'name',
  title: 'name',
  type: 'type',
  value: 'value',
  amount: 'value',
  currency: 'currency',
  validfrom: 'valid_from',
  valid_from: 'valid_from',
  start: 'valid_from',
  validto: 'valid_to',
  valid_to: 'valid_to',
  end: 'valid_to',
  codeprefix: 'code_prefix',
  code_prefix: 'code_prefix',
  prefix: 'code_prefix',
  usagelimittotal: 'usage_limit',
  usage_limit_total: 'usage_limit',
  usage_limit: 'usage_limit',
  limit: 'usage_limit',
};

/** Split CSV text into records, honouring double-quoted fields. */
export function splitCsv(text: string, delimiter: string): string[][] {
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      record.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      record.push(field);
      if (record.some((f) => f.trim() !== '')) records.push(record);
      record = [];
      field = '';
    } else {
      field += ch;
    }
  }
  record.push(field);
  if (record.some((f) => f.trim() !== '')) records.push(record);
  return records;
}

function detectDelimiter(headerLine: string): string {
  const semis = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  return semis > commas ? ';' : ',';
}

type DayBoundary = 'local' | 'utc';

/** "2026-10-01" or "01.10.2026" / "01/10/2026" (day first) → [y, m, d]. */
function parseDay(raw: string): [number, number, number] | null {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (m) return [Number(m[3]), Number(m[2]), Number(m[1])];
  return null;
}

function dayToDate([y, mo, d]: [number, number, number], end: boolean, boundary: DayBoundary): Date | null {
  const args: [number, number, number, number, number, number, number] = end
    ? [y, mo - 1, d, 23, 59, 59, 999]
    : [y, mo - 1, d, 0, 0, 0, 0];
  const date = boundary === 'utc' ? new Date(Date.UTC(...args)) : new Date(...args);
  // Reject impossible dates such as 31.02.2026 (Date would roll them over).
  const check = boundary === 'utc' ? [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()] : [date.getFullYear(), date.getMonth() + 1, date.getDate()];
  if (check[0] !== y || check[1] !== mo || check[2] !== d) return null;
  return date;
}

export function parseVoucherCsv(
  text: string,
  options: { defaultCurrency?: string; dayBoundary?: DayBoundary; maxRows?: number } = {},
): VoucherCsvResult {
  const defaultCurrency = normalizeCurrency(options.defaultCurrency);
  const boundary = options.dayBoundary ?? 'local';
  const maxRows = options.maxRows ?? 500;
  const errors: string[] = [];
  const rows: VoucherCsvRow[] = [];

  const firstLine = text.replace(/^﻿/, '').split(/\r?\n/, 1)[0] ?? '';
  const records = splitCsv(text, detectDelimiter(firstLine));
  if (records.length < 2) {
    return { rows, errors: ['The file needs a header row and at least one voucher row.'] };
  }

  const header = records[0].map((h) => HEADER_ALIASES[h.trim().toLowerCase().replace(/\s+/g, '_')] ?? h.trim().toLowerCase());
  for (const col of ['type', 'value', 'valid_from', 'valid_to']) {
    if (!header.includes(col)) errors.push(`Missing column "${col}".`);
  }
  if (errors.length) return { rows, errors };

  const dataRecords = records.slice(1);
  if (dataRecords.length > maxRows) {
    return { rows, errors: [`The file has ${dataRecords.length} rows; the maximum is ${maxRows} per import.`] };
  }

  dataRecords.forEach((record, index) => {
    const line = index + 2; // 1-based, counting the header
    const get = (col: string) => {
      const i = header.indexOf(col);
      return i === -1 ? '' : (record[i] ?? '').trim();
    };
    const rowErrors: string[] = [];

    const type = TYPE_ALIASES[get('type').toLowerCase()];
    if (!type) rowErrors.push(`type "${get('type')}" should be amount, percent or credit`);

    const currencyRaw = get('currency');
    if (currencyRaw && !isSupportedCurrency(currencyRaw)) rowErrors.push(`currency "${currencyRaw}" is not supported`);
    const currency = currencyRaw ? currencyRaw.toUpperCase() : defaultCurrency;

    let value: number | null = null;
    if (type) {
      const parsed =
        type === 'percentage'
          ? parsePercentToBasisPoints(get('value'), 'value')
          : parseMoneyToMinor(get('value'), currency, 'value');
      if (!parsed.ok) rowErrors.push(parsed.error);
      else if (parsed.value === null || parsed.value <= 0) rowErrors.push('value must be more than 0');
      else value = parsed.value;
    }

    const fromDay = parseDay(get('valid_from'));
    const toDay = parseDay(get('valid_to'));
    const from = fromDay ? dayToDate(fromDay, false, boundary) : null;
    const to = toDay ? dayToDate(toDay, true, boundary) : null;
    if (!from) rowErrors.push(`valid_from "${get('valid_from')}" is not a date (use 2026-10-01 or 01.10.2026)`);
    if (!to) rowErrors.push(`valid_to "${get('valid_to')}" is not a date (use 2026-10-01 or 01.10.2026)`);
    if (from && to && to.getTime() <= from.getTime()) rowErrors.push('valid_to must be on or after valid_from');

    let usageLimitTotal: number | undefined;
    const limitRaw = get('usage_limit');
    if (limitRaw) {
      if (!/^\d+$/.test(limitRaw) || Number(limitRaw) < 1) rowErrors.push('usage_limit must be a whole number of 1 or more');
      else usageLimitTotal = Number(limitRaw);
    }

    const codePrefix = get('code_prefix').toUpperCase();
    if (codePrefix && !/^[A-Z0-9-]{1,10}$/.test(codePrefix)) {
      rowErrors.push('code_prefix can only use letters, numbers and "-" (max 10)');
    }

    if (rowErrors.length) {
      errors.push(`Row ${line}: ${rowErrors.join('; ')}.`);
      return;
    }
    const name = get('name');
    rows.push({
      ...(name ? { name } : {}),
      type: type!,
      value: value!,
      currency,
      validFrom: from!.toISOString(),
      validTo: to!.toISOString(),
      ...(codePrefix ? { codePrefix } : {}),
      ...(usageLimitTotal ? { usageLimitTotal } : {}),
    });
  });

  return { rows, errors };
}
