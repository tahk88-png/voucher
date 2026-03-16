'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Box {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  interval: string;
  maxItems: number;
  subscriberCount: number;
  itemCount: number;
}

export default function MerchantSubscriptionBoxesPage() {
  const { slug } = useParams<{ slug: string }>();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', priceCents: '', currency: 'EUR', interval: 'monthly', maxItems: '3' });
  const [saving, setSaving] = useState(false);

  const fetchBoxes = () => {
    fetch(`/api/merchant/${slug}/subscription-boxes`)
      .then((r) => r.json())
      .then((data) => setBoxes(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBoxes(); }, [slug]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/merchant/${slug}/subscription-boxes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ name: '', description: '', priceCents: '', currency: 'EUR', interval: 'monthly', maxItems: '3' });
        fetchBoxes();
      }
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en', { style: 'currency', currency }).format(cents / 100);
    } catch {
      return `${(cents / 100).toFixed(2)} ${currency}`;
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-lg">
              <svg className="h-6 w-6 text-[#2D2721]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#2D2721]">Subscription Boxes</h1>
              <p className="text-[#6b5e52]">Manage recurring voucher boxes</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-[#FFC857] to-[#FFB627] text-[#2D2721] font-semibold py-2.5 px-5 rounded-xl shadow-md hover:opacity-90 transition"
          >
            {showForm ? 'Cancel' : '+ New Box'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-[#e8e0d8] p-6 mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2721] mb-1">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-[#e8e0d8] rounded-xl px-4 py-2.5 bg-[#faf8f5] focus:outline-none focus:ring-2 focus:ring-[#FFC857]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2721] mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-[#e8e0d8] rounded-xl px-4 py-2.5 bg-[#faf8f5] focus:outline-none focus:ring-2 focus:ring-[#FFC857]"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2D2721] mb-1">Price (cents)</label>
                <input
                  type="number"
                  value={form.priceCents}
                  onChange={(e) => setForm({ ...form, priceCents: e.target.value })}
                  className="w-full border border-[#e8e0d8] rounded-xl px-4 py-2.5 bg-[#faf8f5] focus:outline-none focus:ring-2 focus:ring-[#FFC857]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2721] mb-1">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full border border-[#e8e0d8] rounded-xl px-4 py-2.5 bg-[#faf8f5] focus:outline-none focus:ring-2 focus:ring-[#FFC857]"
                >
                  {['EUR', 'USD', 'GBP', 'SEK', 'NOK', 'DKK'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2721] mb-1">Interval</label>
                <select
                  value={form.interval}
                  onChange={(e) => setForm({ ...form, interval: e.target.value })}
                  className="w-full border border-[#e8e0d8] rounded-xl px-4 py-2.5 bg-[#faf8f5] focus:outline-none focus:ring-2 focus:ring-[#FFC857]"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2721] mb-1">Max Items</label>
                <input
                  type="number"
                  value={form.maxItems}
                  onChange={(e) => setForm({ ...form, maxItems: e.target.value })}
                  className="w-full border border-[#e8e0d8] rounded-xl px-4 py-2.5 bg-[#faf8f5] focus:outline-none focus:ring-2 focus:ring-[#FFC857]"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-[#FFC857] to-[#FFB627] text-[#2D2721] font-semibold py-2.5 px-6 rounded-xl shadow-md hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Box'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-[#FFC857] border-t-transparent rounded-full" />
          </div>
        ) : boxes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#e8e0d8]">
            <p className="text-[#6b5e52]">No subscription boxes yet. Create your first one.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {boxes.map((box) => (
              <div key={box.id} className="bg-white rounded-2xl border border-[#e8e0d8] p-6 hover:shadow-md transition">
                <h3 className="text-lg font-bold text-[#2D2721] mb-1">{box.name}</h3>
                {box.description && <p className="text-sm text-[#6b5e52] mb-3">{box.description}</p>}
                <div className="flex items-center gap-4 text-sm text-[#6b5e52]">
                  <span className="font-semibold text-[#b8860b]">{formatPrice(box.priceCents, box.currency)}/{box.interval}</span>
                  <span>{box.subscriberCount} subscriber{box.subscriberCount !== 1 ? 's' : ''}</span>
                  <span>{box.itemCount} item{box.itemCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
