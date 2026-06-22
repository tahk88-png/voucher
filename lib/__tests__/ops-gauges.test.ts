/**
 * Unit tests for lib/ops-gauges.ts.
 *
 * Two concerns:
 *   1. `renderGaugesPrometheus` — pure formatter, pin the exact
 *      wire format so scrapers don't break on a cosmetic refactor.
 *   2. `collectOpsGauges` — DB shape: confirm a failing sub-gauge
 *      degrades gracefully to an empty gauge instead of blanking
 *      the whole response.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { emailJob, payoutRecord, payoutHold } = vi.hoisted(() => ({
  emailJob: { groupBy: vi.fn() },
  payoutRecord: { groupBy: vi.fn() },
  payoutHold: { count: vi.fn() },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { emailJob, payoutRecord, payoutHold },
}));

import { renderGaugesPrometheus, collectOpsGauges, type GaugeSample } from '../ops-gauges';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('renderGaugesPrometheus', () => {
  it('emits HELP/TYPE headers and label lines in sorted order', () => {
    const gauges: GaugeSample[] = [
      {
        name: 'voucher_email_queue_depth',
        help: 'Jobs waiting',
        values: [
          { labels: { status: 'queued' }, value: 17 },
          { labels: { status: 'processing' }, value: 3 },
        ],
      },
    ];
    const out = renderGaugesPrometheus(gauges);
    expect(out).toContain('# HELP voucher_email_queue_depth Jobs waiting');
    expect(out).toContain('# TYPE voucher_email_queue_depth gauge');
    expect(out).toContain('voucher_email_queue_depth{status="queued"} 17');
    expect(out).toContain('voucher_email_queue_depth{status="processing"} 3');
    // Trailing newline so the concatenated body stays well-formed.
    expect(out.endsWith('\n')).toBe(true);
  });

  it('sorts multi-label keys alphabetically for deterministic output', () => {
    const gauges: GaugeSample[] = [
      {
        name: 'g',
        help: 'h',
        values: [{ labels: { z: '1', a: '2' }, value: 5 }],
      },
    ];
    const out = renderGaugesPrometheus(gauges);
    // Label `a` must come before `z`.
    expect(out).toContain('g{a="2",z="1"} 5');
  });

  it('returns an empty string when no gauges are provided', () => {
    expect(renderGaugesPrometheus([])).toBe('');
  });
});

describe('collectOpsGauges', () => {
  it('maps Prisma groupBy rows into {status,value} tuples', async () => {
    emailJob.groupBy.mockResolvedValueOnce([
      { status: 'queued', _count: { _all: 42 } },
      { status: 'processing', _count: { _all: 2 } },
    ]);
    payoutRecord.groupBy.mockResolvedValueOnce([
      { status: 'pending', _count: { _all: 11 } },
    ]);
    payoutHold.count.mockResolvedValueOnce(3);

    const gauges = await collectOpsGauges();

    const email = gauges.find((g) => g.name === 'voucher_email_queue_depth')!;
    expect(email.values).toEqual([
      { labels: { status: 'queued' }, value: 42 },
      { labels: { status: 'processing' }, value: 2 },
    ]);

    const payouts = gauges.find((g) => g.name === 'voucher_payout_backlog_count')!;
    // groupBy row plus the synthesised `held` bucket from PayoutHold.count.
    expect(payouts.values).toContainEqual({ labels: { status: 'pending' }, value: 11 });
    expect(payouts.values).toContainEqual({ labels: { status: 'held' }, value: 3 });
  });

  it('degrades one failing gauge to an empty gauge without throwing', async () => {
    emailJob.groupBy.mockRejectedValueOnce(new Error('db down'));
    payoutRecord.groupBy.mockResolvedValueOnce([]);
    payoutHold.count.mockResolvedValueOnce(0);

    const gauges = await collectOpsGauges();
    const email = gauges.find((g) => g.name === 'voucher_email_queue_depth')!;
    expect(email.values).toEqual([]);
    // The other gauge is still returned — partial failure does not blank
    // the scrape.
    expect(gauges.find((g) => g.name === 'voucher_payout_backlog_count')).toBeDefined();
  });
});
