'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CreditCard, RefreshCw, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { Input } from '@/components/ui/input';

type Tab = 'subscriptions' | 'failed' | 'refunds' | 'holds';

type Subscription = {
  id: string;
  merchantId: string;
  merchantName: string;
  plan: string;
  status: string;
  currentPeriodEnd: string;
  amount: number;
};

type FailedPayment = {
  id: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  currency: string;
  failureReason: string;
  createdAt: string;
  retryCount: number;
};

type Refund = {
  id: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
};

type PayoutHold = {
  id: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
};

const TAB_LABELS: Record<Tab, string> = {
  subscriptions: 'Subscriptions',
  failed: 'Failed Payments',
  refunds: 'Refunds',
  holds: 'Payout Holds',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  past_due: 'bg-red-100 text-red-700',
  canceled: 'bg-gray-100 text-gray-500',
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  held: 'bg-orange-100 text-orange-700',
  released: 'bg-green-100 text-green-700',
};

function cents(amount: number) {
  return `€${(amount / 100).toFixed(2)}`;
}

export default function BillingClient() {
  const [tab, setTab] = useState<Tab>('subscriptions');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoints: Record<Tab, string> = {
        subscriptions: '/api/admin/billing/subscriptions',
        failed: '/api/admin/billing/failed-payments',
        refunds: '/api/admin/billing/refunds',
        holds: '/api/admin/billing/payout-holds',
      };
      const res = await fetch(endpoints[tab]);
      if (res.ok) {
        const json = await res.json();
        setData(json.subscriptions ?? json.payments ?? json.refunds ?? json.holds ?? json.data ?? []);
      } else {
        setData([]);
      }
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function retryPayment(id: string) {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/billing/failed-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: id, action: 'retry' }),
      });
      fetchData();
    } finally {
      setActionLoading(null);
    }
  }

  async function releaseHold(id: string) {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/billing/payout-holds/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'release' }),
      });
      fetchData();
    } finally {
      setActionLoading(null);
    }
  }

  async function issueRefund(id: string) {
    if (!refundReason.trim()) return;
    setActionLoading(id);
    try {
      await fetch('/api/admin/billing/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: id, reason: refundReason }),
      });
      setRefundReason('');
      fetchData();
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/control-panel">
              <WarmButton variant="ghost" size="sm">← Back</WarmButton>
            </Link>
            <CreditCard className="h-6 w-6 text-blue-500" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Billing & Payments</h1>
          </div>
          <WarmButton variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </WarmButton>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[var(--border)]">
          {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Content */}
        <WarmCard padding="none">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-[var(--text-secondary)]">Loading...</div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-[var(--text-secondary)]">
              <CheckCircle className="h-8 w-8 opacity-30" />
              <p>No data found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--surface)]">
                  {tab === 'subscriptions' && (
                    <tr className="text-left text-[var(--text-secondary)]">
                      <th className="px-4 py-3 font-semibold">Merchant</th>
                      <th className="px-4 py-3 font-semibold">Plan</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Period ends</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  )}
                  {tab === 'failed' && (
                    <tr className="text-left text-[var(--text-secondary)]">
                      <th className="px-4 py-3 font-semibold">Merchant</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Failure reason</th>
                      <th className="px-4 py-3 font-semibold">Retries</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  )}
                  {tab === 'refunds' && (
                    <tr className="text-left text-[var(--text-secondary)]">
                      <th className="px-4 py-3 font-semibold">Merchant</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Reason</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                    </tr>
                  )}
                  {tab === 'holds' && (
                    <tr className="text-left text-[var(--text-secondary)]">
                      <th className="px-4 py-3 font-semibold">Merchant</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Reason</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data.map((item: any) => (
                    <tr key={item.id} className="hover:bg-[var(--surface)] transition-colors">
                      {tab === 'subscriptions' && (
                        <>
                          <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{item.merchantName ?? item.merchantId}</td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] capitalize">{item.plan}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium">{item.amount ? cents(item.amount) : '—'}</td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                            {item.currentPeriodEnd ? new Date(item.currentPeriodEnd).toLocaleDateString('en-GB') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Input
                                value={refundReason}
                                onChange={e => setRefundReason(e.target.value)}
                                placeholder="Refund reason"
                                className="text-xs h-8 w-36"
                              />
                              <WarmButton size="sm" variant="outline" onClick={() => issueRefund(item.id)} disabled={!refundReason.trim()}>
                                Refund
                              </WarmButton>
                            </div>
                          </td>
                        </>
                      )}
                      {tab === 'failed' && (
                        <>
                          <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{item.merchantName ?? item.merchantId}</td>
                          <td className="px-4 py-3 font-medium">{item.amount ? cents(item.amount) : '—'}</td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] text-xs max-w-[200px] truncate">{item.failureReason ?? item.lastError ?? '—'}</td>
                          <td className="px-4 py-3 text-center">{item.retryCount ?? 0}</td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <WarmButton
                              size="sm"
                              variant="secondary"
                              isLoading={actionLoading === item.id}
                              onClick={() => retryPayment(item.id)}
                            >
                              Retry
                            </WarmButton>
                          </td>
                        </>
                      )}
                      {tab === 'refunds' && (
                        <>
                          <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{item.merchantName ?? item.merchantId}</td>
                          <td className="px-4 py-3 font-medium">{item.amount ? cents(item.amount) : '—'}</td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">{item.reason ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '—'}
                          </td>
                        </>
                      )}
                      {tab === 'holds' && (
                        <>
                          <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{item.merchantName ?? item.merchantId}</td>
                          <td className="px-4 py-3 font-medium">{item.amount ? cents(item.amount) : '—'}</td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">{item.reason ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {item.status === 'held' && (
                              <WarmButton
                                size="sm"
                                variant="secondary"
                                isLoading={actionLoading === item.id}
                                onClick={() => releaseHold(item.id)}
                              >
                                Release
                              </WarmButton>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </WarmCard>
      </div>
    </div>
  );
}
