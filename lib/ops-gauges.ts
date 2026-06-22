/**
 * Live operational gauges — DB-backed point-in-time counts that we
 * emit alongside the in-process metrics at scrape time.
 *
 * These can't live in `lib/metrics.ts` because that module is a pure
 * in-process counter/histogram collector with no DB dependency.
 * Keeping them here means the Prometheus scrape endpoint composes
 * cheap in-memory counters + a small set of `count({ where: {...} })`
 * queries, and the app code stays free of DB calls during hot paths.
 *
 * Gauges exposed:
 *  - voucher_email_queue_depth{status}: queued / retrying / locked
 *  - voucher_payout_backlog_count{status}: pending / processing / held
 */

import { prisma } from './prisma';

export interface GaugeSample {
  name: string;
  help: string;
  /** Label set + integer value pairs. */
  values: Array<{ labels: Record<string, string>; value: number }>;
}

/**
 * Collect DB-backed gauges. Errors on any single gauge short-circuit
 * that one (returning 0) — a single slow/broken query should not
 * blank the whole scrape.
 */
export async function collectOpsGauges(): Promise<GaugeSample[]> {
  const [email, payouts] = await Promise.all([
    collectEmailQueueGauge().catch(() => emptyGauge('voucher_email_queue_depth', 'Email jobs by status')),
    collectPayoutBacklogGauge().catch(() =>
      emptyGauge('voucher_payout_backlog_count', 'Unsettled payout records by status'),
    ),
  ]);

  return [email, payouts];
}

async function collectEmailQueueGauge(): Promise<GaugeSample> {
  // groupBy is tiny — EmailJob has status in @@index.
  const rows = await prisma.emailJob.groupBy({
    by: ['status'],
    _count: { _all: true },
    where: {
      // Only the "not yet terminal" statuses matter for backlog alerts.
      // `completed` is the success sink; `dead` is the give-up sink —
      // both are surfaced via other dashboards.
      status: { in: ['queued', 'processing', 'failed'] as never[] },
    },
  });

  return {
    name: 'voucher_email_queue_depth',
    help: 'Email jobs currently waiting, in-flight, or scheduled for retry',
    values: rows.map((r) => ({
      labels: { status: String(r.status) },
      value: r._count._all,
    })),
  };
}

async function collectPayoutBacklogGauge(): Promise<GaugeSample> {
  const [byStatus, activeHolds] = await Promise.all([
    prisma.payoutRecord.groupBy({
      by: ['status'],
      _count: { _all: true },
      where: { status: { in: ['pending', 'processing'] } },
    }),
    prisma.payoutHold.count({ where: { isActive: true } }),
  ]);

  const values = byStatus.map((r) => ({
    labels: { status: String(r.status) },
    value: r._count._all,
  }));
  // Active payout holds are a distinct backlog flavour — a merchant is
  // blocked until an admin releases the hold. Emit as its own label.
  values.push({ labels: { status: 'held' }, value: activeHolds });

  return {
    name: 'voucher_payout_backlog_count',
    help: 'PayoutRecord rows not yet completed, plus active PayoutHold count',
    values,
  };
}

function emptyGauge(name: string, help: string): GaugeSample {
  return { name, help, values: [] };
}

/**
 * Render a list of gauges into Prometheus text format. Kept pure
 * (no DB access) so it's trivially testable against a fixed input.
 */
export function renderGaugesPrometheus(gauges: GaugeSample[]): string {
  const lines: string[] = [];
  for (const g of gauges) {
    lines.push(`# HELP ${g.name} ${g.help}`);
    lines.push(`# TYPE ${g.name} gauge`);
    for (const v of g.values) {
      const labelStr = Object.entries(v.labels)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, val]) => `${k}="${val}"`)
        .join(',');
      lines.push(`${g.name}{${labelStr}} ${v.value}`);
    }
  }
  return lines.length > 0 ? lines.join('\n') + '\n' : '';
}
