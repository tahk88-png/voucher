'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Receipt, RefreshCw, Plus, Trash2, Globe, ShieldCheck } from 'lucide-react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showConfirm } from '@/lib/confirm-helpers';

type VatRate = {
  id: string;
  countryCode: string;
  rate: number;
  rateType: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  isActive: boolean;
  createdAt: string;
};

type VatExemption = {
  id: string;
  merchantId: string;
  countryCode: string;
  exemptionType: string;
  documentReference: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  expiresAt: string | null;
  createdAt: string;
  merchant: { id: string; name: string; slug: string };
};

const RATE_TYPE_COLORS: Record<string, string> = {
  standard: 'bg-blue-100 text-blue-700',
  reduced: 'bg-green-100 text-green-700',
  super_reduced: 'bg-yellow-100 text-yellow-700',
  zero: 'bg-gray-100 text-gray-500',
};

const EXEMPTION_TYPE_COLORS: Record<string, string> = {
  b2b: 'bg-indigo-100 text-indigo-700',
  export: 'bg-teal-100 text-teal-700',
  charity: 'bg-pink-100 text-pink-700',
  public_body: 'bg-orange-100 text-orange-700',
};

const RATE_TYPES = ['standard', 'reduced', 'super_reduced', 'zero'];
const EXEMPTION_TYPES = ['b2b', 'export', 'charity', 'public_body'];

export default function VatManagementPage() {
  const [tab, setTab] = useState<'rates' | 'exemptions'>('rates');

  // Rates state
  const [rates, setRates] = useState<VatRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [showCreateRate, setShowCreateRate] = useState(false);
  const [rateActionLoading, setRateActionLoading] = useState<string | null>(null);

  // Rate form
  const [newCountry, setNewCountry] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newRateType, setNewRateType] = useState('standard');
  const [newEffectiveFrom, setNewEffectiveFrom] = useState('');
  const [newEffectiveUntil, setNewEffectiveUntil] = useState('');

  // Exemptions state
  const [exemptions, setExemptions] = useState<VatExemption[]>([]);
  const [exemptionsLoading, setExemptionsLoading] = useState(true);
  const [showCreateExemption, setShowCreateExemption] = useState(false);

  // Exemption form
  const [newExMerchantId, setNewExMerchantId] = useState('');
  const [newExCountry, setNewExCountry] = useState('');
  const [newExType, setNewExType] = useState('b2b');
  const [newExDocRef, setNewExDocRef] = useState('');
  const [newExExpires, setNewExExpires] = useState('');

  const fetchRates = useCallback(async () => {
    setRatesLoading(true);
    try {
      const res = await fetch('/api/admin/vat-rates');
      if (res.ok) {
        const data = await res.json();
        setRates(data.rates ?? []);
      }
    } finally {
      setRatesLoading(false);
    }
  }, []);

  const fetchExemptions = useCallback(async () => {
    setExemptionsLoading(true);
    try {
      const res = await fetch('/api/admin/vat-exemptions');
      if (res.ok) {
        const data = await res.json();
        setExemptions(data.exemptions ?? []);
      }
    } finally {
      setExemptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    fetchExemptions();
  }, [fetchRates, fetchExemptions]);

  // Summary stats
  const uniqueCountries = new Set(rates.filter(r => r.isActive).map(r => r.countryCode)).size;
  const activeExemptions = exemptions.filter(e => {
    if (!e.approvedAt) return false;
    if (e.expiresAt && new Date(e.expiresAt) < new Date()) return false;
    return true;
  }).length;

  async function createRate() {
    if (!newCountry || !newRate || !newEffectiveFrom) return;
    try {
      const res = await fetch('/api/admin/vat-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: newCountry.toUpperCase(),
          rate: parseFloat(newRate),
          rateType: newRateType,
          effectiveFrom: newEffectiveFrom,
          effectiveUntil: newEffectiveUntil || undefined,
        }),
      });
      if (res.ok) {
        setShowCreateRate(false);
        setNewCountry('');
        setNewRate('');
        setNewRateType('standard');
        setNewEffectiveFrom('');
        setNewEffectiveUntil('');
        fetchRates();
      }
    } catch { /* ignore */ }
  }

  async function toggleRateActive(rate: VatRate) {
    setRateActionLoading(rate.id);
    try {
      await fetch(`/api/admin/vat-rates/${rate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rate.isActive }),
      });
      fetchRates();
    } finally {
      setRateActionLoading(null);
    }
  }

  async function deleteRate(id: string) {
    showConfirm('Deactivate this VAT rate?', async () => {
      setRateActionLoading(id);
      try {
        await fetch(`/api/admin/vat-rates/${id}`, { method: 'DELETE' });
        fetchRates();
      } finally {
        setRateActionLoading(null);
      }
    }, { variant: 'destructive' });
    return;
  }

  async function createExemption() {
    if (!newExMerchantId || !newExCountry || !newExType) return;
    try {
      const res = await fetch('/api/admin/vat-exemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: newExMerchantId,
          countryCode: newExCountry.toUpperCase(),
          exemptionType: newExType,
          documentReference: newExDocRef || undefined,
          expiresAt: newExExpires || undefined,
        }),
      });
      if (res.ok) {
        setShowCreateExemption(false);
        setNewExMerchantId('');
        setNewExCountry('');
        setNewExType('b2b');
        setNewExDocRef('');
        setNewExExpires('');
        fetchExemptions();
      }
    } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/control-panel">
              <WarmButton variant="ghost" size="sm">&larr; Back</WarmButton>
            </Link>
            <Receipt className="h-6 w-6 text-blue-500" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">VAT Management</h1>
          </div>
          <WarmButton variant="outline" size="sm" onClick={() => { fetchRates(); fetchExemptions(); }}>
            <RefreshCw className="h-4 w-4" />
          </WarmButton>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <WarmCard padding="md">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
              <Globe className="h-4 w-4" />
              Countries configured
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{uniqueCountries}</p>
          </WarmCard>
          <WarmCard padding="md">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
              <Receipt className="h-4 w-4" />
              Total rates
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{rates.length}</p>
          </WarmCard>
          <WarmCard padding="md">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
              <ShieldCheck className="h-4 w-4" />
              Active exemptions
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{activeExemptions}</p>
          </WarmCard>
          <WarmCard padding="md">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
              <ShieldCheck className="h-4 w-4" />
              Total exemptions
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{exemptions.length}</p>
          </WarmCard>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[var(--border)]">
          <button
            onClick={() => setTab('rates')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'rates'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            VAT Rates
          </button>
          <button
            onClick={() => setTab('exemptions')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'exemptions'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            VAT Exemptions
          </button>
        </div>

        {/* TAB: VAT Rates */}
        {tab === 'rates' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <WarmButton size="sm" onClick={() => setShowCreateRate(!showCreateRate)}>
                <Plus className="h-4 w-4 mr-1" /> Add rate
              </WarmButton>
            </div>

            {/* Create rate form */}
            {showCreateRate && (
              <WarmCard padding="lg">
                <h2 className="font-semibold text-[var(--text-primary)] mb-4">New VAT Rate</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="vr-country">Country code (e.g. DE)</Label>
                    <Input
                      id="vr-country"
                      value={newCountry}
                      onChange={e => setNewCountry(e.target.value)}
                      placeholder="DE"
                      maxLength={2}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vr-rate">Rate (%)</Label>
                    <Input
                      id="vr-rate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={newRate}
                      onChange={e => setNewRate(e.target.value)}
                      placeholder="19.0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Rate type</Label>
                    <select
                      value={newRateType}
                      onChange={e => setNewRateType(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm bg-[var(--surface)]"
                    >
                      {RATE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="vr-from">Effective from</Label>
                    <Input
                      id="vr-from"
                      type="date"
                      value={newEffectiveFrom}
                      onChange={e => setNewEffectiveFrom(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vr-until">Effective until (optional)</Label>
                    <Input
                      id="vr-until"
                      type="date"
                      value={newEffectiveUntil}
                      onChange={e => setNewEffectiveUntil(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <WarmButton onClick={createRate}>Create rate</WarmButton>
                  <WarmButton variant="outline" onClick={() => setShowCreateRate(false)}>Cancel</WarmButton>
                </div>
              </WarmCard>
            )}

            {/* Rates table */}
            {ratesLoading ? (
              <WarmCard>
                <div className="flex items-center justify-center h-32 text-[var(--text-secondary)]">Loading...</div>
              </WarmCard>
            ) : rates.length === 0 ? (
              <WarmCard>
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-[var(--text-secondary)]">
                  <Receipt className="h-8 w-8 opacity-30" />
                  <p>No VAT rates found</p>
                </div>
              </WarmCard>
            ) : (
              <WarmCard padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                        <th className="text-left px-4 py-3 font-medium">Country</th>
                        <th className="text-left px-4 py-3 font-medium">Rate</th>
                        <th className="text-left px-4 py-3 font-medium">Type</th>
                        <th className="text-left px-4 py-3 font-medium">Effective from</th>
                        <th className="text-left px-4 py-3 font-medium">Effective until</th>
                        <th className="text-left px-4 py-3 font-medium">Active</th>
                        <th className="text-right px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rates.map(rate => (
                        <tr key={rate.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]">
                          <td className="px-4 py-3 font-mono font-medium text-[var(--text-primary)]">{rate.countryCode}</td>
                          <td className="px-4 py-3 text-[var(--text-primary)]">{rate.rate}%</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RATE_TYPE_COLORS[rate.rateType] ?? 'bg-gray-100 text-gray-600'}`}>
                              {rate.rateType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)]">
                            {new Date(rate.effectiveFrom).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)]">
                            {rate.effectiveUntil ? new Date(rate.effectiveUntil).toLocaleDateString('en-GB') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleRateActive(rate)}
                              disabled={rateActionLoading === rate.id}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                rate.isActive ? 'bg-green-500' : 'bg-gray-200'
                              }`}
                            >
                              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                rate.isActive ? 'translate-x-4' : 'translate-x-0.5'
                              }`} />
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => deleteRate(rate.id)}
                              disabled={rateActionLoading === rate.id}
                              className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </WarmCard>
            )}
          </div>
        )}

        {/* TAB: VAT Exemptions */}
        {tab === 'exemptions' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <WarmButton size="sm" onClick={() => setShowCreateExemption(!showCreateExemption)}>
                <Plus className="h-4 w-4 mr-1" /> Add exemption
              </WarmButton>
            </div>

            {/* Create exemption form */}
            {showCreateExemption && (
              <WarmCard padding="lg">
                <h2 className="font-semibold text-[var(--text-primary)] mb-4">New VAT Exemption</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="ve-merchant">Merchant ID</Label>
                    <Input
                      id="ve-merchant"
                      value={newExMerchantId}
                      onChange={e => setNewExMerchantId(e.target.value)}
                      placeholder="cuid..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ve-country">Country code (e.g. DE)</Label>
                    <Input
                      id="ve-country"
                      value={newExCountry}
                      onChange={e => setNewExCountry(e.target.value)}
                      placeholder="DE"
                      maxLength={2}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Exemption type</Label>
                    <select
                      value={newExType}
                      onChange={e => setNewExType(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm bg-[var(--surface)]"
                    >
                      {EXEMPTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="ve-doc">Document reference (optional)</Label>
                    <Input
                      id="ve-doc"
                      value={newExDocRef}
                      onChange={e => setNewExDocRef(e.target.value)}
                      placeholder="VAT-123-456"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ve-expires">Expires (optional)</Label>
                    <Input
                      id="ve-expires"
                      type="date"
                      value={newExExpires}
                      onChange={e => setNewExExpires(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <WarmButton onClick={createExemption}>Create exemption</WarmButton>
                  <WarmButton variant="outline" onClick={() => setShowCreateExemption(false)}>Cancel</WarmButton>
                </div>
              </WarmCard>
            )}

            {/* Exemptions table */}
            {exemptionsLoading ? (
              <WarmCard>
                <div className="flex items-center justify-center h-32 text-[var(--text-secondary)]">Loading...</div>
              </WarmCard>
            ) : exemptions.length === 0 ? (
              <WarmCard>
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-[var(--text-secondary)]">
                  <ShieldCheck className="h-8 w-8 opacity-30" />
                  <p>No VAT exemptions found</p>
                </div>
              </WarmCard>
            ) : (
              <WarmCard padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                        <th className="text-left px-4 py-3 font-medium">Merchant</th>
                        <th className="text-left px-4 py-3 font-medium">Country</th>
                        <th className="text-left px-4 py-3 font-medium">Type</th>
                        <th className="text-left px-4 py-3 font-medium">Status</th>
                        <th className="text-left px-4 py-3 font-medium">Document</th>
                        <th className="text-left px-4 py-3 font-medium">Expires</th>
                        <th className="text-left px-4 py-3 font-medium">Approved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exemptions.map(ex => {
                        const isExpired = ex.expiresAt && new Date(ex.expiresAt) < new Date();
                        const isApproved = !!ex.approvedAt;
                        const statusText = isExpired ? 'Expired' : isApproved ? 'Active' : 'Pending';
                        const statusColor = isExpired
                          ? 'bg-red-100 text-red-700'
                          : isApproved
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700';

                        return (
                          <tr key={ex.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]">
                            <td className="px-4 py-3">
                              <div className="font-medium text-[var(--text-primary)]">{ex.merchant.name}</div>
                              <div className="text-xs text-[var(--text-secondary)]">{ex.merchant.slug}</div>
                            </td>
                            <td className="px-4 py-3 font-mono text-[var(--text-primary)]">{ex.countryCode}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${EXEMPTION_TYPE_COLORS[ex.exemptionType] ?? 'bg-gray-100 text-gray-600'}`}>
                                {ex.exemptionType}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                {statusText}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[var(--text-secondary)]">
                              {ex.documentReference ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-[var(--text-secondary)]">
                              {ex.expiresAt ? new Date(ex.expiresAt).toLocaleDateString('en-GB') : '—'}
                            </td>
                            <td className="px-4 py-3 text-[var(--text-secondary)]">
                              {ex.approvedAt
                                ? `${new Date(ex.approvedAt).toLocaleDateString('en-GB')} (${ex.approvedBy ?? '—'})`
                                : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </WarmCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
