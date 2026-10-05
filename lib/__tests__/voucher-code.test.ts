import { describe, it, expect } from 'vitest';
import { formatVoucherCode, parseScanCode } from '../voucher-code';

const id = 'cmui0tg1x0000abcd1234efgh';

describe('formatVoucherCode', () => {
  it('uses the prefix and the first 8 id characters upper-cased', () => {
    expect(formatVoucherCode({ id, codePrefix: 'AUD' })).toBe('AUD-CMUI0TG1');
  });
  it('falls back to V when there is no prefix', () => {
    expect(formatVoucherCode({ id, codePrefix: null })).toBe('V-CMUI0TG1');
  });
});

describe('parseScanCode', () => {
  it('round-trips the displayed code', () => {
    expect(parseScanCode(formatVoucherCode({ id, codePrefix: 'AUD' }))).toEqual({
      kind: 'voucher_code',
      prefix: 'AUD',
      idFragment: 'cmui0tg1',
      raw: 'AUD-CMUI0TG1',
    });
  });

  it('accepts lower-case and surrounding whitespace', () => {
    expect(parseScanCode('  aud-cmui0tg1 ')).toMatchObject({ kind: 'voucher_code', prefix: 'AUD', idFragment: 'cmui0tg1' });
  });

  it('accepts prefixes containing a hyphen', () => {
    expect(parseScanCode('XMAS-24-CMUI0TG1')).toMatchObject({ kind: 'voucher_code', prefix: 'XMAS-24' });
  });

  it('extracts the id from a full public voucher URL (QR payload)', () => {
    expect(parseScanCode(`https://gifthub.example/v/${id}`)).toEqual({ kind: 'voucher_id', id });
    expect(parseScanCode(`http://localhost:3000/v/${id}/`)).toEqual({ kind: 'voucher_id', id });
    expect(parseScanCode(`https://gifthub.example/et/v/${id}?ref=qr`)).toEqual({ kind: 'voucher_id', id });
  });

  it('extracts the id from a relative path', () => {
    expect(parseScanCode(`/v/${id}`)).toEqual({ kind: 'voucher_id', id });
  });

  it('leaves other URLs and codes as raw', () => {
    expect(parseScanCode('https://gifthub.example/m/some-shop')).toEqual({
      kind: 'raw',
      value: 'https://gifthub.example/m/some-shop',
    });
    expect(parseScanCode('GC-ABCD-EFGH-1234')).toEqual({ kind: 'raw', value: 'GC-ABCD-EFGH-1234' });
    expect(parseScanCode(id)).toEqual({ kind: 'raw', value: id });
    expect(parseScanCode('')).toEqual({ kind: 'raw', value: '' });
  });

  it('does not throw on malformed URLs', () => {
    expect(parseScanCode('http://')).toEqual({ kind: 'raw', value: 'http://' });
  });
});

import { describeVoucherValue, formatVoucherValue, voucherDisplayName, voucherTypeLabel } from '../voucher-display';

describe('voucher display helpers', () => {
  it('formats percentage and money values', () => {
    expect(formatVoucherValue({ type: 'percentage', value: 1500, currency: 'EUR' })).toBe('15%');
    expect(formatVoucherValue({ type: 'percentage', value: 1250, currency: 'EUR' })).toBe('12.5%');
    expect(formatVoucherValue({ type: 'fixed_amount', value: 700, currency: 'eur' })).toBe('€7.00');
    expect(describeVoucherValue({ type: 'credit_amount', value: 450, currency: 'EUR' })).toBe('€4.50 credit');
  });

  it('prefers the headline and falls back to the value', () => {
    const base = { id, type: 'fixed_amount', value: 700, currency: 'EUR' };
    expect(voucherDisplayName({ ...base, designJson: { headline: 'Free coffee' } })).toBe('Free coffee');
    expect(voucherDisplayName({ ...base, designJson: JSON.stringify({ headline: 'Stringified' }) })).toBe('Stringified');
    expect(voucherDisplayName({ ...base, designJson: { headline: '  ' } })).toBe('€7.00 off');
    expect(voucherDisplayName({ ...base, designJson: null })).toBe('€7.00 off');
  });

  it('labels types in plain language', () => {
    expect(voucherTypeLabel('FIXED_AMOUNT')).toBe('Amount off');
  });
});

import { AUDIT_ACTION_MESSAGE_KEYS, describeAuditResource, formatAuditAction, resolveAuditResource } from '../audit-labels';

describe('audit labels', () => {
  it('formats actions readably', () => {
    expect(formatAuditAction('voucher.created')).toBe('Voucher created');
    expect(formatAuditAction('payout_hold.released')).toBe('Payout hold released');
  });
  it('describes the resource from columns or payload', () => {
    expect(describeAuditResource({ resourceType: 'voucher', resourceId: 'abc' })).toEqual({ label: 'Voucher', id: 'abc', name: null });
    expect(describeAuditResource({ payloadJson: JSON.stringify({ campaignId: 'c1', name: 'Spring' }) })).toEqual({
      label: 'Campaign',
      id: 'c1',
      name: 'Spring',
    });
    expect(describeAuditResource({ payloadJson: null })).toBeNull();
  });
  it('exposes a stable kind for translating the resource label', () => {
    expect(resolveAuditResource({ resourceType: 'api_key', resourceId: 'k1' })?.kind).toBe('apiKey');
    expect(resolveAuditResource({ payloadJson: { memberId: 'm1' } })?.kind).toBe('teamMember');
    expect(resolveAuditResource({ resourceType: 'something_else' })?.kind).toBeNull();
    expect(AUDIT_ACTION_MESSAGE_KEYS['member.role_changed']).toBe('memberRoleChanged');
  });
});
